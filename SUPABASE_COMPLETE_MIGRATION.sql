-- =============================================================================
-- FRIGGO DB v2.0 — RESET + REDESIGN OTIMIZADO PARA 10K USUÁRIOS SIMULTÂNEOS
-- =============================================================================
-- Target      : Supabase PostgreSQL 15+
-- Execução    : SQL Editor do Supabase (cola tudo e RUN — transação única)
-- Arquitetura : Multi-tenant por "home" (casa), M:N com users via home_members
-- =============================================================================
-- IMPORTANTE ANTES DE EXECUTAR:
--   1. Faça BACKUP no Supabase Dashboard > Settings > Backups > "Backup now"
--   2. Este script APAGA tudo do schema public e recria do zero
--   3. O frontend precisa ser atualizado após aplicar (nomes de tabela mudaram)
-- =============================================================================

BEGIN;

-- Desliga validação de corpo de função em tempo de parse.
-- Necessário porque user_home_ids() (STAGE 3) referencia home_members
-- antes da tabela ser criada em STAGE 4. O corpo é validado em runtime,
-- quando a tabela já existe. Escopo: apenas esta transação.
SET LOCAL check_function_bodies = off;

-- =============================================================================
-- STAGE 0 : EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;             -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;   -- monitoria de queries lentas
CREATE EXTENSION IF NOT EXISTS pg_trgm;              -- busca fuzzy por nome de item/receita

-- =============================================================================
-- STAGE 1 : DROP TUDO (order matters — FK reversa)
-- =============================================================================

-- Desabilitar RLS em tudo que existir para evitar bloqueios durante drop
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- Drop triggers em auth.users (bootstrap)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop tables (ordem reversa de dependência; CASCADE elimina constraints restantes)
DROP TABLE IF EXISTS public.payment_history          CASCADE;
DROP TABLE IF EXISTS public.subscriptions            CASCADE;
DROP TABLE IF EXISTS public.meal_plans               CASCADE;
DROP TABLE IF EXISTS public.meal_plan                CASCADE;  -- legacy singular
DROP TABLE IF EXISTS public.item_history             CASCADE;
DROP TABLE IF EXISTS public.consumable_logs          CASCADE;
DROP TABLE IF EXISTS public.consumables              CASCADE;
DROP TABLE IF EXISTS public.shopping_items           CASCADE;
DROP TABLE IF EXISTS public.shopping_lists           CASCADE;
DROP TABLE IF EXISTS public.shopping_history         CASCADE;  -- legacy
DROP TABLE IF EXISTS public.items                    CASCADE;
DROP TABLE IF EXISTS public.recipes                  CASCADE;
DROP TABLE IF EXISTS public.recipe_favorites         CASCADE;  -- legacy (frontend)
DROP TABLE IF EXISTS public.favorite_recipes         CASCADE;  -- legacy
DROP TABLE IF EXISTS public.saved_recipes            CASCADE;  -- legacy
DROP TABLE IF EXISTS public.notifications            CASCADE;  -- legacy
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.garbage_reminders        CASCADE;
DROP TABLE IF EXISTS public.home_settings            CASCADE;
DROP TABLE IF EXISTS public.home_members             CASCADE;
DROP TABLE IF EXISTS public.homes                    CASCADE;
DROP TABLE IF EXISTS public.profile_sensitive        CASCADE;
DROP TABLE IF EXISTS public.profile_settings         CASCADE;
DROP TABLE IF EXISTS public.profiles                 CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.home_type            CASCADE;
DROP TYPE IF EXISTS public.fridge_type          CASCADE;
DROP TYPE IF EXISTS public.home_role            CASCADE;
DROP TYPE IF EXISTS public.item_category        CASCADE;
DROP TYPE IF EXISTS public.item_location        CASCADE;
DROP TYPE IF EXISTS public.maturation_level     CASCADE;
DROP TYPE IF EXISTS public.meal_type            CASCADE;
DROP TYPE IF EXISTS public.subscription_plan    CASCADE;
DROP TYPE IF EXISTS public.subscription_status  CASCADE;
DROP TYPE IF EXISTS public.action_type          CASCADE;
DROP TYPE IF EXISTS public.consumable_action    CASCADE;

