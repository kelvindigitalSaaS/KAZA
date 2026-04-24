-- =============================================================================
-- Fix: accept_invite RETURNS TABLE column names conflicting with PL/pgSQL
-- Error: column reference "group_id" is ambiguous (PostgreSQL 42702)
-- Root cause: RETURNS TABLE(group_id uuid, ...) creates an implicit OUT
--             variable named group_id that shadows the table column in
--             ON CONFLICT (group_id, user_id).
-- Fix: rename output columns to r_group_id / r_master_name.
-- =============================================================================

DROP FUNCTION IF EXISTS accept_invite(text);

CREATE FUNCTION accept_invite(invite_token text)
RETURNS TABLE(r_group_id uuid, r_master_name text) AS $$
DECLARE
  v_invite        sub_account_invites;
  v_master_home_id uuid;
BEGIN
  -- Validate invite
  SELECT * INTO v_invite
  FROM sub_account_invites
  WHERE token     = invite_token
    AND status    = 'pending'
    AND expires_at > now();

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- 1) Create/update sub-account membership with user's name
  INSERT INTO sub_account_members (group_id, user_id, role, is_active, joined_at, display_name)
  SELECT v_invite.group_id, auth.uid(), 'member', true, now(), COALESCE(p.name, 'Membro')
  FROM profiles p
  WHERE p.user_id = auth.uid()
  ON CONFLICT (group_id, user_id) DO UPDATE
    SET is_active = true,
        joined_at = now(),
        display_name = COALESCE((SELECT COALESCE(p.name, 'Membro') FROM profiles p WHERE p.user_id = auth.uid()), display_name);

  -- 2) Find the master's primary home (the one where they are 'owner')
  SELECT hm.home_id INTO v_master_home_id
  FROM   sub_account_groups sag
  JOIN   home_members hm
      ON hm.user_id = sag.master_user_id
     AND hm.role    = 'owner'
  WHERE  sag.id = v_invite.group_id
  LIMIT  1;

  -- 3) Add member to master's home (SECURITY DEFINER bypasses INSERT policy)
  IF v_master_home_id IS NOT NULL THEN
    INSERT INTO home_members (home_id, user_id, role, joined_at)
    VALUES (v_master_home_id, auth.uid(), 'member', now())
    ON CONFLICT (home_id, user_id) DO NOTHING;
  END IF;

  -- 4) Mark invite as accepted
  UPDATE sub_account_invites
  SET    status = 'accepted'
  WHERE  id = v_invite.id;

  RETURN QUERY SELECT v_invite.group_id, v_invite.master_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
