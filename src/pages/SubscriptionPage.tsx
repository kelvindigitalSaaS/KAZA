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
  Zap,
  Star,
  Check,
  Sparkles,
  Lock,
} from "lucide-react";

const labels = {
  "pt-BR": {
    title: "Assinatura",
    status: "Seu plano",
    memberSince: "Membro desde",
    trial: "Teste multiPRO",
    trialDesc: "Acesso completo — expira em breve.",
    daysLeft: "dias",
    dayLeft: "dia",
    trialEnded: "Teste encerrado",
    trialEndedDesc: "Assine para continuar usando todos os recursos.",
    viewSubs: "Ver planos disponíveis",
    viewSubsDesc: "Upgrade, downgrade ou gerenciar cobrança",
    freeLabel: "Grátis",
    activeBadge: "Acesso Premium ativo",
    individualDesc: "1 conta · tudo ilimitado",
    multiDesc: "Até 3 contas · casa compartilhada",
    trialBadge: "Teste ativo",
    whyUpgrade: "O que está incluído",
    benefits: [
      { icon: Zap, text: "Itens e receitas ilimitados" },
      { icon: Users, text: "Geladeira compartilhada com a família" },
      { icon: Sparkles, text: "Plano alimentar com IA" },
      { icon: Star, text: "Notificações em tempo real" },
    ],
    cta: "Escolher plano",
    ctaActive: "Gerenciar assinatura",
    ctaTrial: "Assinar multiPRO",
    guarantee: "Cancele quando quiser · Sem multa",
    startTrial: "Iniciar teste grátis",
    trialCta: "Testar multiPRO — 7 dias grátis",
  },
  en: {
    title: "Subscription",
    status: "Your plan",
    memberSince: "Member since",
    trial: "multiPRO trial",
    trialDesc: "Full access — expires soon.",
    daysLeft: "days",
    dayLeft: "day",
    trialEnded: "Trial ended",
    trialEndedDesc: "Subscribe to keep using all features.",
    viewSubs: "See available plans",
    viewSubsDesc: "Upgrade, downgrade or manage billing",
    freeLabel: "Free",
    activeBadge: "Active Premium access",
    individualDesc: "1 account · everything unlimited",
    multiDesc: "Up to 3 accounts · shared home",
    trialBadge: "Trial active",
    whyUpgrade: "What's included",
    benefits: [
      { icon: Zap, text: "Unlimited items and recipes" },
      { icon: Users, text: "Shared fridge with family" },
      { icon: Sparkles, text: "AI meal planning" },
      { icon: Star, text: "Real-time notifications" },
    ],
    cta: "Choose plan",
    ctaActive: "Manage subscription",
    ctaTrial: "Subscribe multiPRO",
    guarantee: "Cancel anytime · No penalties",
    startTrial: "Start free trial",
    trialCta: "Try multiPRO — 7 days free",
  },
  es: {
    title: "Suscripción",
    status: "Tu plan",
    memberSince: "Miembro desde",
    trial: "Prueba multiPRO",
    trialDesc: "Acceso completo — vence pronto.",
    daysLeft: "días",
    dayLeft: "día",
    trialEnded: "Prueba finalizada",
    trialEndedDesc: "Suscríbete para seguir usando todos los recursos.",
    viewSubs: "Ver planes disponibles",
    viewSubsDesc: "Upgrade, downgrade o gestionar cobro",
    freeLabel: "Gratis",
    activeBadge: "Acceso Premium activo",
    individualDesc: "1 cuenta · todo ilimitado",
    multiDesc: "Hasta 3 cuentas · hogar compartido",
    trialBadge: "Prueba activa",
    whyUpgrade: "Qué incluye",
    benefits: [
      { icon: Zap, text: "Artículos y recetas ilimitadas" },
      { icon: Users, text: "Heladera compartida con familia" },
      { icon: Sparkles, text: "Plan de comidas con IA" },
      { icon: Star, text: "Notificaciones en tiempo real" },
    ],
    cta: "Elegir plan",
    ctaActive: "Gestionar suscripción",
    ctaTrial: "Suscribir multiPRO",
    guarantee: "Cancela cuando quieras",
    startTrial: "Iniciar prueba gratis",
    trialCta: "Probar multiPRO — 7 días gratis",
  },
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { subscription, trialDaysRemaining, registrationDate, planTier } = useSubscription();
  const l = labels[language as keyof typeof labels] || labels["pt-BR"];

  const isTrial = trialDaysRemaining > 0 && !subscription?.isActive;
  const isActive = !!subscription?.isActive;

  const planLabel = isActive
    ? planTier === "multiPRO" ? "multiPRO" : "individualPRO"
    : isTrial ? "multiPRO" : l.freeLabel;

  const PlanIcon = (planTier === "multiPRO" || isTrial) ? Users : User;
  const planDesc = isActive
    ? planTier === "multiPRO" ? l.multiDesc : l.individualDesc
    : isTrial ? l.multiDesc : "";

  const manageRoute = "/app/settings/subscription/manage";

  // Trial progress (0–1, where 1 = all days used)
  const trialProgress = isTrial ? Math.max(0, Math.min(1, (7 - trialDaysRemaining) / 7)) : 0;
  const circumference = 2 * Math.PI * 22; // radius 22

  return (
    <div className="min-h-screen bg-[#FAF8F4] dark:bg-[#091f1c] pb-20 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAF8F4]/95 dark:bg-[#091f1c]/95 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.06] px-4 h-16 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/10 text-[#1a1a1a] dark:text-white transition-all active:scale-90"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-[#1a1a1a] dark:text-white">{l.title}</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        {/* Hero plan card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2rem] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0F3D38 0%, #165A52 60%, #1a7a6e 100%)",
            boxShadow: "0 20px 60px rgba(22,90,82,0.35)",
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.06] rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-300/10 rounded-full blur-2xl translate-y-8 -translate-x-8 pointer-events-none" />

          <div className="relative p-6">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">{l.status}</p>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <PlanIcon className="h-7 w-7 text-emerald-300" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[28px] font-black text-white leading-none tracking-tight">{planLabel}</h2>
                  {(isActive || isTrial) && (
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
                  )}
                </div>
                {planDesc && (
                  <p className="text-[12px] text-emerald-300/90 font-semibold mt-0.5">{planDesc}</p>
                )}
                <p className="text-[11px] text-white/50 font-medium mt-1">
                  {registrationDate
                    ? `${l.memberSince} ${new Date(registrationDate).toLocaleDateString(
                        language === "pt-BR" ? "pt-BR" : language === "es" ? "es-ES" : "en-US"
                      )}`
                    : l.memberSince}
                </p>
              </div>
            </div>

            {/* Trial block — with visual ring */}
            {isTrial && (
              <div className="mt-4 flex items-center gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <div className="relative h-14 w-14 shrink-0">
                  <svg className="h-14 w-14 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle
                      cx="24" cy="24" r="22" fill="none"
                      stroke="#34d399" strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * trialProgress}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[16px] font-black text-emerald-300 leading-none">{trialDaysRemaining}</span>
                    <span className="text-[7px] text-white/60 font-bold uppercase tracking-wider">{trialDaysRemaining === 1 ? l.dayLeft : l.daysLeft}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{l.trial}</p>
                  <p className="text-[11px] text-white/60 mt-0.5">{l.trialDesc}</p>
                </div>
              </div>
            )}

            {/* Trial ended */}
            {!isTrial && !isActive && (
              <div className="mt-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 flex items-center gap-3">
                <Lock className="h-5 w-5 text-amber-300 shrink-0" />
                <div>
                  <p className="text-sm text-white font-bold">{l.trialEnded}</p>
                  <p className="text-[11px] text-white/60">{l.trialEndedDesc}</p>
                </div>
              </div>
            )}

            {/* Active badge */}
            {isActive && (
              <div className="mt-4 flex items-center gap-2 bg-emerald-400/20 rounded-2xl px-4 py-3 border border-emerald-400/30">
                <ShieldCheck className="h-4 w-4 text-emerald-300 shrink-0" />
                <p className="text-[12px] font-bold text-emerald-200">{l.activeBadge}</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* Benefits section — simplified */}
        {!isActive && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
            className="rounded-[2rem] bg-white dark:bg-[#11302c] border border-black/[0.06] dark:border-white/[0.06] p-6 shadow-sm"
          >
            <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-4">{l.whyUpgrade}</p>
            <div className="space-y-3">
              {l.benefits.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[14px] font-semibold text-[#1a1a1a] dark:text-white">{text}</span>
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 ml-auto shrink-0" />
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* CTA button — trial points to multiPRO */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          onClick={() => navigate(manageRoute)}
          className="w-full rounded-[1.5rem] p-5 text-left flex items-center gap-4 active:scale-[0.98] transition-all"
          style={{
            background: isActive
              ? "linear-gradient(135deg, #111827 0%, #1f2937 100%)"
              : "linear-gradient(135deg, #0F3D38 0%, #165A52 100%)",
            boxShadow: isActive
              ? "0 8px 24px rgba(0,0,0,0.20)"
              : "0 8px 32px rgba(22,90,82,0.40)",
          }}
        >
          <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-base font-black text-white">
              {isActive ? l.ctaActive : isTrial ? l.ctaTrial : l.cta}
            </p>
            <p className="text-[11px] text-white/70 font-medium">{l.viewSubsDesc}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-white shrink-0" />
        </motion.button>

        {/* Guarantee line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="text-center text-[11px] text-black/40 dark:text-white/40 font-medium"
        >
          {l.guarantee}
        </motion.p>
      </main>
    </div>
  );
}
