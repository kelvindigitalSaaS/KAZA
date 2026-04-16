// Friggo DB schema v2.0 — multi-tenant by home_id.
// Apenas os shapes usados pelo app. Colunas opcionais ficam com `| null`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type HomeRole = "owner" | "admin" | "member" | "viewer";
export type HomeTypeEnum = "apartment" | "house";
export type FridgeTypeEnum = "regular" | "smart";
export type ItemCategoryEnum =
  | "fruit" | "vegetable" | "meat" | "dairy" | "cooked" | "frozen"
  | "beverage" | "cleaning" | "hygiene" | "pantry" | "other";
export type ItemLocationEnum = "fridge" | "freezer" | "pantry" | "cleaning";
export type MaturationLevelEnum = "green" | "ripe" | "very-ripe" | "overripe";
export type MealTypeEnum = "breakfast" | "lunch" | "dinner" | "snack";
export type SubscriptionPlanEnum = "free" | "basic" | "standard" | "premium";
export type SubscriptionStatusEnum =
  | "trialing" | "active" | "past_due" | "cancelled" | "expired";
export type ActionTypeEnum =
  | "added" | "consumed" | "cooked" | "discarded" | "defrosted" | "expired";
export type ConsumableActionEnum = "debit" | "restock" | "adjust";

export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: {
      home_role: HomeRole;
      home_type: HomeTypeEnum;
      fridge_type: FridgeTypeEnum;
      item_category: ItemCategoryEnum;
      item_location: ItemLocationEnum;
      maturation_level: MaturationLevelEnum;
      meal_type: MealTypeEnum;
      subscription_plan: SubscriptionPlanEnum;
      subscription_status: SubscriptionStatusEnum;
      action_type: ActionTypeEnum;
      consumable_action: ConsumableActionEnum;
    };
  };
}
