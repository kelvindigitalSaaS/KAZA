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
import type { PlanTierEnum } from "@/integrations/supabase/types";

/** Plano interno da subscription (campo `plan` na tabela). Mantido para compat. */
export type SubscriptionPlan = "free" | "basic" | "standard" | "premium" | "individualPRO" | "multiPRO";

/** Tier efetivo do plano — o que o front deve usar para lógica de negócio. */
export type PlanTier = PlanTierEnum; // "free" | "individualPRO" | "multiPRO"

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
  planTier: PlanTier;
  groupId: string | null;
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
    planTier: PlanTier;
    maxAccounts: number;
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
    tier: "simple",
    planTier: "free",
    maxAccounts: 1
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
    tier: "simple",
    planTier: "free",
    maxAccounts: 1
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
      "Alterar notificação a cada 2 dias"
    ],
    tier: "almost-premium",
    planTier: "free",
    maxAccounts: 1
  },
  /** Compat: usuários antigos com plan="premium" — mapeados para individualPRO */
  premium: {
    name: "individualPRO",
    price: 14.99,
    itemsLimit: -1,
    recipesPerDay: -1,
    shoppingListLimit: -1,
    notificationChangeDays: 0,
    features: [
      "1 conta",
      "Itens e receitas ilimitados",
      "Lista de compras ilimitada",
      "Alertas inteligentes sem restrição",
      "Planejador de refeições semanal",
      "Histórico completo de consumo"
    ],
    tier: "premium",
    planTier: "individualPRO",
    maxAccounts: 1
  },
  individualPRO: {
    name: "individualPRO",
    price: 14.99,
    itemsLimit: -1,
    recipesPerDay: -1,
    shoppingListLimit: -1,
    notificationChangeDays: 0,
    features: [
      "1 conta",
      "Itens e receitas ilimitados",
      "Lista de compras ilimitada",
      "Alertas inteligentes sem restrição",
      "Planejador de refeições semanal",
      "Histórico completo de consumo"
    ],
    tier: "premium",
    planTier: "individualPRO",
    maxAccounts: 1
  },
  multiPRO: {
    name: "multiPRO",
    price: 27.00,
    itemsLimit: -1,
    recipesPerDay: -1,
    shoppingListLimit: -1,
    notificationChangeDays: 0,
    features: [
      "Até 3 sub-contas no mesmo plano",
      "Geladeira e estoque compartilhados",
      "Configurações e notificações independentes",
      "Lista de compras em tempo real",
      "Notificar outros membros da casa",
      "Conta mestre gerencia acesso"
    ],
    tier: "premium",
    planTier: "multiPRO",
    maxAccounts: 3
  }
};

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  planTier: PlanTier;
  isMultiPro: boolean;
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

      // Fonte canônica: view v_user_access
      try {
        const { data: access } = await supabase
          .from("v_user_access")
          .select("has_access, in_trial, trial_days_left, billing_soon")
          .eq("user_id", user.id)
          .maybeSingle();
        if (access) {
          remaining = (access as any).trial_days_left ?? remaining;
          locked = !((access as any).has_access);
        }
      } catch {
        // view pode não existir em ambientes antigos — mantém fallback
      }

      setTrialDaysRemaining(remaining);
      setIsLocked(locked);
      // @ts-ignore
      setRegistrationDate(profile?.created_at ? new Date(profile.created_at) : null);

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Reset receitas se virou o dia
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

        // Durante trial = acesso multiPRO completo (ilimitado)
        const inTrial = remaining > 0;
        const effectivePlan = (inTrial ? "multiPRO" : (data.plan || "free")) as SubscriptionPlan;
        const effectiveItemsLimit = inTrial ? -1 : data.items_limit;
        const effectiveRecipesPerDay = inTrial ? -1 : data.recipes_per_day;
        const effectiveShoppingListLimit = inTrial ? -1 : data.shopping_list_limit;

        // Determina o planTier efetivo
        const rawPlanTier: string = (data as any).plan_tier || "free";
        let effectivePlanTier: PlanTier = inTrial
          ? "multiPRO"
          : (rawPlanTier === "individualPRO" || rawPlanTier === "multiPRO")
            ? rawPlanTier as PlanTier
            : data.plan === "premium" && data.is_active
              ? "individualPRO"
              : "free";

        setSubscription({
          id: data.id,
          userId: data.user_id,
          plan: effectivePlan,
          planTier: effectivePlanTier,
          groupId: (data as any).group_id ?? null,
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
      if (import.meta.env.DEV) { console.error("[DEV] subscription fetch error:", error); }
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Verificar assinatura ao retornar do checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionResult = params.get("subscription");

    if (subscriptionResult === "success" && user) {
      const url = new URL(window.location.href);
      url.searchParams.delete("subscription");
      window.history.replaceState({}, "", url.toString());

      const syncSubscription = async () => {
        try {
          await supabase.functions.invoke("check-subscription");
          await fetchSubscription();
        } catch (error) {
          if (import.meta.env.DEV) { console.error("[DEV] sync error:", error); }
        }
      };
      syncSubscription();
    } else if (subscriptionResult === "canceled") {
      const url = new URL(window.location.href);
      url.searchParams.delete("subscription");
      window.history.replaceState({}, "", url.toString());
    }
  }, [user, fetchSubscription]);

  // Derived state
  const planTier: PlanTier = subscription?.planTier ?? "free";
  const isMultiPro = planTier === "multiPRO";

  const canAddItem = useCallback(() => {
    if (!subscription) return false;
    if (subscription.itemsLimit === -1) return true;
    return true;
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
      if (import.meta.env.DEV) { console.error("[DEV] recipe error:", error); }
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
            plan_tier: planDetails.planTier,
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
        if (import.meta.env.DEV) { console.error("[DEV] upgrade error:", error); }
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
        if (import.meta.env.DEV) {
          console.log(`[DEV] [Checkout] Attempt ${attempt}/${maxRetries} for plan ${plan}`);
        }

        let cpf: string | null = null;
        try {
          const { data: profileSensitive } = await supabase
            .from("profile_sensitive")
            .select("cpf")
            .eq("user_id", user?.id)
            .maybeSingle();
          // @ts-ignore
          cpf = profileSensitive?.cpf ?? null;
        } catch {
          // Non-critical
        }

        const { data, error } = await supabase.functions.invoke(
          "create-checkout",
          {
            body: { plan, email: user?.email ?? null, cpf },
            headers: { "Content-Type": "application/json" }
          }
        );

        if (error) {
          let errorMessage = "Erro desconhecido";
          try {
            const ctx = (error as any).context;
            if (ctx && ctx instanceof Response) {
              try {
                const bodyJson = await ctx.json();
                errorMessage = bodyJson?.error || bodyJson?.message || String(error);
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
          } catch {
            errorMessage = String(error);
          }

          lastError = new Error(errorMessage);
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          } else {
            throw lastError;
          }
        }

        if (data?.url) {
          window.location.href = data.url;
          return;
        } else {
          throw new Error("Sessão de pagamento não foi criada");
        }
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    const finalErrorMsg = lastError?.message ? String(lastError.message) : "Erro desconhecido";
    throw new Error(
      finalErrorMsg || "Não foi possível iniciar o pagamento. Verifique sua conexão e tente novamente."
    );
  }, [user]);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        await openExternalUrl(data.url);
      }
    } catch (error) {
      if (import.meta.env.DEV) { console.error("[DEV] portal error:", error); }
      throw error;
    }
  }, []);

  const getPlanTier = useCallback(() => {
    if (!subscription) return "simple";
    return PLAN_DETAILS[subscription.plan]?.tier ?? "simple";
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
        planTier,
        isMultiPro,
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
