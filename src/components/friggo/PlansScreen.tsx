import { useState } from "react";
import {
  Check,
  Crown,
  Sparkles,
  Star,
  X,
  Loader2,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useSubscription,
  PLAN_DETAILS,
  SubscriptionPlan
} from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from '@/hooks/useAuth';
import { openExternalUrl } from '@/lib/nativeBrowser';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MiniCheckout } from "./MiniCheckout";

interface PlansScreenProps {
  onClose?: () => void;
}

export function PlansScreen({ onClose }: PlansScreenProps) {
  const {
    subscription,
    startCheckout,
    openCustomerPortal,
    refreshSubscription,
    upgradePlan,
    trialDaysRemaining,
    registrationDate
  } = useSubscription();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(
    null
  );

  const plans: SubscriptionPlan[] = ["basic", "standard", "premium"];

  const labels = {
    "pt-BR": {
      title: "Escolha seu Plano",
      subtitle: "Desbloqueie todo o potencial do Kaza",
      currentPlan: "Plano atual",
      free: "Grátis",
      active: "Ativo",
      mostPopular: "Mais Popular",
      subscribe: "Assinar Agora",
      currentPlanBtn: "Plano Atual",
      manageSub: "Gerenciar Assinatura",
      footer:
        "Cancele a qualquer momento. Pagamentos processados de forma segura.",
      googlePay: "Google Pay",
      applePay: "Apple Pay",
      cards: "Cartões",
      processing: "Processando...",
      errorCheckout: "Erro ao iniciar checkout",
      perMonth: "/mês"
    },
    en: {
      title: "Choose Your Plan",
      subtitle: "Unlock the full potential of Kaza",
      currentPlan: "Current plan",
      free: "Free",
      active: "Active",
      mostPopular: "Most Popular",
      subscribe: "Subscribe Now",
      currentPlanBtn: "Current Plan",
      manageSub: "Manage Subscription",
      footer: "Cancel anytime. Payments securely processed.",
      googlePay: "Google Pay",
      applePay: "Apple Pay",
      cards: "Cards",
      processing: "Processing...",
      errorCheckout: "Error starting checkout",
      perMonth: "/mo"
    },
    es: {
      title: "Elige tu Plan",
      subtitle: "Desbloquea todo el potencial de Kaza",
      currentPlan: "Plan actual",
      free: "Gratis",
      active: "Activo",
      mostPopular: "Más Popular",
      subscribe: "Suscribirse Ahora",
      currentPlanBtn: "Plan Actual",
      manageSub: "Gestionar Suscripción",
      footer: "Cancela cuando quieras. Pagos procesados de forma segura.",
      googlePay: "Google Pay",
      applePay: "Apple Pay",
      cards: "Tarjetas",
      processing: "Procesando...",
      errorCheckout: "Error al iniciar checkout",
      perMonth: "/mes"
    }
  };

  const l = labels[language];

  // Show inline checkout
  if (checkoutPlan) {
    return (
      <MiniCheckout
        plan={checkoutPlan}
        onSuccess={async () => {
          await upgradePlan(checkoutPlan);
          await refreshSubscription();
          setCheckoutPlan(null);
          toast.success(
            language === "pt-BR"
              ? "Assinatura ativada!"
              : language === "en"
                ? "Subscription activated!"
                : "¡Suscripción activada!"
          );
        }}
        onCancel={() => setCheckoutPlan(null)}
      />
    );
  }

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan === subscription?.plan) return;
    setLoading(plan);
    try {
      await startCheckout(plan);
    } catch (err) {
      toast.error(language === "pt-BR" ? l.errorCheckout : l.errorCheckout);
      // Fallback: open direct payment link with email (CPF handled server-side if available)
      try {
        const base = "https://pay.cakto.com.br/wbjq4ne_846287";
        const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
        await openExternalUrl(`${base}${emailParam}`);
      } catch (e) {
        // ignore fallback errors
      }
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error("Error opening portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case "basic":
        return <Star className="h-6 w-6" />;
      case "standard":
        return <Sparkles className="h-6 w-6" />;
      case "premium":
        return <Crown className="h-6 w-6" />;
      default:
        return null;
    }
  };

  const getPlanStyles = (plan: SubscriptionPlan) => {
    switch (plan) {
      case "basic":
        return {
          card: "border-border bg-card",
          header: "text-foreground",
          badge: "bg-muted text-muted-foreground",
          button: "bg-primary text-primary-foreground hover:bg-primary/90"
        };
      case "standard":
        return {
          card: "border-primary/50 shadow-sm ",
          header: "text-primary",
          badge: "bg-primary/20 text-primary",
          button: "bg-primary text-primary-foreground hover:bg-primary/90"
        };
      case "premium":
        return {
          card: "border-amber-500/50 shadow-sm ",
          header: "text-amber-600 dark:text-amber-400",
          badge: "bg-amber-500 text-white",
          button: "bg-amber-500 hover:bg-amber-600 text-white"
        };
      default:
        return { card: "", header: "", badge: "", button: "" };
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{l.title}</h1>
            <p className="text-sm text-gray-500">{l.subtitle}</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {trialDaysRemaining > 0 && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Teste Gratuito</div>
                <div className="text-xs">Seu trial termina em {trialDaysRemaining} dia{trialDaysRemaining > 1 ? 's' : ''}.</div>
              </div>
              <div className="text-sm font-bold">Aproveite agora</div>
            </div>
          </div>
        )}

        {subscription && (
          <Card className="mb-6 border-dashed">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-500">{l.currentPlan}</p>
                <p className="font-semibold text-foreground">
                  {PLAN_DETAILS[subscription.plan].name}
                </p>
              </div>
              <Badge variant="outline">
                {subscription.plan === "free" ? l.free : l.active}
              </Badge>
            </CardContent>
          </Card>
        )}

        {subscription && subscription.plan !== "free" && (
          <Button
            variant="outline"
            className="w-full mb-4 gap-2"
            onClick={handleManageSubscription}
            disabled={portalLoading}
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {l.manageSub}
          </Button>
        )}

        <div className="mb-6 flex items-center justify-center gap-4">
          {[l.googlePay, l.applePay, l.cards].map((label) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-md bg-muted px-3 py-2"
            >
              <span className="text-xs font-medium text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {plans.map((plan) => {
            const details = PLAN_DETAILS[plan];
            const styles = getPlanStyles(plan);
            const isCurrentPlan = subscription?.plan === plan;
            const isPopular = plan === "standard";

            return (
              <Card
                key={plan}
                className={cn(
                  "relative overflow-hidden transition-all duration-300",
                  styles.card,
                  isCurrentPlan && "ring-2 ring-primary"
                )}
              >
                {isPopular && (
                  <div className="absolute right-0 top-0">
                    <Badge
                      className={cn(
                        "rounded-bl-lg rounded-tr-lg rounded-br-none rounded-tl-none",
                        styles.badge
                      )}
                    >
                      {l.mostPopular}
                    </Badge>
                  </div>
                )}
                {plan === "premium" && (
                  <div className="absolute left-0 top-0">
                    <Badge className="rounded-br-lg rounded-tl-lg bg-emerald-600 text-white">
                      Oferta exclusiva
                    </Badge>
                  </div>
                )}
                {plan === "premium" && (
                  <div className="absolute inset-0 pointer-events-none" />
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "rounded-md p-2",
                        plan === "premium"
                          ? " text-white"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {getPlanIcon(plan)}
                    </div>
                    <div>
                      <CardTitle className={cn("text-lg", styles.header)}>
                        {details.name}
                      </CardTitle>
                      <CardDescription>
                        <span className="text-2xl font-bold text-foreground">
                          R$ {details.price.toFixed(2)}
                        </span>
                        <span className="text-gray-500">{l.perMonth}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {details.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            plan === "premium"
                              ? "text-amber-500"
                              : "text-primary"
                          )}
                        />
                        <span className="text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full gap-2",
                      plan === "premium" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : styles.button
                    )}
                    disabled={isCurrentPlan || Boolean(loading)}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {loading === plan ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      l.currentPlanBtn
                    ) : (
                      l.subscribe
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">{l.footer}</p>
      </div>
    </div>
  );
}
