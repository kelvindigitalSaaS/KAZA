-- =============================================================================
-- FRIGGO — Consolidated Schema Migration
-- Date: 2026-04-18
--
-- This file consolidates all prior migrations (9 files) into a single,
-- fully idempotent migration safe to run multiple times.
--
-- Issues fixed:
--   1. recipe_id type mismatch (UUID → TEXT)
--   2. Trial users can now invite (accepts trial_ends_at)
--   3. garbage_reminders UNIQUE constraint
--   4. RLS infinite recursion via SECURITY DEFINER helpers
--   5. All missing DB objects
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 0: Extensions
-- ═════════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 1: Core helper functions
-- ═════════════════════════════════════════════════════════════════════════════

-- Helper to set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper to get auth user's group memberships (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_auth_user_group_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT group_id FROM public.sub_account_members WHERE user_id = auth.uid();
$$;

-- Helper to get auth user's master groups (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_auth_master_group_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT id FROM public.sub_account_groups WHERE master_user_id = auth.uid();
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 2: Profile identity locking (CPF + Name immutable after first set)
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf             text,
  ADD COLUMN IF NOT EXISTS name            text,
  ADD COLUMN IF NOT EXISTS cpf_locked_at   timestamptz,
  ADD COLUMN IF NOT EXISTS name_locked_at  timestamptz,
  ADD COLUMN IF NOT EXISTS theme_preference    TEXT DEFAULT 'system'
    CHECK (theme_preference IN ('light','dark','system')),
  ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'pt-BR'
    CHECK (language_preference IN ('pt-BR','en','es'));

