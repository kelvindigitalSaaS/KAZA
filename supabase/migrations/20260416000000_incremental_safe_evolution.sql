-- =====================================================================
-- Friggo — Evolução incremental SEGURA do schema
-- Data: 2026-04-16
-- Regras:
--   * NÃO destrutivo (sem DROP TABLE / DROP COLUMN em uso).
--   * Tudo idempotente (IF NOT EXISTS / IF EXISTS).
--   * Compatível Postgres/Supabase (semAC SPARSE).
--   * Preserva tabelas e colunas já usadas pelo app.
--   * CPF e nome ficam blindados: só podem ser definidos uma vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Extensões necessárias (seguro rodar várias vezes)
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1) Helper genérico de updated_at
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 2) BLINDAGEM DE CPF E NOME EM profiles
--    Regra do produto: uma vez definido, NÃO altera.
--    Só email/senha podem mudar (via auth, não via profiles.cpf/name).
-- ---------------------------------------------------------------------

-- Garantir colunas que o app já usa (no-op se existirem)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf           text,
  ADD COLUMN IF NOT EXISTS name          text,
  ADD COLUMN IF NOT EXISTS cpf_locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS name_locked_at timestamptz;

-- Índice único parcial para CPF (permite múltiplos NULL, bloqueia duplicado)
-- Substitui qualquer tentativa inválida de "CPF TEXT UNIQUE SPARSE".
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique_idx
  ON public.profiles (cpf)
  WHERE cpf IS NOT NULL;

-- Trigger: impede alteração de CPF/nome depois de preenchidos
CREATE OR REPLACE FUNCTION public.profiles_lock_identity()
RETURNS TRIGGER AS $$
BEGIN
  -- CPF: se já tinha valor, não pode mudar nem apagar
  IF OLD.cpf IS NOT NULL AND OLD.cpf <> '' THEN
    IF NEW.cpf IS DISTINCT FROM OLD.cpf THEN
      RAISE EXCEPTION 'CPF já registrado não pode ser alterado'
        USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    -- Primeira definição: marca lock
    IF NEW.cpf IS NOT NULL AND NEW.cpf <> '' THEN
      NEW.cpf_locked_at := now();
    END IF;
  END IF;

  -- Nome: mesma regra
  IF OLD.name IS NOT NULL AND OLD.name <> '' THEN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      RAISE EXCEPTION 'Nome já registrado não pode ser alterado'
        USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF NEW.name IS NOT NULL AND NEW.name <> '' THEN
      NEW.name_locked_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_lock_identity ON public.profiles;
CREATE TRIGGER trg_profiles_lock_identity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_lock_identity();

-- Trigger no INSERT para marcar lock_at se já vier preenchido
CREATE OR REPLACE FUNCTION public.profiles_mark_identity_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cpf  IS NOT NULL AND NEW.cpf  <> '' AND NEW.cpf_locked_at  IS NULL THEN
    NEW.cpf_locked_at := now();
  END IF;
  IF NEW.name IS NOT NULL AND NEW.name <> '' AND NEW.name_locked_at IS NULL THEN
    NEW.name_locked_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_mark_identity_insert ON public.profiles;
CREATE TRIGGER trg_profiles_mark_identity_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_mark_identity_insert();

-- Backfill: marcar locks em perfis já existentes
UPDATE public.profiles
   SET cpf_locked_at = COALESCE(cpf_locked_at, now())
 WHERE cpf IS NOT NULL AND cpf <> '' AND cpf_locked_at IS NULL;

UPDATE public.profiles
   SET name_locked_at = COALESCE(name_locked_at, now())
 WHERE name IS NOT NULL AND name <> '' AND name_locked_at IS NULL;

-- View de compatibilidade para o front checar se campo já está travado
CREATE OR REPLACE VIEW public.v_profile_identity_status AS
SELECT
  user_id,
  (cpf  IS NOT NULL AND cpf  <> '') AS cpf_locked,
  (name IS NOT NULL AND name <> '') AS name_locked,
  cpf_locked_at,
  name_locked_at
FROM public.profiles;

-- ---------------------------------------------------------------------
-- 3) LEMBRETE DE LIXO — persistência no banco
--    Hoje vive em localStorage; passamos a replicar no BD (coexistindo).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.garbage_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL,
  user_id         uuid NOT NULL,
  enabled         boolean NOT NULL DEFAULT true,
  selected_days   smallint[] NOT NULL DEFAULT '{}'::smallint[], -- 0=Dom..6=Sáb
  reminder_time   time NOT NULL DEFAULT '20:00',
  timezone        text NOT NULL DEFAULT 'America/Sao_Paulo',
  garbage_location text,
  building_floor  text,
  last_fired_at   timestamptz,
  next_fire_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (home_id, user_id)
);

