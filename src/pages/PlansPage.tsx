import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Check,
  Crown,
  Zap,
  ShieldCheck,
  Star,
  CreditCard,
  Loader2,
  Calendar,
  Wallet,
  Users,
  User,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const INDIVIDUAL_URL = "https://pay.cakto.com.br/356go8z";
const TRIO_URL = "https://pay.cakto.com.br/wbjq4ne_846287";

const INDIVIDUAL_FEATURES = {
  "pt-BR": [
    "Itens e receitas ilimitados",
    "Lista de compras ilimitada",
    "Alertas de vencimento inteligentes",
    "Planejador semanal de refeições",
    "Controle de consumíveis",
    "Lembrete de coleta de lixo",
    "Histórico completo de consumo",
  ],
  en: [
    "Unlimited items and recipes",
    "Unlimited shopping list",
    "Smart expiry alerts",
    "Weekly meal planner",
    "Consumables tracking",
    "Garbage pickup reminder",
    "Full consumption history",
  ],
};

const TRIO_FEATURES = {
  "pt-BR": [
    "Tudo do plano Individual",
    "Até 3 perfis simultâneos",
    "Cada pessoa com sua própria geladeira",
    "Lista de compras compartilhada e sincronizada",
    "Planejador de refeições por pessoa",
    "Notificações independentes por perfil",
    "Sincronização em tempo real entre os membros",
  ],
  en: [
    "Everything in Individual",
    "Up to 3 simultaneous profiles",
    "Each person with their own fridge",
    "Shared & synced shopping list",
    "Meal planner per person",
    "Independent notifications per profile",
    "Real-time sync between members",
  ],
};