-- Unique partial index for CPF (allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique_idx
  ON public.profiles (cpf)
  WHERE cpf IS NOT NULL;

-- Trigger: lock CPF and Name after first set
CREATE OR REPLACE FUNCTION public.profiles_lock_identity()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.cpf IS NOT NULL AND OLD.cpf <> '' THEN
    IF NEW.cpf IS DISTINCT FROM OLD.cpf THEN
      RAISE EXCEPTION 'CPF já registrado não pode ser alterado'
        USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF NEW.cpf IS NOT NULL AND NEW.cpf <> '' THEN
      NEW.cpf_locked_at := now();
    END IF;
  END IF;

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

-- Mark locks on INSERT
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

-- Backfill existing locks
UPDATE public.profiles
   SET cpf_locked_at = COALESCE(cpf_locked_at, now())
 WHERE cpf IS NOT NULL AND cpf <> '' AND cpf_locked_at IS NULL;

UPDATE public.profiles
   SET name_locked_at = COALESCE(name_locked_at, now())
 WHERE name IS NOT NULL AND name <> '' AND name_locked_at IS NULL;

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 3: Subscriptions with trial and plan tiers
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan                 text,
  ADD COLUMN IF NOT EXISTS is_active            boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_tier            text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS trial_started_at     timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at        timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end   timestamptz,
  ADD COLUMN IF NOT EXISTS next_billing_at      timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at          timestamptz,
  ADD COLUMN IF NOT EXISTS auto_renew           boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_status       text,
  ADD COLUMN IF NOT EXISTS plan_label           text,
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS group_id             uuid;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill trial dates from profiles
UPDATE public.subscriptions s
   SET trial_started_at = COALESCE(s.trial_started_at, p.trial_start_date),
       trial_ends_at    = COALESCE(s.trial_ends_at,    p.trial_start_date + interval '7 days'),
       plan_tier        = 'free'
  FROM public.profiles p
 WHERE p.user_id = s.user_id
   AND p.trial_start_date IS NOT NULL
   AND (s.trial_started_at IS NULL OR s.trial_ends_at IS NULL);

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 4: Subscription events and payment history
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  subscription_id uuid,
  event_type      text NOT NULL,
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

-- Payment history
CREATE TABLE IF NOT EXISTS public.payment_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  subscription_id uuid,
  plan            text,
  amount          numeric(12,2),
  currency        text DEFAULT 'BRL',
  status          text NOT NULL DEFAULT 'paid',
  method          text,
  paid_at         timestamptz NOT NULL DEFAULT now(),
  invoice_url     text,
  external_id     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

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

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 5: Notifications (PWA + email)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  endpoint      text NOT NULL,
  p256dh        text,
  auth          text,
  user_agent    text,
  platform      text,
  native_token  text,
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

-- Notification queue
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL,
  home_id        uuid,
  category       text NOT NULL,
  title          text NOT NULL,
  body           text,
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key     text,
  scheduled_for  timestamptz NOT NULL DEFAULT now(),
  sent_at        timestamptz,
  read_at        timestamptz,
  status         text NOT NULL DEFAULT 'queued',
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

-- Notification preferences
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

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 6: Garbage reminders with UNIQUE constraint
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.garbage_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL,
  user_id         uuid NOT NULL,
  enabled         boolean NOT NULL DEFAULT true,
  selected_days   smallint[] NOT NULL DEFAULT '{}'::smallint[],
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

-- Clean orphans and deduplicate before constraint enforcement
DELETE FROM public.garbage_reminders
 WHERE home_id IS NULL OR user_id IS NULL;

DELETE FROM public.garbage_reminders
 WHERE ctid NOT IN (
   SELECT DISTINCT ON (home_id, user_id) ctid
     FROM public.garbage_reminders
    ORDER BY home_id, user_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST
 );

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

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 7: Multi-PRO and Sub-Accounts
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.sub_account_groups (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  master_user_id uuid        NOT NULL,
  plan_tier      text        NOT NULL DEFAULT 'multiPRO',
  max_members    int         NOT NULL DEFAULT 3,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

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
DROP POLICY IF EXISTS sag_master_all ON public.sub_account_groups;
CREATE POLICY sag_master_all ON public.sub_account_groups
  FOR ALL
  USING  (master_user_id = auth.uid())
  WITH CHECK (master_user_id = auth.uid());
DROP POLICY IF EXISTS sag_member_read ON public.sub_account_groups;
CREATE POLICY sag_member_read ON public.sub_account_groups
  FOR SELECT
  USING (id IN (SELECT public.get_auth_user_group_ids()));

-- Sub-account members
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
DROP POLICY IF EXISTS sam_own ON public.sub_account_members;
CREATE POLICY sam_own ON public.sub_account_members
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS sam_group_read ON public.sub_account_members;
CREATE POLICY sam_group_read ON public.sub_account_members
  FOR SELECT
  USING (group_id IN (SELECT public.get_auth_user_group_ids()));
DROP POLICY IF EXISTS sam_master_mgmt ON public.sub_account_members;
CREATE POLICY sam_master_mgmt ON public.sub_account_members
  FOR ALL
  USING (group_id IN (SELECT public.get_auth_master_group_ids()))
  WITH CHECK (group_id IN (SELECT public.get_auth_master_group_ids()));

-- Sub-account invites
CREATE TABLE IF NOT EXISTS public.sub_account_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.sub_account_groups(id) ON DELETE CASCADE,
  master_user_id uuid NOT NULL,
  master_name text NOT NULL,
  invited_email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, invited_email)
);

ALTER TABLE public.sub_account_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS master_manage_invites ON public.sub_account_invites;
CREATE POLICY master_manage_invites ON public.sub_account_invites
  FOR ALL USING (master_user_id = auth.uid());

-- Account sessions
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
DROP POLICY IF EXISTS as_own_rw ON public.account_sessions;
CREATE POLICY as_own_rw ON public.account_sessions
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS as_group_read ON public.account_sessions;
CREATE POLICY as_group_read ON public.account_sessions
  FOR SELECT
  USING (
    group_id IS NOT NULL
    AND group_id IN (SELECT public.get_auth_user_group_ids())
  );
DROP POLICY IF EXISTS as_master_mgmt ON public.account_sessions;
CREATE POLICY as_master_mgmt ON public.account_sessions
  FOR UPDATE
  USING (group_id IN (SELECT public.get_auth_master_group_ids()));

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 8: Recipes, Favorites, and Categories
-- ═════════════════════════════════════════════════════════════════════════════

