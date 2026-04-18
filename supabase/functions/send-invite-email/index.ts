import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

// Service-role client — bypasses RLS for admin operations
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

interface InviteRequest {
  group_id?: string;
  invited_email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Invalid token" }, 401);

    // ── Payload ───────────────────────────────────────────────────────────
    const payload: InviteRequest = await req.json();
    const { invited_email } = payload;
    let { group_id } = payload;

    if (!invited_email) return json({ error: "Missing invited_email" }, 400);

    // ── Resolve / auto-create group ───────────────────────────────────────
    if (!group_id) {
      // Look up the group via the user's subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("group_id, plan_tier, plan, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (sub?.group_id) {
        group_id = sub.group_id;
      } else {
        // User has multiPRO subscription but no group yet — create one now
        const isPro =
          (sub?.plan_tier === "multiPRO" || sub?.plan_tier === "individualPRO" || sub?.plan === "premium" || sub?.plan === "multiPRO") &&
          sub?.is_active;

        if (!isPro) {
          return json(
            { error: "Você precisa de um plano PRO para convidar membros." },
            403
          );
        }

        // Create the group
        const { data: newGroup, error: groupErr } = await supabase
          .from("sub_account_groups")
          .insert({ master_user_id: user.id, plan_tier: "multiPRO", max_members: 3 })
          .select("id")
          .single();

        if (groupErr || !newGroup) {
          console.error("Failed to auto-create group:", groupErr);
          return json({ error: "Não foi possível criar o grupo. Tente novamente." }, 500);
        }

        group_id = newGroup.id;

        // Link group to subscription
        await supabase
          .from("subscriptions")
          .update({ group_id })
          .eq("user_id", user.id);
      }
    }

    // ── Validate caller is master of group ────────────────────────────────
    const { data: group, error: groupError } = await supabase
      .from("sub_account_groups")
      .select("id")
      .eq("id", group_id)
      .eq("master_user_id", user.id)
      .single();

    if (groupError || !group) {
      return json({ error: "Você não tem permissão para convidar neste grupo." }, 403);
    }

    // ── Duplicate invite check ────────────────────────────────────────────
    const { data: existingInvite } = await supabase
      .from("sub_account_invites")
      .select("id")
      .eq("group_id", group_id)
      .eq("invited_email", invited_email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return json(
        {
          error: `Este email (${invited_email}) já foi convidado. Aguarde a resposta ou reenvie após 7 dias.`,
        },
        400
      );
    }

    // ── Master display name ───────────────────────────────────────────────
    const { data: masterProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user.id)
      .maybeSingle();

    const masterName =
      (masterProfile as any)?.name || user.email?.split("@")[0] || "Kaza User";

    // ── Create invite record ──────────────────────────────────────────────
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
      // Unique constraint → already invited (race condition)
      if (inviteError.code === "23505") {
        return json(
          { error: `Este email (${invited_email}) já possui um convite pendente.` },
          400
        );
      }
      return json({ error: inviteError.message }, 400);
    }

    // ── Send email via Resend (best-effort) ───────────────────────────────
    const appUrl =
      Deno.env.get("PUBLIC_APP_URL") ||
      supabaseUrl.replace(".supabase.co", "");
    const inviteUrl = `${appUrl}/invite?token=${invite.token}`;

    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "convites@kaza.app",
          to: invited_email,
          subject: `${masterName} te convidou para o Kaza PRO`,
          html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f5fdf9;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(22,90,82,0.10)">
    <div style="background:#165A52;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">Kaza</h1>
      <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:14px">Tecnologia para sua rotina</p>
    </div>
    <div style="padding:32px 24px">
      <h2 style="color:#165A52;margin:0 0 12px;font-size:20px">Você foi convidado!</h2>
      <p style="color:#548A76;margin:0 0 24px;font-size:15px">
        <strong>${masterName}</strong> te convidou para fazer parte do plano
        <strong>Kaza multiPRO</strong>.<br>
        Compartilhe receitas, lista de compras e muito mais.
      </p>
      <a href="${inviteUrl}"
         style="display:inline-block;background:#165A52;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">
        Aceitar convite →
      </a>
      <p style="color:#90AB9C;margin:20px 0 0;font-size:13px">Este link expira em 7 dias.</p>
    </div>
  </div>
</body>
</html>`,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("Resend error:", errText);
        // Non-critical — invite record is already created
      }
    } catch (emailErr) {
      console.error("Email send failed (non-critical):", emailErr);
    }

    return json({ success: true, invite_id: invite.id, group_id });
  } catch (error) {
    console.error(error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500
    );
  }
});
