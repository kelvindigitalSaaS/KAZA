/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "sonner";
import { getFoodMetadata } from "@/data/brazilianRecipes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types/friggo";
import {
  Clock,
  Users,
  ChefHat,
  Check,
  ArrowLeft,
  ArrowRight,
  Leaf,
  Play,
  Pause,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKaza } from "@/contexts/FriggoContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface RecipeDetailProps {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
}

export function RecipeDetail({ recipe, open, onClose }: RecipeDetailProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [cookingMode, setCookingMode] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { items, addToShoppingList } = useKaza();
  const { language } = useLanguage();

  if (!recipe) return null;

  const missingIngredients = recipe.ingredients.filter((ingredient) => {
    const ingredientLower = ingredient.toLowerCase();
    return !items.some((item) =>
      ingredientLower.includes(item.name.toLowerCase())
    );
  });

  const handleAddMissingToShoppingList = async () => {
    const labels = {
      "pt-BR": {
        added: "Itens adicionados à lista de compras!",
        noMissing: "Você já tem todos os ingredientes!"
      },
      en: {
        added: "Items added to shopping list!",
        noMissing: "You already have all ingredients!"
      },
      es: {
        added: "¡Artículos añadidos a la lista de compras!",
        noMissing: "¡Ya tienes todos los ingredientes!"
      }
    };
    const l = labels[language];
    if (missingIngredients.length === 0) {
      toast.info(l.noMissing);
      return;
    }
    for (const ingredient of missingIngredients) {
      const metadata = getFoodMetadata(ingredient);
      await addToShoppingList({
        name: ingredient,
        quantity: 1,
        unit: metadata.unit === "un" ? "un" : metadata.unit,
        category: (metadata.category as any) || "pantry",
        store:
          metadata.category === "hygiene"
            ? "pharmacy"
            : metadata.category === "vegetable" || metadata.category === "fruit"
            ? "fair"
            : "market"
      });
    }
    toast.success(l.added);
  };

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const nextStep = () => {
    if (currentStep < (recipe.instructions ?? []).length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const progress = (completedSteps.length / (recipe.instructions ?? []).length) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-lg">
        {/* Header Image */}
        <div className="relative h-40 ">
          <div className="absolute inset-0 flex items-center justify-center">
            <ChefHat className="h-16 w-16 text-primary/40" />
          </div>
          {recipe.usesExpiringItems && (
            <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-warning px-3 py-1 text-warning-foreground shadow-sm">
              <Leaf className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Prioridade</span>
            </div>
          )}
        </div>

        <div className="p-5">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold leading-tight">
              {recipe.name}
            </DialogTitle>
            {recipe.description && (
              <p className="mt-1 text-sm text-gray-500">{recipe.description}</p>
            )}
          </DialogHeader>

          {/* Stats */}
          <div className="mb-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
              <Clock className="h-4 w-4 text-primary" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-muted-foreground">
                  Preparo
                </span>
                <span className="text-sm font-semibold">
                  {recipe.prepTime} min
                </span>
              </div>
            </div>
            {recipe.cookTime && (
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <ChefHat className="h-4 w-4 text-primary" />
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-muted-foreground">
                    Cozimento
                  </span>
                  <span className="text-sm font-semibold">
                    {recipe.cookTime} min
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
              <Users className="h-4 w-4 text-primary" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-muted-foreground">
                  Porções
                </span>
                <span className="text-sm font-semibold">
                  {recipe.servings || 2}
                </span>
              </div>
            </div>
            {recipe.difficulty && (
              <div
                className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                  recipe.difficulty === "fácil"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : recipe.difficulty === "médio"
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                <span
                  className={`text-sm font-bold ${
                    recipe.difficulty === "fácil"
                      ? "text-green-600"
                      : recipe.difficulty === "médio"
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {recipe.difficulty === "fácil"
                    ? "⭐ Fácil"
                    : recipe.difficulty === "médio"
                    ? "⭐⭐ Médio"
                    : "⭐⭐⭐ Avançado"}
                </span>
              </div>
            )}
          </div>

          {/* Add Missing to Shopping List */}
          {missingIngredients.length > 0 && (
            <Button
              onClick={handleAddMissingToShoppingList}
              variant="outline"
              className="mb-3 w-full gap-2 rounded-md py-5 border-warning/30 text-warning hover:bg-warning/10"
            >
              <ShoppingCart className="h-4 w-4" />
              {language === "en"
                ? `Add ${missingIngredients.length} missing to list`
                : language === "es"
                ? `Añadir ${missingIngredients.length} faltantes`
                : `Adicionar ${missingIngredients.length} faltante(s) à lista`}
            </Button>
          )}

          {/* Cooking Mode Toggle */}
          <Button
            onClick={() => setCookingMode(!cookingMode)}
            variant={cookingMode ? "default" : "outline"}
            className="mb-5 w-full gap-2 rounded-md py-5"
          >
            {cookingMode ? (
              <>
                <Pause className="h-4 w-4" />
                Sair do Modo Cozinha
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Iniciar Modo Cozinha
              </>
            )}
          </Button>

          {cookingMode ? (
            /* Cooking Mode - Step by Step */
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-500">
                Passo {currentStep + 1} de {(recipe.instructions ?? []).length}
              </p>

              {/* Current Step */}
              <div className="rounded-md bg-primary/5 p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {currentStep + 1}
                </div>
                <p className="text-lg font-medium leading-relaxed text-foreground">
                  {(recipe.instructions ?? [])[currentStep]}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex-1 rounded-md py-5"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  onClick={() => {
                    toggleStep(currentStep);
                    nextStep();
                  }}
                  className="flex-1 rounded-md py-5"
                  disabled={
                    currentStep === (recipe.instructions ?? []).length - 1 &&
                    completedSteps.includes(currentStep)
                  }
                >
                  {currentStep === (recipe.instructions ?? []).length - 1 ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Concluir
                    </>
                  ) : (
                    <>
                      Próximo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Normal View */
            <>
              {/* Ingredients */}
              <section className="mb-5">
                <h3 className="mb-3 text-base font-bold text-foreground">
                  Ingredientes
                </h3>
                <div className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-3"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {ingredient}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Instructions */}
              <section>
                <h3 className="mb-3 text-base font-bold text-foreground">
                  Modo de Preparo
                </h3>
                <div className="space-y-3">
                  {(recipe.instructions ?? []).map((instruction, index) => (
                    <div
                      key={index}
                      onClick={() => toggleStep(index)}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-md border border-gray-200 p-4 transition-all active:scale-[0.99]",
                        completedSteps.includes(index)
                          ? "border-primary/30 bg-primary/5"
                          : "bg-white hover:border-primary/20"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all",
                          completedSteps.includes(index)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-gray-500"
                        )}
                      >
                        {completedSteps.includes(index) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm leading-relaxed",
                          completedSteps.includes(index)
                            ? "text-gray-500 line-through"
                            : "text-foreground"
                        )}
                      >
                        {instruction}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