-- Defensivo: se tabela já existia sem essas colunas, garante que existam
ALTER TABLE public.garbage_reminders
  ADD COLUMN IF NOT EXISTS home_id          uuid,
  ADD COLUMN IF NOT EXISTS user_id          uuid,
  ADD COLUMN IF NOT EXISTS enabled          boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS selected_days    smallint[] NOT NULL DEFAULT '{}'::smallint[],
  ADD COLUMN IF NOT EXISTS reminder_time    time NOT NULL DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS timezone         text NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS garbage_location text,
  ADD COLUMN IF NOT EXISTS building_floor   text,
  ADD COLUMN IF NOT EXISTS last_fired_at    timestamptz,
  ADD COLUMN IF NOT EXISTS next_fire_at     timestamptz,
  ADD COLUMN IF NOT EXISTS created_at       timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS garbage_reminders_next_fire_idx
  ON public.garbage_reminders (next_fire_at)
  WHERE enabled = true;

DROP TRIGGER IF EXISTS trg_garbage_reminders_updated_at ON public.garbage_reminders;
CREATE TRIGGER trg_garbage_reminders_updated_at
  BEFORE UPDATE ON public.garbage_reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.garbage_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS garbage_reminders_select ON public.garbage_reminders;
CREATE POLICY garbage_reminders_select ON public.garbage_reminders
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS garbage_reminders_ins ON public.garbage_reminders;
CREATE POLICY garbage_reminders_ins ON public.garbage_reminders
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS garbage_reminders_upd ON public.garbage_reminders;
CREATE POLICY garbage_reminders_upd ON public.garbage_reminders
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS garbage_reminders_del ON public.garbage_reminders;
CREATE POLICY garbage_reminders_del ON public.garbage_reminders
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 4) NOTIFICAÇÕES PWA
--    a) push_subscriptions (endpoints do navegador)
--    b) notification_queue (fila/histórico)
--    c) notification_preferences: novas colunas (ADDITIVE, não remove nada)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  endpoint      text NOT NULL,
  p256dh        text,
  auth          text,
  user_agent    text,
  platform      text,           -- 'web' | 'android' | 'ios'
  native_token  text,           -- APNs/FCM token quando nativo
  is_active     boolean NOT NULL DEFAULT true,
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS user_id      uuid,
  ADD COLUMN IF NOT EXISTS endpoint     text,
  ADD COLUMN IF NOT EXISTS p256dh       text,
  ADD COLUMN IF NOT EXISTS auth         text,
  ADD COLUMN IF NOT EXISTS user_agent   text,
  ADD COLUMN IF NOT EXISTS platform     text,
  ADD COLUMN IF NOT EXISTS native_token text,
  ADD COLUMN IF NOT EXISTS is_active    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at   timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS push_subs_user_active_idx
  ON public.push_subscriptions (user_id) WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_push_subs_updated_at ON public.push_subscriptions;
