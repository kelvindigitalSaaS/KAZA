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

/** Novos tiers de plano (plan_tier na tabela subscriptions) */
export type PlanTierEnum = "free" | "individualPRO" | "multiPRO";

/** Papel dentro de um grupo multiPRO */
export type SubAccountRole = "master" | "member";

export interface SubAccountGroup {
  id: string;
  master_user_id: string;
  plan_tier: PlanTierEnum;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface SubAccountMember {
  id: string;
  group_id: string;
  user_id: string;
  role: SubAccountRole;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  invited_by: string | null;
  joined_at: string;
}

export interface AccountSession {
  id: string;
  user_id: string;
  group_id: string | null;
  device_id: string;
  device_name: string | null;
  platform: string | null;
  is_connected: boolean;
  force_disconnected: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}
export type ActionTypeEnum =
  | "added" | "consumed" | "cooked" | "discarded" | "defrosted" | "expired";
export type ConsumableActionEnum = "debit" | "restock" | "adjust";

export interface Database {
  public: {
    Tables: {
      account_sessions: {
        Row: AccountSession;
        Insert: Omit<AccountSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AccountSession, 'id' | 'created_at' | 'updated_at'>>;
      };
      [key: string]: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; };
    };
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