-- Drop public functions
DROP FUNCTION IF EXISTS public.set_updated_at()                       CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column()             CASCADE;
DROP FUNCTION IF EXISTS public.user_home_ids()                        CASCADE;
DROP FUNCTION IF EXISTS public.user_has_home_role(UUID, public.home_role[]) CASCADE;
DROP FUNCTION IF EXISTS public.bootstrap_user()                       CASCADE;
DROP FUNCTION IF EXISTS public.create_default_home_and_members()      CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user()                      CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_subscription()         CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_notification_prefs()   CASCADE;
DROP FUNCTION IF EXISTS public.handle_payment_via_cpf(TEXT, DECIMAL)  CASCADE;
DROP FUNCTION IF EXISTS public.prevent_cpf_update()                   CASCADE;
DROP FUNCTION IF EXISTS public.consume_recipe_quota(UUID)             CASCADE;

-- Storage: NÃO deletamos storage.objects/buckets diretamente.
-- Supabase bloqueia com trigger storage.protect_delete() (erro 42501).
-- O bucket 'avatars' é reutilizado em STAGE 8 via INSERT ... ON CONFLICT DO NOTHING.
-- Para limpar avatares órfãos, use a Storage API ou o dashboard.

-- Storage policies (best-effort drop; nomes variam entre revisões)
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (policyname ILIKE '%avatar%' OR policyname ILIKE '%public access%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- =============================================================================
-- STAGE 2 : ENUMS (type-safe, espaço fixo, mais rápido que TEXT para filtros)
-- =============================================================================

CREATE TYPE public.home_type           AS ENUM ('apartment', 'house');
CREATE TYPE public.fridge_type         AS ENUM ('regular', 'smart');
CREATE TYPE public.home_role           AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE public.item_category       AS ENUM (
  'fruit','vegetable','meat','dairy','cooked','frozen',
  'beverage','cleaning','hygiene','pantry','other'
);
CREATE TYPE public.item_location       AS ENUM ('fridge','freezer','pantry','cleaning');
CREATE TYPE public.maturation_level    AS ENUM ('green','ripe','very-ripe','overripe');
CREATE TYPE public.meal_type           AS ENUM ('breakfast','lunch','dinner','snack');
CREATE TYPE public.subscription_plan   AS ENUM ('free','basic','standard','premium');
CREATE TYPE public.subscription_status AS ENUM ('trialing','active','past_due','cancelled','expired');
CREATE TYPE public.action_type         AS ENUM ('added','consumed','cooked','discarded','defrosted','expired');
CREATE TYPE public.consumable_action   AS ENUM ('debit','restock','adjust');

-- =============================================================================
-- STAGE 3 : HELPER FUNCTIONS
-- =============================================================================

-- Trigger genérico para atualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Retorna home_ids do usuário autenticado. STABLE + SECURITY DEFINER:
--   - STABLE permite cache por query (Postgres não re-executa dentro do mesmo scan)
--   - SECURITY DEFINER bypassa RLS de home_members (evita recursão em policies)
-- Esta é a chave para RLS performar bem com 10k conexões concorrentes.
CREATE OR REPLACE FUNCTION public.user_home_ids()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT home_id FROM public.home_members WHERE user_id = auth.uid();
$$;

-- Verifica se o usuário atual tem um dos roles informados para a home
CREATE OR REPLACE FUNCTION public.user_has_home_role(_home_id UUID, _roles public.home_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.home_members
    WHERE home_id = _home_id
      AND user_id = auth.uid()
      AND role = ANY(_roles)
  );
$$;

-- =============================================================================
-- STAGE 4 : TABLES
-- =============================================================================

-- 4.1 profiles (1:1 com auth.users) -------------------------------------------
CREATE TABLE public.profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT,
  cpf                  TEXT,
  avatar_url           TEXT,
  plan_type            TEXT DEFAULT 'free',
  subscription_status  TEXT DEFAULT 'trialing',
  trial_start_date     TIMESTAMPTZ DEFAULT now(),
  cakto_customer_id    TEXT,
  last_payment_date    TIMESTAMPTZ,
  payment_method       TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- UNIQUE parcial: só impede duplicata quando CPF presente
CREATE UNIQUE INDEX profiles_cpf_unique_idx
  ON public.profiles(cpf) WHERE cpf IS NOT NULL;

-- 4.2 homes (tenant) ----------------------------------------------------------
CREATE TABLE public.homes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Minha Casa',
  home_type     public.home_type NOT NULL DEFAULT 'apartment',
  address       TEXT,
  residents     SMALLINT NOT NULL DEFAULT 1 CHECK (residents BETWEEN 1 AND 50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX homes_owner_idx ON public.homes(owner_user_id);

-- 4.3 home_members (M:N users ↔ homes) ----------------------------------------
-- PK composta = sem ID artificial, mais leve
CREATE TABLE public.home_members (
  home_id   UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  role      public.home_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (home_id, user_id)
);
-- Index reverso para lookup "homes do usuário" (chave para user_home_ids())
CREATE INDEX home_members_user_idx ON public.home_members(user_id, home_id);

-- 4.4 home_settings (1:1 com homes) -------------------------------------------
CREATE TABLE public.home_settings (
  home_id         UUID PRIMARY KEY REFERENCES public.homes(id) ON DELETE CASCADE,
  fridge_type     public.fridge_type NOT NULL DEFAULT 'regular',
  fridge_brand    TEXT,
  cooling_level   SMALLINT NOT NULL DEFAULT 3 CHECK (cooling_level BETWEEN 1 AND 5),
  habits          TEXT[] NOT NULL DEFAULT '{}',
  hidden_sections TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.5 notification_preferences (1:1) ------------------------------------------
CREATE TABLE public.notification_preferences (
  home_id               UUID PRIMARY KEY REFERENCES public.homes(id) ON DELETE CASCADE,
  expiring_items        BOOLEAN NOT NULL DEFAULT true,
  low_stock_consumables BOOLEAN NOT NULL DEFAULT true,
  garbage_reminder      BOOLEAN NOT NULL DEFAULT true,
  cooking_timer         BOOLEAN NOT NULL DEFAULT true,
  shopping_list_updates BOOLEAN NOT NULL DEFAULT true,
  daily_summary         BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start     TIME NOT NULL DEFAULT '22:00',
  quiet_hours_end       TIME NOT NULL DEFAULT '07:00',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.6 garbage_reminders (1:1) -------------------------------------------------
CREATE TABLE public.garbage_reminders (
  home_id          UUID PRIMARY KEY REFERENCES public.homes(id) ON DELETE CASCADE,
  enabled          BOOLEAN NOT NULL DEFAULT false,
  selected_days    SMALLINT[] NOT NULL DEFAULT ARRAY[1,4]::SMALLINT[],
  reminder_time    TIME NOT NULL DEFAULT '20:00',
  garbage_location TEXT NOT NULL DEFAULT 'street',
  building_floor   TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.7 items (estoque da casa) -------------------------------------------------
CREATE TABLE public.items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id          UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  category         public.item_category NOT NULL,
  location         public.item_location NOT NULL DEFAULT 'fridge',
  quantity         NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit             TEXT NOT NULL DEFAULT 'un',
  expiry_date      DATE,
  opened_date      DATE,
  maturation       public.maturation_level DEFAULT 'green',
  min_stock        NUMERIC(10,2),
  image_url        TEXT,
  added_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX items_home_idx           ON public.items(home_id);
CREATE INDEX items_home_expiry_idx    ON public.items(home_id, expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX items_home_location_idx  ON public.items(home_id, location);
CREATE INDEX items_home_category_idx  ON public.items(home_id, category);
CREATE INDEX items_name_trgm_idx      ON public.items USING GIN (name gin_trgm_ops);

-- 4.8 shopping_items (lista atual) --------------------------------------------
CREATE TABLE public.shopping_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id            UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  category           TEXT NOT NULL DEFAULT 'market',
  quantity           NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit               TEXT NOT NULL DEFAULT 'un',
  checked            BOOLEAN NOT NULL DEFAULT false,
  checked_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX shopping_items_home_idx
  ON public.shopping_items(home_id);
CREATE INDEX shopping_items_home_pending_idx
  ON public.shopping_items(home_id, created_at DESC) WHERE checked = false;

-- 4.9 shopping_lists (listas salvas) ------------------------------------------
CREATE TABLE public.shopping_lists (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id            UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  items              JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (home_id, name)
);
CREATE INDEX shopping_lists_home_idx ON public.shopping_lists(home_id, created_at DESC);

-- 4.10 consumables ------------------------------------------------------------
CREATE TABLE public.consumables (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id              UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  icon                 TEXT NOT NULL DEFAULT '📦',
  category             TEXT NOT NULL DEFAULT 'other',
  current_stock        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  unit                 TEXT NOT NULL DEFAULT 'un',
  daily_consumption    NUMERIC(10,4) NOT NULL DEFAULT 1 CHECK (daily_consumption >= 0),
  min_stock            NUMERIC(10,2) NOT NULL DEFAULT 2 CHECK (min_stock >= 0),
  usage_interval       TEXT NOT NULL DEFAULT 'daily',
  auto_add_to_shopping BOOLEAN NOT NULL DEFAULT true,
  is_hidden            BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (home_id, name)
);
CREATE INDEX consumables_home_idx     ON public.consumables(home_id);
CREATE INDEX consumables_home_low_idx ON public.consumables(home_id)
  WHERE current_stock <= min_stock AND NOT is_hidden;

-- 4.11 consumable_logs (time-series) ------------------------------------------
CREATE TABLE public.consumable_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumable_id UUID NOT NULL REFERENCES public.consumables(id) ON DELETE CASCADE,
  home_id       UUID NOT NULL REFERENCES public.homes(id)       ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        public.consumable_action NOT NULL,
  amount        NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX consumable_logs_cons_idx   ON public.consumable_logs(consumable_id, created_at DESC);
CREATE INDEX consumable_logs_home_idx   ON public.consumable_logs(home_id, created_at DESC);
-- BRIN: 1/100 do tamanho de B-tree, ideal para time-series append-only
CREATE INDEX consumable_logs_ts_brin    ON public.consumable_logs USING BRIN (created_at);

-- 4.12 item_history (activity feed) -------------------------------------------
CREATE TABLE public.item_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id    UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  item_id    UUID,  -- não é FK: item pode ser deletado mas histórico permanece
  item_name  TEXT NOT NULL,
  action     public.action_type NOT NULL,
  quantity   NUMERIC(10,2) NOT NULL,
  unit       TEXT,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name  TEXT,  -- snapshot: sobrevive à remoção do user
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX item_history_home_date_idx ON public.item_history(home_id, created_at DESC);
CREATE INDEX item_history_user_idx      ON public.item_history(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX item_history_ts_brin       ON public.item_history USING BRIN (created_at);

-- 4.13 recipes ----------------------------------------------------------------
-- Consolidando saved_recipes + favorite_recipes + recipe_favorites em UMA tabela.
-- is_favorite é uma flag direta — mais simples, 1 query em vez de 2.
CREATE TABLE public.recipes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  ingredients  JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions TEXT[],
  type         TEXT,
  category     TEXT,
  prep_time    INT,
  cook_time    INT,
  servings     INT,
  difficulty   TEXT,
  image_url    TEXT,
  is_favorite  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (home_id, name)
);
CREATE INDEX recipes_home_idx          ON public.recipes(home_id);
CREATE INDEX recipes_home_favorite_idx ON public.recipes(home_id) WHERE is_favorite = true;
CREATE INDEX recipes_name_trgm_idx     ON public.recipes USING GIN (name gin_trgm_ops);

-- 4.14 meal_plans -------------------------------------------------------------
CREATE TABLE public.meal_plans (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id            UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  recipe_id          UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  recipe_name        TEXT NOT NULL,
  planned_date       DATE NOT NULL,
  meal_type          public.meal_type NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (home_id, planned_date, meal_type)
);
CREATE INDEX meal_plans_home_date_idx ON public.meal_plans(home_id, planned_date);

-- 4.15 subscriptions (por user) -----------------------------------------------
CREATE TABLE public.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                     public.subscription_plan   NOT NULL DEFAULT 'free',
  status                   public.subscription_status NOT NULL DEFAULT 'active',
  items_limit              INT NOT NULL DEFAULT 5,
  recipes_per_day          INT NOT NULL DEFAULT 1,
  shopping_list_limit      INT NOT NULL DEFAULT 20,
  notification_change_days INT NOT NULL DEFAULT 7,
  last_notification_change TIMESTAMPTZ,
  recipes_used_today       INT NOT NULL DEFAULT 0,
  last_recipe_reset        DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at               TIMESTAMPTZ,
  trial_end_at             TIMESTAMPTZ,
  payment_provider         TEXT,
  payment_id               TEXT,
  cakto_customer_id        TEXT,
  cakto_subscription_id    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Índice parcial para job diário de expiração/cobrança
CREATE INDEX subscriptions_expiring_idx
  ON public.subscriptions(expires_at)
  WHERE status IN ('active','trialing') AND expires_at IS NOT NULL;

-- 4.16 payment_history --------------------------------------------------------
CREATE TABLE public.payment_history (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cakto_transaction_id TEXT NOT NULL UNIQUE,
  amount               NUMERIC(10,2) NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'BRL',
  status               TEXT NOT NULL,
  payment_method       TEXT,
  webhook_data         JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payment_history_user_idx    ON public.payment_history(user_id, created_at DESC);
CREATE INDEX payment_history_status_idx  ON public.payment_history(status, created_at DESC);
CREATE INDEX payment_history_ts_brin     ON public.payment_history USING BRIN (created_at);

-- =============================================================================
-- STAGE 5 : TRIGGERS DE updated_at
-- =============================================================================

CREATE TRIGGER trg_profiles_updated_at              BEFORE UPDATE ON public.profiles              FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_homes_updated_at                 BEFORE UPDATE ON public.homes                 FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_home_settings_updated_at         BEFORE UPDATE ON public.home_settings         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_notif_prefs_updated_at           BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_garbage_reminders_updated_at     BEFORE UPDATE ON public.garbage_reminders     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_items_updated_at                 BEFORE UPDATE ON public.items                 FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_consumables_updated_at           BEFORE UPDATE ON public.consumables           FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_recipes_updated_at               BEFORE UPDATE ON public.recipes               FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_meal_plans_updated_at            BEFORE UPDATE ON public.meal_plans            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at         BEFORE UPDATE ON public.subscriptions         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- STAGE 6 : BOOTSTRAP DO USUÁRIO (cria tudo no signup)
-- =============================================================================
-- Trigger em auth.users AFTER INSERT: cria profile + home + settings + subs.
-- Um único trigger, atômico — evita estados inconsistentes.

CREATE OR REPLACE FUNCTION public.bootstrap_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_home_id UUID;
BEGIN
  -- Profile mínimo (nome inferido do metadata ou email)
  INSERT INTO public.profiles (user_id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  -- Home padrão + settings + preferências
  INSERT INTO public.homes (owner_user_id, name)
  VALUES (NEW.id, 'Minha Casa')
  RETURNING id INTO new_home_id;

  INSERT INTO public.home_members (home_id, user_id, role)
  VALUES (new_home_id, NEW.id, 'owner');

  INSERT INTO public.home_settings (home_id)            VALUES (new_home_id);
  INSERT INTO public.notification_preferences (home_id) VALUES (new_home_id);
  INSERT INTO public.garbage_reminders (home_id)        VALUES (new_home_id);

  -- Assinatura free
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.bootstrap_user();

-- =============================================================================
-- STAGE 7 : RLS (ROW LEVEL SECURITY)
-- =============================================================================
-- Padrão: todas policies usam public.user_home_ids() (SECURITY DEFINER, STABLE)
-- para evitar recursão e permitir cache. Isso é 2-3x mais rápido que EXISTS()
-- aninhado em cada row.

-- Ativar RLS
ALTER TABLE public.profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homes                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_members             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garbage_reminders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumables              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_history             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history          ENABLE ROW LEVEL SECURITY;

-- 7.1 profiles: só o dono ----------------------------------------------------
CREATE POLICY profiles_rw ON public.profiles
  FOR ALL TO authenticated
  USING       (user_id = (SELECT auth.uid()))
  WITH CHECK  (user_id = (SELECT auth.uid()));

-- 7.2 homes: membro pode SELECT; write só owner/admin; delete só owner -------
CREATE POLICY homes_select ON public.homes
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_home_ids()));

CREATE POLICY homes_insert ON public.homes
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = (SELECT auth.uid()));

CREATE POLICY homes_update ON public.homes
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(id, ARRAY['owner','admin']::public.home_role[]));

CREATE POLICY homes_delete ON public.homes
  FOR DELETE TO authenticated
  USING (owner_user_id = (SELECT auth.uid()));

-- 7.3 home_members: membros veem; admin/owner muda; só owner remove ----------
CREATE POLICY home_members_select ON public.home_members
  FOR SELECT TO authenticated
  USING (home_id IN (SELECT public.user_home_ids()));

CREATE POLICY home_members_insert ON public.home_members
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));

CREATE POLICY home_members_update ON public.home_members
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));

