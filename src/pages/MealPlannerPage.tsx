import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useKaza } from "@/contexts/FriggoContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { allRecipes } from "@/data/recipeDatabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  ChefHat,
  Coffee,
  UtensilsCrossed,
  Moon,
  Cookie,
  Check,
  Clock,
  Bell,
  BellOff,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/PageTransition";

const MEAL_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  breakfast: { label: "Café", icon: Coffee, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  lunch: { label: "Almoço", icon: UtensilsCrossed, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  dinner: { label: "Jantar", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
  snack: { label: "Lanche", icon: Cookie, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
};

export default function MealPlannerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToMealPlan } = useKaza();
  const { isMultiPro } = useSubscription();

  const dateParam = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [addedRecipes, setAddedRecipes] = useState<Set<string>>(new Set());

  // Bottom sheet state
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingMeal, setPendingMeal] = useState<{
    recipeId: string;
    recipeName: string;
    mealType: string;
  } | null>(null);
  const [plannedTime, setPlannedTime] = useState("");
  const [notifyMembers, setNotifyMembers] = useState(true);

  const dateLabel = (() => {
    try {
      return format(new Date(dateParam + "T00:00:00"), "eeee, dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateParam;
    }
  })();

  const filteredRecipes = allRecipes
    .filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 30);

  const handleAddMeal = (recipeId: string, recipeName: string, mealType: string) => {
    setPendingMeal({ recipeId, recipeName, mealType });
    setPlannedTime("");
    setNotifyMembers(true);
    setShowSheet(true);
  };

  const handleConfirmMeal = async () => {
    if (!pendingMeal || saving) return;
    setSaving(true);
    try {
      await addToMealPlan({
        recipe_id: pendingMeal.recipeId,
        recipe_name: pendingMeal.recipeName,
        planned_date: dateParam,
        meal_type: pendingMeal.mealType as any,
        planned_time: plannedTime || undefined,
        notify_members: notifyMembers,
      });
      setAddedRecipes((prev) => new Set(prev).add(`${pendingMeal.recipeId}-${pendingMeal.mealType}`));
      setShowSheet(false);
      setPendingMeal(null);
    } catch {
      toast.error("Erro ao salvar refeição. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const mealCfg = pendingMeal ? MEAL_CONFIG[pendingMeal.mealType] : null;
  const MealIcon = mealCfg?.icon;

  return (
    <PageTransition direction="left" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fafafa]/90 dark:bg-[#091f1c]/90 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06] px-4 h-16 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-foreground transition-all active:scale-90 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground">Planejar refeição</h1>
          <p className="text-xs text-muted-foreground capitalize truncate">{dateLabel}</p>
        </div>
      </header>

      {/* Meal Type Filter */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedMealType(null)}
          className={cn(
            "h-9 px-4 rounded-full text-[12px] font-bold shrink-0 transition-all border",
            !selectedMealType
              ? "bg-primary text-white border-transparent shadow-md"
              : "bg-white dark:bg-white/5 text-muted-foreground border-black/[0.06] dark:border-white/[0.08]"
          )}
        >
          Todos
        </button>
        {Object.entries(MEAL_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={type}
              onClick={() => setSelectedMealType(selectedMealType === type ? null : type)}
              className={cn(
                "h-9 px-4 rounded-full text-[12px] font-bold shrink-0 transition-all flex items-center gap-1.5 border",
                selectedMealType === type
                  ? `${cfg.bg} ${cfg.color} border-current/20 shadow-sm`
                  : "bg-white dark:bg-white/5 text-muted-foreground border-black/[0.06] dark:border-white/[0.08]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar receitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-white dark:bg-white/[0.05] border-black/[0.06] dark:border-white/[0.08] focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Recipes List */}
      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-3">
        {filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ChefHat className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-bold text-muted-foreground">Nenhuma receita encontrada.</p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-[1.5rem] bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.08] overflow-hidden shadow-sm"
            >
              {/* Recipe header */}
              <div
                className="flex items-center gap-3 px-4 py-4 cursor-pointer active:bg-black/[0.02]"
                onClick={() => navigate(`/app/recipe/${recipe.id}`, { state: { recipe } })}
              >
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary/10 shrink-0 overflow-hidden">
                  {recipe.image ? (
                    <img src={recipe.image} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <ChefHat className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-foreground truncate">{recipe.name}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider opacity-60">
                    {recipe.category || "Receita"}
                  </p>
                </div>
              </div>

              {/* Meal type buttons */}
              {(!selectedMealType ? Object.entries(MEAL_CONFIG) : [[selectedMealType, MEAL_CONFIG[selectedMealType]]]).map(
                ([type, cfg]: any) => {
                  const Icon = cfg.icon;
                  const added = addedRecipes.has(`${recipe.id}-${type}`);
                  return (
                    <button
                      key={type}
                      onClick={() => !added && handleAddMeal(recipe.id, recipe.name, type)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 border-t border-black/[0.03] dark:border-white/[0.04] transition-all active:bg-black/[0.02]",
                        added && "opacity-50 cursor-default"
                      )}
                    >
                      <div className={cn("h-8 w-8 flex items-center justify-center rounded-xl border", cfg.bg, "shrink-0")}>
                        {added ? <Check className={cn("h-4 w-4", cfg.color)} /> : <Icon className={cn("h-4 w-4", cfg.color)} />}
                      </div>
                      <span className={cn("text-sm font-bold", cfg.color)}>
                        {added ? `${cfg.label} adicionado` : `Adicionar ao ${cfg.label}`}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Schedule Bottom Sheet ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
              onClick={() => !saving && setShowSheet(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.8 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-[#fafafa] dark:bg-[#0d2820] shadow-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/10" />
              </div>

              {/* Close button */}
              <button
                onClick={() => !saving && setShowSheet(false)}
                className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="px-6 pb-8 pt-2 space-y-5">
                {/* Recipe + meal type label */}
                {pendingMeal && mealCfg && MealIcon && (
                  <div className="flex items-center gap-3">
                    <div className={cn("h-11 w-11 flex items-center justify-center rounded-2xl border", mealCfg.bg)}>
                      <MealIcon className={cn("h-5 w-5", mealCfg.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-foreground truncate">{pendingMeal.recipeName}</p>
                      <p className={cn("text-xs font-semibold", mealCfg.color)}>{mealCfg.label}</p>
                    </div>
                  </div>
                )}

                {/* Time picker */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" />
                    Horário (opcional)
                  </label>
                  <input
                    type="time"
                    value={plannedTime}
                    onChange={(e) => setPlannedTime(e.target.value)}
                    className="w-full h-13 bg-black/[0.04] dark:bg-white/[0.06] border-none rounded-xl text-base font-bold px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Notify members toggle — only for multiPRO */}
                {isMultiPro && (
                  <button
                    onClick={() => setNotifyMembers((v) => !v)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-2xl px-4 py-4 transition-all border-2",
                      notifyMembers
                        ? "bg-primary/5 border-primary/20"
                        : "bg-black/[0.03] dark:bg-white/[0.03] border-transparent"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 flex items-center justify-center rounded-xl shrink-0",
                      notifyMembers ? "bg-primary/10" : "bg-black/5 dark:bg-white/5"
                    )}>
                      {notifyMembers
                        ? <Bell className="h-4 w-4 text-primary" />
                        : <BellOff className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="text-left flex-1">
                      <p className={cn("text-sm font-bold", notifyMembers ? "text-primary" : "text-muted-foreground")}>
                        Notificar membros
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notifyMembers ? "Todos serão avisados desta refeição" : "Sem notificação"}
                      </p>
                    </div>
                    {/* Toggle pill */}
                    <div className={cn(
                      "w-12 h-6 rounded-full transition-colors shrink-0 relative",
                      notifyMembers ? "bg-primary" : "bg-black/10 dark:bg-white/10"
                    )}>
                      <div className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                        notifyMembers ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                      )} />
                    </div>
                  </button>
                )}

                {/* Confirm button */}
                <button
                  onClick={handleConfirmMeal}
                  disabled={saving}
                  className="w-full h-14 flex items-center justify-center rounded-2xl text-white text-[15px] font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "#165A52" }}
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                    />
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Adicionar refeição
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
