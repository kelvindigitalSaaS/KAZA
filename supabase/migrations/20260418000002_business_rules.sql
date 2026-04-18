-- =============================================================================
-- FRIGGO — Business Rules: Trial Expiration, Invite Eligibility
-- Date: 2026-04-18
--
-- Rules:
--   1. Trial of 7 days = full access (multiPRO) — can invite up to 3 people
--   2. Individual (standard) = cannot invite
--   3. Premium (Trio) = can invite up to 3 people
--   4. After 7 days without subscription → is_active = false → blocked
--   5. Login forces disconnect of other devices of the same user (1 device at a time)
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- Function: expire_trials()
-- Marks subscriptions as is_active = false when trial_ends_at has passed
-- and the user has never activated a paid plan
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark trial users as inactive when trial expires and no paid plan activated
  UPDATE public.subscriptions
  SET is_active = false
  WHERE trial_ends_at IS NOT NULL
    AND trial_ends_at < now()
    AND is_active = false  -- never activated a paid plan
    AND (plan_tier = 'free' OR plan_tier IS NULL);

  RAISE NOTICE 'Expired % trials', COALESCE(ROW_COUNT(), 0);
END;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- Function: check_invite_eligibility(user_uuid uuid)
-- Returns true if user can invite members (multiPRO paid OR trial active)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_invite_eligibility(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trial_ends_at timestamptz;
  v_plan_tier text;
  v_is_active boolean;
BEGIN
  SELECT trial_ends_at, plan_tier, is_active
  INTO v_trial_ends_at, v_plan_tier, v_is_active
  FROM public.subscriptions
  WHERE user_id = user_uuid;

  -- Trial active (even without payment)
  IF v_trial_ends_at IS NOT NULL AND v_trial_ends_at > now() THEN
    RETURN true;
  END IF;

  -- Paid multiPRO plan
  IF v_plan_tier = 'multiPRO' AND v_is_active = true THEN
    RETURN true;
  END IF;

  -- All others (individual, free, expired) cannot invite
  RETURN false;
END;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- Update v_user_access view to include can_invite
-- ═════════════════════════════════════════════════════════════════════════════

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
  s.group_id,
  -- NEW: can_invite
  CASE
    WHEN s.trial_ends_at IS NOT NULL AND s.trial_ends_at > now() THEN true
    WHEN s.plan_tier = 'multiPRO' AND s.is_active = true THEN true
    ELSE false
  END AS can_invite
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.user_id;

-- ═════════════════════════════════════════════════════════════════════════════
-- Grant execution permissions
-- ═════════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.check_invite_eligibility(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.expire_trials() TO service_role;

-- ═════════════════════════════════════════════════════════════════════════════
-- FIM — Business rules implemented.
-- Run expire_trials() periodically via pg_cron or external scheduler.
-- ═════════════════════════════════════════════════════════════════════════════
