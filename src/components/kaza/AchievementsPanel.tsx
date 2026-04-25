import { useAchievements } from "@/contexts/AchievementsContext";
import { Achievement, AchievementCategory } from "@/types/kaza";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

const CATEGORY_META: Record<AchievementCategory, { label: string; color: string }> = {
  economy:  { label: "Economia",        color: "text-emerald-600 dark:text-emerald-400" },
  usage:    { label: "Aproveitamento",  color: "text-amber-600 dark:text-amber-400" },
  shopping: { label: "Compras",         color: "text-blue-600 dark:text-blue-400" },
  share:    { label: "Compartilhar",    color: "text-violet-600 dark:text-violet-400" },
  mealplan: { label: "Plano Semanal",   color: "text-rose-600 dark:text-rose-400" },
  register: { label: "Cadastrar Itens", color: "text-cyan-600 dark:text-cyan-400" },
  garbage:  { label: "Lembrete do Lixo", color: "text-lime-600 dark:text-lime-400" },
};

const CATEGORY_ORDER: AchievementCategory[] = [
  "economy", "usage", "shopping", "share", "mealplan", "register", "garbage",
];

function AchievementCard({ achievement, progress }: { achievement: Achievement; progress: number }) {
  const pct = Math.min(100, Math.round((progress / achievement.threshold) * 100));

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl border transition-all",
        achievement.unlocked
          ? "bg-primary/5 border-primary/20 dark:border-primary/30"
          : "bg-muted/30 border-black/[0.04] dark:border-white/[0.06] opacity-70"
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl",
          achievement.unlocked ? "bg-primary/10" : "bg-muted/40 grayscale"
        )}
      >
        {achievement.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("text-sm font-bold truncate", achievement.unlocked ? "text-foreground" : "text-muted-foreground")}>
            {achievement.name}
          </p>
          {achievement.unlocked && <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{achievement.description}</p>

        {!achievement.unlocked && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/50 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
              {Math.min(progress, achievement.threshold)}/{achievement.threshold}
            </span>
          </div>
        )}

        {achievement.unlocked && achievement.unlockedAt && (
          <p className="text-[10px] text-primary font-semibold mt-0.5">
            Desbloqueado em {achievement.unlockedAt.toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
    </div>
  );
}

export function AchievementsPanel() {
  const { achievements, getProgress } = useAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="text-base font-black text-foreground">Conquistas</h2>
        <span className="ml-auto text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      {CATEGORY_ORDER.map(cat => {
        const catAchievements = achievements.filter(a => a.category === cat);
        if (catAchievements.length === 0) return null;
        const { label, color } = CATEGORY_META[cat];

        return (
          <div key={cat} className="space-y-2">
            <p className={cn("text-xs font-bold uppercase tracking-wider", color)}>{label}</p>
            <div className="space-y-2">
              {catAchievements.map(a => (
                <AchievementCard key={a.id} achievement={a} progress={getProgress(a.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
