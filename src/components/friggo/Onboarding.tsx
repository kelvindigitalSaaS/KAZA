import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OnboardingData, ConsumableCategory } from "@/types/friggo";
import { useKaza } from "@/contexts/FriggoContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import { isValidCPF, formatCPF } from "@/lib/utils/validation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Home,
  Users,
  Refrigerator,
  Thermometer,
  ChefHat,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  Sun,
  Moon,
  Monitor,
  Palette,
  User,
  Wifi,
  BarChart3,
  ShoppingCart,
  Bell,
  Smartphone,
  Snowflake,
  Package,
  Plus,
  Trash2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const onboardingLabels = {
  "pt-BR": {
    welcome: "Bem-vindo ao",
    brandName: "Kaza",
    tagline: "Tudo o que sua casa precisa, antes de acabar.",
    setupSteps: "Vamos configurar sua casa em poucos passos",
    features: ["Alertas de vencimento", "Receitas IA", "Lista inteligente"],
    whereYouLive: "Onde você mora?",
    helpsPersonalize: "Isso nos ajuda a personalizar sua experiência",
    apartment: "Apartamento",
    house: "Casa",
    howMany: "Quantas pessoas moram?",
    helpsCalc: "Ajuda a calcular o consumo médio",
    person: "pessoa",
    people: "pessoas",
    yourFridge: "Sua geladeira",
    smartIntegrate: "Escolha o tipo da sua geladeira",
    regular: "Comum",
    smart: "Smart",
    regularDesc: "Geladeira tradicional sem conectividade",
    smartDesc: "Com Wi-Fi, tela touch e sensores inteligentes",
    regularFeatures: ["Controle manual", "Economia de energia", "Simples e confiável"],
    smartFeatures: ["Controle por app", "Sensores de temperatura", "Alertas automáticos"],
    coolingLevel: "Nível de resfriamento",
    coolingLabels: ["Menos frio", "Frio leve", "Normal", "Bem frio", "Máximo"],
    yourHabits: "Seus hábitos",
    selectHabits: "Selecione o que combina com você",
    habits: [
      { id: "cook-daily", label: "Cozinho todos os dias", icon: "🍳", description: "Preparo refeições diariamente" },
      { id: "meal-prep", label: "Faço marmitas", icon: "📦", description: "Organizo refeições da semana" },
      { id: "diet", label: "Sigo dieta", icon: "🥗", description: "Alimentação controlada" },
      { id: "family", label: "Refeições em família", icon: "👨‍👩‍👧‍👦", description: "Cozinho para todos" },
      { id: "quick-meals", label: "Comidas rápidas", icon: "⚡", description: "Prefiro praticidade" },
      { id: "healthy", label: "Vida saudável", icon: "💪", description: "Foco em saúde" },
      { id: "organic", label: "Orgânicos", icon: "🌿", description: "Prefiro produtos naturais" },
      { id: "budget", label: "Economizar", icon: "💰", description: "Não desperdiçar alimentos" }
    ],
    notifications: "Notificações",
    notifDesc: "Escolha o que deseja ser notificado",
    notifOptions: [
      { id: "expiry", label: "Vencimento de alimentos", icon: "⏰", description: "Quando algo está para vencer" },
      { id: "shopping", label: "Lista de compras", icon: "🛒", description: "Quando itens estão acabando" },
      { id: "recipes", label: "Receitas sugeridas", icon: "🍽️", description: "Sugestões baseadas no seu estoque" },
      { id: "nightCheckup", label: "Check-up noturno", icon: "🌙", description: "Lembrete diário à noite" },
      { id: "cooking", label: "Temporizador de cozinha", icon: "🔔", description: "Quando o timer acabar" },
      { id: "consumables", label: "Consumíveis baixos", icon: "📉", description: "Quando produtos de casa acabam" }
    ],
    consumables: "Consumíveis da casa",
    consumablesDesc: "Configure os produtos que você usa no dia a dia",
    consumableName: "Nome do item",
    consumableCategory: "Classificação",
    consumableStock: "Estoque atual",
    consumableMinStock: "Estoque mínimo",
    consumableUsage: "Consumo",
    consumableUsageType: "Frequência",
    consumableDaily: "Diário",
    consumableWeekly: "Semanal",
    consumableUnit: "Unidade",
    consumableAdd: "Adicionar item",
    consumableCategories: {
      hygiene: "Higiene",
      cleaning: "Limpeza",
      kitchen: "Cozinha",
      health: "Saúde",
      other: "Outros"
    },
    consumableDefaults: [
      { name: "Papel higiênico", icon: "🧻", category: "hygiene", unit: "rolos", stock: 12, min: 4, usage: 1, usageType: "daily" },
      { name: "Detergente", icon: "🧴", category: "cleaning", unit: "un", stock: 2, min: 1, usage: 1, usageType: "weekly" },
      { name: "Sabonete", icon: "🧼", category: "hygiene", unit: "un", stock: 3, min: 2, usage: 1, usageType: "weekly" },
      { name: "Pasta de dente", icon: "🪥", category: "hygiene", unit: "tubos", stock: 2, min: 1, usage: 1, usageType: "weekly" },
      { name: "Esponja", icon: "🧽", category: "kitchen", unit: "un", stock: 3, min: 1, usage: 1, usageType: "weekly" }
    ],
    allReady: "Tudo pronto!",
    readyDesc: "Sua casa está configurada. Agora é só aproveitar!",
    readyItems: ["Alertas de vencimento ativos", "Receitas inteligentes prontas", "Lista de compras automática"],
    startSetup: "Começar configuração",
    continue: "Continuar",
    startUsing: "Começar a usar",
    yourName: "Como podemos te chamar?",
    namePlaceholder: "Seu nome",
    nameHelper: "Usar no app para saudações",
    personalize: "Personalize seu app",
    personalizeDesc: "Escolha o visual que combina com você",
    themeLabel: "Aparência",
    light: "Claro",
    dark: "Escuro",
    auto: "Auto",
    cpfTitle: "Qual seu CPF?",
    cpfDesc: "Necessário para ativar seus 7 dias gratuitos.",
    cpfPlaceholder: "000.000.000-00",
    invalidCpf: "CPF inválido, verifique os números.",
    cancel: "Cancelar",
    save: "Salvar"
  },
  en: {
    welcome: "Welcome to",
    brandName: "Kaza",
    tagline: "Everything your home needs, before it runs out.",
    setupSteps: "Let's set up your home in a few steps",
    features: ["Expiry alerts", "AI Recipes", "Smart list"],
    whereYouLive: "Where do you live?",
    helpsPersonalize: "This helps us personalize your experience",
    apartment: "Apartment",
    house: "House",
    howMany: "How many people live here?",
    helpsCalc: "Helps calculate average consumption",
    person: "person",
    people: "people",
    yourFridge: "Your fridge",
    smartIntegrate: "Choose your fridge type",
    regular: "Regular",
    smart: "Smart",
    regularDesc: "Traditional fridge without connectivity",
    smartDesc: "With Wi-Fi, touchscreen and smart sensors",
    regularFeatures: ["Manual control", "Energy saving", "Simple and reliable"],
    smartFeatures: ["App control", "Temperature sensors", "Automatic alerts"],
    coolingLevel: "Cooling level",
    coolingLabels: ["Less cold", "Mild cold", "Normal", "Very cold", "Maximum"],
    yourHabits: "Your habits",
    selectHabits: "Select what matches you",
    habits: [
      { id: "cook-daily", label: "Cook daily", icon: "🍳", description: "I prepare meals every day" },
      { id: "meal-prep", label: "Meal prep", icon: "📦", description: "I organize weekly meals" },
      { id: "diet", label: "Follow a diet", icon: "🥗", description: "Controlled eating" },
      { id: "family", label: "Family meals", icon: "👨‍👩‍👧‍👦", description: "I cook for everyone" },
      { id: "quick-meals", label: "Quick meals", icon: "⚡", description: "I prefer convenience" },
      { id: "healthy", label: "Healthy living", icon: "💪", description: "Focus on health" },
      { id: "organic", label: "Organic food", icon: "🌿", description: "I prefer natural products" },
      { id: "budget", label: "Save money", icon: "💰", description: "Don't waste food" }
    ],
    notifications: "Notifications",
    notifDesc: "Choose what you want to be notified about",
    notifOptions: [
      { id: "expiry", label: "Food expiry", icon: "⏰", description: "When something is about to expire" },
      { id: "shopping", label: "Shopping list", icon: "🛒", description: "When items are running low" },
      { id: "recipes", label: "Suggested recipes", icon: "🍽️", description: "Suggestions based on your stock" },
      { id: "nightCheckup", label: "Night check-up", icon: "🌙", description: "Daily evening reminder" },
      { id: "cooking", label: "Kitchen timer", icon: "🔔", description: "When the timer is done" },
      { id: "consumables", label: "Low consumables", icon: "📉", description: "When household products run out" }
    ],
    consumables: "Household consumables",
    consumablesDesc: "Set up the products you use every day",
    consumableName: "Item name",
    consumableCategory: "Category",
    consumableStock: "Current stock",
    consumableMinStock: "Minimum stock",
    consumableUsage: "Usage",
    consumableUsageType: "Frequency",
    consumableDaily: "Daily",
    consumableWeekly: "Weekly",
    consumableUnit: "Unit",
    consumableAdd: "Add item",
    consumableCategories: {
      hygiene: "Hygiene",
      cleaning: "Cleaning",
      kitchen: "Kitchen",
      health: "Health",
      other: "Other"
    },
    consumableDefaults: [
      { name: "Toilet paper", icon: "🧻", category: "hygiene", unit: "rolls", stock: 12, min: 4, usage: 1, usageType: "daily" },
      { name: "Dish soap", icon: "🧴", category: "cleaning", unit: "un", stock: 2, min: 1, usage: 1, usageType: "weekly" },
      { name: "Soap", icon: "🧼", category: "hygiene", unit: "un", stock: 3, min: 2, usage: 1, usageType: "weekly" },
      { name: "Toothpaste", icon: "🪥", category: "hygiene", unit: "tubes", stock: 2, min: 1, usage: 1, usageType: "weekly" },
      { name: "Sponge", icon: "🧽", category: "kitchen", unit: "un", stock: 3, min: 1, usage: 1, usageType: "weekly" }
    ],
    allReady: "All set!",
    readyDesc: "Your home is configured. Enjoy!",
    readyItems: ["Expiry alerts active", "Smart recipes ready", "Automatic shopping list"],
    startSetup: "Start setup",
    continue: "Continue",
    startUsing: "Start using",
    yourName: "What should we call you?",
    namePlaceholder: "Your name",
    nameHelper: "Used for greetings in the app",
    personalize: "Personalize your app",
    personalizeDesc: "Choose the look that fits you",
    themeLabel: "Appearance",
    light: "Light",
    dark: "Dark",
    auto: "Auto",
    cpfTitle: "Your CPF",
    cpfDesc: "We need your CPF to associate the trial period.",
    cpfPlaceholder: "000.000.000-00",
    invalidCpf: "Invalid CPF, please check.",
    cancel: "Cancel",
    save: "Save"
  },
  es: {
    welcome: "Bienvenido a",
    brandName: "Kaza",
    tagline: "Todo lo que tu hogar necesita, antes de que se acabe.",
    setupSteps: "Configuremos tu hogar en pocos pasos",
    features: ["Alertas de vencimiento", "Recetas IA", "Lista inteligente"],
    whereYouLive: "¿Dónde vives?",
    helpsPersonalize: "Esto nos ayuda a personalizar tu experiencia",
    apartment: "Apartamento",
    house: "Casa",
    howMany: "¿Cuántas personas viven?",
    helpsCalc: "Ayuda a calcular el consumo promedio",
    person: "persona",
    people: "personas",
    yourFridge: "Tu nevera",
    smartIntegrate: "Elige el tipo de tu nevera",
    regular: "Común",
    smart: "Smart",
    regularDesc: "Nevera tradicional sin conectividad",
    smartDesc: "Con Wi-Fi, pantalla táctil y sensores inteligentes",
    regularFeatures: ["Control manual", "Ahorro de energía", "Simple y confiable"],
    smartFeatures: ["Control por app", "Sensores de temperatura", "Alertas automáticas"],
    coolingLevel: "Nivel de enfriamiento",
    coolingLabels: ["Menos frío", "Frío leve", "Normal", "Muy frío", "Máximo"],
    yourHabits: "Tus hábitos",
    selectHabits: "Selecciona lo que va contigo",
    habits: [
      { id: "cook-daily", label: "Cocino todos los días", icon: "🍳", description: "Preparo comidas diariamente" },
      { id: "meal-prep", label: "Preparo comidas", icon: "📦", description: "Organizo comidas de la semana" },
      { id: "diet", label: "Sigo dieta", icon: "🥗", description: "Alimentación controlada" },
      { id: "family", label: "Comidas en familia", icon: "👨‍👩‍👧‍👦", description: "Cocino para todos" },
      { id: "quick-meals", label: "Comidas rápidas", icon: "⚡", description: "Prefiero practicidad" },
      { id: "healthy", label: "Vida saludable", icon: "💪", description: "Foco en salud" },
      { id: "organic", label: "Orgánicos", icon: "🌿", description: "Prefiero productos naturales" },
      { id: "budget", label: "Ahorrar", icon: "💰", description: "No desperdiciar alimentos" }
    ],
    notifications: "Notificaciones",
    notifDesc: "Elige sobre qué deseas ser notificado",
    notifOptions: [
      { id: "expiry", label: "Vencimiento de alimentos", icon: "⏰", description: "Cuando algo está por vencer" },
      { id: "shopping", label: "Lista de compras", icon: "🛒", description: "Cuando los artículos se están acabando" },
      { id: "recipes", label: "Recetas sugeridas", icon: "🍽️", description: "Sugerencias basadas en tu stock" },
      { id: "nightCheckup", label: "Chequeo nocturno", icon: "🌙", description: "Recordatorio diario por la noche" },
      { id: "cooking", label: "Temporizador de cocina", icon: "🔔", description: "Cuando el timer termine" },
      { id: "consumables", label: "Consumibles bajos", icon: "📉", description: "Cuando los productos del hogar se acaban" }
    ],
    consumables: "Consumibles del hogar",
    consumablesDesc: "Configura los productos que usas en el día a día",
    consumableName: "Nombre del item",
    consumableCategory: "Clasificación",
    consumableStock: "Stock actual",
    consumableMinStock: "Stock mínimo",
    consumableUsage: "Consumo",
    consumableUsageType: "Frecuencia",
    consumableDaily: "Diario",
    consumableWeekly: "Semanal",
    consumableUnit: "Unidad",
    consumableAdd: "Agregar item",
    consumableCategories: {
      hygiene: "Higiene",
      cleaning: "Limpieza",
      kitchen: "Cocina",
      health: "Salud",
      other: "Otros"
    },
    consumableDefaults: [
      { name: "Papel higiénico", icon: "🧻", category: "hygiene", unit: "rollos", stock: 12, min: 4, usage: 1, usageType: "daily" },
      { name: "Detergente", icon: "🧴", category: "cleaning", unit: "un", stock: 2, min: 1, usage: 1, usageType: "weekly" },
      { name: "Jabón", icon: "🧼", category: "hygiene", unit: "un", stock: 3, min: 2, usage: 1, usageType: "weekly" },
      { name: "Pasta de dientes", icon: "🪥", category: "hygiene", unit: "tubos", stock: 2, min: 1, usage: 1, usageType: "weekly" },
      { name: "Esponja", icon: "🧽", category: "kitchen", unit: "un", stock: 3, min: 1, usage: 1, usageType: "weekly" }
    ],
    allReady: "¡Todo listo!",
    readyDesc: "Tu hogar está configurado. ¡A disfrutar!",
    readyItems: ["Alertas de vencimiento activos", "Recetas inteligentes listas", "Lista de compras automática"],
    startSetup: "Iniciar configuración",
    continue: "Continuar",
    startUsing: "Comenzar a usar",
    yourName: "¿Cómo te llamamos?",
    namePlaceholder: "Tu nombre",
    nameHelper: "Para saludos en la app",
    personalize: "Personaliza tu app",
    personalizeDesc: "Elige el estilo que te gusta",
    themeLabel: "Apariencia",
    light: "Claro",
    dark: "Oscuro",
    auto: "Auto",
    cpfTitle: "Tu CPF",
    cpfDesc: "Necesitamos tu CPF para asociar el período de prueba.",
    cpfPlaceholder: "000.000.000-00",
    invalidCpf: "CPF no válido, por favor verifica.",
    cancel: "Cancelar",
    save: "Guardar"
  }
};

