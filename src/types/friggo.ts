export type ItemCategory =
  | "fruit"
  | "vegetable"
  | "meat"
  | "dairy"
  | "cooked"
  | "frozen"
  | "beverage"
  | "cleaning"
  | "hygiene"
  | "pantry";

export type MaturationLevel = "green" | "ripe" | "very-ripe" | "overripe";

export type ItemLocation = "fridge" | "freezer" | "pantry" | "cleaning";

export interface KazaItem {
  id: string;
  name: string;
  category: ItemCategory;
  location: ItemLocation;
  quantity: number;
  unit: string;
  addedDate: Date;
  expirationDate?: Date;
  openedDate?: Date;
  maturation?: MaturationLevel;
  minStock?: number;
  dailyConsumption?: number; // Consumo diário por pessoa
  isCooked?: boolean; // Se é comida cozida
  imageUrl?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  isCompleted: boolean;
  store: "market" | "fair" | "pharmacy" | "other";
  user_id?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string; // ex: 'Massas', 'Carnes', 'Vegetariano'
  type:
  | "lunch"
  | "dinner"
  | "snack"
  | "dessert"
  | "meal-prep"
  | "healthy"
  | "lanche"
  | "sobremesa"
  | "doce";
  ingredients: string[];
  instructions?: string[]; // normalizado pelo mapper — sempre presente em allRecipes
  steps?: string[]; // alias usado em alguns arquivos de categoria
  prepTime: number; // minutos de preparo
  cookTime?: number; // minutos de cozimento
  servings?: number;
  // Accept difficulty labels in Portuguese (Brasil), Spanish (LATAM) and English (US)
  difficulty?:
    | "fácil"
    | "médio"
    | "difícil"
    | "facil"
    | "medio"
    | "easy"
    | "medium"
    | "hard";
  tips?: string | string[]; // dicas extras — aceita string única ou array
  // Optional UI / metadata fields added by augmentation script
  emoji?: string; // emoji representativo da receita
  region?: "BR" | "LATAM" | "US" | "INT"; // país/região de referência
  estimatedCost?: "low" | "medium" | "high";
  usesExpiringItems?: boolean; // definido pelo mapper em allRecipes
  missingIngredients?: string[];
}

export interface OnboardingData {
  name?: string;
  avatarUrl?: string;
  cpf?: string;
  homeType: "apartment" | "house";
  residents: number;
  fridgeType?: "regular" | "smart";
  fridgeBrand?: string;
  coolingLevel?: number;
  hasAlexa?: boolean; // deprecated - kept for backwards compatibility
  habits: string[];
  notificationPrefs?: string[];
  hiddenSections?: string[];
}

export interface ItemHistoryEntry {
  itemId: string;
  itemName: string;
  action: "added" | "consumed" | "cooked" | "discarded" | "defrosted";
  quantity: number;
  unit?: string;
  user?: string;
  timestamp: Date;
}

export interface Alert {
  id: string;
  type: "expiring" | "low-stock" | "overripe" | "consume-today";
  itemId: string;
  itemName: string;
  message: string;
  priority: "low" | "medium" | "high";
  createdAt: Date;
}

export type ConsumableCategory = "hygiene" | "cleaning" | "kitchen" | "health" | "other";

export interface ConsumableItem {
  id: string;
  name: string;
  icon: string;
  category: ConsumableCategory;
  currentStock: number;
  unit: string;
  dailyConsumption: number;
  minStock: number;
  usageInterval: "daily" | "weekly" | "fortnightly" | "monthly";
  hidden?: boolean;
}

export interface DefrostTimer {
  id: string;
  itemId: string;
  itemName: string;
  startedAt: Date;
  estimatedMinutes: number;
}

export interface MealPlanEntry {
  id: string;
  recipe_id: string;
  recipe_name: string;
  planned_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  planned_time?: string | null;
  notify_members?: boolean;
  created_by?: string | null;
}
