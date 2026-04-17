import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface InviteRequest {
  group_id: string;
  invited_email: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const payload: InviteRequest = await req.json();
    const { group_id, invited_email } = payload;

    if (!group_id || !invited_email) {
      return new Response(
        JSON.stringify({ error: "Missing group_id or invited_email" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Validate user is master of group
    const { data: group, error: groupError } = await supabase
      .from("sub_account_groups")
      .select("*")
      .eq("id", group_id)
      .eq("master_user_id", user.id)
      .single();

    if (groupError || !group) {
      const errorMsg = groupError?.message || "Você não tem permissão para enviar convites neste grupo";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Check if email already invited to this group
    const { data: existingInvite } = await supabase
      .from("sub_account_invites")
      .select("*")
      .eq("group_id", group_id)
      .eq("invited_email", invited_email)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: `Este email (${invited_email}) já foi convidado para este grupo. Aguarde a resposta ou envie um novo convite em 7 dias.` }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get master's display name
    const { data: masterProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const masterName = masterProfile?.display_name || user.email || "Friggo User";

    // Create invite
    const { data: invite, error: inviteError } = await supabase
      .from("sub_account_invites")
      .insert({
        group_id,
        master_user_id: user.id,
        master_name: masterName,
        invited_email,
      })
      .select()
      .single();

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Send email via Resend
    const inviteUrl = `${Deno.env.get("PUBLIC_APP_URL")}/invite?token=${invite.token}`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "convites@friggo.com",
        to: invited_email,
        subject: `${masterName} te convidou para Friggo PRO`,
        html: `
          <h2>Você foi convidado para Friggo PRO!</h2>
          <p>${masterName} te convidou para fazer parte do plano Friggo PRO Trio.</p>
          <p><a href="${inviteUrl}" style="background-color: #007AFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Aceitar convite</a></p>
          <p>Este link expira em 7 dias.</p>
        `,
      }),
    });

    return new Response(
      JSON.stringify({ success: true, invite_id: invite.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
