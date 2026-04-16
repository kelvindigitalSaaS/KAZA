import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { openExternalUrl } from "@/lib/nativeBrowser";
import { isNative } from "@/lib/capacitor";

export type SubscriptionPlan = "free" | "basic" | "standard" | "premium";

export interface PlanLimits {
  itemsLimit: number;
  recipesPerDay: number;
  shoppingListLimit: number;
  notificationChangeDays: number;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  price: number | null;
  itemsLimit: number;
  recipesPerDay: number;
  shoppingListLimit: number;
  notificationChangeDays: number;
  lastNotificationChange: Date | null;
  recipesUsedToday: number;
  lastRecipeReset: Date;
  startedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  paymentProvider: string | null;
  paymentId: string | null;
  lastPaymentDate: Date | null;
  paymentMethod: string | null;
}

export const PLAN_DETAILS: Record<
  SubscriptionPlan,
  {
    name: string;
    price: number;
    itemsLimit: number;
    recipesPerDay: number;
    shoppingListLimit: number;
    notificationChangeDays: number;
    features: string[];
    tier: "simple" | "almost-premium" | "premium";
  }
> = {
  free: {
    name: "Grátis",
    price: 0,
    itemsLimit: 5,
    recipesPerDay: 1,
    shoppingListLimit: 20,
    notificationChangeDays: 7,
    features: [
      "5 itens na geladeira",
      "1 receita por dia",
      "20 itens na lista"
    ],
    tier: "simple"
  },
  basic: {
    name: "Básico",
    price: 9.99,
    itemsLimit: 20,
    recipesPerDay: 1,
    shoppingListLimit: 40,
    notificationChangeDays: 7,
    features: [
      "20 itens na geladeira",
      "1 receita por dia",
      "40 itens na lista",
      "Alterar notificação 1x/semana"
    ],
    tier: "simple"
  },
  standard: {
    name: "Padrão",
    price: 19.99,
    itemsLimit: 60,
    recipesPerDay: 3,
    shoppingListLimit: 90,
    notificationChangeDays: 2,
    features: [
      "60 itens na geladeira",
      "3 receitas por dia",
      "90 itens na lista",
      "Alterar notificação a cada 2 dias",
      "Interface quase premium"
    ],
    tier: "almost-premium"
  },
  premium: {
    name: "Premium",
    price: 27.00,
    itemsLimit: -1, // unlimited
    recipesPerDay: -1, // unlimited
    shoppingListLimit: -1, // unlimited
    notificationChangeDays: 0, // anytime
    features: [
      "Itens ilimitados",
      "Receitas ilimitadas",
      "Lista ilimitada",
      "Notificações sem restrição",
      "Interface premium exclusiva"
    ],
    tier: "premium"
  }
};

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  canAddItem: () => boolean;
  canUseRecipe: () => boolean;
  canAddShoppingItem: (currentCount: number) => boolean;
  canChangeNotification: () => boolean;
  useRecipe: () => Promise<boolean>;
  upgradePlan: (plan: SubscriptionPlan) => Promise<boolean>;
  startCheckout: (
    plan: SubscriptionPlan
  ) => Promise<{ clientSecret: string; publishableKey: string } | void>;
  openCustomerPortal: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  getPlanTier: () => "simple" | "almost-premium" | "premium";
  getRemainingItems: () => number;
  getRemainingRecipes: () => number;
  getRemainingShoppingItems: (currentCount: number) => number;
  trialDaysRemaining: number;
  isLocked: boolean;
  registrationDate: Date | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(7);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [registrationDate, setRegistrationDate] = useState<Date | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_type, subscription_status, trial_start_date, created_at, cakto_customer_id, last_payment_date, payment_method")
        .eq("user_id", user.id)
        .maybeSingle();
      // @ts-ignore
      let planType = profile?.plan_type || "free";
      // @ts-ignore
      let trialStart = profile?.trial_start_date ? new Date(profile.trial_start_date) : new Date();
      let daysPassed = Math.floor((new Date().getTime() - trialStart.getTime()) / (1000 * 3600 * 24));
      let remaining = Math.max(0, 7 - daysPassed);
      let locked = planType !== 'premium' && remaining === 0;

      setTrialDaysRemaining(remaining);
      setIsLocked(locked);
      // @ts-ignore
      setRegistrationDate(profile?.created_at ? new Date(profile.created_at) : null);

      if (!profile && user) {
        console.log("Profile not found, using defaults");
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Reset recipes if it's a new day
        const today = new Date().toISOString().split("T")[0];
        const lastReset = data.last_recipe_reset;

        if (lastReset !== today) {
          await supabase
            .from("subscriptions")
            .update({ recipes_used_today: 0, last_recipe_reset: today })
            .eq("id", data.id)
            .eq("user_id", user.id);
          data.recipes_used_today = 0;
        }

        const effectivePlan = (trialDaysRemaining > 0 ? "premium" : data.plan) as SubscriptionPlan;
        const effectiveItemsLimit = trialDaysRemaining > 0 ? -1 : data.items_limit;
        const effectiveRecipesPerDay = trialDaysRemaining > 0 ? -1 : data.recipes_per_day;
        const effectiveShoppingListLimit = trialDaysRemaining > 0 ? -1 : data.shopping_list_limit;

        setSubscription({
          id: data.id,
          userId: data.user_id,
          plan: effectivePlan,
          price: data.price,
          itemsLimit: effectiveItemsLimit,
          recipesPerDay: effectiveRecipesPerDay,
          shoppingListLimit: effectiveShoppingListLimit,
          notificationChangeDays: data.notification_change_days,
          lastNotificationChange: data.last_notification_change
            ? new Date(data.last_notification_change)
            : null,
          recipesUsedToday: data.recipes_used_today,
          lastRecipeReset: new Date(data.last_recipe_reset),
          startedAt: new Date(data.started_at),
          expiresAt: data.expires_at ? new Date(data.expires_at) : null,
          isActive: data.is_active,
          paymentProvider: data.payment_provider,
          paymentId: data.payment_id,
          // @ts-ignore
          lastPaymentDate: profile?.last_payment_date ? new Date(profile.last_payment_date) : null,
          // @ts-ignore
          paymentMethod: profile?.payment_method || null,
        });
      } else {
        setSubscription(null);
      }
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      // Suppress JWT errors
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Verificar assinatura automaticamente quando o usuário volta do checkout do Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionResult = params.get("subscription");

    if (subscriptionResult === "success" && user) {
      // Limpar a URL para evitar re-triggers
      const url = new URL(window.location.href);
      url.searchParams.delete("subscription");
      window.history.replaceState({}, "", url.toString());

      // Chamar check-subscription para sincronizar com o Stripe
      const syncSubscription = async () => {
        try {
          await supabase.functions.invoke("check-subscription");
          await fetchSubscription();
        } catch (error) {
          console.error("Error syncing subscription after checkout:", error);
        }
      };
      syncSubscription();
    } else if (subscriptionResult === "canceled") {
      const url = new URL(window.location.href);
      url.searchParams.delete("subscription");
      window.history.replaceState({}, "", url.toString());
    }
  }, [user, fetchSubscription]);

  const canAddItem = useCallback(() => {
    if (!subscription) return false;
    if (subscription.itemsLimit === -1) return true;
    return true; // Will be checked against actual count in context
  }, [subscription]);

  const canUseRecipe = useCallback(() => {
    if (!subscription) return false;
    if (subscription.recipesPerDay === -1) return true;
    return subscription.recipesUsedToday < subscription.recipesPerDay;
  }, [subscription]);

  const canAddShoppingItem = useCallback(
    (currentCount: number) => {
      if (!subscription) return false;
      if (subscription.shoppingListLimit === -1) return true;
      return currentCount < subscription.shoppingListLimit;
    },
    [subscription]
  );

  const canChangeNotification = useCallback(() => {
    if (!subscription) return false;
    if (subscription.notificationChangeDays === 0) return true;
    if (!subscription.lastNotificationChange) return true;

    const daysSinceChange = Math.floor(
      (Date.now() - subscription.lastNotificationChange.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysSinceChange >= subscription.notificationChangeDays;
  }, [subscription]);

  const useRecipe = useCallback(async () => {
    if (!subscription || !canUseRecipe()) return false;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ recipes_used_today: subscription.recipesUsedToday + 1 })
        .eq("id", subscription.id)
        .eq("user_id", subscription.userId);

      if (error) throw error;

      setSubscription((prev) =>
        prev ? { ...prev, recipesUsedToday: prev.recipesUsedToday + 1 } : null
      );
      return true;
    } catch (error) {
      console.error("Error using recipe:", error);
      return false;
    }
  }, [subscription, canUseRecipe]);

  const upgradePlan = useCallback(
    async (plan: SubscriptionPlan) => {
      if (!subscription) return false;

      const planDetails = PLAN_DETAILS[plan];

      try {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan,
            price: planDetails.price,
            items_limit: planDetails.itemsLimit,
            recipes_per_day: planDetails.recipesPerDay,
            shopping_list_limit: planDetails.shoppingListLimit,
            notification_change_days: planDetails.notificationChangeDays,
            started_at: new Date().toISOString(),
            is_active: true
          })
          .eq("id", subscription.id)
          .eq("user_id", subscription.userId);

        if (error) throw error;

        await fetchSubscription();
        return true;
      } catch (error) {
        console.error("Error upgrading plan:", error);
        return false;
      }
    },
    [subscription, fetchSubscription]
  );

  const startCheckout = useCallback(async (plan: SubscriptionPlan) => {
    if (plan === "free") return;

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[Checkout] Tentativa ${attempt}/${maxRetries} para plano ${plan}`
        );

        // Fetch profile to include optional CPF and always include email for the edge function
        // Use `profile_sensitive` (canonical storage for CPF)
        let cpf: string | null = null;
        try {
          const { data: profile } = await supabase
            .from("profile_sensitive")
            .select("cpf")
            .eq("user_id", user?.id)
            .maybeSingle();
          // @ts-ignore
          cpf = profile?.cpf ?? null;
        } catch (err) {
          console.warn("Could not read profile_sensitive cpf before checkout:", err);
        }

        const { data, error } = await supabase.functions.invoke(
          "create-checkout",
          {
            body: { plan, email: user?.email ?? null, cpf },
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        if (error) {
          let errorMessage = "Erro desconhecido";

          try {
            // Se error tem context (Response)
            const ctx = (error as any).context;
            if (ctx && ctx instanceof Response) {
              try {
                const bodyJson = await ctx.json();
                errorMessage =
                  bodyJson?.error || bodyJson?.message || String(error);
              } catch {
                errorMessage = await ctx.text();
              }
            } else if (error?.message) {
              errorMessage = String(error.message);
            } else if (typeof error === "string") {
              errorMessage = error;
            } else {
              errorMessage = JSON.stringify(error);
            }
          } catch (parseErr) {
            errorMessage = String(error);
          }

          lastError = new Error(errorMessage);
          console.error("[Checkout] Erro na tentativa:", errorMessage);

          // Retry em caso de erro de rede
          if (attempt < maxRetries) {
            console.log(`[Checkout] Aguardando 2 segundos antes de retry...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          } else {
            throw lastError;
          }
        }

        if (data?.url) {
          // Redireciona para a Stripe Hosted Page
          console.log("[Checkout] Redirecionando para Stripe...");
          window.location.href = data.url;
          return;
        } else {
          throw new Error("Sessão de pagamento não foi criada");
        }
      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message ? String(error.message) : String(error);
        console.error(`[Checkout] Erro na tentativa ${attempt}:`, errorMsg);

        if (attempt < maxRetries) {
          console.log(`[Checkout] Aguardando antes de retry...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    // Se chegou aqui, falhou após todas as tentativas
    const finalErrorMsg = lastError?.message
      ? String(lastError.message)
      : "Erro desconhecido";
    console.error("[Checkout] Falha após 3 tentativas:", finalErrorMsg);
    throw new Error(
      finalErrorMsg ||
        "Não foi possível iniciar o pagamento. Verifique sua conexão e tente novamente."
    );
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "customer-portal"
      );

      if (error) throw error;

      if (data?.url) {
        await openExternalUrl(data.url);
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      throw error;
    }
  }, []);

  const getPlanTier = useCallback(() => {
    if (!subscription) return "simple";
    return PLAN_DETAILS[subscription.plan].tier;
  }, [subscription]);

  const getRemainingItems = useCallback(() => {
    if (!subscription) return 0;
    if (subscription.itemsLimit === -1) return -1;
    return subscription.itemsLimit;
  }, [subscription]);

  const getRemainingRecipes = useCallback(() => {
    if (!subscription) return 0;
    if (subscription.recipesPerDay === -1) return -1;
    return subscription.recipesPerDay - subscription.recipesUsedToday;
  }, [subscription]);

  const getRemainingShoppingItems = useCallback(
    (currentCount: number) => {
      if (!subscription) return 0;
      if (subscription.shoppingListLimit === -1) return -1;
      return subscription.shoppingListLimit - currentCount;
    },
    [subscription]
  );

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        canAddItem,
        canUseRecipe,
        canAddShoppingItem,
        canChangeNotification,
        useRecipe,
        upgradePlan,
        startCheckout,
        openCustomerPortal,
        refreshSubscription: fetchSubscription,
        getPlanTier,
        getRemainingItems,
        getRemainingRecipes,
        getRemainingShoppingItems,
        trialDaysRemaining,
        isLocked,
        registrationDate
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