export default function PlansPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const {
    subscription,
    openCustomerPortal,
    getPlanTier,
    loading,
    trialDaysRemaining,
    isLocked,
  } = useSubscription();

  const [portalLoading, setPortalLoading] = useState(false);

  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center bg-[#F7F6F3] dark:bg-[#091f1c]">
        <div className="h-10 w-10 rounded-full border-2 border-[#3D6B55] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-[#9A998F] dark:text-white/40">
          {language === "pt-BR" ? "Carregando planos..." : "Loading plans..."}
        </p>
      </div>
    );
  }

  if (!user) return null;

  const isPremium = subscription?.plan === "premium" && trialDaysRemaining <= 0;
  const isTrial = trialDaysRemaining > 0;

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } catch {
      toast.error(language === "pt-BR" ? "Erro ao abrir portal." : "Error opening portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const featIndividual = INDIVIDUAL_FEATURES[language as keyof typeof INDIVIDUAL_FEATURES] ?? INDIVIDUAL_FEATURES["pt-BR"];
  const featTrio = TRIO_FEATURES[language as keyof typeof TRIO_FEATURES] ?? TRIO_FEATURES["pt-BR"];

  return (
    <PageTransition direction="left" className="min-h-[100dvh] bg-[#F7F6F3] dark:bg-[#091f1c] pb-32">
      <header className="sticky top-0 z-50 flex items-center gap-3 bg-[#F7F6F3]/80 dark:bg-[#091f1c]/80 px-4 py-4 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.04]">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#2C2C2A] dark:text-white bg-white dark:bg-white/10 border border-[#E2E1DC] dark:border-white/10 active:scale-[0.97] transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[18px] font-black text-[#2C2C2A] dark:text-white">
            {language === "pt-BR" ? "Escolha seu Plano" : "Choose Your Plan"}
          </h1>
          <p className="text-xs text-[#9A998F] dark:text-white/40 font-medium">
            {language === "pt-BR" ? "Cancele quando quiser · Seguro via Cakto" : "Cancel anytime · Secure via Cakto"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-5">
        {/* Current Plan Status */}
        {(isTrial || isPremium) && (
          <div className={cn(
            "rounded-2xl px-5 py-4 flex items-center gap-3 border shadow-sm",
            isPremium
              ? "bg-[#3D6B55]/10 border-[#3D6B55]/20"
              : "bg-amber-500/10 border-amber-400/20"
          )}>
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", isPremium ? "bg-[#3D6B55]/20" : "bg-amber-500/20")}>
              {isPremium ? <Crown className="h-5 w-5 text-[#3D6B55]" /> : <Star className="h-5 w-5 text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#2C2C2A] dark:text-white text-[14px]">
                {isPremium
                  ? (language === "pt-BR" ? "Plano atual: Premium" : "Current plan: Premium")
                  : (language === "pt-BR" ? "Trial ativo" : "Trial active")}
              </p>
              <p className="text-[12px] text-[#9A998F] dark:text-white/40">
                {isPremium
                  ? (language === "pt-BR" ? "Acesso completo ativo" : "Full access active")
                  : (language === "pt-BR" ? `${trialDaysRemaining} dias restantes` : `${trialDaysRemaining} days remaining`)}
              </p>
            </div>
            {isPremium && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="text-[12px] font-bold text-[#3D6B55] flex items-center gap-1"
              >
                {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {language === "pt-BR" ? "Gerenciar" : "Manage"}
              </button>
            )}
          </div>
        )}

        {/* INDIVIDUAL PLAN */}
        <div className="rounded-3xl bg-white dark:bg-[#11302c] border border-[#E2E1DC] dark:border-white/10 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-[#EDECEA] dark:bg-white/10 flex items-center justify-center">
                <User className="h-5 w-5 text-[#3D3D3A] dark:text-white/70" />
              </div>
              <div>
                <p className="font-black text-[17px] text-[#2C2C2A] dark:text-white leading-tight">Individual</p>
                <p className="text-[12px] text-[#9A998F] dark:text-white/40 font-medium">
                  {language === "pt-BR" ? "Para 1 perfil" : "For 1 profile"}
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-[38px] font-black text-[#2C2C2A] dark:text-white tracking-tight leading-none">R$ 14,99</span>
              <span className="text-[14px] font-semibold text-[#B0AFA7] dark:text-white/30">
                {language === "pt-BR" ? "/mês" : "/mo"}
              </span>
            </div>
            <p className="text-[12px] text-[#9A998F] dark:text-white/40 font-medium mb-5">
              {language === "pt-BR" ? "Cancele quando quiser" : "Cancel anytime"}
            </p>

            {/* Features */}
            <div className="space-y-2.5 mb-6">
              {featIndividual.map((feat) => (
                <div key={feat} className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-[#3D6B55]/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-[#3D6B55] stroke-[2.5]" />
                  </div>
                  <span className="text-[13px] font-medium text-[#7A7A72] dark:text-white/60">{feat}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => window.open(INDIVIDUAL_URL, "_blank")}
              disabled={isPremium}
              className={cn(
                "w-full h-14 rounded-2xl font-black text-[15px] tracking-wide transition-all active:scale-[0.97] flex items-center justify-center gap-2.5 shadow-sm",
                isPremium
                  ? "bg-[#EDECEA] dark:bg-white/10 text-[#B0AFA7] dark:text-white/30 cursor-not-allowed"
                  : "bg-[#2C2C2A] dark:bg-white text-white dark:text-[#091f1c] hover:bg-[#1a1a18] dark:hover:bg-white/90"
              )}
            >
              {isPremium ? (
                <><Check className="h-4.5 w-4.5" /> {language === "pt-BR" ? "Já Assinado" : "Already Subscribed"}</>
              ) : (
                <><CreditCard className="h-4.5 w-4.5" /> {language === "pt-BR" ? "Assinar Individual" : "Subscribe Individual"}</>
              )}
            </button>
          </div>
        </div>

        {/* TRIO PLAN — highlighted */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-[#3D6B55]/20">
          {/* Popular badge */}
          <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-[#3D6B55] text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
            {language === "pt-BR" ? "Mais Popular" : "Most Popular"}
          </div>

          {/* Card body */}
          <div className="bg-[#0a2520] dark:bg-[#061a16] px-6 pt-6 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-[#3D6B55]/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="font-black text-[17px] text-white leading-tight">Trio</p>
                <p className="text-[12px] text-emerald-400/70 font-medium">
                  {language === "pt-BR" ? "Para até 3 perfis" : "For up to 3 profiles"}
                </p>
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-[38px] font-black text-white tracking-tight leading-none">R$ 27,00</span>
              <span className="text-[14px] font-semibold text-white/40">
                {language === "pt-BR" ? "/mês" : "/mo"}
              </span>
            </div>
            <p className="text-[12px] text-emerald-400/60 font-medium mb-5">
              {language === "pt-BR" ? "R$ 9,00 por pessoa · Cancele quando quiser" : "R$ 9.00 per person · Cancel anytime"}
            </p>

            {/* Features */}
            <div className="space-y-2.5 mb-6">
              {featTrio.map((feat, i) => (
                <div key={feat} className="flex items-center gap-2.5">
                  <div className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                    i === 0 ? "bg-emerald-500/30" : "bg-[#3D6B55]/40"
                  )}>
                    <Check className="h-3 w-3 text-emerald-400 stroke-[2.5]" />
                  </div>
                  <span className={cn(
                    "text-[13px] font-medium",
                    i === 0 ? "text-white font-bold" : "text-white/60"
                  )}>{feat}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                if (!isPremium) navigate("/app/trio-setup");
              }}
              disabled={isPremium}
              className={cn(
                "w-full h-16 rounded-2xl font-black text-[16px] tracking-wide transition-all active:scale-[0.97] flex items-center justify-center gap-3 shadow-lg",
                isPremium
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-[#3D6B55] hover:bg-[#2f5543] text-white shadow-[#3D6B55]/30"
              )}
            >
              {isPremium ? (
                <><Check className="h-5 w-5" /> {language === "pt-BR" ? "Já Assinado" : "Already Subscribed"}</>
              ) : (
                <><Users className="h-5 w-5" /> {language === "pt-BR" ? "Assinar Trio" : "Subscribe Trio"} <ArrowRight className="h-4.5 w-4.5 ml-1" /></>
              )}
            </button>

            {/* Payment methods */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-white/30 text-[11px] font-bold">
                <div className="w-4 h-4 rounded-sm bg-[#32BCAD] flex items-center justify-center text-[7px] text-white font-black">P</div>
                PIX
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-1.5 text-white/30 text-[11px] font-bold">
                <CreditCard className="h-3.5 w-3.5" />
                {language === "pt-BR" ? "Cartão" : "Card"}
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-1.5 text-white/30 text-[11px] font-bold">
                <ShieldCheck className="h-3.5 w-3.5" />
                {language === "pt-BR" ? "Seguro" : "Secure"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-[#B0AFA7] dark:text-white/30 font-medium pt-2">
          {language === "pt-BR"
            ? "Pagamento seguro processado pela Cakto · PIX e cartão"
            : "Secure payment processed by Cakto · PIX and card"}
        </p>
      </main>
    </PageTransition>
  );
}