CREATE POLICY home_members_delete ON public.home_members
  FOR DELETE TO authenticated
  USING (
    public.user_has_home_role(home_id, ARRAY['owner']::public.home_role[])
    OR user_id = (SELECT auth.uid())  -- usuário pode sair da casa
  );

-- 7.4 home_settings: todos veem; só owner/admin altera -----------------------
CREATE POLICY home_settings_select ON public.home_settings
  FOR SELECT TO authenticated
  USING (home_id IN (SELECT public.user_home_ids()));

CREATE POLICY home_settings_update ON public.home_settings
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));

CREATE POLICY home_settings_insert ON public.home_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));

-- 7.5 notification_preferences -----------------------------------------------
CREATE POLICY notif_prefs_select ON public.notification_preferences
  FOR SELECT TO authenticated USING (home_id IN (SELECT public.user_home_ids()));
CREATE POLICY notif_prefs_update ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));
CREATE POLICY notif_prefs_insert ON public.notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));

-- 7.6 garbage_reminders ------------------------------------------------------
CREATE POLICY garbage_rem_select ON public.garbage_reminders
  FOR SELECT TO authenticated USING (home_id IN (SELECT public.user_home_ids()));
CREATE POLICY garbage_rem_update ON public.garbage_reminders
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));
CREATE POLICY garbage_rem_insert ON public.garbage_reminders
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));

