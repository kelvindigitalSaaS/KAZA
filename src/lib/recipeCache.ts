import { Recipe } from '@/types/friggo';

// In-memory only. Nada é persistido em localStorage.
// Receitas favoritas ficam no banco (recipes.is_favorite) via FriggoContext.

const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface CachedRecipes {
  ingredients: string[];
  recipes: Recipe[];
  expiresAt: number;
}

let memoryCache: CachedRecipes | null = null;
const savedRecipes = new Map<string, Recipe>();

export function getCachedRecipes(ingredients: string[]): Recipe[] | null {
  if (!memoryCache) return null;
  if (Date.now() > memoryCache.expiresAt) {
    memoryCache = null;
    return null;
  }
  const normalizedInput = ingredients.map(i => i.toLowerCase()).sort();
  const normalizedCached = memoryCache.ingredients.map(i => i.toLowerCase()).sort();
  const overlap = normalizedInput.filter(i => normalizedCached.includes(i));
  if (overlap.length / Math.max(normalizedInput.length, normalizedCached.length) >= 0.7) {
    return memoryCache.recipes;
  }
  return null;
}

export function cacheRecipes(ingredients: string[], recipes: Recipe[]): void {
  memoryCache = { ingredients, recipes, expiresAt: Date.now() + CACHE_DURATION };
}

export function clearRecipeCache(): void {
  memoryCache = null;
}

export function getCacheInfo(): { hasCache: boolean; expiresAt: Date | null; recipeCount: number } {
  if (!memoryCache) return { hasCache: false, expiresAt: null, recipeCount: 0 };
  return {
    hasCache: true,
    expiresAt: new Date(memoryCache.expiresAt),
    recipeCount: memoryCache.recipes.length,
  };
}

export function getSavedRecipes(): Recipe[] {
  return Array.from(savedRecipes.values());
}

export function saveRecipe(recipe: Recipe): void {
  savedRecipes.set(recipe.id, recipe);
}

export function unsaveRecipe(recipeId: string): void {
  savedRecipes.delete(recipeId);
}

export function isRecipeSaved(recipeId: string): boolean {
  return savedRecipes.has(recipeId);
}
