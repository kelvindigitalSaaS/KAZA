import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

interface AcceptInviteRequest {
  token: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) return json({ error: "Invalid token" }, 401);

    const payload: AcceptInviteRequest = await req.json();
    const { token: inviteToken } = payload;

    if (!inviteToken) return json({ error: "Missing invite token" }, 400);

    // Validate invite exists and is not expired
    const { data: invite, error: inviteError } = await supabase
      .from("sub_account_invites")
      .select("*")
      .eq("token", inviteToken)
      .eq("status", "pending")
      .single();

    if (inviteError || !invite) {
      return json({ error: "Invalid or expired invite token" }, 400);
    }

    if (new Date() > new Date(invite.expires_at)) {
      return json({ error: "Invite has expired" }, 400);
    }

    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from("sub_account_groups")
      .select("id")
      .eq("id", invite.group_id)
      .single();

    if (groupError || !group) {
      return json({ error: "Group not found" }, 404);
    }

    // Call the RPC to accept invite (creates home_members entry etc.)
    const { error: rpcError } = await supabase.rpc("accept_invite", {
      invite_token: inviteToken,
    });

    if (rpcError) {
      console.error("accept_invite RPC error:", rpcError);
      return json({ error: rpcError.message }, 400);
    }

    return json({
      success: true,
      group_id: invite.group_id,
      master_name: invite.master_name,
    });
  } catch (error) {
    console.error(error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500
    );
  }
});
