import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const CAKTO_WEBHOOK_SECRET = Deno.env.get("CAKTO_WEBHOOK_SECRET") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const payloadText = await req.text();
    let webhookData;

    try {
      webhookData = JSON.parse(payloadText);
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log("🔔 Webhook recebido:", webhookData.event);

    // ── Validação do secret ──
    const secretFromBody = webhookData.secret;
    if (!secretFromBody || secretFromBody !== CAKTO_WEBHOOK_SECRET) {
      console.error("❌ Secret inválido. Esperado:", CAKTO_WEBHOOK_SECRET, "Recebido:", secretFromBody);
      return new Response(JSON.stringify({ error: "Invalid secret" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    console.log("✅ Secret validado");

    // ── Extrair dados ──
    const event = webhookData.event;
    const transaction = webhookData.data;
    const customer = transaction?.customer;

    if (!customer?.email) {
      return new Response(JSON.stringify({ error: "No customer email" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const email = customer.email.toLowerCase().trim();
    console.log("📧 Email do cliente:", email);

    // ── Buscar usuário pelo email ──
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id, plan_type, subscription_status")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Erro ao buscar perfil:", profileError);
      return new Response(JSON.stringify({ error: "DB error", details: profileError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!profile) {
      if (email === "test@test.com" || email === "teste@teste.com" || email === "john.doe@example.com") {
        console.log("ℹ️ Evento de teste ignorado com sucesso (Cakto Test)");
        return new Response(JSON.stringify({ success: true, message: "Test payload processed" }), {
          status: 200,
          headers: corsHeaders,
        });
      }
      console.error("❌ Usuário não encontrado para:", email);
      return new Response(JSON.stringify({ error: "User not found", email }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    console.log("👤 Perfil encontrado:", profile.id);

    let resultMsg = "Event ignored";
    const transactionId = transaction.id || "unknown";

    // ── purchase_approved ──
    if (event === "purchase_approved") {
      console.log("💳 Processando compra aprovada...");

      const { error: updateErr } = await supabase.from("profiles").update({
        plan_type: "premium",
        subscription_status: "active",
        last_payment_date: new Date().toISOString(),
        payment_method: transaction.paymentMethod || "credit_card",
        cakto_customer_id: customer.docNumber || "",
      }).eq("id", profile.id);

      if (updateErr) {
        console.error("❌ Erro ao atualizar perfil:", updateErr);
      } else {
        console.log("✅ Perfil atualizado para premium");
      }

      // Salvar no histórico
      await supabase.from("payment_history").upsert({
        user_id: profile.user_id,
        cakto_transaction_id: transactionId,
        amount: transaction.amount || 0,
        status: "completed",
        payment_method: transaction.paymentMethod || "credit_card",
        webhook_data: transaction,
      }, { onConflict: "cakto_transaction_id" });

      // Atualizar subscriptions com period/next_billing e registrar evento
      const now = new Date();
      const nextBilling = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      await supabase.from("subscriptions").upsert({
        user_id: profile.user_id,
        plan: "premium",
        is_active: true,
        current_period_end: nextBilling.toISOString(),
        next_billing_at: nextBilling.toISOString(),
        payment_status: "paid",
        plan_label: "Premium",
        auto_renew: true,
        cancel_at_period_end: false,
      }, { onConflict: "user_id" });

      await supabase.from("subscription_events").insert({
        user_id: profile.user_id,
        event_type: "payment_succeeded",
        amount: transaction.amount || 0,
        currency: "BRL",
        metadata: { cakto_transaction_id: transactionId },
      });

      resultMsg = "Purchase approved - user upgraded to premium";

    // ── refund / subscription_canceled (nota: Cakto usa 1 'l') ──
    } else if (event === "refund" || event === "subscription_canceled" || event === "subscription_cancelled") {
      console.log("🚫 Processando cancelamento/reembolso...");

      const { error: updateErr } = await supabase.from("profiles").update({
        plan_type: "free",
        subscription_status: "canceled",
      }).eq("id", profile.id);

      if (updateErr) {
        console.error("❌ Erro ao cancelar:", updateErr);
      } else {
        console.log("✅ Assinatura cancelada");
      }

      await supabase.from("payment_history").upsert({
        user_id: profile.user_id,
        cakto_transaction_id: `${event}_${transactionId}`,
        amount: event === "refund" ? -(transaction.amount || 0) : 0,
        status: event,
        payment_method: "cancellation",
        webhook_data: transaction,
      }, { onConflict: "cakto_transaction_id" });

      await supabase.from("subscriptions").upsert({
        user_id: profile.user_id,
        plan: "free",
        is_active: false,
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
        payment_status: event,
      }, { onConflict: "user_id" });

      await supabase.from("subscription_events").insert({
        user_id: profile.user_id,
        event_type: event === "refund" ? "payment_failed" : "canceled",
        amount: event === "refund" ? -(transaction.amount || 0) : 0,
        currency: "BRL",
        metadata: { cakto_transaction_id: transactionId, event },
      });

      resultMsg = "Refund/Cancel processed - user downgraded to free";

    } else {
      console.log("⚠️ Evento não tratado:", event);
      resultMsg = `Event '${event}' acknowledged but not processed`;
    }

    console.log("✅ Resultado:", resultMsg);

    return new Response(JSON.stringify({ success: true, message: resultMsg }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("❌ Erro interno:", err);
    return new Response(JSON.stringify({ error: "Internal error", details: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
