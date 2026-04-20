/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const resendFrom =
  Deno.env.get("RESEND_FROM_EMAIL") || "Kaza <onboarding@resend.dev>";

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

interface Payload {
  email: string;
  redirect_to?: string;
  invite_token?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { email, redirect_to, invite_token }: Payload = await req.json();
    if (!email) return json({ error: "Missing email" }, 400);

    // Authorize via one of: (a) logged-in user session, or (b) a valid invite
    // token whose invited_email matches. (b) covers the invite onboarding flow
    // where the user has signed up but isn't confirmed yet (no session).
    let authorized = false;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) authorized = true;
    }

    if (!authorized && invite_token) {
      const { data: invite } = await supabase
        .from("sub_account_invites")
        .select("invited_email, status")
        .eq("token", invite_token)
        .maybeSingle();
      if (
        invite &&
        invite.invited_email?.toLowerCase() === email.toLowerCase() &&
        (invite.status === "pending" || invite.status === "accepted")
      ) {
        authorized = true;
      }
    }

    if (!authorized) return json({ error: "Unauthorized" }, 401);

    const appUrl =
      Deno.env.get("PUBLIC_APP_URL") ||
      supabaseUrl.replace(".supabase.co", "");
    const redirectTo = redirect_to || `${appUrl}/auth`;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not set");
      return json({ error: "RESEND_API_KEY nÃ£o configurada." }, 500);
    }

    // Check if user already exists in auth.users
    const { data: listData } = await (supabase.auth as any).admin.listUsers();
    const existingUser = listData?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    // If already registered â†’ magiclink (logs them in directly).
    // If not â†’ signup link (confirms & creates session).
    const linkType = existingUser ? "magiclink" : "signup";
    const linkRes = await (supabase.auth as any).admin.generateLink({
      type: linkType,
      email,
      options: { redirectTo },
    });

    if (!linkRes?.data?.properties?.action_link) {
      console.error("generateLink failed:", linkType, linkRes?.error);
      return json(
        {
          error:
            linkRes?.error?.message ||
            "NÃ£o foi possÃ­vel gerar o link de acesso.",
        },
        500
      );
    }

    const confirmUrl: string = linkRes.data.properties.action_link;
    const isMagicLink = linkType === "magiclink";
    const subject = isMagicLink
      ? "Seu link de acesso â€” Kaza"
      : "Confirme seu email â€” Kaza";
    const heading = isMagicLink
      ? "Entrar na sua conta Kaza"
      : "Um clique e sua conta estÃ¡ pronta";
    const description = isMagicLink
      ? "Clique no botÃ£o abaixo para entrar direto no app."
      : "Clique no botÃ£o abaixo para confirmar seu email e ativar sua conta.";
    const button = isMagicLink ? "Entrar no Kaza â†’" : "Confirmar email â†’";

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: resendFrom,
        to: email,
        subject,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f5fdf9;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(22,90,82,0.10)">
    <div style="background:#165A52;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">Kaza</h1>
      <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:14px">${subject}</p>
    </div>
    <div style="padding:32px 24px">
      <h2 style="color:#165A52;margin:0 0 12px;font-size:20px">${heading}</h2>
      <p style="color:#548A76;margin:0 0 24px;font-size:15px">${description}</p>
      <a href="${confirmUrl}"
         style="display:inline-block;background:#165A52;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">
        ${button}
      </a>
      <p style="color:#90AB9C;margin:20px 0 0;font-size:13px">
        Se vocÃª nÃ£o solicitou este email, pode ignorar com seguranÃ§a.
      </p>
    </div>
  </div>
</body>
</html>`,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", emailRes.status, errText);
      return json(
        { error: `Resend ${emailRes.status}: ${errText}` },
        500
      );
    }

    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500
    );
  }
});
