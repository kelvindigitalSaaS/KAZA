import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useAccountSession } from "@/hooks/useAccountSession";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
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
  Wifi,
  WifiOff,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CAKTO_LOGO =
  "https://app.cakto.com.br/logo/green-logo-transparent-background.png";

type PlanId = "individualPRO" | "multiPRO";

const PLANS: Record<PlanId, { url: string; maxAccounts: number; price: string; period: string }> = {
  individualPRO: {
    url: "https://pay.cakto.com.br/356go8z",
    maxAccounts: 1,
    price: "R$ 14,99",
    period: "/mês",
  },
  multiPRO: {
    url: "https://pay.cakto.com.br/wbjq4ne_846287",
    maxAccounts: 3,
    price: "R$ 27,00",
    period: "/mês",
  },
};

const labels = {
  "pt-BR": {
    title: "Gerenciar assinatura",
    currentPlan: "Seu plano atual",
    active: "Ativo",
    trial: "Período de teste multiPRO",
    free: "Grátis",
    availablePlans: "Planos disponíveis",
    availableDesc: "Escolha o plano ideal para você.",
    upgradeOnly: "Você tem um plano ativo — só pode trocar para o outro plano.",
    individualPRO: "individualPRO",
    multiPRO: "multiPRO",
    account: "conta",
    accounts: "contas",
    mostPopular: "Mais popular",
    current: "Plano atual",
    subscribe: "Assinar agora",
    upgrade: "Atualizar para este plano",
    individualFeatures: [
      "1 conta individual",
      "Itens e receitas ilimitados",
      "Lista de compras ilimitada",
      "Alertas inteligentes sem restrição",
      "Planejador de refeições semanal",
      "Histórico completo de consumo",
    ],
    multiFeatures: [
      "Até 3 sub-contas no mesmo plano",
      "Geladeira e estoque compartilhados",
      "Lista de compras em tempo real",
      "Notificações independentes por conta",
      "Notificar outros membros da casa",
      "Conta mestre gerencia acessos",
    ],
    security: "Pagamento seguro via Cakto",
    securityDesc: "Seus dados estão 100% protegidos. PIX e cartões.",
    paymentHistory: "Histórico de pagamentos",
    noHistory: "Nenhum pagamento registrado ainda.",
    groupMembers: "Membros do seu grupo",
    online: "online",
    offline: "offline",
    disconnect: "Desconectar",
    reconnect: "Reconectar",
    masterBadge: "Conta mestre",
    youBadge: "Você",
  },
  en: {
    title: "Manage subscription",
    currentPlan: "Your current plan",
    active: "Active",
    trial: "multiPRO trial period",
    free: "Free",
    availablePlans: "Available plans",
    availableDesc: "Pick the ideal plan for you.",
    upgradeOnly: "You have an active plan — you can only switch to the other plan.",
    individualPRO: "individualPRO",
    multiPRO: "multiPRO",
    account: "account",
    accounts: "accounts",
    mostPopular: "Most popular",
    current: "Current plan",
    subscribe: "Subscribe now",
    upgrade: "Upgrade to this plan",
    individualFeatures: [
      "1 individual account",
      "Unlimited items and recipes",
      "Unlimited shopping list",
      "Unrestricted smart alerts",
      "Weekly meal planner",
      "Full consumption history",
    ],
    multiFeatures: [
      "Up to 3 sub-accounts in one plan",
      "Shared fridge and pantry",
      "Real-time shopping list",
      "Independent notifications per account",
      "Notify other household members",
      "Master account manages access",
    ],
    security: "Secure payment via Cakto",
    securityDesc: "Your data is 100% protected. PIX and cards.",
    paymentHistory: "Payment history",
    noHistory: "No payment history yet.",
    groupMembers: "Your group members",
    online: "online",
    offline: "offline",
    disconnect: "Disconnect",
    reconnect: "Reconnect",
    masterBadge: "Master account",
    youBadge: "You",
  },
  es: {
    title: "Administrar suscripción",
    currentPlan: "Tu plan actual",
    active: "Activo",
    trial: "Período de prueba multiPRO",
    free: "Gratis",
    availablePlans: "Planes disponibles",
    availableDesc: "Elige el plan ideal para ti.",
    upgradeOnly: "Tienes un plan activo — solo puedes cambiar al otro plan.",
    individualPRO: "individualPRO",
    multiPRO: "multiPRO",
    account: "cuenta",
    accounts: "cuentas",
    mostPopular: "Más popular",
    current: "Plan actual",
    subscribe: "Suscribirse",
    upgrade: "Actualizar a este plan",
    individualFeatures: [
      "1 cuenta individual",
      "Items y recetas ilimitados",
      "Lista de compras ilimitada",
      "Alertas inteligentes sin restricción",
      "Planificador semanal de comidas",
      "Historial completo de consumo",
    ],
    multiFeatures: [
      "Hasta 3 sub-cuentas en un plan",
      "Heladera y despensa compartidas",
      "Lista de compras en tiempo real",
      "Notificaciones independientes por cuenta",
      "Notificar a otros miembros del hogar",
      "Cuenta maestra gestiona accesos",
    ],
    security: "Pago seguro vía Cakto",
    securityDesc: "Tus datos están 100% protegidos. PIX y tarjetas.",
    paymentHistory: "Historial de pagos",
    noHistory: "No hay historial de pagos aún.",
    groupMembers: "Miembros de tu grupo",
    online: "en línea",
    offline: "desconectado",
    disconnect: "Desconectar",
    reconnect: "Reconectar",
    masterBadge: "Cuenta maestra",
    youBadge: "Tú",
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
  const { subscription, trialDaysRemaining, isMultiPro } = useSubscription();
  const { user } = useAuth();
  const l = labels[language as keyof typeof labels] || labels["pt-BR"];

  const isTrial = trialDaysRemaining > 0 && !subscription?.isActive;
  const isActive = !!subscription?.isActive;

  // Detecta plano ativo pelo planTier
  const activePlanId: PlanId | null = isActive
    ? subscription?.planTier === "multiPRO"
      ? "multiPRO"
      : subscription?.planTier === "individualPRO"
        ? "individualPRO"
        // compat: plan="premium" legacy → individualPRO
        : subscription?.plan === "premium"
          ? "individualPRO"
          : null
    : null;

  const groupId = subscription?.groupId ?? null;

  // Session tracking para multiPRO
  const {
    groupMembers,
    isGroupMaster,
    disconnectMember,
    reconnectMember,
  } = useAccountSession(isMultiPro || isTrial ? groupId : null);

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
      return new Intl.NumberFormat(
        language === "pt-BR" ? "pt-BR" : language === "es" ? "es-ES" : "en-US",
        { style: "currency", currency: cur }
      ).format(Number(amount));
    } catch {
      return `${cur} ${amount}`;
    }
  };

  const currentPlanLabel = isActive
    ? activePlanId === "multiPRO" ? l.multiPRO : l.individualPRO
    : isTrial
      ? `${l.trial} · multiPRO`
      : l.free;

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
        {/* Plano atual */}
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
              <p className="text-[18px] font-black text-white">{currentPlanLabel}</p>
              <p className="text-[11px] text-white/60 font-medium">
                {isActive
                  ? l.active
                  : isTrial
                    ? `${trialDaysRemaining} ${language === "pt-BR" ? "dias restantes" : language === "es" ? "días restantes" : "days left"}`
                    : ""}
              </p>
            </div>
          </div>
          {isActive && (
            <p className="mt-3 text-[11px] text-emerald-200/80 font-medium bg-[#165A52]/30 border border-emerald-300/20 rounded-xl px-3 py-2">
              {l.upgradeOnly}
            </p>
          )}
        </motion.section>

        {/* Membros do grupo — apenas multiPRO ativo ou em trial */}
        <AnimatePresence>
          {(isMultiPro || isTrial) && groupMembers.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-[1.5rem] bg-[#11302c] border border-white/10 p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-emerald-300" />
                <h3 className="text-sm font-bold text-white">{l.groupMembers}</h3>
                <span className="ml-auto text-[10px] font-black text-emerald-300 bg-emerald-300/10 px-2 py-0.5 rounded-full">
                  {groupMembers.length}/3
                </span>
              </div>
              <ul className="space-y-2">
                {groupMembers.map((member) => {
                  const isMe = member.user_id === user?.id;
                  const isMasterMember = member.role === "master";
                  return (
                    <li
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-[#0b1f1c] border border-white/5"
                    >
                      {/* Avatar placeholder */}
                      <div className="h-9 w-9 rounded-xl bg-[#165A52]/60 flex items-center justify-center shrink-0 text-sm font-black text-white">
                        {(member.display_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-bold text-white truncate">
                            {member.display_name || `Membro ${member.user_id.slice(0, 6)}`}
                          </span>
                          {isMasterMember && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-300/20 text-emerald-300">
                              {l.masterBadge}
                            </span>
                          )}
                          {isMe && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
                              {l.youBadge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {member.isOnline ? (
                            <Wifi className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <WifiOff className="h-3 w-3 text-white/40" />
                          )}
                          <span className={cn(
                            "text-[10px] font-semibold",
                            member.isOnline ? "text-emerald-400" : "text-white/40"
                          )}>
                            {member.isOnline ? l.online : l.offline}
                          </span>
                        </div>
                      </div>
                      {/* Master controls: desconectar/reconectar outros membros */}
                      {isGroupMaster && !isMe && (
                        <button
                          onClick={() =>
                            member.isOnline
                              ? disconnectMember(member.user_id)
                              : reconnectMember(member.user_id)
                          }
                          className={cn(
                            "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90",
                            member.isOnline
                              ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                              : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          )}
                          title={member.isOnline ? l.disconnect : l.reconnect}
                        >
                          {member.isOnline ? (
                            <LogOut className="h-3.5 w-3.5" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Planos disponíveis */}
        <section className="space-y-3">
          <div className="px-1">
            <h3 className="text-base font-black text-white">{l.availablePlans}</h3>
            <p className="text-xs text-white/60 font-medium mt-0.5">{l.availableDesc}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 items-start">
            <PlanCard
              planId="individualPRO"
              label={l.individualPRO}
              maxAccounts={PLANS.individualPRO.maxAccounts}
              accountLabel={l.account}
              price={PLANS.individualPRO.price}
              period={PLANS.individualPRO.period}
              features={l.individualFeatures}
              isActive={activePlanId === "individualPRO"}
              disabled={!canOpenPlan("individualPRO")}
              onClick={() => openCheckout("individualPRO")}
              currentLabel={l.current}
              icon={<User className="h-4 w-4" />}
              prominent={false}
            />
            <PlanCard
              planId="multiPRO"
              label={l.multiPRO}
              maxAccounts={PLANS.multiPRO.maxAccounts}
              accountLabel={l.accounts}
              price={PLANS.multiPRO.price}
              period={PLANS.multiPRO.period}
              features={l.multiFeatures}
              isActive={activePlanId === "multiPRO"}
              disabled={!canOpenPlan("multiPRO")}
              onClick={() => openCheckout("multiPRO")}
              currentLabel={l.current}
              popularLabel={l.mostPopular}
              icon={<Users className="h-5 w-5" />}
              prominent={true}
            />
          </div>

          {/* Segurança Cakto */}
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

        {/* Histórico de pagamentos */}
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

// ── PlanCard ──────────────────────────────────────────────────────────

function PlanCard(props: {
  planId: PlanId;
  label: string;
  maxAccounts: number;
  accountLabel: string;
  price: string;
  period: string;
  features: string[];
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
  currentLabel: string;
  popularLabel?: string;
  icon: React.ReactNode;
  prominent: boolean;
}) {
  const {
    label, maxAccounts, accountLabel, price, period, features,
    isActive, disabled, onClick, currentLabel, popularLabel, icon, prominent
  } = props;

  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      disabled={disabled}
      className={cn(
        "relative rounded-[1.5rem] p-4 text-left transition-all duration-200 border w-full",
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
      <p className="font-black text-[15px] leading-tight text-white">{label}</p>
      <p className="text-[11px] font-semibold mb-2 text-white/60">
        {maxAccounts} {accountLabel}
      </p>
      <p className="text-[22px] font-black leading-none text-white">{price}</p>
      <p className="text-[11px] font-bold text-white/60">{period}</p>

      {/* Features resumidas */}
      <ul className="mt-3 space-y-1">
        {features.slice(0, 3).map((f, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-300 shrink-0 mt-0.5" />
            <span className="text-[10px] font-semibold text-white/70 leading-snug">{f}</span>
          </li>
        ))}
      </ul>

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