-- 7.7 items: viewer lê; member+ escreve; owner/admin deleta ------------------
CREATE POLICY items_select ON public.items
  FOR SELECT TO authenticated USING (home_id IN (SELECT public.user_home_ids()) OR user_id = auth.uid());

CREATE POLICY items_insert ON public.items
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));

CREATE POLICY items_update ON public.items
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));

CREATE POLICY items_delete ON public.items
  FOR DELETE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));

-- 7.8 shopping_items ---------------------------------------------------------
CREATE POLICY shopping_items_select ON public.shopping_items
  FOR SELECT TO authenticated USING (home_id IN (SELECT public.user_home_ids()) OR user_id = auth.uid());
CREATE POLICY shopping_items_insert ON public.shopping_items
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));
CREATE POLICY shopping_items_update ON public.shopping_items
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));
CREATE POLICY shopping_items_delete ON public.shopping_items
  FOR DELETE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));

-- 7.9 shopping_lists ---------------------------------------------------------
CREATE POLICY shopping_lists_select ON public.shopping_lists
  FOR SELECT TO authenticated USING (home_id IN (SELECT public.user_home_ids()));
CREATE POLICY shopping_lists_insert ON public.shopping_lists
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));
CREATE POLICY shopping_lists_update ON public.shopping_lists
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));
CREATE POLICY shopping_lists_delete ON public.shopping_lists
  FOR DELETE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));

