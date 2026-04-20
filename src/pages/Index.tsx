import { useState, useEffect, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useKaza } from "@/contexts/FriggoContext";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/friggo/BottomNav";
import { FabAddButton } from "@/components/friggo/FabAddButton";
import { HomeTab } from "@/components/friggo/tabs/HomeTab";
import { FridgeTab } from "@/components/friggo/tabs/FridgeTab";
import { RecipesTab } from "@/components/friggo/tabs/RecipesTab";
import { PlannerTab } from "@/components/friggo/tabs/PlannerTab";
import { ShoppingTab } from "@/components/friggo/tabs/ShoppingTab";
import { SettingsTab } from "@/components/friggo/tabs/SettingsTab";
import { Onboarding } from "@/components/friggo/Onboarding";
import { motion, AnimatePresence } from "framer-motion";
import BrandName from '@/components/friggo/BrandName';

function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-primary dark:bg-primary/90 animate-fade-in">
      <div className="flex flex-col items-center">
        <div className="relative mb-5">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.25rem] bg-white flex items-center justify-center shadow-xl overflow-hidden">
            <svg className="w-12 h-12 md:w-14 md:h-14 text-primary" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 50 150 L 100 40 L 150 150"/>
              <line x1="65" y1="115" x2="135" y2="115"/>
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white mb-1">Kaza</h1>
        <p className="text-xs text-white/70 mb-5">Carregando...</p>
        <div className="w-24 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-white animate-[loading-bar_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

const TAB_ORDER = ["home", "fridge", "recipes", "shopping", "settings"];

const TAB_STORAGE_KEY = "friggo-active-tab";

const tabSpring = { type: "spring" as const, stiffness: 350, damping: 30, mass: 0.8 };

function KazaApp() {
  // ── ALL hooks must be declared before any early returns ───────────────────
  const { loading: friggoLoading, isOnboarded, homeId } = useKaza();
  const { user, loading: authLoading, requireAuth } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem(TAB_STORAGE_KEY);
      return saved && TAB_ORDER.includes(saved) ? saved : "home";
    } catch {
      return "home";
    }
  });
  const [prevTab, setPrevTab] = useState(activeTab);
  // Reset to false whenever the user id changes so the loading screen shows
  // correctly for new sign-ins after logout within the same browser session.
  const prevUserId = useRef<string | undefined>(undefined);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (user?.id !== prevUserId.current) {
      hasLoadedOnce.current = false;
      prevUserId.current = user?.id;
    }
    if (!authLoading && !friggoLoading && user) {
      hasLoadedOnce.current = true;
    }
  }, [homeId, user?.id, authLoading, friggoLoading]);

  const handleTabChange = useCallback((tab: string) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch { /* ignore */ }
  }, [activeTab]);

  useEffect(() => {
    const handleNavigateTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && TAB_ORDER.includes(customEvent.detail)) {
        handleTabChange(customEvent.detail);
      }
    };
    window.addEventListener("navigateTab", handleNavigateTab);
    return () => window.removeEventListener("navigateTab", handleNavigateTab);
  }, [handleTabChange]);

  useEffect(() => {
    if (!authLoading) requireAuth();
  }, [authLoading, requireAuth]);

  const getTabDirection = (): number => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const prevIndex = TAB_ORDER.indexOf(prevTab);
    return currentIndex > prevIndex ? 1 : -1;
  };

  // ── Early returns after all hooks ─────────────────────────────────────────
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while auth/data resolves. Skip after first successful load
  // to avoid flicker when coming back from background.
  if ((authLoading || friggoLoading) && !hasLoadedOnce.current) {
    return <LoadingScreen />;
  }

  // Wait for user+data before showing onboarding vs main app.
  if (!user || friggoLoading) {
    return <LoadingScreen />;
  }

  // Mandatory Onboarding — key resets component state when user changes.
  if (!isOnboarded) {
    return <Onboarding key={user.id} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-nav-safe overflow-hidden">
      <main className="mx-auto max-w-lg px-3 sm:px-4 pt-safe relative h-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: getTabDirection() * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: getTabDirection() * -20 }}
            transition={tabSpring}
          >
            {activeTab === "home" && <HomeTab />}
            {activeTab === "fridge" && <FridgeTab />}
            {activeTab === "recipes" && <RecipesTab />}
            {activeTab === "planner" && <PlannerTab />}
            {activeTab === "shopping" && <ShoppingTab />}
            {activeTab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </main>
      <FabAddButton activeTab={activeTab} />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default function Index() {
  return <KazaApp />;
}
