import {
  Home,
  Refrigerator,
  ShoppingCart,
  ChefHat,
  CalendarDays,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabLabels = {
  "pt-BR": {
    home: "Início",
    fridge: "Estoque",
    recipes: "Receitas",
    shopping: "Lista",
    settings: "Perfil"
  },
  en: {
    home: "Home",
    fridge: "Pantry",
    recipes: "Recipes",
    shopping: "Shopping",
    settings: "Settings"
  },
  es: {
    home: "Inicio",
    fridge: "Despensa",
    recipes: "Recetas",
    shopping: "Compras",
    settings: "Ajustes"
  }
};

const appleSpring = { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.6 };

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { language } = useLanguage();
  const l = tabLabels[language];

  const tabs = [
    { id: "home", label: l.home, icon: Home },
    { id: "fridge", label: l.fridge, icon: Refrigerator },
    { id: "recipes", label: l.recipes, icon: ChefHat },
    { id: "shopping", label: l.shopping, icon: ShoppingCart },
    { id: "settings", label: l.settings, icon: Settings }
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 md:left-auto md:right-auto md:w-full md:max-w-[480px] md:-translate-x-1/2 md:left-1/2 z-50 rounded-[2rem] border border-black/[0.05] dark:border-white/[0.08] bg-white/70 dark:bg-[#111]/70 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] pb-0">
      <div className="mx-auto flex h-[4.25rem] w-full items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.85 }}
              transition={appleSpring}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className="relative flex h-8 w-8 items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 rounded-xl bg-primary/12 shadow-sm"
                    transition={appleSpring}
                  />
                )}
                <motion.div
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={appleSpring}
                >
                  <Icon className="h-[22px] w-[22px] relative z-10" />
                </motion.div>
              </div>
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  fontWeight: isActive ? 600 : 500,
                }}
                transition={{ duration: 0.2 }}
                className="text-[10px]"
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