-- 7.10 consumables -----------------------------------------------------------
CREATE POLICY consumables_select ON public.consumables
  FOR SELECT TO authenticated USING (home_id IN (SELECT public.user_home_ids()));
CREATE POLICY consumables_insert ON public.consumables
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));
CREATE POLICY consumables_update ON public.consumables
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));
CREATE POLICY consumables_delete ON public.consumables
  FOR DELETE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));

-- 7.11 consumable_logs (append-only, sem UPDATE/DELETE) ----------------------
CREATE POLICY consumable_logs_select ON public.consumable_logs
  FOR SELECT TO authenticated USING (home_id IN (SELECT public.user_home_ids()));
CREATE POLICY consumable_logs_insert ON public.consumable_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));

-- 7.12 item_history (append-only) --------------------------------------------
CREATE POLICY item_history_select ON public.item_history
  FOR SELECT TO authenticated USING (home_id IN (SELECT public.user_home_ids()));
CREATE POLICY item_history_insert ON public.item_history
  FOR INSERT TO authenticated
  WITH CHECK (home_id IN (SELECT public.user_home_ids()));

-- 7.13 recipes ---------------------------------------------------------------
CREATE POLICY recipes_select ON public.recipes
  FOR SELECT TO authenticated USING (home_id IN (SELECT public.user_home_ids()) OR user_id = auth.uid());
