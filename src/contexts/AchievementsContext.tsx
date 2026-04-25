/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext, useContext, useMemo, useCallback,
  useEffect, useRef, useState,
} from "react";
import { Achievement } from "@/types/kaza";
import {
  buildAchievements,
  getProgressForAchievement,
  ACHIEVEMENT_TEMPLATES,
  AchievementCounters,
} from "@/data/achievements";
import { useKaza } from "@/contexts/KazaContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserAchievementRow } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface AchievementsContextType {
  achievements: Achievement[];
  getProgress: (achievementId: string) => number;
  recordShoppingCompletion: () => void;
  recordShare: () => void;
  recordMealPlan: () => void;
  recordGarbageSetup: () => void;
  recordGarbageDone: () => void;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

type DbCounters = Pick<
  UserAchievementRow,
  "shopping_completions" | "share_count" | "meal_plan_count" | "garbage_setups" | "garbage_done" | "unlocked"
>;

const EMPTY_DB: DbCounters = {
  shopping_completions: 0,
  share_count: 0,
  meal_plan_count: 0,
  garbage_setups: 0,
  garbage_done: 0,
  unlocked: {},
};

// No-op context for sub-accounts — they don't participate in achievements
const NOOP_CTX: AchievementsContextType = {
  achievements: [],
  getProgress: () => 0,
  recordShoppingCompletion: () => {},
  recordShare: () => {},
  recordMealPlan: () => {},
  recordGarbageSetup: () => {},
  recordGarbageDone: () => {},
};

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const { isSubAccount } = useKaza();
  const { user } = useAuth();

  const [dbCounters, setDbCounters] = useState<DbCounters>(EMPTY_DB);
  const dbCountersRef = useRef<DbCounters>(EMPTY_DB);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<DbCounters>>({});

  // Counts from DB item_history filtered by this user — cross-device persistent
  const [historyCounters, setHistoryCounters] = useState({ consumed: 0, cooked: 0, added: 0 });

  // Load per-user item_history counts from DB (not the shared in-memory state)
  useEffect(() => {
    if (!user || isSubAccount) return;
    (supabase as any)
      .from("item_history")
      .select("action")
      .eq("user_id", user.id)
      .then(({ data }: { data: { action: string }[] | null }) => {
        if (!data) return;
        setHistoryCounters({
          consumed: data.filter(r => r.action === "consumed").length,
          cooked:   data.filter(r => r.action === "cooked").length,
          added:    data.filter(r => r.action === "added").length,
        });
      });
  }, [user, isSubAccount]);

  // Load achievement row from DB
  useEffect(() => {
    if (!user || isSubAccount) return;
    (supabase as any)
      .from("user_achievements")
      .select("shopping_completions,share_count,meal_plan_count,garbage_setups,garbage_done,unlocked")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: DbCounters | null }) => {
        if (data) {
          dbCountersRef.current = data;
          setDbCounters(data);
        }
      });
  }, [user, isSubAccount]);

  const buildCounters = useCallback((): AchievementCounters => ({
    consumedCount:       historyCounters.consumed,
    cookedCount:         historyCounters.cooked,
    addedCount:          historyCounters.added,
    shoppingCompletions: dbCountersRef.current.shopping_completions,
    shareCount:          dbCountersRef.current.share_count,
    mealPlanCount:       dbCountersRef.current.meal_plan_count,
    garbageSetups:       dbCountersRef.current.garbage_setups,
    garbageDone:         dbCountersRef.current.garbage_done,
  }), [historyCounters]);

  const achievements = useMemo(
    () => buildAchievements(buildCounters(), dbCountersRef.current.unlocked ?? {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyCounters, dbCounters]
  );

  // Flush pending updates to DB (debounced 1.5 s)
  const flushToDb = useCallback(async (unlocked: Record<string, string>) => {
    if (!user || isSubAccount) return;
    const payload = {
      user_id: user.id,
      ...pendingRef.current,
      unlocked,
      updated_at: new Date().toISOString(),
    };
    pendingRef.current = {};
    await (supabase as any)
      .from("user_achievements")
      .upsert(payload, { onConflict: "user_id" });
  }, [user, isSubAccount]);

  const scheduleSave = useCallback((unlocked: Record<string, string>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => flushToDb(unlocked), 1500);
  }, [flushToDb]);

  const checkAndNotify = useCallback((counters: AchievementCounters, unlocked: Record<string, string>) => {
    let changed = false;
    ACHIEVEMENT_TEMPLATES.forEach(t => {
      if (unlocked[t.id]) return;
      if (getProgressForAchievement(t, counters) >= t.threshold) {
        unlocked[t.id] = new Date().toISOString();
        changed = true;
        toast.success(`${t.icon} Conquista desbloqueada: ${t.name}`, {
          description: t.description,
          duration: 5000,
        });
      }
    });
    return changed;
  }, []);

  // Detect unlocks when history counters change
  useEffect(() => {
    if (isSubAccount) return;
    const unlocked = { ...dbCountersRef.current.unlocked };
    const changed = checkAndNotify(buildCounters(), unlocked);
    if (changed) {
      dbCountersRef.current = { ...dbCountersRef.current, unlocked };
      setDbCounters(prev => ({ ...prev, unlocked }));
      pendingRef.current = { ...pendingRef.current, unlocked };
      scheduleSave(unlocked);
    }
  }, [historyCounters, buildCounters, checkAndNotify, scheduleSave, isSubAccount]);

  const increment = useCallback(
    (field: keyof Omit<DbCounters, "unlocked">) => {
      if (isSubAccount) return;
      const next = { ...dbCountersRef.current, [field]: (dbCountersRef.current[field] as number) + 1 };
      dbCountersRef.current = next;
      setDbCounters(next);
      pendingRef.current = { ...pendingRef.current, [field]: next[field] };

      const unlocked = { ...next.unlocked };
      const changed = checkAndNotify(
        {
          consumedCount:       historyCounters.consumed,
          cookedCount:         historyCounters.cooked,
          addedCount:          historyCounters.added,
          shoppingCompletions: next.shopping_completions,
          shareCount:          next.share_count,
          mealPlanCount:       next.meal_plan_count,
          garbageSetups:       next.garbage_setups,
          garbageDone:         next.garbage_done,
        },
        unlocked
      );
      if (changed) {
        dbCountersRef.current = { ...dbCountersRef.current, unlocked };
        setDbCounters(prev => ({ ...prev, unlocked }));
        pendingRef.current = { ...pendingRef.current, unlocked };
      }
      scheduleSave(dbCountersRef.current.unlocked);
    },
    [isSubAccount, historyCounters, checkAndNotify, scheduleSave]
  );

  const recordShoppingCompletion = useCallback(() => increment("shopping_completions"), [increment]);
  const recordShare              = useCallback(() => increment("share_count"),          [increment]);
  const recordMealPlan           = useCallback(() => increment("meal_plan_count"),      [increment]);
  const recordGarbageSetup       = useCallback(() => increment("garbage_setups"),       [increment]);
  const recordGarbageDone        = useCallback(() => increment("garbage_done"),         [increment]);

  const getProgress = useCallback((id: string): number => {
    const t = ACHIEVEMENT_TEMPLATES.find(x => x.id === id);
    if (!t) return 0;
    return getProgressForAchievement(t, buildCounters());
  }, [buildCounters]);

  // Sub-accounts get a no-op context
  if (isSubAccount) {
    return (
      <AchievementsContext.Provider value={NOOP_CTX}>
        {children}
      </AchievementsContext.Provider>
    );
  }

  return (
    <AchievementsContext.Provider value={{
      achievements,
      getProgress,
      recordShoppingCompletion,
      recordShare,
      recordMealPlan,
      recordGarbageSetup,
      recordGarbageDone,
    }}>
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  const ctx = useContext(AchievementsContext);
  if (!ctx) throw new Error("useAchievements must be used inside AchievementsProvider");
  return ctx;
}
