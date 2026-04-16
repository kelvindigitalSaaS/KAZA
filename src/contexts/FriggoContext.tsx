import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback
} from "react";
import {
  KazaItem,
  ShoppingItem,
  OnboardingData,
  Alert,
  ItemHistoryEntry,
  ItemCategory,
  ItemLocation,
  MaturationLevel,
  ConsumableItem,
  ConsumableCategory,
  DefrostTimer,
  MealPlanEntry
} from "@/types/friggo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { scheduleLocalNotification } from "@/lib/pushNotifications";

interface KazaContextType {
  items: KazaItem[];
  shoppingList: ShoppingItem[];
  consumables: ConsumableItem[];
  defrostTimers: DefrostTimer[];
  alerts: Alert[];
  onboardingData: OnboardingData | null;
  isOnboarded: boolean;
  onboarding_completed: boolean;
  itemHistory: ItemHistoryEntry[];
  loading: boolean;
  homeId: string | null;
  addItem: (item: Omit<KazaItem, "id">) => Promise<void>;
  updateItem: (id: string, item: Partial<KazaItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  addToShoppingList: (
    item: Omit<ShoppingItem, "id" | "isCompleted">
  ) => Promise<void>;
  toggleShoppingItem: (id: string) => Promise<void>;
  removeFromShoppingList: (id: string) => Promise<void>;
  updateShoppingItemQuantity: (id: string, quantity: number) => Promise<void>;
  addConsumable: (item: Omit<ConsumableItem, "id">) => Promise<void>;
  updateConsumable: (id: string, updates: Partial<ConsumableItem>) => Promise<void>;
  removeConsumable: (id: string) => Promise<void>;
  clearConsumables: () => void;
  setConsumablesBulk: (items: Omit<ConsumableItem, "id">[]) => Promise<void>;
  markAllShoppingComplete: () => Promise<void>;
  clearAllShoppingList: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  updateProfile: (data: Partial<OnboardingData>) => Promise<void>;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  defrostItem: (id: string) => void;
  dismissAlert: (id: string) => void;
  addItemHistory: (
    itemId: string,
    itemName: string,
    action: "added" | "consumed" | "cooked" | "discarded",
    quantity: number,
    unit?: string
  ) => void;
  toggleSection: (id: string) => Promise<void>;
  isSectionHidden: (id: string) => boolean;
  refreshData: () => Promise<void>;
  favoriteRecipes: string[];
  toggleFavoriteRecipe: (recipeId: string) => Promise<void>;
  mealPlan: MealPlanEntry[];
  addToMealPlan: (entry: Omit<MealPlanEntry, "id">) => Promise<void>;
  removeFromMealPlan: (id: string) => Promise<void>;
}

const KazaContext = createContext<KazaContextType | undefined>(undefined);

const VALID_CATEGORIES: ItemCategory[] = [
  "fruit", "vegetable", "meat", "dairy", "cooked", "frozen",
  "beverage", "cleaning", "hygiene", "pantry"
];
const VALID_LOCATIONS: ItemLocation[] = ["fridge", "freezer", "pantry", "cleaning"];
const DEFAULT_NOTIFICATION_PREFS = ["expiry", "shopping", "nightCheckup"];

const ALERT_NOTIFICATION_PREF_MAP: Record<Alert["type"], string> = {
  expiring: "expiry",
  "consume-today": "expiry",
  overripe: "recipes",
  "low-stock": "shopping"
};

const DEMO_ITEMS: KazaItem[] = [
  {
    id: "demo-1",
    name: "Maçã",
    category: "fruit",
    location: "fridge",
    quantity: 6,
    unit: "unidades",
    addedDate: new Date(Date.now() - 3 * 86400000),
    expirationDate: new Date(Date.now() + 4 * 86400000),
    maturation: "ripe"
  },
  {
    id: "demo-2",
    name: "Leite",
    category: "dairy",
    location: "fridge",
    quantity: 2,
    unit: "litros",
    addedDate: new Date(Date.now() - 2 * 86400000),
    expirationDate: new Date(Date.now() + 2 * 86400000),
    openedDate: new Date(Date.now() - 86400000)
  }
];

export function KazaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();

