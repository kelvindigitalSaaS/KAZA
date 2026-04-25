import { Achievement, AchievementCategory } from "@/types/kaza";

type AchievementTemplate = Omit<Achievement, "unlocked" | "unlockedAt">;

export const ACHIEVEMENT_TEMPLATES: AchievementTemplate[] = [
  // --- Economia ---
  { id: "economy_1", category: "economy", name: "Começando a Economizar", description: "Consumiu 5 itens antes de vencer", icon: "💰", threshold: 5 },
  { id: "economy_2", category: "economy", name: "Guardião da Geladeira", description: "Consumiu 20 itens antes de vencer", icon: "🏦", threshold: 20 },
  { id: "economy_3", category: "economy", name: "Mestre da Economia", description: "Consumiu 50 itens antes de vencer", icon: "🏆", threshold: 50 },

  // --- Aproveitamento ---
  { id: "usage_1", category: "usage", name: "Primeiro Prato", description: "Cozinhou 1 item registrado no app", icon: "🍳", threshold: 1 },
  { id: "usage_2", category: "usage", name: "Chef Caseiro", description: "Cozinhou 10 itens registrados", icon: "👨‍🍳", threshold: 10 },
  { id: "usage_3", category: "usage", name: "Zero Desperdício", description: "Cozinhou 30 itens — quase nada vai pro lixo!", icon: "♻️", threshold: 30 },

  // --- Compras ---
  { id: "shopping_1", category: "shopping", name: "Lista Concluída", description: "Finalizou 1 lista de compras", icon: "🛒", threshold: 1 },
  { id: "shopping_2", category: "shopping", name: "Comprador Assíduo", description: "Finalizou 5 listas de compras", icon: "🛍️", threshold: 5 },
  { id: "shopping_3", category: "shopping", name: "Organizador Nato", description: "Finalizou 15 listas de compras", icon: "📋", threshold: 15 },

  // --- Compartilhar ---
  { id: "share_1", category: "share", name: "Dividindo a Lista", description: "Compartilhou 1 lista de compras", icon: "📤", threshold: 1 },
  { id: "share_2", category: "share", name: "Família Conectada", description: "Compartilhou 5 listas de compras", icon: "👨‍👩‍👧", threshold: 5 },
  { id: "share_3", category: "share", name: "Super Colaborador", description: "Compartilhou 15 listas de compras", icon: "🤝", threshold: 15 },

  // --- Plano Semanal ---
  { id: "mealplan_1", category: "mealplan", name: "Primeira Refeição Planejada", description: "Adicionou 1 refeição ao plano semanal", icon: "📅", threshold: 1 },
  { id: "mealplan_2", category: "mealplan", name: "Semana Completa", description: "Planejou 7 refeições", icon: "🗓️", threshold: 7 },
  { id: "mealplan_3", category: "mealplan", name: "Mestre do Planejamento", description: "Planejou 21 refeições", icon: "🧠", threshold: 21 },

  // --- Cadastrar Itens ---
  { id: "register_1", category: "register", name: "Geladeira Organizada", description: "Cadastrou 5 itens no app", icon: "🧊", threshold: 5 },
  { id: "register_2", category: "register", name: "Despensa Cheia", description: "Cadastrou 20 itens no app", icon: "🏠", threshold: 20 },
  { id: "register_3", category: "register", name: "Controlador de Estoque", description: "Cadastrou 50 itens no app", icon: "📦", threshold: 50 },

  // --- Lembrar do Lixo ---
  { id: "garbage_1", category: "garbage", name: "Primeiro Aviso", description: "Configurou o lembrete do lixo", icon: "🗑️", threshold: 1 },
  { id: "garbage_2", category: "garbage", name: "Vizinho Responsável", description: "Marcou o lixo como feito 3 vezes", icon: "✅", threshold: 3 },
  { id: "garbage_3", category: "garbage", name: "Guardião da Coleta", description: "Marcou o lixo como feito 10 vezes", icon: "🌿", threshold: 10 },
];

export type AchievementCounters = {
  consumedCount: number;
  cookedCount: number;
  addedCount: number;
  shoppingCompletions: number;
  shareCount: number;
  mealPlanCount: number;
  garbageSetups: number;
  garbageDone: number;
};

export function getProgressForAchievement(
  achievement: AchievementTemplate,
  counters: AchievementCounters
): number {
  switch (achievement.category as AchievementCategory) {
    case "economy": return counters.consumedCount;
    case "usage": return counters.cookedCount;
    case "shopping": return counters.shoppingCompletions;
    case "share": return counters.shareCount;
    case "mealplan": return counters.mealPlanCount;
    case "register": return counters.addedCount;
    case "garbage": return achievement.id === "garbage_1" ? counters.garbageSetups : counters.garbageDone;
    default: return 0;
  }
}

export function buildAchievements(
  counters: AchievementCounters,
  savedUnlocked: Record<string, string>
): Achievement[] {
  return ACHIEVEMENT_TEMPLATES.map((t) => {
    const progress = getProgressForAchievement(t, counters);
    const unlocked = progress >= t.threshold;
    const unlockedAt = savedUnlocked[t.id]
      ? new Date(savedUnlocked[t.id])
      : unlocked ? new Date() : undefined;
    return { ...t, unlocked, unlockedAt };
  });
}