const steps = [
  "welcome",
  "personalize",
  "cpf",
  "homeType",
  "residents",
  "habits",
  "consumables",
  "notifications",
  "complete"
];

// Animated fridge door component
function AnimatedFridge() {
  return (
    <motion.div className="relative h-28 w-28">
      {/* Fridge body */}
      <motion.div
        className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/30 flex items-center justify-center overflow-hidden"
      >
        {/* Inner fridge detail */}
        <div className="absolute inset-3 rounded-[1.2rem] border-2 border-primary-foreground/20" />
        {/* Fridge handle */}
        <motion.div className="absolute right-5 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full bg-primary-foreground/40" />
      </motion.div>
      {/* Door opening animation */}
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: [0, -45, -45, 0] }}
        transition={{ duration: 2.5, delay: 0.8, times: [0, 0.3, 0.7, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }}
        style={{ transformOrigin: "left center", perspective: 800 }}
        className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary to-primary/90 shadow-xl flex items-center justify-center"
      >
        <Refrigerator className="h-14 w-14 text-primary-foreground" />
        <motion.div className="absolute right-5 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full bg-primary-foreground/40" />
      </motion.div>
      {/* Cool mist effect when door opens */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.6, 0.6, 0], scale: [0.5, 1.2, 1.2, 0.5] }}
        transition={{ duration: 2.5, delay: 0.8, times: [0, 0.3, 0.7, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }}
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-8 w-20 rounded-full bg-cyan-400/30 blur-lg"
      />
    </motion.div>
  );
}

