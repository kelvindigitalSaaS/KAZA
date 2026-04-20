-- =============================================================================
-- Migration: Fix 403 Onboarding Error
-- Date: 2026-04-20
-- 
-- 1. Create a SECURITY DEFINER function to atomically create a home and its 
--    owner membership, bypassing RLS chicken-and-egg issues.
-- 2. Ensure homes table has proper RLS for future SELECTs.
-- =============================================================================

-- 1) RPC for atomic home creation
DROP FUNCTION IF EXISTS public.create_home_with_owner(text, text, int);
CREATE OR REPLACE FUNCTION public.create_home_with_owner(home_name text, h_type text DEFAULT 'apartment', res_count int DEFAULT 1)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
  new_home_id uuid;
BEGIN
  -- Insert the new home with explicit casting to home_type enum and setting the required owner_user_id
  INSERT INTO public.homes (name, home_type, residents, owner_user_id)
  VALUES (home_name, h_type::public.home_type, res_count, auth.uid())
  RETURNING id INTO new_home_id;

  -- Create the owner membership with explicit casting to home_role enum
  INSERT INTO public.home_members (home_id, user_id, role)
  VALUES (new_home_id, auth.uid(), 'owner'::public.home_role);

  RETURN new_home_id;
END;
$$;

-- 2) Relax RLS on homes for membership-based access
-- Ensure RLS is enabled
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to see homes they are members of
DROP POLICY IF EXISTS "homes_member_select" ON public.homes;
CREATE POLICY "homes_member_select" ON public.homes
  FOR SELECT
  USING (
    id IN (
      SELECT home_id FROM public.home_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow users to update homes they are owners/admins of
DROP POLICY IF EXISTS "homes_member_update" ON public.homes;
CREATE POLICY "homes_member_update" ON public.homes
  FOR UPDATE
  USING (
    id IN (
      SELECT home_id FROM public.home_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Allow INSERT for authenticated users (required if not using RPC)
DROP POLICY IF EXISTS "homes_authenticated_insert" ON public.homes;
CREATE POLICY "homes_authenticated_insert" ON public.homes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 3) Ensure profiles RLS is enabled and correct
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_self_all" ON public.profiles;
CREATE POLICY "profiles_self_all" ON public.profiles
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_home_with_owner(text, text, int) TO authenticated;
