import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Language = 'pt-BR' | 'en' | 'es';

interface Translations {
  // Common
  save: string;
  cancel: string;
  close: string;
  delete: string;
  edit: string;
  add: string;
  search: string;
  loading: string;
  // Navigation
  home: string;
  fridge: string;
  recipes: string;
  shopping: string;
  settings: string;
  // Home Tab
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  expiringToday: string;
  expiringSoon: string;
  lowStock: string;
  overripe: string;
  noAlerts: string;
  allGood: string;
  suggestedRecipes: string;
  viewAll: string;
  // Fridge Tab
  myFridge: string;
  items: string;
  addItem: string;
  empty: string;
  expiresIn: string;
  days: string;
  expired: string;
  // Recipes Tab
  recipesTitle: string;
  generateRecipes: string;
  noRecipes: string;
  prepTime: string;
  servings: string;
  ingredients: string;
  instructions: string;
  // Shopping Tab
  shoppingList: string;
  addToList: string;
  share: string;
  clearCompleted: string;
  completed: string;
  // Settings
  profile: string;
  notifications: string;
  darkMode: string;
  language: string;
  integrations: string;
  voiceAssistants: string;
  smartFridge: string;
  privacy: string;
  faq: string;
  logout: string;
  clearData: string;
  myPlan: string;
  // Alerts
  consumeToday: string;
  buyAlert: string;
  // Units
  units: string;
  kg: string;
  g: string;
  l: string;
  ml: string;
  un: string;
}

