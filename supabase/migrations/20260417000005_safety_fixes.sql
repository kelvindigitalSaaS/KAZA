-- =============================================================================
-- Safety fixes: missing DB objects causing 400/500 runtime errors
-- All statements are idempotent (safe to run multiple times)
-- =============================================================================

-- 1. set_updated_at() trigger function
--    Required by account_sessions and other triggers that call it.
--    Without this the DB returns a 500 on any INSERT/UPDATE to those tables.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. meal_plans – columns added in 20260417000002 using plain ALTER TABLE
--    (no IF NOT EXISTS), so they fail if that migration was already applied
--    partially. Repeat here idempotently.
ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS planned_time    TIME    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notify_members  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by      UUID    DEFAULT NULL;

-- Foreign key is non-idempotent – add only if it doesn't already exist
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

-- 3. profiles – theme and language preferences
--    (also in 20260417000004, repeated here for safety)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference    TEXT DEFAULT 'system'
    CHECK (theme_preference IN ('light','dark','system')),
  ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'pt-BR'
    CHECK (language_preference IN ('pt-BR','en','es'));

-- 4. Ensure garbage_reminders table exists
--    (created in 20260416000000 but might be missing in some environments)
CREATE TABLE IF NOT EXISTS public.garbage_reminders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id          UUID        NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled          BOOLEAN     NOT NULL DEFAULT false,
  selected_days    INTEGER[]   NOT NULL DEFAULT '{1,4}',
  reminder_time    TIME        NOT NULL DEFAULT '20:00',
  timezone         TEXT        NOT NULL DEFAULT 'America/Sao_Paulo',
  garbage_location TEXT        NOT NULL DEFAULT 'street'
    CHECK (garbage_location IN ('street','building')),
  building_floor   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (home_id, user_id)
);

-- Row-level security
ALTER TABLE public.garbage_reminders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'garbage_reminders' AND policyname = 'garbage_reminders_owner'
  ) THEN
    CREATE POLICY garbage_reminders_owner ON public.garbage_reminders
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;

-- 5. sub_account_groups – ensure base columns exist
--    (table created in 20260417000000; this just guarantees it)
ALTER TABLE public.sub_account_groups
  ADD COLUMN IF NOT EXISTS plan_tier   TEXT NOT NULL DEFAULT 'multiPRO',
  ADD COLUMN IF NOT EXISTS max_members INT  NOT NULL DEFAULT 3;
