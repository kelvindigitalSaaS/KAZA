import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription, PLAN_DETAILS } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Crown,
  Zap,
  ShieldCheck,
  Package,
  Star,
  CreditCard,
  Loader2,
  History,
  ShoppingBag,
  EyeOff,
  Calendar,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PlansPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const { user, loading: authLoading, requireAuth } = useAuth();
  const { 
    subscription, 
    openCustomerPortal, 
    getPlanTier, 
    loading, 
    trialDaysRemaining, 
    isLocked, 
    registrationDate,
    startCheckout
  } = useSubscription();
  
  const [portalLoading, setPortalLoading] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, requireAuth]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="h-10 w-10 text-primary animate-pulse mb-4" />
        <p className="text-sm font-medium text-muted-foreground">
          Carregando planos...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const labels = {
    "pt-BR": {
      title: "Escolha seu Plano",
      subtitle: "Desbloqueie todo o potencial do Kaza",
      popular: "Mais Popular",
      current: "Seu plano atual",
      upgrade: "Assinar Agora",
      freeTrial: "Plano Grátis",
      freeDesc: "Experimente as funcionalidades básicas.",
      monthly: "/mês",
      cancel: "Cancele a qualquer momento.",
      secure: "Pagamentos processados de forma segura.",
      paymentMethods: "Métodos de pagamento aceitos",
      manageSub: "Gerenciar Assinatura",
      opening: "Abrindo...",
      status: "Status",
      active: "Ativo",
      payment: "Pagamento",
      lastPayment: "Último pagamento",
      nextBilling: "Próxima cobrança",
      trialExpires: "Trial expira em",
      days: "dias",
      alreadySubscribed: "Já Assinado",
      subscribeNow: "Realizar Assinatura",
      paid: "PAGO"
    },
    en: {
      title: "Choose your Plan",
      subtitle: "Unlock the full potential of Kaza",
      popular: "Most Popular",
      current: "Your current plan",
      upgrade: "Subscribe Now",
      freeTrial: "Free Plan",
      freeDesc: "Try out the basic features.",
      monthly: "/month",
      cancel: "Cancel anytime.",
      secure: "Payments processed securely.",
      paymentMethods: "Accepted payment methods",
      manageSub: "Manage Subscription",
      opening: "Opening...",
      status: "Status",
      active: "Active",
      payment: "Payment",
      lastPayment: "Last payment",
      nextBilling: "Next billing",
      trialExpires: "Trial expires in",
      days: "days",
      alreadySubscribed: "Already Subscribed",
      subscribeNow: "Subscribe Now",
      paid: "PAID"
    }
  };

  const l = labels[language] || labels["pt-BR"];

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      await startCheckout('premium');
    } catch (error) {
      toast.error(language === 'pt-BR' ? 'Erro ao iniciar checkout.' : 'Error starting checkout.');
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error(
        language === "pt-BR"
          ? "Erro ao abrir portal de gerenciamento."
          : "Error opening management portal."
      );
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <PageTransition
      direction="left"
      className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-32"
    >
      <header className="sticky top-0 z-50 flex items-center gap-3 bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-4 backdrop-blur-2xl border-b border-black/[0.03] dark:border-white/[0.03]">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-foreground bg-white/80 dark:bg-white/10 backdrop-blur-xl active:scale-[0.97] transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-foreground">{l.title}</h1>
          <p className="text-xs text-muted-foreground">{l.subtitle}</p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Active Premium Status Card */}
        {subscription?.plan === "premium" && (
          <div className="rounded-3xl border border-amber-500/10 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 p-6 space-y-4 shadow-xl shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/20">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground tracking-tight">Kaza Premium</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{l.active}</span>
                  </div>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[10px] px-2.5 py-1 uppercase">
                {l.current}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/60 dark:bg-white/5 p-4 border border-black/[0.02] dark:border-white/[0.02] backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">{l.payment}</p>
                <div className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground truncate">{subscription.paymentMethod || 'Credit Card'}</span>
                    {trialDaysRemaining > 0 && (
                      <span className="text-[11px] text-muted-foreground">{`Trial: ${trialDaysRemaining} ${l.days}`}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/60 dark:bg-white/5 p-4 border border-black/[0.02] dark:border-white/[0.02] backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">{l.nextBilling}</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground">{subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Auto-renew'}</span>
                    {subscription.lastPaymentDate && (
                      <span className="text-[11px] text-muted-foreground">{`${l.lastPayment}: ${new Date(subscription.lastPaymentDate).toLocaleDateString()}`}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {subscription.lastPaymentDate && (
              <div className="rounded-2xl bg-white/60 dark:bg-white/5 p-4 border border-black/[0.02] dark:border-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground">{l.lastPayment}</span>
                  <span className="text-xs font-black text-foreground bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg">{l.paid}</span>
                </div>
                <p className="text-sm font-black text-foreground">
                  {new Date(subscription.lastPaymentDate).toLocaleDateString()}
                </p>
                <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trial Status (if not Premium) */}
        {subscription?.plan !== "premium" && (
          <div className={cn(
            "rounded-3xl p-6 border transition-all",
            isLocked 
              ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30 shadow-none" 
              : "bg-gradient-to-br from-primary/10 to-indigo-50/50 dark:from-primary/20 dark:to-indigo-950/10 border-primary/20 shadow-lg shadow-primary/5"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm",
                isLocked ? "bg-red-500" : "bg-primary"
              )}>
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg text-foreground tracking-tight">{l.freeTrial}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", isLocked ? "bg-red-500" : "bg-primary")} />
                  <span className={cn("text-xs font-black uppercase tracking-wider", isLocked ? "text-red-600" : "text-primary")}>
                    {isLocked ? "Expired" : l.active}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-black/[0.03] dark:border-white/[0.03]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-muted-foreground">{l.trialExpires}</span>
              </div>
              <span className={cn("text-base font-black", isLocked ? "text-red-500" : "text-foreground")}>
                {isLocked ? '0' : trialDaysRemaining} {l.days}
              </span>
            </div>
            
            {!isLocked && (
              <div className="mt-4 h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000" 
                  style={{ width: `${(trialDaysRemaining / 7) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Paid Plan Selection */}
        <div className="relative group">
          <div
            className="relative flex flex-col gap-5 rounded-[2.5rem] p-8 border-2 transition-all border-amber-400 bg-white dark:bg-[#1a1a1a] shadow-2xl shadow-amber-500/20"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-amber-500 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl ring-4 ring-[#fafafa] dark:ring-[#091f1c]">
                {l.popular}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-amber-100 dark:bg-amber-900/30">
                  <Crown className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <p className="font-black text-xl text-foreground tracking-tight">
                    Kaza Premium
                  </p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide opacity-70">
                    Acesso Vitalício
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-foreground tracking-tighter">
                R$ 27,00
              </span>
              <span className="text-base font-bold text-muted-foreground">
                {l.monthly}
              </span>
            </div>

            <div className="space-y-4 py-2">
              {PLAN_DETAILS.premium.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <span className="text-[14px] font-bold text-foreground opacity-90">{feat}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={subscription?.plan === "premium"}
              className="w-full h-16 rounded-2xl text-base font-black shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] bg-amber-500 hover:bg-amber-600 text-white border-b-4 border-amber-700 disabled:opacity-50"
            >
              {subscription?.plan === "premium" ? (
                <>
                  <Check className="h-6 w-6 mr-2 stroke-[3]" /> {l.alreadySubscribed}
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-1.5" /> {l.subscribeNow}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Payment Methods Side-by-Side */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{l.paymentMethods}</p>
          <div className="flex flex-row flex-wrap justify-center items-center gap-3 group">
             {/* Credit Card Badge */}
             <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-black/[0.04] dark:border-white/10 px-4 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105 min-w-[120px] justify-center">
               <CreditCard className="h-4 w-4 text-amber-500" />
               <span className="text-xs font-black text-foreground">Cartão</span>
             </div>
             {/* PIX Badge */}
             <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-black/[0.04] dark:border-white/10 px-4 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105 min-w-[120px] justify-center">
               <div className="w-4 h-4 rounded-sm bg-[#32BCAD] flex items-center justify-center text-[8px] text-white font-black">P</div>
               <span className="text-xs font-black text-foreground">PIX</span>
             </div>
             {/* Apple/Google Pay */}
             <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-black/[0.04] dark:border-white/10 px-4 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105 min-w-[120px] justify-center">
               <ShieldCheck className="h-4 w-4 text-primary" />
               <span className="text-xs font-black text-foreground">Apple/Google</span>
             </div>
          </div>
        </div>

        {/* Manage Subscription Button */}
        {subscription && subscription.plan !== "free" && (
          <div className="pt-4">
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="w-full h-14 rounded-2xl text-sm font-black border-2 transition-all active:scale-[0.98] hover:bg-muted"
            >
              {portalLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> {l.opening}
                </>
              ) : (
                l.manageSub
              )}
            </Button>
          </div>
        )}

        <div className="text-center pb-8 opacity-50">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
            {l.cancel}<br/>
            {l.secure}
          </p>
        </div>
      </main>
    </PageTransition>
  );
}