const translations: Record<Language, Translations> = {
  'pt-BR': {
    save: 'Salvar',
    cancel: 'Cancelar',
    close: 'Fechar',
    delete: 'Excluir',
    edit: 'Editar',
    add: 'Adicionar',
    search: 'Buscar',
    loading: 'Carregando...',
    home: 'Início',
    fridge: 'Geladeira',
    recipes: 'Receitas',
    shopping: 'Lista',
    settings: 'Ajustes',
    goodMorning: 'Bom dia',
    goodAfternoon: 'Boa tarde',
    goodEvening: 'Boa noite',
    expiringToday: 'Vence hoje',
    expiringSoon: 'Vencendo em breve',
    lowStock: 'Estoque baixo',
    overripe: 'Muito maduro',
    noAlerts: 'Sem alertas',
    allGood: 'Tudo sob controle!',
    suggestedRecipes: 'Receitas sugeridas',
    viewAll: 'Ver todas',
    myFridge: 'Minha Geladeira',
    items: 'itens',
    addItem: 'Adicionar item',
    empty: 'Vazio',
    expiresIn: 'Vence em',
    days: 'dias',
    expired: 'Vencido',
    recipesTitle: 'Receitas',
    generateRecipes: 'Gerar receitas',
    noRecipes: 'Sem receitas',
    prepTime: 'Tempo de preparo',
    servings: 'Porções',
    ingredients: 'Ingredientes',
    instructions: 'Modo de preparo',
    shoppingList: 'Lista de Compras',
    addToList: 'Adicionar à lista',
    share: 'Compartilhar',
    clearCompleted: 'Limpar concluídos',
    completed: 'Concluído',
    profile: 'Perfil',
    notifications: 'Notificações',
    darkMode: 'Modo escuro',
    language: 'Idioma',
    integrations: 'Integrações',
    voiceAssistants: '',
    smartFridge: 'Geladeira Smart',
    privacy: 'Privacidade',
    faq: 'Ajuda e FAQ',
    logout: 'Sair',
    clearData: 'Limpar dados',
    myPlan: 'Meu Plano',
    consumeToday: 'Consumir hoje',
    buyAlert: 'Hora de comprar',
    units: 'unidades',
    kg: 'kg',
    g: 'g',
    l: 'L',
    ml: 'ml',
    un: 'un',
  },
  en: {
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    home: 'Home',
    fridge: 'Fridge',
    recipes: 'Recipes',
    shopping: 'List',
    settings: 'Settings',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    expiringToday: 'Expires today',
    expiringSoon: 'Expiring soon',
    lowStock: 'Low stock',
    overripe: 'Very ripe',
    noAlerts: 'No alerts',
    allGood: 'Everything under control!',
    suggestedRecipes: 'Suggested recipes',
    viewAll: 'View all',
    myFridge: 'My Fridge',
    items: 'items',
    addItem: 'Add item',
    empty: 'Empty',
    expiresIn: 'Expires in',
    days: 'days',
    expired: 'Expired',
    recipesTitle: 'Recipes',
    generateRecipes: 'Generate recipes',
    noRecipes: 'No recipes',
    prepTime: 'Prep time',
    servings: 'Servings',
    ingredients: 'Ingredients',
    instructions: 'Instructions',
    shoppingList: 'Shopping List',
    addToList: 'Add to list',
    share: 'Share',
    clearCompleted: 'Clear completed',
    completed: 'Completed',
    profile: 'Profile',
    notifications: 'Notifications',
    darkMode: 'Dark mode',
    language: 'Language',
    integrations: 'Integrations',
    voiceAssistants: '',
    smartFridge: 'Smart Fridge',
    privacy: 'Privacy',
    faq: 'Help & FAQ',
    logout: 'Logout',
    clearData: 'Clear data',
    myPlan: 'My Plan',
    consumeToday: 'Consume today',
    buyAlert: 'Time to buy',
    units: 'units',
    kg: 'kg',
    g: 'g',
    l: 'L',
    ml: 'ml',
    un: 'un',
  },
  es: {
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    search: 'Buscar',
    loading: 'Cargando...',
    home: 'Inicio',
    fridge: 'Nevera',
    recipes: 'Recetas',
    shopping: 'Lista',
    settings: 'Ajustes',
    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    expiringToday: 'Vence hoy',
    expiringSoon: 'Por vencer',
    lowStock: 'Stock bajo',
    overripe: 'Muy maduro',
    noAlerts: 'Sin alertas',
    allGood: '¡Todo bajo control!',
    suggestedRecipes: 'Recetas sugeridas',
    viewAll: 'Ver todas',
    myFridge: 'Mi Nevera',
    items: 'artículos',
    addItem: 'Agregar artículo',
    empty: 'Vacío',
    expiresIn: 'Vence en',
    days: 'días',
    expired: 'Vencido',
    recipesTitle: 'Recetas',
    generateRecipes: 'Generar recetas',
    noRecipes: 'Sin recetas',
    prepTime: 'Tiempo de preparación',
    servings: 'Porciones',
    ingredients: 'Ingredientes',
    instructions: 'Preparación',
    shoppingList: 'Lista de Compras',
    addToList: 'Agregar a la lista',
    share: 'Compartir',
    clearCompleted: 'Borrar completados',
    completed: 'Completado',
    profile: 'Perfil',
    notifications: 'Notificaciones',
    darkMode: 'Modo oscuro',
    language: 'Idioma',
    integrations: 'Integraciones',
    voiceAssistants: '',
    smartFridge: 'Nevera Smart',
    privacy: 'Privacidad',
    faq: 'Ayuda y FAQ',
    logout: 'Salir',
    clearData: 'Borrar datos',
    myPlan: 'Mi Plan',
    consumeToday: 'Consumir hoy',
    buyAlert: 'Hora de comprar',
    units: 'unidades',
    kg: 'kg',
    g: 'g',
    l: 'L',
    ml: 'ml',
    un: 'un',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LS_KEY = 'friggo-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Leitura inicial do localStorage — instantânea, sem flash
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(LS_KEY) as Language) || 'pt-BR';
  });

  // Sincroniza lang do documento
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Sincroniza DO banco quando o usuário loga (fonte de verdade = DB)
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('language_preference')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const dbLang = (data as any)?.language_preference as Language | undefined;
        if (dbLang && dbLang !== localStorage.getItem(LS_KEY)) {
          setLanguageState(dbLang);
          localStorage.setItem(LS_KEY, dbLang);
        }
      })
      .catch(() => { /* falha silenciosa — localStorage mantém o valor */ });
  }, [user?.id]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LS_KEY, lang);
    // Persiste no banco (best-effort)
    if (user) {
      (supabase as any)
        .from('profiles')
        .update({ language_preference: lang })
        .eq('user_id', user.id)
        .then(() => {})
        .catch(() => {});
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
