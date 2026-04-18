-- =============================================================================
-- Fix for 500 Internal Server Errors caused by RLS infinite recursion
-- =============================================================================

-- 1. Helper functions with SECURITY DEFINER to safely read relationships 
-- without triggering RLS recursively.
CREATE OR REPLACE FUNCTION public.get_auth_user_group_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  -- Returns group_ids where the user is a member
  SELECT group_id FROM public.sub_account_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_master_group_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  -- Returns group_ids where the user is master
  SELECT id FROM public.sub_account_groups WHERE master_user_id = auth.uid();
$$;

-- 2. Update policies to use the SECURITY DEFINER functions

-- sub_account_groups: membros lêem o grupo ao qual pertencem
DROP POLICY IF EXISTS sag_member_read ON public.sub_account_groups;
CREATE POLICY sag_member_read ON public.sub_account_groups
  FOR SELECT
  USING (id IN (SELECT public.get_auth_user_group_ids()));

-- sub_account_members: membros do mesmo grupo lêem uns aos outros
DROP POLICY IF EXISTS sam_group_read ON public.sub_account_members;
CREATE POLICY sam_group_read ON public.sub_account_members
  FOR SELECT
  USING (group_id IN (SELECT public.get_auth_user_group_ids()));

-- sub_account_members: master gerencia membros do seu grupo
DROP POLICY IF EXISTS sam_master_mgmt ON public.sub_account_members;
CREATE POLICY sam_master_mgmt ON public.sub_account_members
  FOR ALL
  USING (group_id IN (SELECT public.get_auth_master_group_ids()))
  WITH CHECK (group_id IN (SELECT public.get_auth_master_group_ids()));

-- account_sessions: membros do grupo lêem sessões uns dos outros
DROP POLICY IF EXISTS as_group_read ON public.account_sessions;
CREATE POLICY as_group_read ON public.account_sessions
  FOR SELECT
  USING (
    group_id IS NOT NULL 
    AND group_id IN (SELECT public.get_auth_user_group_ids())
  );

-- account_sessions: master pode force-disconnect sessões do grupo
DROP POLICY IF EXISTS as_master_mgmt ON public.account_sessions;
CREATE POLICY as_master_mgmt ON public.account_sessions
  FOR UPDATE
  USING (group_id IN (SELECT public.get_auth_master_group_ids()));

-- 3. Idempotent check: Ensure that the Unique Constraint on user_id, device_id exists
-- Without this, UPSERT on account_sessions will fail if the table was created before the constraint was added.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'account_sessions' AND t.relnamespace = 'public'::regnamespace AND c.contype = 'u'
  ) THEN
    ALTER TABLE public.account_sessions ADD CONSTRAINT account_sessions_user_id_device_id_key UNIQUE (user_id, device_id);
  END IF;
END $$;
