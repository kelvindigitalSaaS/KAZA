import { useState, useMemo } from "react";
import { useKaza } from "@/contexts/FriggoContext";
import { RecipeCard } from "../RecipeCard";
import { allRecipes, findRecipesByIngredients, availableCategories } from "@/data/recipeDatabase";
import { Sparkles, Heart, ChefHat, Search, BookOpen, Dumbbell, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PlannerTab } from "./PlannerTab";
import { CalendarDays } from "lucide-react";

const FITNESS_KEYWORDS = [
  "frango", "chicken", "peixe", "fish", "salada", "salad", "quinoa",
  "ovo", "egg", "iogurte", "yogurt", "aveia", "oat", "proteína", "protein",
  "brócolis", "broccoli", "batata doce", "sweet potato", "atum", "tuna",
  "grelhado", "grilled", "vapor", "steam", "light", "fitness", "saudável", "healthy"
];

export function RecipesTab() {
  const { shoppingList, addToShoppingList, items, favoriteRecipes } = useKaza();
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<"recipes" | "planner">("recipes");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const [canCookNow, setCanCookNow] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [fitnessOnly, setFitnessOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories from recipes (top ones, limit to avoid clutter)
  const topCategories = useMemo(() => {
    return availableCategories.slice(0, 8);
  }, []);

  const getFilteredRecipes = () => {
    let baseList = allRecipes;

    if (canCookNow) {
      const ingredientNames = items.map(i => i.name);
      baseList = findRecipesByIngredients(ingredientNames);
    }

    if (showFavorites) {
      baseList = baseList.filter(r => favoriteRecipes.includes(r.id));
    }

    if (fitnessOnly) {
      baseList = baseList.filter(r => {
        const text = `${r.name} ${r.description ?? ""} ${(r.ingredients || []).join(" ")}`.toLowerCase();
        return FITNESS_KEYWORDS.some(k => text.includes(k));
      });
    }

    if (selectedCategory) {
      baseList = baseList.filter(r => r.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      baseList = baseList.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
      );
    }

    return baseList;
  };

  const filteredRecipes = getFilteredRecipes();
  const activeFiltersCount = [canCookNow, showFavorites, fitnessOnly, !!selectedCategory].filter(Boolean).length;

  return (
    <div className="space-y-4 pb-24">
      {/* ── Header ── */}
      <div className="pt-2 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {subTab === "recipes" ? "Receitas" : "Plano"}
            <div className="rounded-xl bg-primary/10 p-1.5">
              {subTab === "recipes" ? <ChefHat className="h-5 w-5 text-primary" /> : <CalendarDays className="h-5 w-5 text-primary" />}
            </div>
          </h1>
        </div>

        {/* Segmented control */}
        <div
          className="flex p-1 rounded-2xl w-full max-w-sm mx-auto"
          style={{ background: "rgba(22,90,82,0.07)" }}
        >
          <button
            onClick={() => setSubTab("recipes")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold rounded-xl transition-all",
              subTab === "recipes"
                ? "bg-white dark:bg-white/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className={cn("h-4 w-4", subTab === "recipes" ? "text-primary" : "text-muted-foreground")} />
            Catálogo
          </button>
          <button
            onClick={() => setSubTab("planner")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold rounded-xl transition-all",
              subTab === "planner"
                ? "bg-white dark:bg-white/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className={cn("h-4 w-4", subTab === "planner" ? "text-primary" : "text-muted-foreground")} />
            Plano
          </button>
        </div>
      </div>

      {subTab === "planner" ? (
        <PlannerTab />
      ) : (
        <>
          {/* ── Smart filters row ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Can cook now */}
            <button
              onClick={() => setCanCookNow(!canCookNow)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border shrink-0",
                canCookNow
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white dark:bg-white/5 border-black/[0.05] dark:border-white/[0.06] text-foreground"
              )}
              style={canCookNow ? { background: "#165A52" } : {}}
            >
              <Sparkles className={cn("h-3.5 w-3.5", !canCookNow && "text-primary")} />
              Posso cozinhar
            </button>

            {/* Favorites */}
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border shrink-0",
                showFavorites
                  ? "bg-red-500 text-white border-red-500 shadow-sm"
                  : "bg-white dark:bg-white/5 border-black/[0.05] dark:border-white/[0.06] text-foreground"
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", !showFavorites && "text-red-500")} />
              Favoritos
            </button>

            {/* Fitness */}
            <button
              onClick={() => setFitnessOnly(!fitnessOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border shrink-0",
                fitnessOnly
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                  : "bg-white dark:bg-white/5 border-black/[0.05] dark:border-white/[0.06] text-foreground"
              )}
            >
              <Dumbbell className={cn("h-3.5 w-3.5", !fitnessOnly && "text-emerald-500")} />
              Fitness
            </button>
          </div>

          {/* ── Category chips ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border",
                !selectedCategory
                  ? "text-white border-transparent"
                  : "bg-white/80 dark:bg-white/5 border-black/[0.05] dark:border-white/[0.06] text-muted-foreground"
              )}
              style={!selectedCategory ? { background: "#165A52" } : {}}
            >
              Todas
            </button>
            {topCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border",
                  selectedCategory === cat
                    ? "text-white border-transparent"
                    : "bg-white/80 dark:bg-white/5 border-black/[0.05] dark:border-white/[0.06] text-foreground"
                )}
                style={selectedCategory === cat ? { background: "#165A52" } : {}}
              >
                <Tag className="h-3 w-3" />
                {cat}
              </button>
            ))}
          </div>

          {/* ── Search ── */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar receitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border-black/[0.04] dark:border-white/[0.06] text-[15px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* ── Count ── */}
          <p className="text-xs text-muted-foreground">
            {filteredRecipes.length} receita{filteredRecipes.length !== 1 ? "s" : ""}
            {searchQuery ? ` para "${searchQuery}"` : ""}
            {activeFiltersCount > 0 && ` · ${activeFiltersCount} filtro(s) ativo(s)`}
          </p>

          {/* ── Recipe grid ── */}
          {filteredRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] p-4 mb-4">
                <ChefHat className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="font-bold text-foreground">Nenhuma receita encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">Tente outra categoria ou busca</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setCanCookNow(false);
                    setShowFavorites(false);
                    setFitnessOnly(false);
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }}
                  className="mt-4 text-sm font-semibold text-primary flex items-center gap-1 active:opacity-70"
                >
                  <X className="h-3.5 w-3.5" /> Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {filteredRecipes.slice(0, visibleCount).map((recipe, index) => (
                  <div
                    key={recipe.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
                    />
                  </div>
                ))}
              </div>
              {filteredRecipes.length > visibleCount && (
                <Button
                  variant="outline"
                  className="w-full rounded-2xl h-11 bg-white/80 dark:bg-white/5 backdrop-blur-xl border-black/[0.04] dark:border-white/[0.06]"
                  onClick={() => setVisibleCount((v) => v + 30)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver mais ({filteredRecipes.length - visibleCount} receitas)
                </Button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
