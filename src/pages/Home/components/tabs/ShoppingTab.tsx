/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { useKaza } from "@/contexts/KazaContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  Store,
  Flower,
  Pill,
  Loader2,
  Sparkles,
  Minus,
  ChevronDown,
  ChevronUp,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  CheckSquare,
  AlertTriangle,
  Share2,
  Save,
  Pencil,
  X,
  SlidersHorizontal,
  Bell,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { searchProducts, ProductSuggestion } from "@/data/productDatabase";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notifyHomeMembers } from "@/lib/pushNotifications";
import { allRecipes } from "@/data/recipeDatabase";
import { Calendar, Utensils, Zap } from "lucide-react";
import { useAchievements } from "@/contexts/AchievementsContext";

export function ShoppingTab() {
  const {
    items,
    shoppingList,
    consumables,
    addToShoppingList,
    toggleShoppingItem,
    removeFromShoppingList,
    updateShoppingItemQuantity,
    onboardingData,
    markAllShoppingComplete,
    clearAllShoppingList,
    homeId,
    isSubAccount
  } = useKaza();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { recordShoppingCompletion, recordShare } = useAchievements();
  const [activeFilter, setActiveFilter] = useState("all");
  const [newItem, setNewItem] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSavedLists, setShowSavedLists] = useState(false);
  const [savedLists, setSavedLists] = useState<Array<{ id: string; date: string; name?: string; items: Array<{ name: string; quantity?: number; unit?: string; store?: string }> }>>([]);
  const [newItemUnit, setNewItemUnit] = useState("un");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemStore, setNewItemStore] = useState<"market" | "fair" | "pharmacy" | "other">("market");
  const [showFilters, setShowFilters] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isNotifying, setIsNotifying] = useState(false);
  const [daysHorizon, setDaysHorizon] = useState<3 | 7 | 15>(7);

  const labels = {
    "pt-BR": {
      title: "Lista de Compras",
      pending: "pendentes",
      bought: "comprados",
      generateAI: "Gerar sugestões para hoje",
      generating: "Analisando estoque...",
      lowStockCount: "itens em estoque baixo",
      analyzeStock: "Sugere itens com base no que está acabando",
      addPlaceholder: "Adicionar item...",
      emptyList: "Lista vazia",
      emptyDesc: "Adicione itens ou peça sugestões",
      itemAdded: "Item adicionado à lista",
      tooManyReq: "Muitas requisições. Tente novamente em alguns segundos.",
      aiSuggested: "itens sugeridos com base no estoque!",
      listUpdated: "Lista atualizada com itens em falta",
      all: "Todos",
      market: "Mercado",
      fair: "Feira",
      pharmacy: "Farmácia",
      marketEmoji: "🛒 Mercado",
      fairEmoji: "🌿 Feira",
      pharmacyEmoji: "💊 Farmácia",
      groupBy: "Agrupar",
      flat: "Lista",
      selectAll: "Selecionar todos",
      payList: "Guardar lista",
      allBought: "Lista salva!",
      deleteAll: "Apagar tudo",
      confirmDeleteAll: "Tem certeza? Todos os itens serão removidos.",
      allDeleted: "Todos os itens foram removidos!",
      shareWhatsApp: "Compartilhar no WhatsApp",
      filters: "Filtros",
    },
    en: {
      title: "Shopping List",
      pending: "pending",
      bought: "bought",
      generateAI: "Get shopping suggestions",
      generating: "Analyzing stock...",
      lowStockCount: "low stock items",
      analyzeStock: "Suggests items based on what's running low",
      addPlaceholder: "Add item...",
      emptyList: "Empty list",
      emptyDesc: "Add items or get suggestions",
      itemAdded: "Item added to list",
      tooManyReq: "Too many requests. Try again in a few seconds.",
      aiSuggested: "items suggested based on stock!",
      listUpdated: "List updated with missing items",
      all: "All",
      market: "Market",
      fair: "Fair",
      pharmacy: "Pharmacy",
      marketEmoji: "🛒 Market",
      fairEmoji: "🌿 Fair",
      pharmacyEmoji: "💊 Pharmacy",
      groupBy: "Group",
      flat: "List",
      selectAll: "Select all",
      payList: "Save list",
      allBought: "List saved!",
      deleteAll: "Delete all",
      confirmDeleteAll: "Are you sure? All items will be removed.",
      allDeleted: "All items removed!",
      shareWhatsApp: "Share on WhatsApp",
      filters: "Filters",
    },
    es: {
      title: "Lista de Compras",
      pending: "pendientes",
      bought: "comprados",
      generateAI: "Generar lista con IA",
      generating: "Generando lista...",
      lowStockCount: "artículos con stock bajo",
      analyzeStock: "Analiza tu stock y sugiere compras",
      addPlaceholder: "Agregar artículo...",
      emptyList: "Lista vacía",
      emptyDesc: "Agrega artículos o genera con IA",
      itemAdded: "Artículo agregado a la lista",
      tooManyReq: "Demasiadas solicitudes. Intenta de nuevo en unos segundos.",
      aiSuggested: "artículos sugeridos por IA!",
      listUpdated: "Lista actualizada con artículos faltantes",
      all: "Todos",
      market: "Mercado",
      fair: "Feria",
      pharmacy: "Farmacia",
      marketEmoji: "🛒 Mercado",
      fairEmoji: "🌿 Feria",
      pharmacyEmoji: "💊 Farmacia",
      groupBy: "Agrupar",
      flat: "Lista",
      selectAll: "Seleccionar todos",
      payList: "Guardar lista",
      allBought: "¡Lista guardada!",
      deleteAll: "Eliminar todo",
      confirmDeleteAll: "¿Estás seguro? Todos los artículos serán eliminados.",
      allDeleted: "¡Todos los artículos eliminados!",
      shareWhatsApp: "Compartir en WhatsApp",
      filters: "Filtros",
    }
  };

  const l = labels[language];

  const storeFilters = [
    { id: "all", label: l.all, icon: ShoppingCart },
    { id: "market", label: l.market, icon: Store },
    { id: "fair", label: l.fair, icon: Flower },
    { id: "pharmacy", label: l.pharmacy, icon: Pill }
  ];

  const storeCategoryLabels: Record<string, Record<string, string>> = {
    market: { "pt-BR": "🛒 Mercado", en: "🛒 Market", es: "🛒 Mercado" },
    fair: { "pt-BR": "🌿 Feira", en: "🌿 Fair", es: "🌿 Feria" },
    pharmacy: { "pt-BR": "💊 Farmácia", en: "💊 Pharmacy", es: "💊 Farmacia" },
    other: { "pt-BR": "📦 Outros", en: "📦 Other", es: "📦 Otros" }
  };

  useEffect(() => {
    const results = searchProducts(newItem);
    setSuggestions(results);
    setShowSuggestions(results.length > 0 && newItem.length > 0);
  }, [newItem]);

  const lowStockItems = items.filter(
    (item) => item.minStock && item.quantity <= item.minStock
  );
  const filteredList = shoppingList.filter(
    (item) => activeFilter === "all" || item.store === activeFilter
  );
  const completedCount = shoppingList.filter((i) => i.isCompleted).length;
  const pendingCount = shoppingList.filter((i) => !i.isCompleted).length;

  // Group items by store category
  const groupedList = filteredList.reduce((acc, item) => {
    const key = item.store || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof filteredList>);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadSavedLists = async () => {
    if (!user || !homeId) { setSavedLists([]); return; }
    const { data } = await supabase
      .from("saved_shopping_lists")
      .select("id, name, items, created_at")
      .eq("home_id", homeId)
      .order("created_at", { ascending: false })
      .limit(20);
    setSavedLists(
      (data || []).map((row: any) => ({
        id: row.id,
        date: row.created_at,
        name: row.name,
        items: Array.isArray(row.items) ? row.items : [],
      }))
    );
  };

  const handleSaveList = async () => {
    if (!user || !homeId) {
      toast.error(language === "pt-BR" ? "Faça login para salvar listas" : "Login to save lists");
      return;
    }
    const items = shoppingList.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit, store: i.store }));
    const { error } = await supabase.from("saved_shopping_lists").insert({
      home_id: homeId,
      user_id: user.id,
      name: new Date().toLocaleDateString(),
      items,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await markAllShoppingComplete();
    recordShoppingCompletion();
    toast.success(l.allBought);
  };

  const handleLoadSavedList = (list: typeof savedLists[0]) => {
    list.items.forEach(item => {
      const store = (item.store as any) || "market";
      addToShoppingList({
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || "un",
        category: store === "pharmacy" ? "hygiene" : store === "fair" ? "vegetable" : "pantry",
        store,
      });
    });
    setShowSavedLists(false);
    toast.success(language === "pt-BR" ? "Lista carregada!" : language === "es" ? "¡Lista cargada!" : "List loaded!");
  };

  const handleDeleteSavedList = async (id: string) => {
    if (!homeId) return;
    await supabase.from("saved_shopping_lists").delete().eq("id", id).eq("home_id", homeId);
    setSavedLists(prev => prev.filter(l => l.id !== id));
  };

  const handleShareWhatsApp = () => {
    const pending = shoppingList.filter(i => !i.isCompleted);
    if (pending.length === 0) { toast.info(language === "pt-BR" ? "Lista vazia" : "Empty list"); return; }
    recordShare();
    const text = pending.map(i => `• ${i.name}${i.quantity ? ` (${i.quantity} ${i.unit || ''})` : ''}`).join('\n');
    const msg = encodeURIComponent(`🛒 *Lista de Compras*\n\n${text}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleNotifyGroup = async () => {
    if (!homeId || !user) return;
    
    setIsNotifying(true);
    const profile = await supabase.from("profiles").select("name").eq("user_id", user.id).single();
    const userName = profile.data?.name || (language === "pt-BR" ? "Alguém" : "Someone");
    
    const result = await notifyHomeMembers({
      home_id: homeId,
      title: language === "pt-BR" ? "🛒 Lista de Compras!" : "🛒 Shopping List!",
      body: language === "pt-BR" 
        ? `${userName} atualizou a lista. Alguém pode passar no mercado?`
        : `${userName} updated the list. Can someone stop by the market?`,
      exclude_user_id: user.id
    });

    if (result.success) {
      toast.success(language === "pt-BR" ? "Casa notificada! 🔔" : "Home notified! 🔔");
    } else {
      // Se for apenas o aviso de que não tem membros, usamos o toast comum, senão erro.
      const msg = result.error || (language === "pt-BR" ? "Erro ao notificar grupo" : "Error notifying home");
      if (result.error?.includes("membros")) {
        toast(msg);
      } else {
        toast.error(msg);
      }
    }
    setIsNotifying(false);
  };

  const handleAddItem = (product?: ProductSuggestion) => {
    const itemName = product?.name || newItem.trim();
    if (!itemName) return;

    // A categoria selecionada nos chips (newItemStore) é a fonte de verdade para itens manuais.
    // Se for um produto sugerido, ele traz sua própria categoria, mas se o usuário mudou o chip, respeitamos.
    const chosenStore = product?.category || newItemStore;
    const parsedQty = parseFloat(newItemQty.replace(',', '.'));
    
    addToShoppingList({
      name: itemName,
      category:
        chosenStore === "pharmacy" ? "hygiene" :
          chosenStore === "fair" ? "vegetable" : "pantry",
      quantity: product?.defaultQuantity || (Number.isFinite(parsedQty) ? parsedQty : 1),
      unit: product?.unit || newItemUnit,
      store: chosenStore
    });
    
    setNewItem("");
    setNewItemQty("1");
    setShowSuggestions(false);
    toast.success(l.itemAdded);
  };

  const handleGenerateSmartList = async () => {
    // Rate limit check
    const rl = checkRateLimit(
      "shoppingList",
      RATE_LIMITS.shoppingList.maxRequests,
      RATE_LIMITS.shoppingList.windowMs
    );
    if (!rl.allowed) {
      toast.error(l.tooManyReq);
      return;
    }

    setIsGenerating(true);

    // Artificial delay to make it feel like AI is working
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Local analysis — instant, offline, no AI cost
    const suggestedItems: any[] = [];
    const residents = onboardingData?.residents || 1;
    const habits = onboardingData?.habits || [];
    const homeType = onboardingData?.homeType || "apartment";
    
    // Fator de escala baseado no horizonte de dias (base era 3 dias)
    const timeScale = daysHorizon / 3;
    const scaleFactor = residents * timeScale;

    lowStockItems.forEach((item) => {
      suggestedItems.push({
        name: item.name,
        quantity: Math.ceil((item.minStock || 1) * 2 * scaleFactor),
        unit: item.unit,
        store:
          item.category === "fruit" || item.category === "vegetable"
            ? "fair"
            : "market"
      });
    });

    const itemsToRestock = Array.isArray(consumables)
      ? consumables.filter((c) => {
        const daysLeft =
          c.dailyConsumption > 0 ? c.currentStock / c.dailyConsumption : 100;
        return daysLeft <= 3;
      })
      : [];

    itemsToRestock.forEach((item) => {
      suggestedItems.push({
        name: item.name,
        quantity: Math.ceil(item.minStock * 3 * scaleFactor),
        unit: item.unit,
        store: item.category === "hygiene" ? "pharmacy" : "market"
      });
    });

    const expiringItems = items.filter((item) => {
      if (!item.expirationDate) return false;
      const daysLeft = Math.ceil(
        (new Date(item.expirationDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 2 && daysLeft >= 0;
    });
    expiringItems.forEach((item) => {
      const exists = suggestedItems.some(
        (s) => s.name.toLowerCase() === item.name.toLowerCase()
      );
      if (!exists) {
        suggestedItems.push({
          name: item.name,
          quantity: Math.max(1, Math.ceil(scaleFactor)),
          unit: item.unit,
          store:
            item.category === "fruit" || item.category === "vegetable"
              ? "fair"
              : "market"
        });
      }
    });

    // ── Lifestyle staples based on habits ──────────────────────────────────
    type SuggestedItem = {
      name: string;
      quantity: number;
      unit: string;
      store: string;
    };
    const lifestyleItems: SuggestedItem[] = [];

    // Everyone cooking daily or feeding a family → pantry essentials
    if (
      habits.includes("cook-daily") ||
      habits.includes("family") ||
      residents >= 2
    ) {
      lifestyleItems.push(
        {
          name: language === "pt-BR" ? "Arroz" : "Rice",
          quantity: Math.ceil(residents * 0.5 * timeScale),
          unit: "kg",
          store: "market"
        },
        {
          name: language === "pt-BR" ? "Feijão" : "Beans",
          quantity: Math.ceil(residents * 0.3 * timeScale),
          unit: "kg",
          store: "market"
        },
        {
          name: language === "pt-BR" ? "Óleo de soja" : "Cooking oil",
          quantity: 1,
          unit: language === "pt-BR" ? "un" : "btl",
          store: "market"
        },
        {
          name: language === "pt-BR" ? "Cebola" : "Onion",
          quantity: Math.ceil(residents * 2 * timeScale),
          unit: language === "pt-BR" ? "un" : "un",
          store: "fair"
        },
        {
          name: language === "pt-BR" ? "Alho" : "Garlic",
          quantity: 1,
          unit: language === "pt-BR" ? "cabeça" : "head",
          store: "fair"
        }
      );
    }

    // Diet or healthy lifestyle → fresh produce and proteins
    if (habits.includes("diet") || habits.includes("healthy")) {
      lifestyleItems.push(
        {
          name: language === "pt-BR" ? "Peito de frango" : "Chicken breast",
          quantity: Math.ceil(residents * 0.5 * timeScale),
          unit: "kg",
          store: "market"
        },
        {
          name: language === "pt-BR" ? "Brócolis" : "Broccoli",
          quantity: Math.ceil(residents * 0.5 * timeScale),
          unit: "kg",
          store: "fair"
        },
        {
          name: language === "pt-BR" ? "Iogurte natural" : "Plain yogurt",
          quantity: Math.ceil(residents * timeScale),
          unit: language === "pt-BR" ? "un" : "un",
          store: "market"
        },
        {
          name: language === "pt-BR" ? "Frutas variadas" : "Mixed fruits",
          quantity: Math.ceil(residents * 3 * timeScale),
          unit: language === "pt-BR" ? "un" : "un",
          store: "fair"
        },
        {
          name: language === "pt-BR" ? "Aveia" : "Oats",
          quantity: 1,
          unit: language === "pt-BR" ? "pct" : "pkg",
          store: "market"
        }
      );
    }

    // Meal prep → bulk cooking ingredients
    if (habits.includes("meal-prep")) {
      lifestyleItems.push(
        {
          name: language === "pt-BR" ? "Batata-doce" : "Sweet potato",
          quantity: Math.ceil(residents * 3 * timeScale),
          unit: language === "pt-BR" ? "un" : "un",
          store: "fair"
        },
        {
          name: language === "pt-BR" ? "Ovo" : "Eggs",
          quantity: Math.ceil(residents * 6 * timeScale),
          unit: language === "pt-BR" ? "un" : "un",
          store: "market"
        },
        {
          name: language === "pt-BR" ? "Cenoura" : "Carrot",
          quantity: Math.ceil(residents * 3 * timeScale),
          unit: language === "pt-BR" ? "un" : "un",
          store: "fair"
        }
      );
    }

    // Quick meals → easy-to-use items
    if (habits.includes("quick-meals")) {
      lifestyleItems.push(
        {
          name: language === "pt-BR" ? "Ovos" : "Eggs",
          quantity: Math.ceil(residents * 4 * timeScale),
          unit: language === "pt-BR" ? "un" : "un",
          store: "market"
        },
        {
          name: language === "pt-BR" ? "Queijo prato" : "Sliced cheese",
          quantity: 1,
          unit: language === "pt-BR" ? "pct" : "pkg",
          store: "market"
        },
        {
          name: language === "pt-BR" ? "Pão de forma" : "Bread loaf",
          quantity: 1,
          unit: language === "pt-BR" ? "un" : "un",
          store: "market"
        }
      );
    }

    // Large household (3+) → extra staples
    if (residents >= 3) {
      lifestyleItems.push(
        {
          name: language === "pt-BR" ? "Leite integral" : "Whole milk",
          quantity: Math.ceil(residents * timeScale),
          unit: language === "pt-BR" ? "L" : "L",
          store: "market"
        },
        {
          name: language === "pt-BR" ? "Macarrão" : "Pasta",
          quantity: Math.ceil(residents * 0.25 * timeScale),
          unit: "kg",
          store: "market"
        }
      );
    }

    // House (not apartment) → cleaning supplies
    if (homeType === "house") {
      lifestyleItems.push(
        {
          name: language === "pt-BR" ? "Detergente" : "Dish soap",
          quantity: 2,
          unit: language === "pt-BR" ? "un" : "un",
          store: "market"
        },
        {
          name: language === "pt-BR" ? "Esponja de limpeza" : "Cleaning sponge",
          quantity: 2,
          unit: language === "pt-BR" ? "un" : "un",
          store: "market"
        }
      );
    }

    // 2. Ingredients from Planning & Favorites
    const recipeIngredients: string[] = [];
    (mealPlan || []).forEach(entry => {
        const recipe = allRecipes.find(r => r.id === entry.recipe_id);
        if (recipe) recipeIngredients.push(...recipe.ingredients);
    });
    (favoriteRecipes || []).slice(0, 3).forEach(recipeId => {
        const recipe = allRecipes.find(r => r.id === recipeId);
        if (recipe) recipeIngredients.push(...recipe.ingredients);
    });

    const uniqueRecipeIngredients = Array.from(new Set(recipeIngredients));
    uniqueRecipeIngredients.forEach(ing => {
        lifestyleItems.push({
            name: ing.charAt(0).toUpperCase() + ing.slice(1),
            quantity: Math.ceil(timeScale),
            unit: "un",
            store: "market"
        });
    });

    // Add lifestyle items that aren't already in the list or suggested
    lifestyleItems.forEach((item) => {
      const alreadySuggested = suggestedItems.some(
        (s) => s.name.toLowerCase() === item.name.toLowerCase()
      );
      const alreadyInList = shoppingList.some(
        (s) => s.name.toLowerCase() === item.name.toLowerCase()
      );
      if (!alreadySuggested && !alreadyInList) {
        suggestedItems.push(item);
      }
    });
    // ──────────────────────────────────────────────────────────────────────

    let addedCount = 0;
    suggestedItems.forEach((item) => {
      const exists = shoppingList.some(
        (s) => s.name.toLowerCase() === item.name.toLowerCase()
      );
      if (!exists) {
        addToShoppingList({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.store === "pharmacy" ? "hygiene" : "pantry",
          store: item.store
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`${addedCount} ${l.aiSuggested}`);
    } else {
      toast.info(
        language === "pt-BR"
          ? "Seu estoque está em dia!"
          : "Your stock is up to date!"
      );
    }
    setIsGenerating(false);
  };

  const getStoreLabel = (store: string) => {
    if (store === "market") return l.marketEmoji;
    if (store === "fair") return l.fairEmoji;
    return l.pharmacyEmoji;
  };

  const renderItem = (item: (typeof filteredList)[0], index: number) => (
    <div
      key={item.id}
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border bg-white/80 dark:bg-white/5 backdrop-blur-xl border-black/[0.04] dark:border-white/[0.06] p-3 transition-all duration-300 shadow-sm",
        item.isCompleted && "opacity-60"
      )}
    >
      <button
        onClick={() => toggleShoppingItem(item.id)}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-90"
        )}
        style={{
          borderColor: "#165A52",
          background: item.isCompleted ? "#165A52" : "transparent",
          color: "#fff"
        }}
      >
        {item.isCompleted && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold text-foreground transition-all",
            item.isCompleted && "line-through text-muted-foreground"
          )}
        >
          {item.name}
        </p>
        <p className="text-[10px] text-muted-foreground">{item.unit}</p>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => {
            const currentQty = item.quantity || 1;
            if (currentQty > 1)
              updateShoppingItemQuantity(item.id, currentQty - 1);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all active:scale-90"
        >
          <Minus className="h-3 w-3" />
        </button>
        <div className="w-8 text-center">
          <span className="text-xs font-bold text-foreground">
            {item.quantity || 1}
          </span>
        </div>
        <button
          onClick={() =>
            updateShoppingItemQuantity(item.id, (item.quantity || 1) + 1)
          }
          className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all active:scale-90"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {!isSubAccount && <button
        onClick={() => removeFromShoppingList(item.id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all active:bg-destructive/10 active:text-destructive active:scale-90"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>}
    </div>
  );

  return (
    <div className="space-y-4 pb-nav-safe">
      <div className="flex items-center justify-between pt-2">
        <div className="hidden">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {l.title}
          </h1>
        </div>
      </div>

      {/* Smart Suggestions Control Center */}
      <div className="mb-4 p-4 rounded-3xl bg-[#F7F6F3] dark:bg-white/5 border border-[#E2E1DC] dark:border-white/10 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#165A52]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Período de compras</span>
          </div>
          <div className="flex bg-black/[0.05] dark:bg-white/10 p-1 rounded-xl gap-1">
            {([3, 7, 15] as const).map(d => (
              <button
                key={d}
                onClick={() => setDaysHorizon(d)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                  daysHorizon === d 
                    ? "bg-white dark:bg-[#165A52] text-[#165A52] dark:text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {d === 15 ? '15d' : d === 7 ? '1 sem' : '3d'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerateSmartList}
          disabled={isGenerating}
          className="w-full group relative flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-white/[0.02] border border-[#E2E1DC] dark:border-white/10 transition-all hover:shadow-md active:scale-[0.98] overflow-hidden"
        >
          <div className="h-12 w-12 rounded-xl bg-[#165A52]/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#165A52]" />
            ) : (
              <Sparkles className="h-5 w-5 text-[#165A52]" />
            )}
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-black text-foreground group-hover:text-[#165A52] transition-colors">
              {isGenerating ? l.generating : l.generateAI}
            </h4>
            <p className="text-[11px] font-medium text-muted-foreground">
              {l.analyzeStock}
            </p>
          </div>
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-black/5 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Zap className="h-3 w-3 text-[#165A52]" />
          </div>
          {isGenerating && (
            <div className="absolute bottom-0 left-0 h-1 bg-[#165A52] animate-progress-indeterminate w-full" />
          )}
        </button>
      </div>
      {pendingCount > 0 && (
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2">
          <button
            onClick={() => {
              const pending = shoppingList.filter(i => !i.isCompleted);
              pending.forEach(i => toggleShoppingItem(i.id));
            }}
            className="flex items-center justify-center h-[52px] w-[52px] rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] text-primary transition-all active:scale-[0.95]"
            title={l.selectAll}
          >
            <CheckSquare className="h-5 w-5" />
          </button>

          <button
            onClick={handleSaveList}
            className="flex items-center justify-center gap-2 h-[52px] rounded-2xl text-white font-bold transition-all active:scale-[0.97] shadow-lg shadow-primary/20"
            style={{ background: "#165A52" }}
          >
            <Save className="h-5 w-5" />
            <span className="text-sm">{language === "pt-BR" ? "Concluir" : "Done"}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center h-[52px] w-[52px] rounded-2xl border border-black/[0.06] bg-white/80 dark:bg-white/5 transition-all active:scale-[0.95]"
            title={l.shareWhatsApp}
          >
            <Share2 className="h-5 w-5 text-[#25D366]" />
          </button>

          <button
            onClick={handleNotifyGroup}
            disabled={isNotifying}
            className={cn(
              "flex items-center justify-center h-[52px] w-[52px] rounded-2xl border border-black/[0.06] bg-white/80 dark:bg-white/5 transition-all active:scale-[0.95]",
              isNotifying && "opacity-50"
            )}
            title={language === "pt-BR" ? "Notificar Casa" : "Notify Home"}
          >
            <Bell className={cn("h-5 w-5 text-primary", isNotifying && "animate-pulse")} />
          </button>
        </div>
      )}

      {/* ── DELETE ALL + LISTAS SALVAS ── */}
      {shoppingList.length > 0 && (
        <div className="flex gap-2">
          {!isSubAccount && <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-destructive/10 text-destructive text-sm font-semibold transition-all active:scale-[0.97]"
            style={{ height: "48px" }}
          >
            <Trash2 className="h-4 w-4" />
            {l.deleteAll}
          </button>}
          <button
            onClick={() => { loadSavedLists(); setShowSavedLists(true); }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-white/5 text-foreground text-sm font-semibold transition-all active:scale-[0.97] px-4"
            style={{ height: "48px" }}
          >
            <Save className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">{language === "pt-BR" ? "Listas Salvas" : language === "es" ? "Listas Guardadas" : "Saved Lists"}</span>
          </button>
        </div>
      )}

      {/* ── SAVED LISTS MODAL ── */}
      {showSavedLists && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 animate-backdrop" onClick={() => setShowSavedLists(false)}>
          <div className="w-full max-w-lg rounded-t-3xl bg-[#fafafa] dark:bg-[#1a1a1a] p-6 pb-10 max-h-[80vh] overflow-y-auto animate-sheet-up" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {language === "pt-BR" ? "Listas Salvas" : language === "es" ? "Listas Guardadas" : "Saved Lists"}
              </h2>
              <button onClick={() => setShowSavedLists(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            {savedLists.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {language === "pt-BR" ? "Nenhuma lista salva ainda." : language === "es" ? "Ninguna lista guardada aún." : "No saved lists yet."}
              </p>
            ) : (
              <div className="space-y-3">
                {savedLists.map(list => (
                  <div key={list.id} className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                          {list.name || (language === "pt-BR" ? "Lista de compras" : language === "es" ? "Lista de compras" : "Shopping list")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(list.date).toLocaleDateString(language === "pt-BR" ? "pt-BR" : language === "es" ? "es-ES" : "en-US")} · {list.items.length} {language === "pt-BR" ? "itens" : language === "es" ? "artículos" : "items"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleLoadSavedList(list)}
                          className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-all active:scale-95"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {language === "pt-BR" ? "Carregar" : language === "es" ? "Cargar" : "Load"}
                        </button>
                        {!isSubAccount && <button
                          onClick={() => handleDeleteSavedList(list.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-all active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <DialogTitle className="text-center">{l.deleteAll}</DialogTitle>
            <DialogDescription className="text-center">
              {l.confirmDeleteAll}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 mt-2 w-full justify-center">
            <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs sm:text-sm font-semibold" onClick={() => setShowDeleteDialog(false)}>
              {language === 'en' ? 'Cancel' : language === 'es' ? 'Cancelar' : 'Cancelar'}
            </Button>
            <Button variant="destructive" className="flex-1 h-12 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-destructive/20" onClick={() => {
              clearAllShoppingList();
              toast.success(l.allDeleted);
              setShowDeleteDialog(false);
            }}>
              <Trash2 className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{l.deleteAll}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'market', 'fair', 'pharmacy', 'other'] as const).map(cat => {
              const isActive = cat === 'all' ? activeFilter === 'all' : activeFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveFilter(cat);
                    if (cat !== 'all') setNewItemStore(cat as any);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-white/80 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06] text-muted-foreground"
                  )}
                >
                  {cat === 'all' && <ShoppingCart className="h-3 w-3" />}
                  {cat === 'market' && <Store className="h-3 w-3" />}
                  {cat === 'fair' && <Flower className="h-3 w-3" />}
                  {cat === 'pharmacy' && <Pill className="h-3 w-3" />}
                  {cat === 'other' && <LayoutList className="h-3 w-3" />}
                  {cat === 'all' ? l.all : cat === 'market' ? l.market : cat === 'fair' ? l.fair : cat === 'pharmacy' ? l.pharmacy : 'Outros'}
                  {cat !== 'all' && (
                    <span className={cn(
                      "ml-1 rounded-full px-1 py-0.5 text-[8px]",
                      isActive ? "bg-white/20" : "bg-black/[0.04] dark:bg-white/10"
                    )}>
                      {shoppingList.filter(i => i.store === cat).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={l.addPlaceholder}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="flex-1 h-[52px] rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl text-sm transition-all focus:shadow-sm"
            />
            <Input
              inputMode="decimal"
              placeholder="Q.td"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              className="flex-shrink-0 h-[52px] w-[50px] text-center rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 text-sm font-bold transition-all focus:shadow-sm px-1 placeholder:font-normal placeholder:opacity-70"
            />
            <Select value={newItemUnit} onValueChange={setNewItemUnit}>
              <SelectTrigger className="h-[52px] w-[60px] rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 text-xs font-bold shrink-0 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="un">un</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="L">L</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="pct">pct</SelectItem>
                <SelectItem value="cx">cx</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleAddItem()}
              size="icon"
              className="rounded-2xl shadow-sm shadow-primary/25 transition-all active:scale-[0.97] shrink-0"
              style={{ height: "52px", width: "52px", background: "#165A52" }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {showSuggestions && (
          <div className="absolute left-0 right-12 z-50 mt-2 max-h-48 overflow-y-auto rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/90 dark:bg-card/90 backdrop-blur-2xl shadow-lg animate-fade-in">
            {suggestions.map((product, index) => (
              <button
                key={index}
                onClick={() => handleAddItem(product)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors active:bg-black/[0.03] dark:active:bg-white/[0.03] first:rounded-t-2xl last:rounded-b-2xl"
              >
                <span className="text-sm font-medium text-foreground">
                  {product.name}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground rounded-full bg-muted/50 px-2 py-0.5">
                  {getStoreLabel(product.category)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end mt-2">

        <button
          onClick={() => setGroupByCategory(!groupByCategory)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all active:scale-[0.97]",
            groupByCategory
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] text-foreground"
          )}
        >
          {groupByCategory ? (
            <LayoutGrid className="h-3.5 w-3.5" />
          ) : (
            <LayoutList className="h-3.5 w-3.5" />
          )}
          {groupByCategory ? l.groupBy : l.flat}
        </button>
      </div>

      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="mb-4 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] p-5">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground">{l.emptyList}</p>
          <p className="mt-1 text-sm text-muted-foreground">{l.emptyDesc}</p>
        </div>
      ) : groupByCategory ? (
        <div className="space-y-3">
          {Object.entries(groupedList).map(([storeKey, storeItems]) => (
            <section
              key={storeKey}
              className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggleGroup(storeKey)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-all active:bg-black/[0.03] dark:active:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">
                    {storeCategoryLabels[storeKey]?.[language] ||
                      storeCategoryLabels.other[language]}
                  </h2>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {storeItems.length}
                  </span>
                </div>
                {collapsedGroups[storeKey] ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {!collapsedGroups[storeKey] && (
                <div className="space-y-1.5 px-3 pb-3 pt-1">
                  {storeItems.map((item, index) => renderItem(item, index))}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredList.map((item, index) => renderItem(item, index))}
        </div>
      )}
    </div>
  );
}