CREATE TRIGGER trg_push_subs_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subs_own ON public.push_subscriptions;
CREATE POLICY push_subs_own ON public.push_subscriptions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Fila/histórico de notificações
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL,
  home_id        uuid,
  category       text NOT NULL,      -- 'expiry'|'garbage'|'low-stock'|'trial'|'billing'|'general'
  title          text NOT NULL,
  body           text,
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key     text,
  scheduled_for  timestamptz NOT NULL DEFAULT now(),
  sent_at        timestamptz,
  read_at        timestamptz,
  status         text NOT NULL DEFAULT 'queued', -- queued|sent|failed|read|canceled
  error          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_queue
  ADD COLUMN IF NOT EXISTS user_id       uuid,
  ADD COLUMN IF NOT EXISTS home_id       uuid,
  ADD COLUMN IF NOT EXISTS category      text,
  ADD COLUMN IF NOT EXISTS title         text,
  ADD COLUMN IF NOT EXISTS body          text,
  ADD COLUMN IF NOT EXISTS payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dedupe_key    text,
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS sent_at       timestamptz,
  ADD COLUMN IF NOT EXISTS read_at       timestamptz,
  ADD COLUMN IF NOT EXISTS status        text NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS error         text,
  ADD COLUMN IF NOT EXISTS created_at    timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS notif_queue_due_idx
  ON public.notification_queue (scheduled_for)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS notif_queue_user_idx
  ON public.notification_queue (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS notif_queue_dedupe_idx
  ON public.notification_queue (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

DROP TRIGGER IF EXISTS trg_notif_queue_updated_at ON public.notification_queue;
CREATE TRIGGER trg_notif_queue_updated_at
  BEFORE UPDATE ON public.notification_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notif_queue_own_read ON public.notification_queue;
CREATE POLICY notif_queue_own_read ON public.notification_queue
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS notif_queue_own_upd ON public.notification_queue;
CREATE POLICY notif_queue_own_upd ON public.notification_queue
  FOR UPDATE USING (user_id = auth.uid());
-- INSERT/DELETE ficam para service_role (edge functions).

-- Preferências estendidas (ADDITIVE — não quebra colunas existentes)
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS user_id              uuid,
  ADD COLUMN IF NOT EXISTS nightly_checkup      boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS nightly_checkup_time time        NOT NULL DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS timezone             text        NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS garbage_reminder     boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS trial_expiring       boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS billing_upcoming     boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_notif_prefs_updated_at ON public.notification_preferences;
CREATE TRIGGER trg_notif_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5) ASSINATURAS / TRIAL — colunas + eventos + view de acesso
--    ADDITIVE: tabela subscriptions mantém colunas atuais.
-- ---------------------------------------------------------------------

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan                 text,
  ADD COLUMN IF NOT EXISTS is_active            boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_started_at     timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at        timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end   timestamptz,
  ADD COLUMN IF NOT EXISTS next_billing_at      timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at          timestamptz,
  ADD COLUMN IF NOT EXISTS auto_renew           boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_status       text,
  ADD COLUMN IF NOT EXISTS plan_label           text,
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill: trial de 7 dias a partir de profiles.trial_start_date (se existir)
UPDATE public.subscriptions s
   SET trial_started_at = COALESCE(s.trial_started_at, p.trial_start_date),
       trial_ends_at    = COALESCE(s.trial_ends_at,    p.trial_start_date + interval '7 days')
  FROM public.profiles p
 WHERE p.user_id = s.user_id
   AND p.trial_start_date IS NOT NULL
   AND (s.trial_started_at IS NULL OR s.trial_ends_at IS NULL);

-- Eventos de cobrança (auditoria + base para avisos)
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  subscription_id uuid,
  event_type      text NOT NULL,    -- trial_started|trial_expiring|trial_expired|billing_upcoming|payment_succeeded|payment_failed|canceled|renewed
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  amount          numeric(12,2),
  currency        text DEFAULT 'BRL',
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_events
  ADD COLUMN IF NOT EXISTS user_id         uuid,
  ADD COLUMN IF NOT EXISTS subscription_id uuid,
  ADD COLUMN IF NOT EXISTS event_type      text,
  ADD COLUMN IF NOT EXISTS occurred_at     timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS amount          numeric(12,2),
  ADD COLUMN IF NOT EXISTS currency        text DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at      timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS sub_events_user_idx
  ON public.subscription_events (user_id, occurred_at DESC);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sub_events_own_read ON public.subscription_events;
CREATE POLICY sub_events_own_read ON public.subscription_events
  FOR SELECT USING (user_id = auth.uid());
-- INSERT restrito a service_role.

-- View canônica de acesso (o front consulta esta view para liberar/bloquear)
CREATE OR REPLACE VIEW public.v_user_access AS
SELECT
  p.user_id,
  s.plan,
  s.is_active,
  s.trial_started_at,
  s.trial_ends_at,
  s.current_period_end,
  s.next_billing_at,
  s.cancel_at_period_end,
  CASE
    WHEN s.trial_ends_at IS NOT NULL AND s.trial_ends_at > now() THEN true
    ELSE false
  END AS in_trial,
  CASE
    WHEN s.is_active = true THEN true
    WHEN s.trial_ends_at IS NOT NULL AND s.trial_ends_at > now() THEN true
    ELSE false
  END AS has_access,
  CASE
    WHEN s.trial_ends_at IS NOT NULL AND s.trial_ends_at > now()
      THEN GREATEST(0, EXTRACT(day FROM (s.trial_ends_at - now()))::int)
    ELSE 0
  END AS trial_days_left,
  CASE
    WHEN s.next_billing_at IS NOT NULL
     AND s.next_billing_at BETWEEN now() AND now() + interval '3 days'
      THEN true ELSE false
  END AS billing_soon
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.user_id;

-- Função utilitária de acesso (chamável em policies futuras)
CREATE OR REPLACE FUNCTION public.user_has_access(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(bool_or(has_access), false)
    FROM public.v_user_access WHERE user_id = uid;
$$;

-- ---------------------------------------------------------------------
-- 6) ESTRUTURA COMPLEMENTAR (ADDITIVE)
--    - categorias personalizadas
--    - favoritos de receitas por usuário (já existe recipes.is_favorite;
--      adicionamos user_recipe_favorites sem remover nada)
--    - listas salvas / histórico de listas
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.custom_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id    uuid NOT NULL,
  user_id    uuid NOT NULL,
  name       text NOT NULL,
  icon       text,
  color      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (home_id, name)
);
ALTER TABLE public.custom_categories
  ADD COLUMN IF NOT EXISTS home_id    uuid,
  ADD COLUMN IF NOT EXISTS user_id    uuid,
  ADD COLUMN IF NOT EXISTS name       text,
  ADD COLUMN IF NOT EXISTS icon       text,
  ADD COLUMN IF NOT EXISTS color      text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS custom_categories_own ON public.custom_categories;
