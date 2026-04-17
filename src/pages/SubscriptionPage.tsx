import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Crown,
  ShieldCheck,
  Clock,
  ArrowRight,
  Users,
  User,
} from "lucide-react";

const labels = {
  "pt-BR": {
    title: "Assinatura",
    status: "Plano atual",
    memberSince: "Membro desde",
    trial: "Período de teste multiPRO",
    trialDesc: "Você está testando o multiPRO gratuitamente por 7 dias.",
    daysLeft: "dias restantes",
    dayLeft: "dia restante",
    trialEnded: "Período de teste encerrado",
    viewSubs: "Ver assinaturas",
    viewSubsDesc: "Ver plano ativo, planos disponíveis e histórico",
    freeLabel: "Grátis",
    activeBadge: "Você tem acesso Premium ativo. Obrigado!",
    individualDesc: "1 conta · tudo ilimitado",
    multiDesc: "Até 3 contas · geladeira compartilhada",
    trialBadge: "Teste gratuito",
  },
  en: {
    title: "Subscription",
    status: "Current plan",
    memberSince: "Member since",
    trial: "multiPRO trial period",
    trialDesc: "You are testing multiPRO for free for 7 days.",
    daysLeft: "days left",
    dayLeft: "day left",
    trialEnded: "Trial period ended",
    viewSubs: "View subscriptions",
    viewSubsDesc: "View active plan, available plans and history",
    freeLabel: "Free",
    activeBadge: "You already have active Premium access. Thank you!",
    individualDesc: "1 account · everything unlimited",
    multiDesc: "Up to 3 accounts · shared fridge",
    trialBadge: "Free trial",
  },
  es: {
    title: "Suscripción",
    status: "Plan actual",
    memberSince: "Miembro desde",
    trial: "Período de prueba multiPRO",
    trialDesc: "Estás probando multiPRO gratis por 7 días.",
    daysLeft: "días restantes",
    dayLeft: "día restante",
    trialEnded: "Prueba finalizada",
    viewSubs: "Ver suscripciones",
    viewSubsDesc: "Ver plan activo, planes disponibles e historial",
    freeLabel: "Gratis",
    activeBadge: "¡Ya tienes acceso Premium activo!",
    individualDesc: "1 cuenta · todo ilimitado",
    multiDesc: "Hasta 3 cuentas · heladera compartida",
    trialBadge: "Prueba gratuita",
  },
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { subscription, trialDaysRemaining, registrationDate, planTier, isMultiPro } = useSubscription();
  const l = labels[language as keyof typeof labels] || labels["pt-BR"];

  const isTrial = trialDaysRemaining > 0 && !subscription?.isActive;
  const isActive = !!subscription?.isActive;

  // Label e ícone do plano atual
  const planLabel = isActive
    ? planTier === "multiPRO"
      ? "multiPRO"
      : "individualPRO"
    : isTrial
      ? "multiPRO"
      : l.freeLabel;

  const PlanIcon = (planTier === "multiPRO" || isTrial) ? Users : User;
  const planDesc = isActive
    ? planTier === "multiPRO"
      ? l.multiDesc
      : l.individualDesc
    : isTrial
      ? l.multiDesc
      : "";

  return (
    <div className="min-h-screen bg-[#0b1f1c] dark:bg-[#091f1c] pb-16 font-sans text-foreground">
      <header className="sticky top-0 z-50 bg-[#0b1f1c]/95 dark:bg-[#091f1c]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 h-16 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white transition-all active:scale-90"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-white">{l.title}</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {/* Card do plano ativo */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] bg-[#11302c] border border-white/10 overflow-hidden shadow-sm"
        >
          <div className="p-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#165A52]/30 rounded-full blur-3xl -translate-y-8 translate-x-8 pointer-events-none" />
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">{l.status}</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#165A52]/40 flex items-center justify-center shrink-0">
                <PlanIcon className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-[24px] font-black text-white flex items-center gap-2 leading-tight">
                  {planLabel}
                  {(isActive || isTrial) && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  )}
                </h2>
                {planDesc && (
                  <p className="text-[12px] text-emerald-300/80 font-semibold">{planDesc}</p>
                )}
                <p className="text-[11px] text-white/50 font-medium mt-0.5">
                  {registrationDate
                    ? `${l.memberSince} ${new Date(registrationDate).toLocaleDateString(
                        language === "pt-BR" ? "pt-BR" : language === "es" ? "es-ES" : "en-US"
                      )}`
                    : l.memberSince}
                </p>
              </div>
            </div>
            {isTrial && (
              <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-300/15 text-emerald-300 border border-emerald-300/20">
                <Crown className="h-3 w-3" />
                {l.trialBadge}
              </span>
            )}
          </div>
        </motion.section>

        {/* Período de teste */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[1.5rem] bg-[#11302c] border border-white/10 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-[#165A52]/40 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-black text-white">{l.trial}</p>
              <p className="text-[11px] text-white/60 font-medium">{l.trialDesc}</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-[#0b1f1c] border border-white/5 p-4 flex items-baseline gap-2">
            {isTrial ? (
              <>
                <span className="text-[32px] font-black text-emerald-300 leading-none">{trialDaysRemaining}</span>
                <span className="text-sm font-semibold text-white/70">
                  {trialDaysRemaining === 1 ? l.dayLeft : l.daysLeft}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-white/70">{l.trialEnded}</span>
            )}
          </div>
        </motion.section>

        {/* Botão ver assinaturas */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate("/app/settings/subscription/manage")}
          className="w-full rounded-[1.5rem] p-5 text-left flex items-center gap-4 shadow-lg active:scale-[0.98] transition-all"
          style={{
            background: "linear-gradient(135deg, #0F3D38 0%, #165A52 100%)",
            boxShadow: "0 8px 24px rgba(22,90,82,0.35)",
          }}
        >
          <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-base font-black text-white">{l.viewSubs}</p>
            <p className="text-[11px] text-white/70 font-medium">{l.viewSubsDesc}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-white shrink-0" />
        </motion.button>

        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-[1.5rem] bg-[#165A52]/20 border border-[#165A52]/40 p-4 flex items-center gap-3"
          >
            <ShieldCheck className="h-5 w-5 text-emerald-300 shrink-0" />
            <p className="text-sm font-semibold text-emerald-200">{l.activeBadge}</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
