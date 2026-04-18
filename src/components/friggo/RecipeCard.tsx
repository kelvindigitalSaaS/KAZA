import { Clock, Leaf, Users, ChevronRight } from "lucide-react";
import { Recipe } from "@/types/friggo";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
}

const categoryColors: Record<string, string> = {
  Massas: "bg-amber-100 text-amber-700",
  Carnes: "bg-red-100 text-red-700",
  Aves: "bg-yellow-100 text-yellow-700",
  "Frutos do Mar": "bg-cyan-100 text-cyan-700",
  Sopas: "bg-orange-100 text-orange-700",
  Saladas: "bg-green-100 text-green-700",
  Vegetariano: "bg-emerald-100 text-emerald-700",
  Risotos: "bg-yellow-100 text-yellow-800",
  Grelhados: "bg-orange-100 text-orange-800",
  Doces: "bg-pink-100 text-pink-700",
  Bolos: "bg-purple-100 text-purple-700",
  Pães: "bg-amber-100 text-amber-800",
  "Café da Manhã": "bg-sky-100 text-sky-700",
  Fitness: "bg-lime-100 text-lime-700",
  Lanches: "bg-orange-100 text-orange-700",
  Asiática: "bg-red-100 text-red-700",
  Mexicana: "bg-yellow-100 text-yellow-700",
  Vegano: "bg-teal-100 text-teal-700",
  Churrasco: "bg-red-100 text-red-800",
  Peixes: "bg-cyan-100 text-cyan-800",
  Bebidas: "bg-sky-100 text-indigo-700",
  Sobremesas: "bg-pink-100 text-pink-700",
  Acompanhamentos: "bg-stone-100 text-stone-700",
  Grãos: "bg-amber-100 text-amber-800"
};

const categoryEmojis: Record<string, string> = {
  Massas: "🍝", Carnes: "🥩", Aves: "🍗", "Frutos do Mar": "🦐",
  Sopas: "🍜", Saladas: "🥗", Vegetariano: "🥬", Risotos: "🍚",
  Grelhados: "🔥", Doces: "🍬", Bolos: "🎂", Pães: "🍞",
  "Café da Manhã": "☕", Fitness: "💪", Lanches: "🥪", Asiática: "🍱",
  Mexicana: "🌮", Vegano: "🌱", Churrasco: "🍖", Peixes: "🐟",
  Bebidas: "🥤", Sobremesas: "🍰", Acompanhamentos: "🍽️", Grãos: "🫘",
};

export function getCategoryEmoji(category?: string): string {
  if (category) {
    for (const [key, val] of Object.entries(categoryEmojis)) {
      if (category.toLowerCase().includes(key.toLowerCase())) return val;
    }
  }
  return "🍴";
}

function getCategoryColor(category?: string): string {
  if (category) {
    for (const [key, val] of Object.entries(categoryColors)) {
      if (category.toLowerCase().includes(key.toLowerCase())) return val;
    }
  }
  return "bg-primary/10 text-primary";
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const totalTime = recipe.prepTime + (recipe.cookTime ?? 0);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 cursor-pointer rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl px-4 py-3 transition-all duration-150 shadow-sm",
        "active:scale-[0.97]"
      )}
    >
      {/* Emoji por categoria */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl",
          getCategoryColor(recipe.category)
        )}
      >
        {getCategoryEmoji(recipe.category)}
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          {recipe.usesExpiringItems && (
            <span className="flex items-center gap-0.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-warning">
              <Leaf className="h-2.5 w-2.5" />
              Prioridade
            </span>
          )}
          {recipe.difficulty && (
            <span
              className={cn(
                "text-[10px] font-semibold",
                recipe.difficulty === "fácil"
                  ? "text-green-500"
                  : recipe.difficulty === "médio"
                    ? "text-amber-500"
                    : "text-red-500"
              )}
            >
              {recipe.difficulty}
            </span>
          )}
        </div>

        <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
          {recipe.name}
        </h3>

        <div className="mt-1 flex items-center gap-2 text-muted-foreground">
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="h-3 w-3" />
            {totalTime}min
          </span>
          <span className="text-[10px] opacity-40">•</span>
          <span className="flex items-center gap-1 text-[11px]">
            <Users className="h-3 w-3" />
            {recipe.servings || 2} porç.
          </span>
          {recipe.category && (
            <>
              <span className="text-[10px] opacity-40">•</span>
              <span className="text-[11px] truncate">{recipe.category}</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </div>
  );
}
