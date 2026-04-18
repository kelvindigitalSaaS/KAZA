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
      let sub = null;
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("id, group_id, plan_tier, plan, is_active, trial_ends_at")
        .eq("user_id", user.id)
        .maybeSingle();
      sub = subData;

      // Se não tiver trial ends_at na subscription, pegar fallback do profile
      let inTrial = sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date();
      if (!inTrial) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("trial_start_date")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (profile?.trial_start_date) {
            const trialEnd = new Date(profile.trial_start_date);
            trialEnd.setDate(trialEnd.getDate() + 7); // Trial = 7 dias
            if (trialEnd > new Date()) {
                inTrial = true;
            }
        }
      }

      if (sub?.group_id) {
        group_id = sub.group_id;
      } else {
        // Only TRIO (multiPRO) paid OR trial users can invite. Individual cannot.
        const isTrioPro = (sub?.plan === "premium" || sub?.plan === "multiPRO" || sub?.plan_tier === "multiPRO") && sub?.is_active;
        const isPro = isTrioPro || inTrial;

        if (!isPro) {
          return json(
            { error: "Apenas o plano Trio ou usuários em Período de Teste podem convidar membros. Faça o upgrade para adicionar membros à sua casa." },
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

        // Link group to subscription if it exists, otherwise create it
        if (sub?.id) {
            await supabase
              .from("subscriptions")
              .update({ group_id })
              .eq("id", sub.id);
        } else {
             // Create an empty subscription shell just to hold the group_id if user has none yet
             await supabase
             .from("subscriptions")
             .insert({ user_id: user.id, group_id, plan: 'free', plan_tier: 'free', is_active: false });
        }
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
    // Se a variável PUBLIC_APP_URL não existir, cai para o localhost (para testes locais)
    const appUrl = Deno.env.get("PUBLIC_APP_URL") || "http://localhost:8080";
    const inviteUrl = `${appUrl}/invite?token=${invite.token}`;

    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: invited_email,
          subject: `${masterName} te convidou para o Kaza PRO`,
          html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kaza - Convite</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f7f6; font-family:Arial, Helvetica, sans-serif; color:#1f2d2a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:#f4f7f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background-color:#ffffff; border-radius:20px; overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 24px 12px 24px; background-color:#165a52;">
              <img src="https://friggo.vercel.app/icons/192.png" alt="Kaza" width="96" style="display:block; width:96px; height:96px; border:0; border-radius:22px; margin:0 auto 16px auto;" />
              <div style="font-size:24px; line-height:32px; font-weight:700; color:#ffffff;">
                Kaza
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 14px 0; font-size:24px; line-height:32px; font-weight:700; color:#1f2d2a; text-align:center;">
                Você recebeu um convite de ${masterName}
              </p>

              <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#52635f; text-align:center;">
                Clique no botão abaixo para aceitar o convite e continuar no Kaza.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="#165a52" style="border-radius:14px;">
                    <a href="${inviteUrl}" style="display:inline-block; padding:15px 26px; font-size:15px; line-height:20px; font-weight:700; color:#ffffff; text-decoration:none; background-color:#165a52; border-radius:14px;">
                      Aceitar convite
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0; font-size:12px; line-height:20px; color:#7b8a87; text-align:center;">
                Se você não esperava esta mensagem, ignore este e-mail.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