CREATE POLICY custom_categories_own ON public.custom_categories
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.user_recipe_favorites (
  user_id    uuid NOT NULL,
  recipe_id  uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);
ALTER TABLE public.user_recipe_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS urf_own ON public.user_recipe_favorites;
CREATE POLICY urf_own ON public.user_recipe_favorites
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.saved_shopping_lists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id    uuid NOT NULL,
  user_id    uuid NOT NULL,
  name       text NOT NULL,
  items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_shopping_lists
  ADD COLUMN IF NOT EXISTS home_id    uuid,
  ADD COLUMN IF NOT EXISTS user_id    uuid,
  ADD COLUMN IF NOT EXISTS name       text,
  ADD COLUMN IF NOT EXISTS items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.saved_shopping_lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ssl_own ON public.saved_shopping_lists;
CREATE POLICY ssl_own ON public.saved_shopping_lists
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 6.1) shopping_items: coluna `store` (market | fair | pharmacy | other)
--      Hoje só existe `category` e o front perde a loja escolhida.
--      Additive: adiciona coluna; nada é removido.
-- ---------------------------------------------------------------------
ALTER TABLE public.shopping_items
  ADD COLUMN IF NOT EXISTS store text;

-- Backfill: tenta inferir a partir da categoria existente
UPDATE public.shopping_items
   SET store = CASE
     WHEN category IN ('fruit','vegetable') THEN 'fair'
     WHEN category = 'hygiene'              THEN 'pharmacy'
     ELSE 'market'
   END
 WHERE store IS NULL;

-- ---------------------------------------------------------------------
-- 6.2) payment_history: histórico para a tela de assinatura
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  subscription_id uuid,
  plan            text,
  amount          numeric(12,2),
  currency        text DEFAULT 'BRL',
  status          text NOT NULL DEFAULT 'paid', -- paid|failed|refunded|pending
  method          text,                         -- pix|card|boleto
  paid_at         timestamptz NOT NULL DEFAULT now(),
  invoice_url     text,
  external_id     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Defensivo: garante todas as colunas caso tabela já existisse
ALTER TABLE public.payment_history
  ADD COLUMN IF NOT EXISTS user_id         uuid,
  ADD COLUMN IF NOT EXISTS subscription_id uuid,
  ADD COLUMN IF NOT EXISTS plan            text,
  ADD COLUMN IF NOT EXISTS amount          numeric(12,2),
  ADD COLUMN IF NOT EXISTS currency        text DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS status          text NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS method          text,
  ADD COLUMN IF NOT EXISTS paid_at         timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS invoice_url     text,
  ADD COLUMN IF NOT EXISTS external_id     text,
  ADD COLUMN IF NOT EXISTS created_at      timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS payment_history_user_idx
  ON public.payment_history (user_id, paid_at DESC);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_history_own ON public.payment_history;
CREATE POLICY payment_history_own ON public.payment_history
  FOR SELECT USING (user_id = auth.uid());
-- INSERT restrito ao service_role (webhook Cakto).

-- ---------------------------------------------------------------------
-- 7) VIEW DE COMPATIBILIDADE: subscription resumida
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_subscription_summary AS
SELECT
  s.user_id,
  s.plan,
  s.plan_label,
  s.is_active,
  s.trial_started_at,
  s.trial_ends_at,
  s.current_period_end,
  s.next_billing_at,
  s.cancel_at_period_end,
  s.canceled_at,
  s.auto_renew,
  s.payment_status
FROM public.subscriptions s;

-- =====================================================================
-- FIM — migration é ADDITIVE. Nenhum DROP/rename destrutivo.
-- Reversão: remover triggers/colunas/tabelas novas (não necessário para o app).
-- =====================================================================
