import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Crown,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Zap,
  Lock,
  Users,
  User,
  Sparkles,
  ArrowRight,
  History,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CAKTO_LOGO =
  "https://app.cakto.com.br/logo/green-logo-transparent-background.png";

type PlanId = "individual" | "trio";

const PLANS: Record<PlanId, { url: string; screens: number; price: string; period: string }> = {
  individual: {
    url: "https://pay.cakto.com.br/356go8z",
    screens: 1,
    price: "R$ 14,99",
    period: "/mês",
  },
  trio: {
    url: "https://pay.cakto.com.br/wbjq4ne_846287",
    screens: 3,
    price: "R$ 27,00",
    period: "/mês",
  },
};

const labels = {
  "pt-BR": {
    title: "Gerenciar assinatura",
    currentPlan: "Seu plano atual",
    active: "Ativo",
    trial: "Em período de teste",
    free: "Grátis",
    availablePlans: "Planos disponíveis",
    availableDesc: "Escolha o plano ideal ou atualize o seu atual.",
    upgradeOnly: "Você tem um plano ativo — só pode trocar para o outro plano.",
    individual: "Individual",
    trio: "Trio",
    screen: "tela",
    screens: "telas",
    mostPopular: "Mais popular",
    current: "Plano atual",
    subscribe: "Assinar agora",
    upgrade: "Atualizar para este plano",
    benefits: [
      "Itens e receitas ilimitadas",
      "Alertas inteligentes sem restrição",
      "Planejador de refeições semanal",
      "Histórico completo de consumo",
    ],
    security: "Pagamento seguro via Cakto",
    securityDesc: "Seus dados estão 100% protegidos. PIX e cartões.",
    paymentHistory: "Histórico de pagamentos",
    noHistory: "Nenhum pagamento registrado ainda.",
  },
  en: {
    title: "Manage subscription",
    currentPlan: "Your current plan",
    active: "Active",
    trial: "Trial period",
    free: "Free",
    availablePlans: "Available plans",
    availableDesc: "Pick the ideal plan or upgrade your current one.",
    upgradeOnly: "You have an active plan — you can only switch to the other plan.",
    individual: "Individual",
    trio: "Trio",
    screen: "screen",
    screens: "screens",
    mostPopular: "Most popular",
    current: "Current plan",
    subscribe: "Subscribe now",
    upgrade: "Upgrade to this plan",
    benefits: [
      "Unlimited items and recipes",
      "Unrestricted smart alerts",
      "Weekly meal planner",
      "Full consumption history",
    ],
    security: "Secure payment via Cakto",
    securityDesc: "Your data is 100% protected. PIX and cards.",
    paymentHistory: "Payment history",
    noHistory: "No payment history yet.",
  },
  es: {
    title: "Administrar suscripción",
    currentPlan: "Tu plan actual",
    active: "Activo",
    trial: "Período de prueba",
    free: "Gratis",
    availablePlans: "Planes disponibles",
    availableDesc: "Elige el plan ideal o actualiza el actual.",
    upgradeOnly: "Tienes un plan activo — solo puedes cambiar al otro plan.",
    individual: "Individual",
    trio: "Trío",
    screen: "pantalla",
    screens: "pantallas",
    mostPopular: "Más popular",
    current: "Plan actual",
    subscribe: "Suscribirse",
    upgrade: "Actualizar a este plan",
    benefits: [
      "Items y recetas ilimitados",
      "Alertas inteligentes sin restricción",
      "Planificador semanal de comidas",
      "Historial completo de consumo",
    ],
    security: "Pago seguro vía Cakto",
    securityDesc: "Tus datos están 100% protegidos. PIX y tarjetas.",
    paymentHistory: "Historial de pagos",
    noHistory: "No hay historial de pagos aún.",
  },
};

interface PaymentRow {
  id: string;
  plan: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
  method: string | null;
  paid_at: string;
}