// Apple-style spring config
const appleSpring = { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 };
const appleFade = { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const };

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: appleSpring,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
    scale: 0.96,
    transition: appleFade,
  }),
};

const staggerContainer = {
  center: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.15,
    },
  },
};

const staggerItem = {
  enter: { opacity: 0, y: 20, scale: 0.95 },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: appleSpring,
  },
};

export function Onboarding() {
  const { completeOnboarding, setConsumablesBulk } = useKaza();
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      if (typeof window !== "undefined") window.location.href = "/auth";
    }
  };
  const l = onboardingLabels[language];
  const [currentStep, setCurrentStep] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData & { cpf?: string }>>({
    homeType: "apartment",
    residents: 2,
    habits: [],
    notificationPrefs: ["expiry", "shopping", "nightCheckup"],
    cpf: ""
  });

  // Consumables state for onboarding step
  const [onboardingConsumables, setOnboardingConsumables] = useState<
    { name: string; icon: string; category: ConsumableCategory; unit: string; currentStock: number; minStock: number; dailyConsumption: number; usageType: "daily" | "weekly" }[]
  >([]);
  const [showAddConsumable, setShowAddConsumable] = useState(false);
  const [newConsumable, setNewConsumable] = useState({ name: "", icon: "📦", category: "other", unit: "un", currentStock: 1, minStock: 1, dailyConsumption: 1, usageType: "daily" as "daily" | "weekly" });

  // Initialize consumables from language defaults when reaching consumables step
  useEffect(() => {
    if (steps[currentStep] === "consumables" && onboardingConsumables.length === 0) {
      setOnboardingConsumables((l as any).consumableDefaults.map((d: any) => ({
        name: d.name,
        icon: d.icon,
        category: d.category as ConsumableCategory,
        unit: d.unit,
        currentStock: d.stock,
        minStock: d.min,
        dailyConsumption: d.usage,
        usageType: d.usageType as "daily" | "weekly",
      })));
    }
  }, [currentStep]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [cpfError, setCpfError] = useState("");

  const handleNext = async () => {
    if (steps[currentStep] === "personalize") {
      if (!data.name || !data.name.trim()) {
        toast.error(
          language === "pt-BR"
            ? "Informe seu nome para continuar."
            : language === "es"
            ? "Ingrese su nombre para continuar."
            : "Please enter your name to continue."
        );
        return;
      }
    }
    if (steps[currentStep] === "cpf") {
      const rawCpf = data.cpf || "";
      if (!isValidCPF(rawCpf)) {
        setCpfError(l.invalidCpf || "CPF inválido");
        return;
      }
      setCpfError("");
      
      // Validação assíncrona para checar duplicidade de CPF (neste ponto usamos apenas a API que tentará salvar)
    }

    // Ensure at least one notification preference is selected
    if (steps[currentStep] === "notifications") {
      if (!data.notificationPrefs || data.notificationPrefs.length === 0) {
        toast.error(language === "pt-BR" ? "Selecione ao menos uma preferência de notificação." : language === "es" ? "Seleccione al menos una preferencia de notificación." : "Select at least one notification preference.");
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setPage([currentStep + 1, 1]);
      setCurrentStep((prev) => prev + 1);
    }
  };
  const handleBack = () => {
    if (currentStep > 0) {
      setPage([currentStep - 1, -1]);
      setCurrentStep((prev) => prev - 1);
    }
  };
  const handleComplete = async () => {
    setIsSubmitting(true);
    if (onboardingConsumables.length > 0) {
      setConsumablesBulk(onboardingConsumables);
    }
    try {
      await completeOnboarding(data as OnboardingData);
    } catch (e: any) {
      setIsSubmitting(false); // Only reset if failed so user can fix
      if (e.message && (e.message.includes("CPF") || e.message.includes("cadastrado"))) {
        // Go back to CPF step
        const cpfStepIndex = steps.indexOf("cpf");
        if (cpfStepIndex !== -1) {
          setPage([cpfStepIndex, -1]);
          setCurrentStep(cpfStepIndex);
          setCpfError(e.message);
        }
      }
    }
  };
  const toggleHabit = (habitId: string) => {
    setData((prev) => ({
      ...prev,
      habits: prev.habits?.includes(habitId)
        ? prev.habits.filter((h) => h !== habitId)
        : [...(prev.habits || []), habitId]
    }));
  };
  const toggleNotification = (notifId: string) => {
    setData((prev) => ({
      ...prev,
      notificationPrefs: prev.notificationPrefs?.includes(notifId)
        ? prev.notificationPrefs.filter((n) => n !== notifId)
        : [...(prev.notificationPrefs || []), notifId]
    }));
  };

  const renderStep = () => {
    switch (steps[currentStep]) {
      case "welcome":
        return (
          <motion.div
            variants={staggerContainer}
            initial="enter"
            animate="center"
            className="flex flex-1 flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              variants={staggerItem}
              className="relative flex items-center justify-center"
            >
              <div
                className="absolute w-[240px] h-[240px] rounded-full kaza-glow pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(52,199,89,0.22) 0%, rgba(52,199,89,0.08) 38%, rgba(52,199,89,0) 70%)",
                  filter: "blur(20px)",
                }}
              />
              <motion.img
                src="/icons/192.png"
                alt=""
                aria-hidden
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...appleSpring, delay: 0.1 }}
                className="relative z-10 w-28 h-28 md:w-32 md:h-32 object-contain rounded-[28px] kaza-breath"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.05), 0 18px 48px rgba(0,0,0,0.45), 0 0 40px rgba(52,199,89,0.18)",
                }}
              />
            </motion.div>
          </motion.div>
        );

      case "personalize":
        return (
          <motion.div
            variants={staggerContainer}
            initial="enter"
            animate="center"
            className="flex flex-1 flex-col justify-center px-6"
          >
            <motion.div variants={staggerItem} className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{l.yourName}</h2>
            </motion.div>
            <motion.p variants={staggerItem} className="mb-6 text-muted-foreground text-sm">{l.nameHelper}</motion.p>
            <motion.div variants={staggerItem}>
              <Input
                type="text"
                placeholder={l.namePlaceholder}
                value={data.name || ""}
                onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                className="h-14 rounded-2xl text-lg font-medium bg-white dark:bg-white/5 border-black/[0.06] dark:border-white/10 px-5 transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoFocus
              />
            </motion.div>

            <motion.div variants={staggerItem} className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{l.themeLabel}</h3>
                  <p className="text-xs text-muted-foreground">{l.personalizeDesc}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: "light", icon: Sun, label: l.light, preview: "bg-white border-gray-200" },
                  { value: "dark", icon: Moon, label: l.dark, preview: "bg-gray-900 border-gray-700" },
                  { value: "system", icon: Monitor, label: l.auto, preview: "bg-gradient-to-br from-white to-gray-900 border-gray-400" },
                ] as const).map(({ value, icon: Icon, label, preview }) => (
                  <motion.button
                    key={value}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setTheme(value as any)}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-300",
                      theme === value
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/15"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className={cn("h-12 w-12 rounded-xl border-2 transition-all", preview)} />
                    <Icon className={cn(
                      "h-5 w-5 transition-colors",
                      theme === value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-xs font-semibold",
                      theme === value ? "text-primary" : "text-foreground"
                    )}>{label}</span>
                    {theme === value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={appleSpring}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );

      case "cpf":
        return (
          <motion.div
            variants={staggerContainer}
            initial="enter"
            animate="center"
            className="flex flex-1 flex-col justify-center px-6"
          >
            <motion.div variants={staggerItem} className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {(l as any).cpfTitle || "Seu CPF"}
              </h2>
            </motion.div>
            <motion.p variants={staggerItem} className="mb-6 text-muted-foreground text-sm">
              {(l as any).cpfDesc || "Usado para vincular seu período de testes gratuito."}
            </motion.p>
            <motion.div variants={staggerItem}>
              <Input
                type="text"
                placeholder={(l as any).cpfPlaceholder || "000.000.000-00"}
                value={data.cpf || ""}
                onChange={(e) => {
                  setCpfError("");
                  setData((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }));
                }}
                maxLength={14}
                className={cn(
                  "h-14 rounded-2xl text-lg font-medium bg-white dark:bg-white/5 border-black/[0.06] dark:border-white/10 px-5 transition-all focus:ring-2 focus:ring-primary/30",
                  cpfError ? "border-destructive focus:border-destructive focus:ring-destructive/30" : "focus:border-primary"
                )}
                autoFocus
              />
              {cpfError && (
                <p className="mt-2 text-sm text-destructive">{cpfError}</p>
              )}
            </motion.div>
          </motion.div>
        );

      case "homeType":
        return (
          <motion.div
            variants={staggerContainer}
            initial="enter"
            animate="center"
            className="flex flex-1 flex-col justify-center px-6"
          >
            <motion.h2 variants={staggerItem} className="mb-2 text-2xl font-bold text-foreground">
              {l.whereYouLive}
            </motion.h2>
            <motion.p variants={staggerItem} className="mb-8 text-muted-foreground">{l.helpsPersonalize}</motion.p>
            <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
              {(
                [
                  { type: "apartment", label: l.apartment, icon: Building2 },
                  { type: "house", label: l.house, icon: Home }
                ] as const
              ).map(({ type, label, icon: Ic }) => (
                <motion.button
                  key={type}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() =>
                    setData((prev) => ({ ...prev, homeType: type }))
                  }
                  className={cn(
                    "group flex flex-col items-center gap-4 rounded-2xl border-2 p-6 transition-all duration-300",
                    data.homeType === type
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/15"
                      : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-2xl transition-all",
                      data.homeType === type
                        ? "bg-primary/20"
                        : "bg-muted group-hover:bg-primary/10"
                    )}
                  >
                    <Ic
                      className={cn(
                        "h-8 w-8 transition-colors",
                        data.homeType === type
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary"
                      )}
                    />
                  </div>
                  <span className="font-semibold text-foreground">{label}</span>
                  {data.homeType === type && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={appleSpring}>
                      <Check className="h-5 w-5 text-primary" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        );

      case "residents":
        return (
          <motion.div
            variants={staggerContainer}
            initial="enter"
            animate="center"
            className="flex flex-1 flex-col justify-center px-6"
          >
            <motion.h2 variants={staggerItem} className="mb-2 text-2xl font-bold text-foreground">
              {l.howMany}
            </motion.h2>
            <motion.p variants={staggerItem} className="mb-8 text-muted-foreground">{l.helpsCalc}</motion.p>
            <motion.div variants={staggerItem} className="flex flex-col items-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <div className="flex items-center gap-6">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      residents: Math.max(1, (prev.residents || 1) - 1)
                    }))
                  }
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-2xl font-bold text-secondary-foreground shadow-sm transition-all"
                >
                  −
                </motion.button>
                <div className="flex flex-col items-center px-4">
                  <motion.span
                    key={data.residents}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={appleSpring}
                    className="text-6xl font-bold text-foreground"
                  >
                    {data.residents}
                  </motion.span>
                  <span className="text-muted-foreground font-medium">
                    {data.residents === 1 ? l.person : l.people}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      residents: Math.min(12, (prev.residents || 1) + 1)
                    }))
                  }
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm transition-all"
                >
                  +
                </motion.button>
              </div>
              <div className="mt-8 flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <motion.button
                    key={num}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setData((prev) => ({ ...prev, residents: num }))
                    }
                    className={cn(
                      "h-10 w-10 rounded-xl font-semibold transition-all",
                      data.residents === num
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {num}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );


      case "habits":
        return (
          <motion.div
            variants={staggerContainer}
            initial="enter"
            animate="center"
            className="flex flex-1 flex-col px-6 pt-4"
          >
            <motion.h2 variants={staggerItem} className="mb-2 text-2xl font-bold text-foreground">
              {l.yourHabits}
            </motion.h2>
            <motion.p variants={staggerItem} className="mb-6 text-muted-foreground">{l.selectHabits}</motion.p>
            <div className="grid grid-cols-2 gap-3">
              {l.habits.map((habit: any, index: number) => (
                <motion.button
                  key={habit.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...appleSpring, delay: 0.15 + index * 0.06 }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => toggleHabit(habit.id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-300",
                    data.habits?.includes(habit.id)
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/15"
                      : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-2xl">{habit.icon}</span>
                    {data.habits?.includes(habit.id) && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={appleSpring}>
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {habit.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {habit.description}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case "consumables":
        return (
          <motion.div
            variants={staggerContainer}
            initial="enter"
            animate="center"
            className="flex flex-1 flex-col px-6 pt-4 overflow-y-auto"
          >
            <motion.div variants={staggerItem} className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{(l as any).consumables}</h2>
            </motion.div>
            <motion.p variants={staggerItem} className="mb-5 text-muted-foreground text-sm">{(l as any).consumablesDesc}</motion.p>

            {/* List of consumables */}
            <div className="space-y-3 mb-4">
              {onboardingConsumables.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...appleSpring, delay: 0.1 + index * 0.05 }}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-semibold text-foreground text-sm">{item.name}</span>
                      <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                        {(l as any).consumableCategories[item.category]}
                      </span>
                    </div>
                    <button
                      onClick={() => setOnboardingConsumables(prev => prev.filter((_, i) => i !== index))}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{(l as any).consumableStock}</label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={item.currentStock}
                          onKeyDown={(e) => {
                            if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            setOnboardingConsumables(prev => prev.map((c, i) => i === index ? { ...c, currentStock: val } : c));
                          }}
                          className="h-9 w-full rounded-xl bg-muted/30 border-none px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{(l as any).consumableMinStock}</label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={item.minStock}
                          onKeyDown={(e) => {
                            if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            setOnboardingConsumables(prev => prev.map((c, i) => i === index ? { ...c, minStock: val } : c));
                          }}
                          className="h-9 w-full rounded-xl bg-muted/30 border-none px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{(l as any).consumableUsage}</label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={item.dailyConsumption}
                        onKeyDown={(e) => {
                          if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          setOnboardingConsumables(prev => prev.map((c, i) => i === index ? { ...c, dailyConsumption: val } : c));
                        }}
                        className="h-9 w-full rounded-xl bg-muted/30 border-none px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{(l as any).consumableUsageType}</label>
                      <div className="flex gap-1 mt-0.5">
                        <button
                          onClick={() => setOnboardingConsumables(prev => prev.map((c, i) => i === index ? { ...c, usageType: "daily" } : c))}
                          className={cn(
                            "flex-1 h-9 rounded-xl text-xs font-semibold transition-all",
                            item.usageType === "daily"
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {(l as any).consumableDaily}
                        </button>
                        <button
                          onClick={() => setOnboardingConsumables(prev => prev.map((c, i) => i === index ? { ...c, usageType: "weekly" } : c))}
                          className={cn(
                            "flex-1 h-9 rounded-xl text-xs font-semibold transition-all",
                            item.usageType === "weekly"
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {(l as any).consumableWeekly}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add new consumable form */}
            {showAddConsumable ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3"
              >
                <Input
                  placeholder={(l as any).consumableName}
                  value={newConsumable.name}
                  onChange={(e) => setNewConsumable(prev => ({ ...prev, name: e.target.value }))}
                  className="h-10 rounded-xl bg-background border-border text-sm font-medium"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{(l as any).consumableCategory}</label>
                    <select
                      value={newConsumable.category}
                      onChange={(e) => setNewConsumable(prev => ({ ...prev, category: e.target.value }))}
                      className="h-9 w-full rounded-xl bg-muted/30 border-none px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mt-0.5"
                    >
                      {Object.entries((l as any).consumableCategories).map(([key, label]) => (
                        <option key={key} value={key}>{label as string}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{(l as any).consumableUnit}</label>
                    <Input
                      value={newConsumable.unit}
                      onChange={(e) => setNewConsumable(prev => ({ ...prev, unit: e.target.value }))}
                      className="h-9 rounded-xl bg-muted/30 border-none text-xs font-semibold mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{(l as any).consumableStock}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newConsumable.currentStock ?? ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(",", ".");
                        if (val === "" || val === ".") {
                          setNewConsumable(prev => ({ ...prev, currentStock: 0 as any }));
                          return;
                        }
                        const num = parseFloat(val);
                        if (!isNaN(num)) {
                          setNewConsumable(prev => ({ ...prev, currentStock: num }));
                        }
                      }}
                      className="h-9 w-full rounded-xl bg-muted/30 border-none px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{(l as any).consumableMinStock}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newConsumable.minStock ?? ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(",", ".");
                        if (val === "" || val === ".") {
                          setNewConsumable(prev => ({ ...prev, minStock: 0 as any }));
                          return;
                        }
                        const num = parseFloat(val);
                        if (!isNaN(num)) {
                          setNewConsumable(prev => ({ ...prev, minStock: num }));
                        }
                      }}
                      className="h-9 w-full rounded-xl bg-muted/30 border-none px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{(l as any).consumableUsage}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newConsumable.dailyConsumption ?? ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(",", ".");
                        if (val === "" || val === ".") {
                          setNewConsumable(prev => ({ ...prev, dailyConsumption: 0 as any }));
                          return;
                        }
                        const num = parseFloat(val);
                        if (!isNaN(num)) {
                          setNewConsumable(prev => ({ ...prev, dailyConsumption: num }));
                        }
                      }}
                      className="h-9 w-full rounded-xl bg-muted/30 border-none px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{(l as any).consumableUsageType}</label>
                    <div className="flex gap-1 mt-0.5">
                      <button
                        onClick={() => setNewConsumable(prev => ({ ...prev, usageType: "daily" }))}
                        className={cn(
                          "flex-1 h-9 rounded-xl text-[10px] font-semibold transition-all",
                          newConsumable.usageType === "daily"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {(l as any).consumableDaily}
                      </button>
                      <button
                        onClick={() => setNewConsumable(prev => ({ ...prev, usageType: "weekly" }))}
                        className={cn(
                          "flex-1 h-9 rounded-xl text-[10px] font-semibold transition-all",
                          newConsumable.usageType === "weekly"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {(l as any).consumableWeekly}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddConsumable(false)}
                    className="flex-1 rounded-xl h-10"
                  >
                    {(l as any).cancel}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newConsumable.name.trim()) {
                        setOnboardingConsumables(prev => [...prev, { ...(newConsumable as any) }]);
                        setNewConsumable({ name: "", icon: "📦", category: "other", unit: "un", currentStock: 1, minStock: 1, dailyConsumption: 1, usageType: "daily" });
                        setShowAddConsumable(false);
                      }
                    }}
                    className="flex-1 rounded-xl h-10"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {(l as any).save}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                variants={staggerItem}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAddConsumable(true)}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 p-4 text-primary font-semibold text-sm transition-all hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
                {(l as any).consumableAdd}
              </motion.button>
            )}
          </motion.div>
        );

      case "notifications":
        return (
          <motion.div
            variants={staggerContainer}
            initial="enter"
            animate="center"
            className="flex flex-1 flex-col px-6 pt-4"
          >
            <motion.div variants={staggerItem} className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{l.notifications}</h2>
            </motion.div>
            <motion.p variants={staggerItem} className="mb-6 text-muted-foreground text-sm">{l.notifDesc}</motion.p>
            <div className="space-y-3">
              {l.notifOptions.map((notif: any, index: number) => (
                <motion.button
                  key={notif.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ ...appleSpring, delay: 0.15 + index * 0.06 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleNotification(notif.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border-2 p-4 w-full text-left transition-all duration-300",
                    data.notificationPrefs?.includes(notif.id)
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/15"
                      : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                  )}
                >
                  <span className="text-2xl">{notif.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground block">{notif.label}</span>
                    <span className="text-xs text-muted-foreground">{notif.description}</span>
                  </div>
                  <div className={cn(
                    "h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0",
                    data.notificationPrefs?.includes(notif.id)
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}>
                    {data.notificationPrefs?.includes(notif.id) && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={appleSpring}>
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case "complete":
        return (
          <motion.div
            variants={staggerContainer}
            initial="enter"
            animate="center"
            className="flex flex-1 flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...appleSpring, delay: 0.1 }}
              className="relative mb-8"
            >
              <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/30">
                <ChefHat className="h-14 w-14 text-primary-foreground" />
              </div>
              <motion.div
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ ...appleSpring, delay: 0.4 }}
                className="absolute -right-2 top-0 text-3xl"
              >
                🎉
              </motion.div>
            </motion.div>
            <motion.h1 variants={staggerItem} className="mb-3 text-3xl font-bold text-foreground">
              {l.allReady}
            </motion.h1>
            <motion.p variants={staggerItem} className="mb-8 text-lg text-muted-foreground">
              {l.readyDesc}
            </motion.p>
            <div className="space-y-3 w-full max-w-xs">
              {l.readyItems.map((text: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...appleSpring, delay: 0.3 + i * 0.12 }}
                  className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...appleSpring, delay: 0.5 + i * 0.12 }}
                    className={cn(
                      "text-lg font-bold",
                      i === 0
                        ? "text-fresh"
                        : i === 1
                          ? "text-primary"
                          : "text-warning"
                    )}
                  >
                    ✓
                  </motion.span>
                  <span className="text-sm font-medium text-foreground">
                    {text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex min-h-screen flex-col bg-primary/5"
    >
      {/* Top bar with Sign Out */}
      <div className="flex justify-end px-4 pt-safe pt-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 rounded-full bg-background/70 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          {language === "pt-BR" ? "Sair" : language === "es" ? "Salir" : "Sign out"}
        </button>
      </div>
      {currentStep > 0 && currentStep < steps.length - 1 && (
        <div className="px-6 pt-safe">
          <div className="flex justify-center gap-2 py-4">
            {steps.slice(1, -1).map((_, index) => (
              <motion.div
                key={index}
                layout
                transition={{ ...appleSpring, duration: 0.4 }}
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-300",
                  index < currentStep
                    ? "w-10 bg-primary"
                    : index === currentStep - 1
                      ? "w-10 bg-primary/50"
                      : "w-6 bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      )}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex flex-1 flex-col"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...appleSpring, delay: 0.2 }}
        className="p-6 pb-safe"
      >
        {currentStep === steps.length - 1 ? (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 transition-all"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {l.startUsing}
            </Button>
          </motion.div>
        ) : (
          <div className="flex gap-3">
            {currentStep > 0 && (
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={handleBack}
                  variant="outline"
                  size="lg"
                  className="h-14 px-5 rounded-2xl transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
            <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
              <Button
                onClick={handleNext}
                className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 transition-all"
                size="lg"
              >
                {currentStep === 0 ? l.startSetup : l.continue}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
