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
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CAKTO_LOGO =
  "https://app.cakto.com.br/logo/green-logo-transparent-background.png";

type PlanId = "individualPRO" | "multiPRO";

const PLANS: Record<PlanId, { url: string; maxAccounts: number; price: string; period: string }> = {
  individualPRO: {
    url: "https://pay.cakto.com.br/356go8z",
    maxAccounts: 1,
    price: "R$ 19,90",
    period: "/mês",
  },
  multiPRO: {
    url: "https://pay.cakto.com.br/wbjq4ne_846287",
    maxAccounts: 3,
    price: "R$ 37,90",
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

          <div className="space-y-4">
            {/* IndividualPRO Card — White/light */}
            <div className="rounded-2xl bg-[#EDECEA] dark:bg-white/10 border border-[#E2E1DC] dark:border-white/10 overflow-hidden shadow-sm p-5">
              <div className="mb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-[18px] font-black text-[#2C2C2A] dark:text-white leading-tight">IndividualPRO</h4>
                    <p className="text-[12px] text-[#9A998F] dark:text-white/40 font-medium mt-0.5">
                      {language === "pt-BR" ? "Para quem organiza a casa sozinho." : "For solo home management."}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[28px] font-black text-[#2C2C2A] dark:text-white leading-none tracking-tight">R$19,90</span>
                    <span className="text-[13px] font-semibold text-[#9A998F] dark:text-white/40">/mês</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {[
                  "1 conta, 1 usuário",
                  "Estoque completo e ilimitado",
                  "Alertas de validade e reposição",
                  "Lista de compras + receitas com IA",
                  "Notificações inteligentes da rotina",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-[#3D6B55]/15 flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-[#3D6B55]" />
                    </div>
                    <span className="text-[13px] text-[#2C2C2A] dark:text-white/80 font-medium">{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => canOpenPlan("individualPRO") && openCheckout("individualPRO")}
                disabled={!canOpenPlan("individualPRO")}
                className={cn(
                  "w-full h-12 rounded-xl font-black text-[14px] tracking-wide transition-all shadow-sm border",
                  canOpenPlan("individualPRO")
                    ? "bg-[#2C2C2A] dark:bg-white/10 hover:bg-[#1a1a1a] dark:hover:bg-white/15 text-white active:scale-[0.97] border-[#2C2C2A] dark:border-white/10"
                    : "bg-gray-300 dark:bg-white/5 text-gray-500 cursor-not-allowed border-gray-300 dark:border-white/5"
                )}
              >
                {activePlanId === "individualPRO" 
                  ? l.current 
                  : isTrial 
                    ? (language === "pt-BR" ? "Assinar Plano (assume após teste)" : "Subscribe (after trial)")
                    : (language === "pt-BR" ? "Escolher IndividualPRO" : "Choose IndividualPRO")}
              </button>
            </div>

            {/* MultiPRO Card — Dark green premium */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-emerald-900/20 border border-[#2a5d4a] dark:border-emerald-400/30 transition-transform duration-300 hover:scale-[1.02]" style={{
              background: "linear-gradient(145deg, #1a3d32 0%, #0f2e24 60%, #0a211a 100%)"
            }}>

              <div className="p-5">
                <div className="mb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[18px] font-black text-white leading-tight">MultiPRO</h4>
                      <p className="text-[12px] text-white/50 font-medium mt-0.5">
                        {language === "pt-BR" ? "1 conta principal + convida até 3." : "1 main account + invite up to 3."}
                      </p>
                    </div>
                    <div className="text-right shrink-0 relative mt-2">
                      <div className="absolute -top-6 right-0 px-2.5 py-1 rounded-full bg-[#E5B54A] shadow-md text-[#11302c] text-[10px] font-black uppercase tracking-widest break-nowrap whitespace-nowrap z-10 rotate-2">
                        {language === "pt-BR" ? "MAIS COMPLETO" : "MOST COMPLETE"}
                      </div>
                      <span className="text-[32px] font-black text-white leading-none tracking-tight">R$37,90</span>
                      <span className="text-[13px] font-semibold text-white/40">/mês</span>
                    </div>
                  </div>
                </div>

                <div className="mb-1">
                  <p className="text-[11px] font-bold text-emerald-300/80 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {language === "pt-BR" ? "Tudo do IndividualPRO, mais:" : "Everything in IndividualPRO, plus:"}
                  </p>
                </div>

                <div className="space-y-2 mb-5">
                  {[
                    { text: "Conta principal convida até 3 pessoas", bold: true },
                    { text: "Casa compartilhada em tempo real", bold: false },
                    { text: "Notificações e permissões por perfil", bold: false },
                    { text: "Controle de membros e sessões", bold: false },
                  ].map(({ text, bold }) => (
                    <div key={text} className="flex items-center gap-2.5">
                      <div className="h-4 w-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-emerald-400" />
                      </div>
                      <span className={cn("text-[13px] text-white/80 font-medium", bold && "font-bold text-white")}>{text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => canOpenPlan("multiPRO") && openCheckout("multiPRO")}
                  disabled={!canOpenPlan("multiPRO")}
                  className={cn(
                    "w-full h-12 rounded-xl font-black text-[14px] tracking-wide transition-all shadow-md",
                    canOpenPlan("multiPRO")
                      ? "active:scale-[0.97]"
                      : "opacity-60 cursor-not-allowed"
                  )}
                  style={{
                    background: "linear-gradient(135deg, #2a5d4a 0%, #1a4a38 100%)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {activePlanId === "multiPRO" 
                    ? l.current 
                    : isTrial 
                      ? (language === "pt-BR" ? "Garantir MultiPRO (Adiciona + dias)" : "Secure MultiPRO (+ days)")
                      : (language === "pt-BR" ? "Testar MultiPRO — 7 dias grátis" : "Try MultiPRO — 7 days free")}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 pt-3 pb-2 mt-2">
              <span className="text-[12px] text-white/40 font-bold text-center leading-tight">
                {language === "pt-BR" ? "Cancele quando quiser. Cobrança transparente." : "Cancel anytime. Transparent billing."}
              </span>
              <div className="flex items-center gap-2 bg-white/[0.03] backdrop-blur-sm px-4 py-2.5 text-white/80 rounded-full border border-white/[0.05] shadow-sm">
                 <Lock className="h-3 w-3 text-emerald-400/80" />
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-80 shrink-0">
                    {language === "pt-BR" ? "PAGAMENTO 100% SEGURO VIA" : "100% SECURE PAYMENT VIA"}
                 </span>
                 <img src={CAKTO_LOGO} alt="Cakto" className="h-4 object-contain opacity-100 ml-1 drop-shadow-sm invert opacity-80" />
              </div>
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