export default function SubscriptionsManagePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { subscription, trialDaysRemaining } = useSubscription();
  const { user } = useAuth();
  const l = labels[language as keyof typeof labels] || labels["pt-BR"];

  const isTrial = subscription?.plan === "premium" && trialDaysRemaining > 0;
  const isActive = !!subscription?.isActive && !isTrial;
  const activePlanId: PlanId | null = isActive
    ? subscription?.itemsLimit === -1 && subscription?.recipesPerDay === -1
      ? "trio"
      : "individual"
    : null;

  const [history, setHistory] = useState<PaymentRow[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("payment_history")
        .select("id, plan, amount, currency, status, method, paid_at")
        .eq("user_id", user.id)
        .order("paid_at", { ascending: false })
        .limit(20);
      setHistory((data || []) as PaymentRow[]);
    })();
  }, [user]);

  const openCheckout = (plan: PlanId) => {
    window.open(PLANS[plan].url, "_blank");
  };

  const canOpenPlan = (plan: PlanId) => !isActive || activePlanId !== plan;

  const formatMoney = (amount: number | null, currency: string | null) => {
    if (amount == null) return "";
    const cur = currency || "BRL";
    try {
      return new Intl.NumberFormat(language === "pt-BR" ? "pt-BR" : language === "es" ? "es-ES" : "en-US", {
        style: "currency",
        currency: cur,
      }).format(Number(amount));
    } catch {
      return `${cur} ${amount}`;
    }
  };

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

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        {/* Current plan */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.5rem] bg-[#11302c] border border-white/10 p-5 shadow-sm"
        >
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">
            {l.currentPlan}
          </p>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#165A52]/40 flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="flex-1">
              <p className="text-[18px] font-black text-white">
                {isActive
                  ? activePlanId === "trio"
                    ? l.trio
                    : l.individual
                  : isTrial
                  ? `${l.trial} · Premium`
                  : l.free}
              </p>
              <p className="text-[11px] text-white/60 font-medium">
                {isActive ? l.active : isTrial ? `${trialDaysRemaining} ${l.trial}` : ""}
              </p>
            </div>
          </div>
          {isActive && (
            <p className="mt-3 text-[11px] text-emerald-200/80 font-medium bg-[#165A52]/30 border border-emerald-300/20 rounded-xl px-3 py-2">
              {l.upgradeOnly}
            </p>
          )}
        </motion.section>

        {/* Available plans */}
        <section className="space-y-3">
          <div className="px-1">
            <h3 className="text-base font-black text-white">{l.availablePlans}</h3>
            <p className="text-xs text-white/60 font-medium mt-0.5">{l.availableDesc}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 items-start">
            {/* Individual */}
            <PlanCard
              plan="individual"
              label={l.individual}
              screens={PLANS.individual.screens}
              screenLabel={l.screen}
              price={PLANS.individual.price}
              period={PLANS.individual.period}
              isActive={activePlanId === "individual"}
              disabled={!canOpenPlan("individual")}
              onClick={() => openCheckout("individual")}
              currentLabel={l.current}
              icon={<User className="h-4 w-4" />}
              prominent={false}
            />
            {/* Trio */}
            <PlanCard
              plan="trio"
              label={l.trio}
              screens={PLANS.trio.screens}
              screenLabel={l.screens}
              price={PLANS.trio.price}
              period={PLANS.trio.period}
              isActive={activePlanId === "trio"}
              disabled={!canOpenPlan("trio")}
              onClick={() => openCheckout("trio")}
              currentLabel={l.current}
              popularLabel={l.mostPopular}
              icon={<Users className="h-5 w-5" />}
              prominent={true}
            />
          </div>

          {/* Benefits */}
          <div className="rounded-[1.5rem] bg-[#11302c] border border-white/10 p-5 space-y-2.5 shadow-sm">
            {l.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-[#165A52]/50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                </div>
                <span className="text-[13px] font-semibold text-white/90 leading-snug">{b}</span>
              </div>
            ))}
          </div>

          {/* Security (Cakto) */}
          <div className="rounded-[1.5rem] bg-[#11302c] border border-white/10 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Lock className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <p className="font-bold text-[13px] text-white">{l.security}</p>
                <p className="text-[11px] text-white/60 font-medium">{l.securityDesc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-400/30">
                  <Zap className="h-3 w-3 text-emerald-300" />
                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">PIX</span>
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg border border-white/20">
                  <CreditCard className="h-3 w-3 text-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">
                    {language === "pt-BR" ? "Cartão" : "Card"}
                  </span>
                </div>
              </div>
              <img
                src={CAKTO_LOGO}
                alt="Cakto"
                className="h-5 object-contain opacity-80"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          </div>
        </section>

        {/* Payment history */}
        <section className="rounded-[1.5rem] bg-[#11302c] border border-white/10 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-white/70" />
            <h3 className="text-sm font-bold text-white">{l.paymentHistory}</h3>
          </div>
          {history.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CreditCard className="h-8 w-8 text-white/40 mb-2" />
              <p className="text-sm text-white/60 font-medium">{l.noHistory}</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {history.map((h) => (
                <li key={h.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-white">
                      {h.plan ? h.plan.charAt(0).toUpperCase() + h.plan.slice(1) : "—"}
                      {h.method ? ` · ${h.method.toUpperCase()}` : ""}
                    </p>
                    <p className="text-[11px] text-white/60 font-medium">
                      {new Date(h.paid_at).toLocaleDateString(
                        language === "pt-BR" ? "pt-BR" : language === "es" ? "es-ES" : "en-US"
                      )}
                      {" · "}
                      <span
                        className={cn(
                          "font-bold",
                          h.status === "paid" && "text-emerald-300",
                          h.status === "failed" && "text-red-400",
                          h.status === "refunded" && "text-amber-300",
                          h.status === "pending" && "text-white/70"
                        )}
                      >
                        {h.status}
                      </span>
                    </p>
                  </div>
                  <p className="text-[14px] font-black text-white whitespace-nowrap">
                    {formatMoney(h.amount, h.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function PlanCard(props: {
  plan: PlanId;
  label: string;
  screens: number;
  screenLabel: string;
  price: string;
  period: string;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
  currentLabel: string;
  popularLabel?: string;
  icon: React.ReactNode;
  prominent: boolean;
}) {
  const {
    label, screens, screenLabel, price, period,
    isActive, disabled, onClick, currentLabel, popularLabel, icon, prominent
  } = props;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "relative rounded-[1.5rem] p-4 text-left transition-all duration-200 border",
        prominent ? "p-5 border-[3px] border-emerald-300/60" : "border-white/10",
        isActive && "bg-[#165A52] text-white shadow-xl shadow-[#165A52]/40 border-emerald-300",
        !isActive && prominent && "bg-[#0e3d38]",
        !isActive && !prominent && "bg-[#11302c]",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      {popularLabel && (
        <span
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap",
            isActive ? "bg-white text-[#165A52]" : "bg-emerald-300 text-[#0b1f1c]"
          )}
        >
          {popularLabel}
        </span>
      )}
      {isActive && (
        <span className="absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#165A52]">
          {currentLabel}
        </span>
      )}
      <div className={cn(
        "h-9 w-9 rounded-xl flex items-center justify-center mb-3",
        isActive ? "bg-white/20 text-white" : "bg-[#165A52]/50 text-emerald-200"
      )}>
        {icon}
      </div>
      <p className={cn("font-black text-[15px] leading-tight", isActive ? "text-white" : "text-white")}>
        {label}
      </p>
      <p className="text-[11px] font-semibold mb-2 text-white/60">
        {screens} {screenLabel}
      </p>
      <p className="text-[22px] font-black leading-none text-white">{price}</p>
      <p className="text-[11px] font-bold text-white/60">{period}</p>
      {!disabled && !isActive && (
        <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-200">
          <Sparkles className="h-3 w-3" />
          <span className="truncate">assinar</span>
          <ArrowUpRight className="h-3 w-3 ml-auto" />
        </div>
      )}
    </button>
  );
}