CREATE POLICY recipes_insert ON public.recipes
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));
CREATE POLICY recipes_update ON public.recipes
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));
CREATE POLICY recipes_delete ON public.recipes
  FOR DELETE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin']::public.home_role[]));

-- 7.14 meal_plans ------------------------------------------------------------
CREATE POLICY meal_plans_select ON public.meal_plans
  FOR SELECT TO authenticated USING (home_id IN (SELECT public.user_home_ids()));
CREATE POLICY meal_plans_insert ON public.meal_plans
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));
CREATE POLICY meal_plans_update ON public.meal_plans
  FOR UPDATE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));
CREATE POLICY meal_plans_delete ON public.meal_plans
  FOR DELETE TO authenticated
  USING (public.user_has_home_role(home_id, ARRAY['owner','admin','member']::public.home_role[]));

-- 7.15 subscriptions (só o dono) ---------------------------------------------
CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
-- INSERT/UPDATE feitos por webhook CAKTO usando service_role (bypass RLS)
-- Usuário não pode INSERT/UPDATE diretamente — previne fraude de plano.

-- 7.16 payment_history (read-only para o dono) -------------------------------
CREATE POLICY payment_history_select ON public.payment_history
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
-- INSERT feito por webhook CAKTO via service_role.

-- =============================================================================
-- STAGE 8 : STORAGE (avatars bucket)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Convenção: nome do arquivo começa com "{user_id}/..."
DROP POLICY IF EXISTS "avatars_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_insert"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_update"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_delete"  ON storage.objects;

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- =============================================================================
-- STAGE 9 : GRANTS (garantir que authenticated vê as funções)
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.user_home_ids()                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_home_role(UUID, public.home_role[]) TO authenticated;

-- =============================================================================
-- STAGE 10 : ANALYZE (atualiza estatísticas do planner)
-- =============================================================================

ANALYZE;

COMMIT;

-- =============================================================================
-- DONE. Verificação pós-execução (rode manualmente no SQL Editor):
--
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
--   SELECT tablename, policyname FROM pg_policies
--     WHERE schemaname = 'public' ORDER BY 1, 2;
--   SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
--
-- Para testar o bootstrap:
--   1. Crie um usuário via Auth dashboard
--   2. SELECT * FROM public.profiles;     -- deve ter 1 linha
--   3. SELECT * FROM public.homes;        -- deve ter 1 "Minha Casa"
--   4. SELECT * FROM public.subscriptions;-- deve ter 1 'free'
-- =============================================================================
