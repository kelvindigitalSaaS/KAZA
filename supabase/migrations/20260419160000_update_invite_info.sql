-- Atualiza a função get_invite_info para retornar os dados de assinatura / trial da conta principal (master)
CREATE OR REPLACE FUNCTION public.get_invite_info(invite_token text)
RETURNS TABLE(
  invited_email text,
  master_name text,
  group_id uuid,
  status text,
  in_trial boolean,
  plan_tier text
) AS $$
  SELECT
    i.invited_email,
    i.master_name,
    i.group_id,
    i.status,
    COALESCE(v.in_trial, false) as in_trial,
    COALESCE(v.plan_tier, 'multiPRO') as plan_tier
  FROM sub_account_invites i
  LEFT JOIN v_user_access v ON v.user_id = i.master_user_id
  WHERE i.token = invite_token
    AND i.expires_at > now()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
