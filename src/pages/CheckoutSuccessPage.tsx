/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ArrowRight, Sparkles, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/hooks/useAuth";
import { usePWA } from "@/contexts/PWAContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Monitor } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const { canInstall, install } = usePWA();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get("session_id");

  const labels = {
    "pt-BR": {
      success: "✨ Pagamento Confirmado!",
      subtitle: "Sua assinatura foi ativada com sucesso",
      sessionId: "ID da Sessão",
      thanks: "Obrigado por se inscrever!",
      features: "Você agora tem acesso a:",
      allFeatures: "todos os recursos premium",
      actions: "O que fazer agora?",
      exploreApp: "Explorar o App",
      goHome: "Voltar para Home",
      backPlans: "Ver Meus Planos",
      contact: "Dúvidas? Entre em contato com suporte@kaza.app"
    },
    en: {
      success: "✨ Payment Confirmed!",
      subtitle: "Your subscription has been activated successfully",
      sessionId: "Session ID",
      thanks: "Thank you for subscribing!",
      features: "You now have access to:",
      allFeatures: "all premium features",
      actions: "What to do next?",
      exploreApp: "Explore the App",
      goHome: "Go to Home",
      backPlans: "View My Subscriptions",
      contact: "Questions? Contact support@kaza.app"
    },
    es: {
      success: "✨ ¡Pago Confirmado!",
      subtitle: "Tu suscripción ha sido activada exitosamente",
      sessionId: "ID de Sesión",
      thanks: "¡Gracias por suscribirse!",
      features: "Ahora tienes acceso a:",
      allFeatures: "todas las características premium",
      actions: "¿Qué hacer ahora?",
      exploreApp: "Explorar la App",
      goHome: "Ir a Inicio",
      backPlans: "Ver Mis Suscripciones",
      contact: "¿Preguntas? Contacta con support@kaza.app"
    }
  };

  const l = labels[language] || labels["pt-BR"];

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);

        // Atualizar subscription do usuário
        await refreshSubscription();

        // Send invites to trio members (if any)
        try {
          const trioMembersStr = localStorage.getItem("trio_members");
          if (trioMembersStr) {
            const members = JSON.parse(trioMembersStr);
            const { data: { session } } = await supabase.auth.getSession();

            if (session && members.length > 0) {
              for (const member of members) {
                if (member.email && member.email.trim()) {
                  try {
                    // Get user's subscription to find group_id
                    const { data: subscription } = await supabase
                      .from("subscriptions")
                      .select("*, sub_account_groups(id)")
                      .eq("user_id", user?.id)
                      .eq("plan_tier", "multiPRO")
                      .single() as any;

                    if (subscription?.sub_account_groups?.id) {
                      await supabase.functions.invoke("send-invite-email", {
                        body: {
                          group_id: subscription.sub_account_groups.id,
                          invited_email: member.email
                        }
                      });
                    }
                  } catch (_inviteError) { /* silent */ }
                }
              }
            }
            // Clear stored members after sending invites
            try { localStorage.removeItem("trio_members"); } catch { /* ignore */ }
          }
        } catch (_inviteProcessError) { /* silent */ }

        toast.success(l.thanks);

        // Aguardar um pouco e depois ir para home
        await new Promise((resolve) => setTimeout(resolve, 10000));
        navigate("/app/home");
      } catch (_error) {
        toast.error("Erro ao ativar assinatura");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      verifyPayment();
    }
  }, [user, refreshSubscription, l.thanks, navigate]);

  return (
    <PageTransition
      direction="up"
      className="min-h-[100dvh] bg-gradient-to-b from-green-50/50 via-[#fafafa] to-[#fafafa] dark:from-green-950/20 dark:via-[#091f1c] dark:to-[#091f1c] pb-20"
    >
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Success Animation */}
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Animated Checkmark */}
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
              <Check className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{l.success}</h1>
            <p className="text-base text-muted-foreground">{l.subtitle}</p>
          </div>

          {/* Session ID (if available) */}
          {sessionId && (
            <div className="w-full bg-muted/40 rounded-xl p-4 border border-muted">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {l.sessionId}
              </p>
              <code className="text-xs break-all text-foreground font-mono bg-muted/50 p-2 rounded block">
                {sessionId}
              </code>
            </div>
          )}

          {/* Features List */}
          <div className="w-full space-y-3">
            <p className="text-sm font-bold text-muted-foreground">
              {l.features}
            </p>
            <div className="space-y-2">
              {[
                "🗂️ Itens ilimitados na geladeira",
                "👨‍🍳 Receitas ilimitadas",
                "📋 Lista de compras ilimitada",
                "🔔 Notificações sem restrição",
                "✨ Interface premium completa"
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm text-foreground p-2 bg-green-50/50 dark:bg-green-900/10 rounded-lg"
                >
                  <span className="text-lg">{feature.split(" ")[0]}</span>
                  <span>{feature.substring(feature.indexOf(" ") + 1)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-spin" />
              Ativando sua assinatura...
            </div>
          )}

          {/* Action Buttons */}
          {!loading && (
            <div className="w-full space-y-3">
              {/* Android/PC Install Guide (Requested) */}
              {(canInstall || (!navigator.userAgent.includes('iPhone') && !navigator.userAgent.includes('iPad'))) && (
                <div className="bg-white dark:bg-white/5 border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 space-y-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
                    <Monitor className="h-4 w-4" /> Instalação Recomendada
                  </div>
                  <p className="text-[13px] text-muted-foreground font-medium px-2">
                    Instale o Kaza no seu dispositivo para ter uma experiência de app real e notificações em tempo real.
                  </p>
                  {canInstall ? (
                    <Button 
                      onClick={install} 
                      className="w-full h-11 rounded-xl bg-primary text-white font-black text-sm gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Instalar Kaza
                    </Button>
                  ) : (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-[10px] text-muted-foreground font-medium italic">
                        Clique nos três pontos do navegador e selecione "Instalar" ou "Adicionar à tela de início".
                      </p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs font-bold text-muted-foreground mb-3">
                {l.actions}
              </p>
              <Button
                onClick={() => navigate("/app/home")}
                className="w-full h-12 rounded-xl font-bold text-base shadow-lg"
              >
                <Home className="h-5 w-5 mr-2" />
                {l.goHome}
              </Button>
              <Button
                onClick={() => navigate("/app/settings/subscription")}
                variant="outline"
                className="w-full h-12 rounded-xl font-bold text-base"
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                {l.backPlans}
              </Button>
            </div>
          )}

          {/* Support Info */}
          <div className="w-full text-center pt-6 border-t border-muted/50">
            <p className="text-xs text-muted-foreground">{l.contact}</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