-- Fix recipe_id types: UUID → TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'recipes'
       AND column_name = 'id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.recipes ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.recipes ALTER COLUMN id SET DATA TYPE TEXT USING id::text;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.user_recipe_favorites (
  user_id    uuid NOT NULL,
  recipe_id  TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

ALTER TABLE public.user_recipe_favorites
  ADD COLUMN IF NOT EXISTS user_id    uuid,
  ADD COLUMN IF NOT EXISTS recipe_id  TEXT,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Convert recipe_id from UUID to TEXT if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'user_recipe_favorites'
       AND column_name = 'recipe_id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.user_recipe_favorites
      ALTER COLUMN recipe_id SET DATA TYPE TEXT USING recipe_id::text;
  END IF;
END;
$$;

ALTER TABLE public.user_recipe_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS urf_own ON public.user_recipe_favorites;
CREATE POLICY urf_own ON public.user_recipe_favorites
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Custom categories
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

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 9: Meal planning with time and notifications
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS planned_time    TIME    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notify_members  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by      UUID    DEFAULT NULL;

-- Convert recipe_id from UUID to TEXT if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'meal_plans'
       AND column_name = 'recipe_id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.meal_plans
      ALTER COLUMN recipe_id SET DATA TYPE TEXT USING recipe_id::text;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_meal_plans_user'
      AND conrelid = 'public.meal_plans'::regclass
  ) THEN
    ALTER TABLE public.meal_plans
      ADD CONSTRAINT fk_meal_plans_user
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 10: Shopping items enhancements
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.shopping_items
  ADD COLUMN IF NOT EXISTS store text;

UPDATE public.shopping_items
   SET store = CASE
     WHEN category IN ('fruit','vegetable') THEN 'fair'
     WHEN category = 'hygiene'              THEN 'pharmacy'
     ELSE 'market'
   END
 WHERE store IS NULL;

-- Saved shopping lists
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

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 11: Access control and utility functions
-- ═════════════════════════════════════════════════════════════════════════════

-- User access view (canonical source of truth for access control)
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
  COALESCE(s.plan_tier, 'free') AS plan_tier,
  s.group_id
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.user_id;

-- Utility function for policies
CREATE OR REPLACE FUNCTION public.user_has_access(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(bool_or(has_access), false)
    FROM public.v_user_access WHERE user_id = uid;
$$;

-- Subscription summary view
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
  COALESCE(s.plan_tier, 'free') AS plan_tier,
  s.group_id
FROM public.subscriptions s;

-- Profile identity status view
CREATE OR REPLACE VIEW public.v_profile_identity_status AS
SELECT
  user_id,
  (cpf  IS NOT NULL AND cpf  <> '') AS cpf_locked,
  (name IS NOT NULL AND name <> '') AS name_locked,
  cpf_locked_at,
  name_locked_at
FROM public.profiles;

-- ═════════════════════════════════════════════════════════════════════════════
-- PHASE 12: RPC functions for invite flow
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.accept_invite(invite_token text)
RETURNS TABLE(group_id uuid, master_name text) AS $$
DECLARE
  v_invite public.sub_account_invites;
BEGIN
  SELECT * INTO v_invite FROM public.sub_account_invites
  WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now();

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  INSERT INTO public.sub_account_members (
    group_id,
    user_id,
    role,
    is_active,
    joined_at
  ) VALUES (
    v_invite.group_id,
    auth.uid(),
    'member',
    true,
    now()
  )
  ON CONFLICT (group_id, user_id) DO UPDATE
    SET is_active = true, joined_at = now();

  UPDATE public.sub_account_invites
  SET status = 'accepted'
  WHERE id = v_invite.id;

  RETURN QUERY SELECT v_invite.group_id, v_invite.master_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_invite_info(invite_token text)
RETURNS TABLE(
  invited_email text,
  master_name text,
  group_id uuid,
  status text
) AS $$
  SELECT
    invited_email,
    master_name,
    group_id,
    status
  FROM public.sub_account_invites
  WHERE token = invite_token
    AND expires_at > now()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_invite_info(text) TO anon, authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- FIM — All migrations consolidated into single idempotent file
-- Safe to run multiple times. No destructive operations.
-- ═════════════════════════════════════════════════════════════════════════════
