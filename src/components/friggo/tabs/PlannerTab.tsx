import { useKaza } from "@/contexts/FriggoContext";
import {
  CalendarDays,
  Trash2,
  ChefHat,
  UtensilsCrossed,
  Coffee,
  Moon,
  Cookie,
  Plus,
  Search,
  Calendar,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { allRecipes } from "@/data/recipeDatabase";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "weekly" | "monthly";

const MEAL_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  breakfast: {
    label: "Café",
    icon: Coffee,
    color: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  lunch: {
    label: "Almoço",
    icon: UtensilsCrossed,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  dinner: {
    label: "Jantar",
    icon: Moon,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  snack: {
    label: "Lanche",
    icon: Cookie,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
};

export function PlannerTab() {
  const { mealPlan, removeFromMealPlan, addToMealPlan } = useKaza();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWeeklyDate, setSelectedWeeklyDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      date,
      dateStr,
      label: format(date, "eee", { locale: ptBR }),
      dayNum: format(date, "dd"),
      meals: mealPlan.filter((p) => p.planned_date === dateStr),
    };
  });

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const filteredRecipes = allRecipes
    .filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 12);

  const handleAddMeal = (recipeId: string, recipeName: string, mealType: string) => {
    if (!selectedDate) return;
    addToMealPlan({
      recipe_id: recipeId,
      recipe_name: recipeName,
      planned_date: selectedDate,
      meal_type: mealType as any,
    });
    setIsDialogOpen(false);
    setSearchQuery("");
    toast.success("Refeição adicionada ao plano!");
  };

  const openAddDialog = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* ── HEADER + VIEW TOGGLE ── */}
      <div className="pt-2 space-y-4">


        {/* Segmented Control */}
        <div className="flex p-1 rounded-2xl" style={{ background: "rgba(22,90,82,0.07)" }}>
          <button
            onClick={() => setViewMode("weekly")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold rounded-xl transition-all",
              viewMode === "weekly"
                ? "bg-white dark:bg-white/10 shadow-sm text-primary"
                : "text-muted-foreground"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Semanal
          </button>
          <button
            onClick={() => setViewMode("monthly")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold rounded-xl transition-all",
              viewMode === "monthly"
                ? "bg-white dark:bg-white/10 shadow-sm text-primary"
                : "text-muted-foreground"
            )}
          >
            <Calendar className="h-4 w-4" />
            Mensal
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── WEEKLY VIEW ── */}
        {viewMode === "weekly" && (() => {
          const activeDayObj = weekDays.find(d => d.dateStr === selectedWeeklyDate) || weekDays[0];
          
          return (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              {/* Horizontal Days Row */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {weekDays.map((day) => {
                  const isActive = day.dateStr === selectedWeeklyDate;
                  const recipeCount = day.meals.length;

                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => setSelectedWeeklyDate(day.dateStr)}
                      className={cn(
                        "flex flex-col items-center justify-center py-2.5 px-3 min-w-[4.5rem] rounded-2xl border transition-all shrink-0",
                        isActive
                          ? "text-white shadow-md border-transparent"
                          : "bg-white dark:bg-white/5 border-black/[0.05] dark:border-white/[0.06] text-muted-foreground"
                      )}
                      style={isActive ? { background: "#165A52" } : {}}
                    >
                      <span className="text-[10px] font-black uppercase leading-none mb-1 opacity-80">{day.label}</span>
                      <span className="text-2xl font-bold leading-none mb-2">{day.dayNum}</span>
                      {recipeCount > 0 ? (
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", isActive ? "bg-white/20 text-white" : "bg-primary/20 text-primary")}>
                          {recipeCount} rec.
                        </span>
                      ) : (
                        <span className="text-[9px] opacity-40 px-1.5 py-0.5">-</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Day Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-bold text-foreground capitalize">
                    {activeDayObj.label}, {activeDayObj.dayNum} de {format(activeDayObj.date, "MMM", { locale: ptBR })}
                  </h3>
                  <button
                    onClick={() => openAddDialog(activeDayObj.dateStr)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-sm"
                    style={{ background: "#165A52", color: "white" }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {activeDayObj.meals.length === 0 ? (
                  <div
                    className="rounded-3xl p-8 text-center border border-dashed flex flex-col items-center"
                    style={{ borderColor: "rgba(22,90,82,0.15)", background: "rgba(22,90,82,0.02)" }}
                  >
                    <ChefHat className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-[15px] font-bold text-foreground">Sem refeições</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[200px] leading-snug">Adicione uma receita para o plano deste dia.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeDayObj.meals.map((meal) => {
                      const config = MEAL_CONFIG[meal.meal_type] || MEAL_CONFIG.lunch;
                      const Icon = config.icon;
                      const recipeData = allRecipes.find((r) => r.id === meal.recipe_id);
                      return (
                        <div
                          key={meal.id}
                          className="group flex flex-row items-center gap-3 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] p-4 rounded-[1.25rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                        >
                          <div className={cn("h-12 w-12 flex items-center justify-center rounded-2xl", config.bg, "border-0 shadow-inner")}>
                            <Icon className={cn("h-5 w-5", config.color)} />
                          </div>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              if (recipeData)
                                navigate(`/recipe/${meal.recipe_id}`, { state: { recipe: recipeData } });
                            }}
                          >
                            <p className={cn("text-[10px] font-black uppercase tracking-wider mb-1", config.color)}>
                              {config.label}
                            </p>
                            <p className="text-[15px] font-bold text-foreground truncate">{meal.recipe_name}</p>
                          </div>
                          <button
                            onClick={() => removeFromMealPlan(meal.id)}
                            className="h-10 w-10 flex items-center justify-center rounded-[14px] bg-red-500/10 text-red-500 transition-opacity active:opacity-70"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}

        {/* ── MONTHLY VIEW ── */}
        {viewMode === "monthly" && (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/80 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06] text-foreground active:scale-90 transition-all"
              >
                {"‹"}
              </button>
              <h2 className="text-base font-bold text-foreground capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/80 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06] text-foreground active:scale-90 transition-all"
              >
                {"›"}
              </button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-black uppercase text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before month start */}
              {Array.from({
                length: (startOfMonth(currentMonth).getDay() + 6) % 7,
              }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {monthDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const hasMeals = mealPlan.some((p) => p.planned_date === dateStr);
                const mealCount = mealPlan.filter((p) => p.planned_date === dateStr).length;
                const today = isToday(day);

                return (
                  <button
                    key={dateStr}
                    onClick={() => openAddDialog(dateStr)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all active:scale-90 relative",
                      today ? "text-white shadow-md" : hasMeals ? "text-primary bg-primary/10" : "text-foreground bg-white/60 dark:bg-white/5 hover:bg-primary/5"
                    )}
                    style={today ? { background: "#165A52" } : {}}
                  >
                    <span>{format(day, "d")}</span>
                    {hasMeals && !today && (
                      <span
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ background: "#165A52" }}
                      />
                    )}
                    {hasMeals && today && (
                      <span className="text-[8px] font-black opacity-80">{mealCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected date meals */}
            {selectedDate && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">
                    {format(new Date(selectedDate + "T00:00:00"), "eeee, dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <button
                    onClick={() => openAddDialog(selectedDate)}
                    className="text-xs font-bold text-primary flex items-center gap-1 active:opacity-70"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                </div>
                {mealPlan.filter((p) => p.planned_date === selectedDate).map((meal) => {
                  const config = MEAL_CONFIG[meal.meal_type] || MEAL_CONFIG.lunch;
                  const Icon = config.icon;
                  return (
                    <div
                      key={meal.id}
                      className="group flex items-center gap-3 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] p-3 rounded-2xl shadow-sm"
                    >
                      <div className={cn("h-9 w-9 flex items-center justify-center rounded-xl border", config.bg)}>
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[10px] font-black uppercase tracking-wider mb-0.5", config.color)}>
                          {config.label}
                        </p>
                        <p className="text-sm font-bold text-foreground truncate">{meal.recipe_name}</p>
                      </div>
                      <button
                        onClick={() => removeFromMealPlan(meal.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
                {mealPlan.filter((p) => p.planned_date === selectedDate).length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    Nenhuma refeição para este dia
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {mealPlan.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-[2.5rem] border border-black/[0.04] dark:border-white/[0.06] bg-white/50 dark:bg-white/5">
          <div className="h-16 w-16 rounded-3xl flex items-center justify-center mb-4" style={{ background: "rgba(22,90,82,0.10)" }}>
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold">Seu guia semanal</h3>
          <p className="text-sm text-muted-foreground max-w-[200px] mt-2">
            Adicione receitas ao seu plano para nunca esquecer o que cozinhar.
          </p>
          <Button
            className="mt-6 rounded-2xl px-6"
            style={{ background: "#165A52" }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent("navigateTab", { detail: "recipes" }));
            }}
          >
            Explorar Receitas
          </Button>
        </div>
      )}

      {/* ── Add Meal Dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-[2rem] bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border-white/10 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-3">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Planejar refeição
            </DialogTitle>
            {selectedDate && (
              <p className="text-sm text-muted-foreground capitalize">
                {format(new Date(selectedDate + "T00:00:00"), "eeee, dd 'de' MMMM", { locale: ptBR })}
              </p>
            )}
          </DialogHeader>

          <div className="px-6 pb-6">
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar receitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border-transparent"
              />
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 pb-2">
              {filteredRecipes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma receita encontrada.</p>
              ) : (
                filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="border border-black/[0.04] dark:border-white/[0.08] rounded-3xl bg-white/50 dark:bg-white/[0.02] overflow-hidden shadow-sm"
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 shrink-0 shadow-inner">
                        {recipe.image ? (
                          <img src={recipe.image} className="h-full w-full object-cover rounded-2xl" alt="" />
                        ) : (
                          <ChefHat className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{recipe.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1 opacity-60">
                          {recipe.category || "Receita"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 px-4 pb-4">
                      {Object.entries(MEAL_CONFIG).map(([type, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={type}
                            onClick={() => handleAddMeal(recipe.id, recipe.name, type)}
                            className={cn(
                              "h-10 rounded-2xl text-[9px] font-black uppercase tracking-tighter flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 border border-transparent hover:border-current/10",
                              cfg.bg,
                              cfg.color
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{cfg.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
