-- =====================================================================
-- Friggo — MultiPRO & IndividualPRO plans
-- Data: 2026-04-17
-- Regras: ADDITIVE. Sem DROP em colunas/tabelas já usadas.
--         Idempotente (IF NOT EXISTS / OR REPLACE).
-- ORDEM: todas as tabelas criadas antes das policies cross-reference.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) plan_tier + group_id na tabela subscriptions
-- ---------------------------------------------------------------------
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS group_id  uuid;

-- Backfill: premium ativo → individualPRO
UPDATE public.subscriptions
   SET plan_tier = 'individualPRO'
 WHERE plan = 'premium'
   AND is_active = true
   AND plan_tier = 'free';

-- ---------------------------------------------------------------------
-- 2) sub_account_groups (cria estrutura, RLS e trigger — SEM policies cross-ref)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sub_account_groups (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  master_user_id uuid        NOT NULL,
  plan_tier      text        NOT NULL DEFAULT 'multiPRO',
  max_members    int         NOT NULL DEFAULT 3,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Defensivo: garante colunas caso tabela já existisse sem elas
ALTER TABLE public.sub_account_groups
  ADD COLUMN IF NOT EXISTS master_user_id uuid,
  ADD COLUMN IF NOT EXISTS plan_tier      text        NOT NULL DEFAULT 'multiPRO',
  ADD COLUMN IF NOT EXISTS max_members    int         NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS created_at     timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_sub_account_groups_updated_at ON public.sub_account_groups;
CREATE TRIGGER trg_sub_account_groups_updated_at
  BEFORE UPDATE ON public.sub_account_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sub_account_groups ENABLE ROW LEVEL SECURITY;

-- Policy simples (sem cross-ref) — só master gerencia
DROP POLICY IF EXISTS sag_master_all ON public.sub_account_groups;
CREATE POLICY sag_master_all ON public.sub_account_groups
  FOR ALL
  USING  (master_user_id = auth.uid())
  WITH CHECK (master_user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3) sub_account_members (cria estrutura e RLS — SEM policies cross-ref ainda)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sub_account_members (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid        NOT NULL REFERENCES public.sub_account_groups(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL,
  role         text        NOT NULL DEFAULT 'member',
  display_name text,
  avatar_url   text,
  is_active    boolean     NOT NULL DEFAULT true,
  invited_by   uuid,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

ALTER TABLE public.sub_account_members
  ADD COLUMN IF NOT EXISTS group_id     uuid,
  ADD COLUMN IF NOT EXISTS user_id      uuid,
  ADD COLUMN IF NOT EXISTS role         text        NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url   text,
  ADD COLUMN IF NOT EXISTS is_active    boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS invited_by   uuid,
  ADD COLUMN IF NOT EXISTS joined_at    timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS sam_group_user_idx ON public.sub_account_members (group_id, user_id);
CREATE INDEX IF NOT EXISTS sam_user_idx       ON public.sub_account_members (user_id);

ALTER TABLE public.sub_account_members ENABLE ROW LEVEL SECURITY;

-- Policy simples: cada membro lê a si mesmo
DROP POLICY IF EXISTS sam_own ON public.sub_account_members;
CREATE POLICY sam_own ON public.sub_account_members
  FOR SELECT USING (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 4) account_sessions (cria estrutura e RLS — SEM policies cross-ref ainda)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_sessions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL,
  group_id            uuid,
  device_id           text        NOT NULL,
  device_name         text,
  platform            text,
  is_connected        boolean     NOT NULL DEFAULT true,
  force_disconnected  boolean     NOT NULL DEFAULT false,
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

ALTER TABLE public.account_sessions
  ADD COLUMN IF NOT EXISTS user_id            uuid,
  ADD COLUMN IF NOT EXISTS group_id           uuid,
  ADD COLUMN IF NOT EXISTS device_id          text,
  ADD COLUMN IF NOT EXISTS device_name        text,
  ADD COLUMN IF NOT EXISTS platform           text,
  ADD COLUMN IF NOT EXISTS is_connected       boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS force_disconnected boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at       timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at         timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS as_user_idx  ON public.account_sessions (user_id);
CREATE INDEX IF NOT EXISTS as_group_idx ON public.account_sessions (group_id) WHERE group_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_account_sessions_updated_at ON public.account_sessions;
CREATE TRIGGER trg_account_sessions_updated_at
  BEFORE UPDATE ON public.account_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.account_sessions ENABLE ROW LEVEL SECURITY;

-- Policy simples: cada usuário gerencia suas próprias sessões
DROP POLICY IF EXISTS as_own_rw ON public.account_sessions;
CREATE POLICY as_own_rw ON public.account_sessions
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================================
-- 5) POLICIES CROSS-REFERENCE
--    Adicionadas APÓS todas as tabelas existirem.
-- =====================================================================

-- sub_account_groups: membros lêem o grupo ao qual pertencem
DROP POLICY IF EXISTS sag_member_read ON public.sub_account_groups;
CREATE POLICY sag_member_read ON public.sub_account_groups
  FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM public.sub_account_members
       WHERE user_id = auth.uid()
    )
  );

-- sub_account_members: membros do mesmo grupo lêem uns aos outros
DROP POLICY IF EXISTS sam_group_read ON public.sub_account_members;
CREATE POLICY sam_group_read ON public.sub_account_members
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.sub_account_members
       WHERE user_id = auth.uid()
    )
  );

-- sub_account_members: master gerencia membros do seu grupo
DROP POLICY IF EXISTS sam_master_mgmt ON public.sub_account_members;
CREATE POLICY sam_master_mgmt ON public.sub_account_members
  FOR ALL
  USING (
    group_id IN (
      SELECT id FROM public.sub_account_groups
       WHERE master_user_id = auth.uid()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id FROM public.sub_account_groups
       WHERE master_user_id = auth.uid()
    )
  );

-- account_sessions: membros do grupo lêem sessões uns dos outros
DROP POLICY IF EXISTS as_group_read ON public.account_sessions;
CREATE POLICY as_group_read ON public.account_sessions
  FOR SELECT
  USING (
    group_id IS NOT NULL
    AND group_id IN (
      SELECT group_id FROM public.sub_account_members
       WHERE user_id = auth.uid()
    )
  );

-- account_sessions: master pode force-disconnect sessões do grupo
DROP POLICY IF EXISTS as_master_mgmt ON public.account_sessions;
CREATE POLICY as_master_mgmt ON public.account_sessions
  FOR UPDATE
  USING (
    group_id IN (
      SELECT id FROM public.sub_account_groups
       WHERE master_user_id = auth.uid()
    )
  );

-- =====================================================================
-- 6) Views atualizadas com plan_tier e group_id
-- =====================================================================

-- DROP + CREATE: views não têm dados, seguro recriar.
-- Necessário porque OR REPLACE não permite reordenar/renomear colunas existentes.
DROP VIEW IF EXISTS public.v_user_access;
CREATE VIEW public.v_user_access AS
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
  END AS billing_soon,
  -- Novas colunas adicionadas ao final para não quebrar OR REPLACE
  COALESCE(s.plan_tier, 'free') AS plan_tier,
  s.group_id
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.user_id;

DROP VIEW IF EXISTS public.v_subscription_summary;
CREATE VIEW public.v_subscription_summary AS
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
  s.payment_status,
  -- Novas colunas ao final
  COALESCE(s.plan_tier, 'free') AS plan_tier,
  s.group_id
FROM public.subscriptions s;

-- =====================================================================
-- FIM — migration ADDITIVE. Nenhum DROP/rename destrutivo.
-- =====================================================================