  const [homeId, setHomeId] = useState<string | null>(null);
  const [items, setItems] = useState<KazaItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [consumables, setConsumables] = useState<ConsumableItem[]>([]);
  const [defrostTimers, setDefrostTimers] = useState<DefrostTimer[]>(() => {
    const saved = localStorage.getItem("friggo_defrost_timers_list");
    return saved ? JSON.parse(saved) : [];
  });
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [onboarding_completed, setOnboardingCompleted] = useState(false);
  const [itemHistory, setItemHistory] = useState<ItemHistoryEntry[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<string[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const notifiedAlertIds = useRef<Set<string>>(new Set());
  const hasHydratedAlerts = useRef(false);

  const buildDefaultOnboarding = (
    overrides: Partial<OnboardingData> = {}
  ): OnboardingData => {
    const fallbackName =
      typeof user?.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";
    return {
      name: fallbackName,
      homeType: "apartment",
      residents: 1,
      fridgeType: "regular",
      coolingLevel: 3,
      habits: [],
      notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      ...overrides
    };
  };

  useEffect(() => {
    localStorage.setItem(
      "friggo_defrost_timers_list",
      JSON.stringify(defrostTimers)
    );
  }, [defrostTimers]);

  useEffect(() => {
    notifiedAlertIds.current.clear();
    hasHydratedAlerts.current = false;
  }, [user?.id]);

  const showError = (title: string, err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(title, err);
    toast({ title, description: msg, variant: "destructive" });
  };

  const fetchData = useCallback(async () => {
    if (!user) {
      setItems(DEMO_ITEMS);
      setShoppingList([]);
      setOnboardingData(null);
      setHomeId(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: membership, error: memberErr } = await supabase
        .from("home_members")
        .select("home_id, role")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (memberErr) throw memberErr;

      const hid = membership?.home_id ?? null;
      setHomeId(hid);

      if (!hid) {
        setItems([]);
        setShoppingList([]);
        setConsumables([]);
        setFavoriteRecipes([]);
        setMealPlan([]);
        setOnboardingData(buildDefaultOnboarding());
        setLoading(false);
        return;
      }

      const [
        itemsRes,
        shoppingRes,
        consumablesRes,
        recipesRes,
        mealPlansRes,
        profileRes,
        homeRes,
        homeSettingsRes,
        notifPrefsRes
      ] = await Promise.all([
        supabase.from("items").select("*").eq("home_id", hid).order("created_at", { ascending: false }),
        supabase.from("shopping_items").select("*").eq("home_id", hid).order("created_at", { ascending: false }),
        supabase.from("consumables").select("*").eq("home_id", hid),
        supabase.from("recipes").select("id, is_favorite").eq("home_id", hid).eq("is_favorite", true),
        supabase.from("meal_plans").select("*").eq("home_id", hid).order("planned_date", { ascending: true }),
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("homes").select("*").eq("id", hid).maybeSingle(),
        supabase.from("home_settings").select("*").eq("home_id", hid).maybeSingle(),
        supabase.from("notification_preferences").select("*").eq("home_id", hid).maybeSingle()
      ]);

      const firstError =
        itemsRes.error || shoppingRes.error || consumablesRes.error ||
        recipesRes.error || mealPlansRes.error || profileRes.error ||
        homeRes.error || homeSettingsRes.error || notifPrefsRes.error;
      if (firstError) throw firstError;

      setItems((itemsRes.data || []).map(toKazaItem));
      setShoppingList((shoppingRes.data || []).map(toShoppingItem));
      setConsumables((consumablesRes.data || []).map(toConsumable));
      setFavoriteRecipes((recipesRes.data || []).map((r: any) => r.id));
      setMealPlan(
        (mealPlansRes.data || []).map((p: any) => ({
          id: p.id,
          recipe_id: p.recipe_id,
          recipe_name: p.recipe_name,
          planned_date: p.planned_date,
          meal_type: p.meal_type
        }))
      );

      const profile = profileRes.data as any;
      const home = homeRes.data as any;
      const hs = homeSettingsRes.data as any;
      const np = notifPrefsRes.data as any;

      const notifPrefs: string[] = [];
      if (np?.expiring_items) notifPrefs.push("expiry");
      if (np?.shopping_list_updates) notifPrefs.push("shopping");
      if (np?.low_stock_consumables) notifPrefs.push("nightCheckup");
      if (np?.daily_summary) notifPrefs.push("recipes");

      const onboardingActive = !!profile?.onboarding_completed;
      setOnboardingCompleted(onboardingActive);

      setOnboardingData(
        buildDefaultOnboarding({
          name: profile?.name ?? "",
          avatarUrl: profile?.avatar_url ?? undefined,
          cpf: profile?.cpf ?? undefined,
          homeType: home?.home_type ?? "apartment",
          residents: home?.residents ?? 1,
          fridgeType: hs?.fridge_type ?? "regular",
          fridgeBrand: hs?.fridge_brand ?? undefined,
          coolingLevel: hs?.cooling_level ?? 3,
          habits: hs?.habits ?? [],
          hiddenSections: hs?.hidden_sections ?? [],
          notificationPrefs: notifPrefs.length ? notifPrefs : DEFAULT_NOTIFICATION_PREFS
        })
      );
    } catch (err) {
      showError("Erro ao carregar dados", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── alerts ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const newAlerts: Alert[] = [];
    const now = new Date();

    items.forEach((item) => {
      if (item.expirationDate) {
        const days = Math.ceil(
          (new Date(item.expirationDate).getTime() - now.getTime()) / 86400000
        );
        if (days <= 0) {
          newAlerts.push({
            id: `exp-${item.id}`, type: "expiring", itemId: item.id,
            itemName: item.name, message: `${item.name} venceu!`,
            priority: "high", createdAt: now
          });
        } else if (days <= 1) {
          newAlerts.push({
            id: `exp-${item.id}`, type: "consume-today", itemId: item.id,
            itemName: item.name, message: `Consumir ${item.name} hoje`,
            priority: "high", createdAt: now
          });
        } else if (days <= 3) {
          newAlerts.push({
            id: `exp-${item.id}`, type: "expiring", itemId: item.id,
            itemName: item.name, message: `${item.name} vence em ${days} dias`,
            priority: "medium", createdAt: now
          });
        }
      }
      if (item.maturation === "very-ripe" || item.maturation === "overripe") {
        newAlerts.push({
          id: `mat-${item.id}`, type: "overripe", itemId: item.id,
          itemName: item.name,
          message: `${item.name} está ${item.maturation === "very-ripe" ? "muito maduro" : "passado"}`,
          priority: item.maturation === "overripe" ? "high" : "medium",
          createdAt: now
        });
      }
      if (item.minStock && item.quantity <= item.minStock) {
        newAlerts.push({
          id: `stock-${item.id}`, type: "low-stock", itemId: item.id,
          itemName: item.name, message: `${item.name} está acabando`,
          priority: "low", createdAt: now
        });
      }
      if (item.dailyConsumption && item.dailyConsumption > 0) {
        const days = Math.floor(item.quantity / item.dailyConsumption);
        if (days <= 3) {
          newAlerts.push({
            id: `consumption-${item.id}`, type: "low-stock", itemId: item.id,
            itemName: item.name, message: `${item.name} acaba em ${days} dias`,
            priority: days <= 1 ? "high" : "medium", createdAt: now
          });
        }
      }
      if (item.category === "meat" && item.location === "pantry") {
        newAlerts.push({
          id: `spoilage-${item.id}`, type: "expiring", itemId: item.id,
          itemName: item.name,
          message: language === "pt-BR"
            ? `${item.name} na dispensa vai estragar! Precisa de refrigeração.`
            : language === "es"
              ? `${item.name} en la despensa se echará a perder!`
              : `${item.name} in pantry will rot! Needs refrigeration.`,
          priority: "high", createdAt: now
        });
      }
    });

    setAlerts(newAlerts);

    const prefs = onboardingData?.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;
    if (!hasHydratedAlerts.current) {
      newAlerts.forEach((a) => notifiedAlertIds.current.add(a.id));
      hasHydratedAlerts.current = true;
      return;
    }
    newAlerts.forEach((alert) => {
      if (notifiedAlertIds.current.has(alert.id)) return;
      notifiedAlertIds.current.add(alert.id);
      if (alert.priority === "low") return;
      if (!prefs.includes(ALERT_NOTIFICATION_PREF_MAP[alert.type])) return;
      const category =
        alert.type === "consume-today" ? "consume-today" as const
          : alert.type === "expiring" ? "expiry" as const
          : alert.type === "overripe" ? "overripe" as const
          : "low-stock" as const;
      const title =
        alert.type === "consume-today" ? "⏰ Friggo — Consumir Hoje!"
          : alert.type === "expiring" ? "🕰️ Friggo — Atenção ao Prazo"
          : alert.type === "overripe" ? "🍌 Friggo — Hora de Usar"
          : "📦 Friggo — Reposição Necessária";
      scheduleLocalNotification(title, alert.message, 0, alert.id, category);
    });
  }, [items, onboardingData?.notificationPrefs, language]);

  // ── mappers ──────────────────────────────────────────────────────────────
  function toKazaItem(row: any): KazaItem {
    const category = VALID_CATEGORIES.includes(row.category) ? row.category : "pantry";
    const location = VALID_LOCATIONS.includes(row.location) ? row.location : "fridge";
    return {
      id: row.id,
      name: row.name,
      category,
      location,
      quantity: Number(row.quantity) || 1,
      unit: row.unit || "unidades",
      addedDate: new Date(row.created_at || Date.now()),
      expirationDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
      openedDate: row.opened_date ? new Date(row.opened_date) : undefined,
      minStock: row.min_stock ? Number(row.min_stock) : undefined,
      maturation: row.maturation || undefined,
      user_id: row.user_id
    };
  }
  function toShoppingItem(row: any): ShoppingItem {
    const category = VALID_CATEGORIES.includes(row.category) ? row.category : "pantry";
    const storeMap: Record<string, "market" | "fair" | "pharmacy"> = {
      market: "market", fair: "fair", pharmacy: "pharmacy"
    };
    return {
      id: row.id,
      name: row.name,
      quantity: Number(row.quantity) || 1,
      unit: row.unit || "unidades",
      category,
      isCompleted: !!row.checked,
      store: storeMap[row.category] || "market",
      user_id: row.user_id
    };
  }
  function toConsumable(row: any): ConsumableItem {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon || "📦",
      category: (row.category as ConsumableCategory) || "other",
      currentStock: Number(row.current_stock) || 0,
      unit: row.unit || "unidades",
      dailyConsumption: Number(row.daily_consumption) || 0,
      minStock: Number(row.min_stock) || 0,
      usageInterval: (row.usage_interval as any) || "daily"
    };
  }

  // ── items ────────────────────────────────────────────────────────────────
  const addItem = async (item: Omit<KazaItem, "id">) => {
    if (!user || !homeId) {
      const local = { ...item, id: crypto.randomUUID() };
      setItems((prev) => [local, ...prev]);
      addItemHistory(local.id, local.name, "added", local.quantity, local.unit);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("items")
        .insert({
          home_id: homeId,
          user_id: user.id,
          added_by_user_id: user.id,
          name: item.name,
          category: item.category,
          location: item.location,
          quantity: item.quantity,
          unit: item.unit,
          expiry_date: item.expirationDate?.toISOString().split("T")[0] ?? null,
          opened_date: item.openedDate?.toISOString().split("T")[0] ?? null,
          min_stock: item.minStock,
          maturation: item.maturation
        })
        .select()
        .single();
      if (error) throw error;
      const mapped = toKazaItem(data);
      setItems((prev) => [mapped, ...prev]);
      addItemHistory(mapped.id, mapped.name, "added", mapped.quantity, mapped.unit);
    } catch (err) {
      showError("Erro ao adicionar item", err);
    }
  };

  const updateItem = async (id: string, updates: Partial<KazaItem>) => {
    if (!user || !homeId || id.startsWith("demo-")) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      return;
    }
    try {
      const patch: any = {};
      if (updates.name !== undefined) patch.name = updates.name;
      if (updates.category !== undefined) patch.category = updates.category;
      if (updates.location !== undefined) patch.location = updates.location;
      if (updates.quantity !== undefined) patch.quantity = updates.quantity;
      if (updates.unit !== undefined) patch.unit = updates.unit;
      if (updates.expirationDate !== undefined) {
        patch.expiry_date = updates.expirationDate
          ? updates.expirationDate.toISOString().split("T")[0] : null;
      }
      if (updates.openedDate !== undefined) {
        patch.opened_date = updates.openedDate
          ? updates.openedDate.toISOString().split("T")[0] : null;
      }
      if (updates.minStock !== undefined) patch.min_stock = updates.minStock;
      if (updates.maturation !== undefined) patch.maturation = updates.maturation;

      const { error } = await supabase
        .from("items").update(patch).eq("id", id).eq("home_id", homeId);
      if (error) throw error;
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    } catch (err) {
      showError("Erro ao atualizar item", err);
    }
  };

  const removeItem = async (id: string) => {
    if (!user || !homeId || id.startsWith("demo-")) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    try {
      const { error } = await supabase
        .from("items").delete().eq("id", id).eq("home_id", homeId);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      showError("Erro ao remover item", err);
    }
  };

  // ── shopping ─────────────────────────────────────────────────────────────
  const addToShoppingList = async (
    item: Omit<ShoppingItem, "id" | "isCompleted">
  ) => {
    if (!user || !homeId) {
      setShoppingList((prev) => [
        ...prev, { ...item, id: crypto.randomUUID(), isCompleted: false }
      ]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .insert({
          home_id: homeId,
          user_id: user.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          checked: false
        })
        .select().single();
      if (error) throw error;
      setShoppingList((prev) => [...prev, toShoppingItem(data)]);
    } catch (err) {
      showError("Erro ao adicionar item", err);
    }
  };

  const toggleShoppingItem = async (id: string) => {
    const item = shoppingList.find((i) => i.id === id);
    if (!item) return;
    const next = !item.isCompleted;
    if (!user || !homeId) {
      setShoppingList((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isCompleted: next } : i)));
      return;
    }
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update({
          checked: next,
          checked_by_user_id: next ? user.id : null,
          checked_at: next ? new Date().toISOString() : null
        })
        .eq("id", id).eq("home_id", homeId);
      if (error) throw error;
      setShoppingList((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isCompleted: next } : i)));
    } catch (err) {
      showError("Erro ao atualizar item", err);
    }
  };

  const removeFromShoppingList = async (id: string) => {
    if (!user || !homeId) {
      setShoppingList((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    try {
      const { error } = await supabase
        .from("shopping_items").delete().eq("id", id).eq("home_id", homeId);
      if (error) throw error;
      setShoppingList((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      showError("Erro ao remover item", err);
    }
  };

  const updateShoppingItemQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    if (!user || !homeId) {
      setShoppingList((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
      return;
    }
    try {
      const { error } = await supabase
        .from("shopping_items").update({ quantity }).eq("id", id).eq("home_id", homeId);
      if (error) throw error;
      setShoppingList((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    } catch (err) {
      showError("Erro ao atualizar quantidade", err);
    }
  };

  const markAllShoppingComplete = async () => {
    const pending = shoppingList.filter((i) => !i.isCompleted);
    for (const item of pending) await toggleShoppingItem(item.id);
  };

  const clearAllShoppingList = async () => {
    if (!user || !homeId) {
      setShoppingList([]);
      return;
    }
    try {
      const { error } = await supabase
        .from("shopping_items").delete().eq("home_id", homeId);
      if (error) throw error;
      setShoppingList([]);
    } catch (err) {
      showError("Erro ao limpar lista", err);
    }
  };

  // ── consumables ──────────────────────────────────────────────────────────
  const addConsumable = async (item: Omit<ConsumableItem, "id">) => {
    if (!user || !homeId) {
      setConsumables((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("consumables")
        .insert({
          home_id: homeId,
          name: item.name,
          icon: item.icon,
          category: item.category,
          current_stock: item.currentStock,
          unit: item.unit,
          daily_consumption: item.dailyConsumption,
          min_stock: item.minStock,
          usage_interval: item.usageInterval || "daily"
        })
        .select().single();
      if (error) throw error;
      setConsumables((prev) => [...prev, toConsumable(data)]);
    } catch (err) {
      showError("Erro ao adicionar consumível", err);
    }
  };

  const updateConsumable = async (id: string, updates: Partial<ConsumableItem>) => {
    if (!user || !homeId) {
      setConsumables((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      return;
    }
    try {
      const patch: any = {};
      if (updates.name !== undefined) patch.name = updates.name;
      if (updates.icon !== undefined) patch.icon = updates.icon;
      if (updates.category !== undefined) patch.category = updates.category;
      if (updates.currentStock !== undefined) patch.current_stock = updates.currentStock;
      if (updates.unit !== undefined) patch.unit = updates.unit;
      if (updates.dailyConsumption !== undefined) patch.daily_consumption = updates.dailyConsumption;
      if (updates.minStock !== undefined) patch.min_stock = updates.minStock;
      if (updates.usageInterval !== undefined) patch.usage_interval = updates.usageInterval;
      const { error } = await supabase
        .from("consumables").update(patch).eq("id", id).eq("home_id", homeId);
      if (error) throw error;
      setConsumables((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    } catch (err) {
      showError("Erro ao atualizar consumível", err);
    }
  };

  const removeConsumable = async (id: string) => {
    if (!user || !homeId) {
      setConsumables((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    try {
      const { error } = await supabase
        .from("consumables").delete().eq("id", id).eq("home_id", homeId);
      if (error) throw error;
      setConsumables((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      showError("Erro ao remover consumível", err);
    }
  };

  const clearConsumables = () => setConsumables([]);

  const setConsumablesBulk = async (list: Omit<ConsumableItem, "id">[]) => {
    if (!user || !homeId) {
      const withIds = list.map((item) => ({ ...item, id: crypto.randomUUID() }));
      setConsumables(withIds);
      return;
    }
    try {
      const rows = list.map((item) => ({
        home_id: homeId,
        name: item.name,
        icon: item.icon,
        category: item.category,
        current_stock: item.currentStock,
        unit: item.unit,
        daily_consumption: item.dailyConsumption,
        min_stock: item.minStock,
        usage_interval: item.usageInterval || "daily"
      }));
      const { data, error } = await supabase
        .from("consumables")
        .upsert(rows, { onConflict: "home_id,name" })
        .select();
      if (error) throw error;
      setConsumables((data || []).map(toConsumable));
    } catch (err) {
      showError("Erro ao salvar consumíveis", err);
    }
  };

  // ── recipes / meal plan ──────────────────────────────────────────────────
  const toggleFavoriteRecipe = async (recipeId: string) => {
    if (!user || !homeId) return;
    const isFav = favoriteRecipes.includes(recipeId);
    try {
      if (isFav) {
        await supabase
          .from("recipes")
          .update({ is_favorite: false })
          .eq("id", recipeId).eq("home_id", homeId);
        setFavoriteRecipes((prev) => prev.filter((id) => id !== recipeId));
      } else {
        await supabase
          .from("recipes")
          .update({ is_favorite: true })
          .eq("id", recipeId).eq("home_id", homeId);
        setFavoriteRecipes((prev) => [...prev, recipeId]);
      }
    } catch (err) {
      showError("Erro ao favoritar receita", err);
    }
  };

  const addToMealPlan = async (entry: Omit<MealPlanEntry, "id">) => {
    if (!user || !homeId) return;
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          home_id: homeId,
          recipe_id: entry.recipe_id,
          recipe_name: entry.recipe_name,
          planned_date: entry.planned_date,
          meal_type: entry.meal_type,
          created_by_user_id: user.id
        })
        .select().single();
      if (error) throw error;
      if (data) {
        setMealPlan((prev) => [...prev, {
          id: data.id,
          recipe_id: data.recipe_id,
          recipe_name: data.recipe_name,
          planned_date: data.planned_date,
          meal_type: data.meal_type
        }]);
        toast({ title: "Agendado!", description: "Refeição adicionada ao seu plano." });
      }
    } catch (err) {
      showError("Erro ao agendar refeição", err);
    }
  };

  const removeFromMealPlan = async (id: string) => {
    if (!user || !homeId) return;
    try {
      const { error } = await supabase
        .from("meal_plans").delete().eq("id", id).eq("home_id", homeId);
      if (error) throw error;
      setMealPlan((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      showError("Erro ao remover do plano", err);
    }
  };

  // ── onboarding / profile ─────────────────────────────────────────────────
  const completeOnboarding = async (data: OnboardingData) => {
    if (!user || !homeId) {
      setOnboardingData(buildDefaultOnboarding(data));
      return;
    }
    try {
      const rawCpf = String(data.cpf || "").replace(/\D/g, "");
      if (rawCpf.length > 0) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("cpf", rawCpf)
          .maybeSingle();
        if (existing && (existing as any).user_id !== user.id) {
          const msg = language === "pt-BR"
            ? "Este CPF já está cadastrado em outra conta."
            : "This CPF is already registered with another account.";
          toast({ title: "CPF Duplicado", description: msg, variant: "destructive" });
          throw new Error(msg);
        }
      }

      const results = await Promise.all([
        supabase.from("profiles").update({
          name: data.name,
          avatar_url: data.avatarUrl,
          cpf: rawCpf.length > 0 ? rawCpf : null,
          onboarding_completed: true
        }).eq("user_id", user.id),
        supabase.from("homes").update({
          home_type: data.homeType || "apartment",
          residents: data.residents || 1
        }).eq("id", homeId),
        supabase.from("home_settings").update({
          fridge_type: data.fridgeType || "regular",
          fridge_brand: data.fridgeBrand || null,
          cooling_level: data.coolingLevel || 3,
          habits: data.habits || [],
          hidden_sections: data.hiddenSections || []
        }).eq("home_id", homeId),
        updateNotificationPreferences(homeId, data.notificationPrefs)
      ]);
      const err = results.find((r: any) => r?.error)?.error;
      if (err) throw err;

      setOnboardingCompleted(true);
      setOnboardingData(buildDefaultOnboarding(data));
    } catch (err: any) {
      if (err?.code === "23505") {
        const msg = language === "pt-BR"
          ? "Este CPF já está cadastrado em outra conta."
          : "This CPF is already registered with another account.";
        toast({ title: "CPF Duplicado", description: msg, variant: "destructive" });
        throw new Error(msg);
      }
      showError("Erro ao salvar perfil", err);
      throw err;
    }
  };

  async function updateNotificationPreferences(
    hid: string, prefs?: string[]
  ): Promise<{ error?: any }> {
    const list = prefs ?? DEFAULT_NOTIFICATION_PREFS;
    const { error } = await supabase
      .from("notification_preferences")
      .update({
        expiring_items: list.includes("expiry"),
        shopping_list_updates: list.includes("shopping"),
        low_stock_consumables: list.includes("nightCheckup"),
        daily_summary: list.includes("recipes")
      })
      .eq("home_id", hid);
    return { error };
  }

  const resetOnboarding = async () => {
    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: false })
          .eq("user_id", user.id);
      } catch (err) {
        console.error("Error resetting onboarding:", err);
      }
    }
    setOnboardingData(buildDefaultOnboarding({}));
    setOnboardingCompleted(false);
  };

  const updateProfile = async (data: Partial<OnboardingData>) => {
    if (!user || !homeId) {
      setOnboardingData((prev) => buildDefaultOnboarding({ ...(prev ?? {}), ...data }));
      return;
    }
    try {
      const jobs: Promise<any>[] = [];
      const profilePatch: any = {};
      const homePatch: any = {};
      const settingsPatch: any = {};

      if (data.name !== undefined) profilePatch.name = data.name;
      if (data.avatarUrl !== undefined) profilePatch.avatar_url = data.avatarUrl;
      if ((data as any).cpf !== undefined && !onboardingData?.cpf) {
        const raw = String((data as any).cpf || "").replace(/\D/g, "");
        if (raw.length > 0) {
          const { data: existing } = await supabase
            .from("profiles").select("user_id").eq("cpf", raw).maybeSingle();
          if (existing && (existing as any).user_id !== user.id) {
            const msg = language === "pt-BR"
              ? "Este CPF já está cadastrado em outra conta."
              : "This CPF is already registered with another account.";
            toast({ title: "CPF Duplicado", description: msg, variant: "destructive" });
            throw new Error(msg);
          }
        }
        profilePatch.cpf = raw.length > 0 ? raw : null;
      }

      if (data.homeType !== undefined) homePatch.home_type = data.homeType;
      if (data.residents !== undefined) homePatch.residents = data.residents;

      if (data.fridgeType !== undefined) settingsPatch.fridge_type = data.fridgeType;
      if (data.fridgeBrand !== undefined) settingsPatch.fridge_brand = data.fridgeBrand;
      if (data.coolingLevel !== undefined) settingsPatch.cooling_level = data.coolingLevel;
      if (data.habits !== undefined) settingsPatch.habits = data.habits;
      if (data.hiddenSections !== undefined) settingsPatch.hidden_sections = data.hiddenSections;

      if (Object.keys(profilePatch).length) jobs.push(supabase.from("profiles").update(profilePatch).eq("user_id", user.id));
      if (Object.keys(homePatch).length) jobs.push(supabase.from("homes").update(homePatch).eq("id", homeId));
      if (Object.keys(settingsPatch).length) jobs.push(supabase.from("home_settings").update(settingsPatch).eq("home_id", homeId));
      if (data.notificationPrefs !== undefined) jobs.push(updateNotificationPreferences(homeId, data.notificationPrefs));

      const results = await Promise.all(jobs);
      const err = results.find((r: any) => r?.error)?.error;
      if (err) throw err;

      setOnboardingData((prev) => buildDefaultOnboarding({ ...(prev ?? {}), ...data }));
    } catch (err) {
      showError("Erro ao atualizar perfil", err);
    }
  };

  const dismissAlert = (id: string) =>
    setAlerts((prev) => prev.filter((a) => a.id !== id));

  const addItemHistory = (
    itemId: string, itemName: string,
    action: "added" | "consumed" | "cooked" | "discarded",
    quantity: number, unit?: string
  ) => {
    setItemHistory((prev) => [
      ...prev,
      { itemId, itemName, action, quantity, unit,
        timestamp: new Date(),
        user: onboardingData?.name || "Usuário" }
    ]);
    // Persistência opcional no DB — fire-and-forget
    if (user && homeId && !itemId.startsWith("demo-")) {
      void supabase.from("item_history").insert({
        home_id: homeId,
        item_id: itemId,
        item_name: itemName,
        action,
        quantity,
        unit,
        user_id: user.id,
        user_name: onboardingData?.name || null
      });
    }
  };

  const defrostItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newExpiration = new Date();
    newExpiration.setDate(newExpiration.getDate() + 3);
    await updateItem(id, { location: "fridge", expirationDate: newExpiration });
    setDefrostTimers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), itemId: id, itemName: item.name,
        startedAt: new Date(), estimatedMinutes: 120 }
    ]);
    toast({
      title: language === "pt-BR" ? "Degelo iniciado" : "Defrost started",
      description: language === "pt-BR"
        ? `${item.name} movido para a geladeira. Um lembrete será enviado em 2 horas.`
        : `${item.name} moved to the fridge. Reminder in 2 hours.`
    });
  };

  const refreshData = async () => { await fetchData(); };

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => (prev ? { ...prev, ...data } : null));
    if (user) updateProfile(data).catch((e) => console.error("auto-save:", e));
  };

  return (
    <KazaContext.Provider
      value={{
        items, shoppingList, consumables, defrostTimers, alerts,
        onboardingData, isOnboarded: onboarding_completed, onboarding_completed,
        itemHistory, loading, homeId,
        addItem, updateItem, removeItem,
        addToShoppingList, toggleShoppingItem, removeFromShoppingList,
        updateShoppingItemQuantity,
        addConsumable, updateConsumable, removeConsumable,
        clearConsumables, setConsumablesBulk,
        markAllShoppingComplete, clearAllShoppingList,
        completeOnboarding, resetOnboarding, updateProfile, updateOnboardingData,
        defrostItem, dismissAlert, addItemHistory,
        toggleSection: async (id: string) => {
          if (!onboardingData) return;
          const current = onboardingData.hiddenSections || [];
          const next = current.includes(id)
            ? current.filter((x) => x !== id)
            : [...current, id];
          await updateProfile({ hiddenSections: next });
        },
        isSectionHidden: (id: string) =>
          onboardingData?.hiddenSections?.includes(id) || false,
        refreshData,
        favoriteRecipes, mealPlan,
        toggleFavoriteRecipe, addToMealPlan, removeFromMealPlan
      }}
    >
      {children}
    </KazaContext.Provider>
  );
}

export function useKaza() {
  const context = useContext(KazaContext);
  if (!context) throw new Error("useKaza must be used within a KazaProvider");
  return context;
}
