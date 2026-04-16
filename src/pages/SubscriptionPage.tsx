import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription, SubscriptionPlan, PLAN_DETAILS } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Crown, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  Zap, 
  Calendar, 
  History,
  Lock,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const labels = {
  "pt-BR": {
    title: "Sua Assinatura",
    premiumTrial: "Premium Trial",
    premium: "Premium",
    free: "Grátis",
    memberSince: "Membro desde",
    status: "Status",
    active: "Ativo",
    paymentHistory: "Histórico de Pagamento",
    noHistory: "Nenhum pagamento registrado ainda.",
    upgradeTitle: "Evolua para o Kaza Premium",
    upgradeDesc: "Economize tempo, evite desperdício e tenha total controle da sua cozinha.",
    getStarted: "Assinar Agora",
    priceTag: "R$ 27,00/mês",
    securityTitle: "Segurança Total",
    securityDesc: "Seus dados estão 100% criptografados. Pagamentos processados pela Cakto, a plataforma mais segura do Brasil, com suporte a PIX Parcelado e Recorrência.",
    benefits: [
      "Itens e receitas ilimitadas",
      "Alertas inteligentes sem restrição",
      "Economia real de dinheiro evitando desperdício",
      "Sua vida mais organizada e saudável",
      "Acesso antecipado a novas funções"
    ]
  },
  en: {
    title: "Your Subscription",
    premiumTrial: "Premium Trial",
    premium: "Premium",
    free: "Free",
    memberSince: "Member since",
    status: "Status",
    active: "Active",
    paymentHistory: "Payment History",
    noHistory: "No payment history yet.",
    upgradeTitle: "Upgrade to Kaza Premium",
    upgradeDesc: "Save time, avoid waste, and take full control of your kitchen.",
    getStarted: "Subscribe Now",
    priceTag: "$5.00/mo",
    securityTitle: "Total Security",
    securityDesc: "Your data is 100% encrypted. Payments processed by Cakto, one of the world's most secure platforms.",
    benefits: [
      "Unlimited items and recipes",
      "Unrestricted smart alerts",
      "Real money savings by avoiding waste",
      "A more organized and healthy life",
      "Early access to new features"
    ]
  },
  es: {
    title: "Tu Suscripción",
    premiumTrial: "Premium Trial",
    premium: "Premium",
    free: "Gratis",
    memberSince: "Miembro desde",
    status: "Status",
    active: "Activo",
    paymentHistory: "Historial de Pagos",
    noHistory: "No hay historial de pagos aún.",
    upgradeTitle: "Evoluciona a Kaza Premium",
    upgradeDesc: "Ahorra tiempo, evita el desperdicio y toma el control total de tu cocina.",
    getStarted: "Suscribirse Ahora",
    priceTag: "R$ 27,00/mes",
    securityTitle: "Seguridad Total",
    securityDesc: "Tus datos están 100% encriptados. Pagos procesados por Cakto, la plataforma más segura.",
    benefits: [
      "Items y recetas ilimitados",
      "Alertas inteligentes sin restricción",
      "Ahorro real de dinero evitando el desperdicio",
      "Tu vida más organizada y saludable",
      "Acceso anticipado a nuevas funciones"
    ]
  }
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { subscription, trialDaysRemaining, registrationDate } = useSubscription();
  const checkoutUrl = "https://pay.cakto.com.br/wbjq4ne_846287";
  const l = labels[language as keyof typeof labels] || labels.en;

  const isTrial = subscription?.plan === "premium" && trialDaysRemaining > 0;
  const planName = isTrial ? l.premiumTrial : (subscription?.plan === "premium" ? l.premium : l.free);

  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] pb-10 font-sans text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fafafa]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06] px-4 h-16 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-foreground transition-all active:scale-90 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground tracking-wide">{l.title}</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Current Status Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] bg-white dark:bg-[#111] border border-black/[0.04] dark:border-white/10 p-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
          
          <div className="flex items-center gap-4 mb-6 relative">
            <div className="h-14 w-14 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center backdrop-blur-md shadow-inner">
              <Crown className="h-8 w-8 text-purple-500 drop-shadow-md" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{l.status}</p>
              <h2 className="text-2xl font-black text-foreground flex items-center gap-2 tracking-tight">
                {planName}
                {subscription?.isActive && (
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
                )}
              </h2>
            </div>
          </div>

          <div className="space-y-4 relative">
            <div className="flex justify-between items-center py-3 border-b border-black/[0.04] dark:border-white/10">
              <div className="flex items-center gap-3">
                <Calendar className="h-4.5 w-4.5 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">{l.memberSince}</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {registrationDate ? new Date(registrationDate).toLocaleDateString(language) : "-"}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                <span className="text-sm font-semibold text-foreground">{l.active}</span>
              </div>
              <span className="text-xs font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full uppercase tracking-wider border border-purple-500/20">
                {subscription?.plan === 'premium' ? 'Premium' : 'Trial'}
              </span>
            </div>
          </div>
        </motion.section>

        {/* Payment History Hideable */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[1.5px] flex items-center gap-2">
              <History className="h-4 w-4" /> {l.paymentHistory}
            </h3>
            <button onClick={() => setShowHistory(!showHistory)} className="text-muted-foreground hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye">
                {showHistory ? (
                   <>
                     <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                     <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                     <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                     <line x1="2" x2="22" y1="2" y2="22" />
                   </>
                ) : (
                  <>
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
          
          {showHistory && (
            <div className="rounded-[2.5rem] bg-white dark:bg-[#111] border border-black/[0.04] dark:border-white/10 p-8 text-center shadow-inner animate-fade-in">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 mb-4 shadow-sm">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">{l.noHistory}</p>
            </div>
          )}
        </motion.section>

        {/* Upgrade Card (High Impact) */}
        {subscription?.plan !== 'premium' && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 p-8 text-white shadow-2xl relative overflow-hidden group border border-purple-400/30"
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-300/30 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-fuchsia-300/50 transition-colors duration-1000" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/40 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[2px] text-white shadow-sm border border-white/20">
                  <Sparkles className="h-3 w-3" /> {l.premium}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none mb-1">Investimento</p>
                  <p className="text-3xl font-black tracking-tight text-white">{l.priceTag}</p>
                </div>
              </div>
              
              <h3 className="text-3xl font-black leading-tight mb-3 tracking-tighter">
                {l.upgradeTitle}
              </h3>
              <p className="text-white/80 text-[15px] font-bold mb-8 leading-relaxed max-w-[280px]">
                {l.upgradeDesc}
              </p>

              <div className="grid gap-4 mb-10">
                {l.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[15px] font-bold leading-snug">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => window.open(checkoutUrl, "_blank")}
                className="w-full h-16 rounded-2xl bg-white text-purple-700 font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20"
              >
                {l.getStarted}
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              
              <p className="text-[11px] text-center text-white/60 font-black uppercase tracking-widest mt-6">
                Acesso imediato após confirmação
              </p>
            </div>
          </motion.section>
        )}

        {/* Security Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[2.5rem] bg-white dark:bg-[#111] border border-black/[0.04] dark:border-white/10 p-8 shadow-sm flex flex-col items-center text-center"
        >
          <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center shrink-0 shadow-inner mb-4">
            <Lock className="h-8 w-8 text-emerald-500 drop-shadow-sm" />
          </div>
          <div>
            <h4 className="text-lg font-black text-foreground mb-1.5">{l.securityTitle}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold mb-6 max-w-[250px] mx-auto">
              {l.securityDesc}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2">
              <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-sm">
                <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">PIX Mensal</span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 shadow-sm">
                <CreditCard className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">Cartões</span>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );

