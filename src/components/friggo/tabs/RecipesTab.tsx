import { useState, useMemo } from "react";
import { useKaza } from "@/contexts/FriggoContext";
import { RecipeCard } from "../RecipeCard";
import { allRecipes, findRecipesByIngredients, availableCategories } from "@/data/recipeDatabase";
import { Sparkles, Heart, ChefHat, Search, BookOpen, Dumbbell, Tag, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PlannerTab } from "./PlannerTab";
import { CalendarDays } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FITNESS_KEYWORDS = [
  "frango", "chicken", "peixe", "fish", "salada", "salad", "quinoa",
  "ovo", "egg", "iogurte", "yogurt", "aveia", "oat", "proteína", "protein",
  "brócolis", "broccoli", "batata doce", "sweet potato", "atum", "tuna",
  "grelhado", "grilled", "vapor", "steam", "light", "fitness", "saudável", "healthy"
];

export function RecipesTab() {
  const { shoppingList, addToShoppingList, items, favoriteRecipes, toggleFavoriteRecipe } = useKaza();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<"recipes" | "planner" | "favorites">("recipes");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string|null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const getFilteredRecipes = () => {
    let baseList = allRecipes;

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

  return (
    <div className="space-y-4 pb-nav-safe">
      {/* ── Header ── */}
      <div className="pt-2 flex flex-col gap-4">


        {/* Segmented control */}
        <div
          className="flex p-1 rounded-2xl w-full"
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
            {language === "en" ? "Catalog" : language === "es" ? "Catálogo" : "Catálogo"}
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
            {language === "en" ? "Plan" : language === "es" ? "Plan" : "Plano"}
          </button>
          <button
            onClick={() => setSubTab("favorites")}
            className={cn(
              "flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-xl transition-all",
              subTab === "favorites"
                ? "bg-white dark:bg-white/10 text-red-500 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart className={cn("h-4 w-4", subTab === "favorites" ? "fill-red-500 text-red-500" : "")} />
            {favoriteRecipes.length > 0 && (
              <span className={cn("text-[10px] font-black", subTab === "favorites" ? "text-red-500" : "text-muted-foreground")}>
                {favoriteRecipes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {subTab === "planner" ? (
        <PlannerTab />
      ) : subTab === "favorites" ? (
        <>
          <p className="text-xs text-muted-foreground">
            {favoriteRecipes.length} {language === "en" ? "favorite recipe" : language === "es" ? "receta favorita" : "receita favorita"}{favoriteRecipes.length !== 1 ? "s" : ""}
          </p>
          {favoriteRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] p-4 mb-4">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="font-bold text-foreground">
                {language === "en" ? "No favorites yet" : language === "es" ? "Sin favoritos" : "Nenhum favorito ainda"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "en" ? "Tap the heart on a recipe to save it" : language === "es" ? "Toca el corazón en una receta para guardarla" : "Toque o coração em uma receita para salvá-la"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allRecipes
                .filter(r => favoriteRecipes.includes(r.id))
                .map((recipe, index) => (
                  <div key={recipe.id} className="relative animate-fade-in" style={{ animationDelay: `${index * 20}ms` }}>
                    <RecipeCard
                      recipe={recipe}
                      onClick={() => navigate(`/app/recipe/${recipe.id}`, { state: { recipe } })}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavoriteRecipe(recipe.id); toast.success(language === "en" ? "Removed from favorites" : language === "es" ? "Eliminado de favoritos" : "Removido dos favoritos"); }}
                      className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-black/60 shadow-sm transition-all active:scale-90"
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </>
      ) : (
        <>


          {/* ── Search ── */}
          <div className="flex gap-2 relative">
            <div className="relative flex-1">
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
            
            <button
               onClick={() => setFilterOpen(!filterOpen)}
               className={cn("flex flex-shrink-0 items-center justify-center h-11 w-11 rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl transition-all", filterOpen || selectedCategory ? "bg-emerald-500 text-white" : "text-muted-foreground")}
            >
               <SlidersHorizontal className="h-4 w-4" />
            </button>
            
            {filterOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                 <div className="absolute right-0 top-[110%] w-48 bg-white dark:bg-[#11302c] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/[0.04] p-2 rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-64 overflow-y-auto no-scrollbar flex flex-col">
                      <button onClick={() => { setSelectedCategory(null); setFilterOpen(false); }} className={cn("w-full text-left px-3 py-2.5 text-[13px] rounded-xl transition-colors mb-1 shrink-0", !selectedCategory ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-foreground")}>
                        Todas as Categorias
                      </button>
                      {availableCategories.map(cat => (
                        <button key={cat} onClick={() => { setSelectedCategory(cat); setFilterOpen(false); }} className={cn("w-full text-left px-3 py-2.5 text-[13px] rounded-xl transition-colors shrink-0", selectedCategory === cat ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-foreground")}>
                          {cat}
                        </button>
                      ))}
                    </div>
                 </div>
               </>
            )}
          </div>

          {/* ── Count ── */}
          <p className="text-xs text-muted-foreground">
            {filteredRecipes.length} receita{filteredRecipes.length !== 1 ? "s" : ""}
            {searchQuery ? ` para "${searchQuery}"` : ""}
          </p>

          {/* ── Recipe grid ── */}
          {filteredRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] p-4 mb-4">
                <ChefHat className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="font-bold text-foreground">Nenhuma receita encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">Tente outra categoria ou busca</p>

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
                      onClick={() => navigate(`/app/recipe/${recipe.id}`, { state: { recipe } })}
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
