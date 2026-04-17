import { useState, useCallback, useMemo } from 'react';
import { useKaza } from '@/contexts/FriggoContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCard } from '../AlertCard';
import { ItemCard } from '../ItemCard';
import { CurrentPlanBadge } from '../CurrentPlanBadge';
import { PlanLimitCard } from '../PlanLimitCard';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { allRecipes } from '@/data/recipeDatabase';
import {
    BarChart3,
    Moon,
    Package,
    AlertTriangle,
    ShoppingCart,
    Clock,
    ChevronRight,
    Bell,
    Refrigerator,
    X,
    Search,
    Lightbulb,
    TrendingDown,
    Plus,
    CheckCircle2,
    Trash2,
    EyeOff,
} from 'lucide-react';

type ActiveSection = 'fridge' | 'expiring' | 'alerts' | 'shopping' | null;

const labels = {
    'pt-BR': {
        hello: 'Olá',
        yourHome: 'Início',
        monthlyReport: 'Relatório Mensal',
        monthlyReportSub: 'Resumo do mês',
        nightCheckup: 'Check-up Noturno',
        nightCheckupSub: 'Revisão diária',
        expiringSoon: 'Vencendo em breve',
        items: 'itens',
        recentlyAdded: 'Adicionados recentemente',
        inFridge: 'Na geladeira',
        expiresToday: 'Vence hoje',
        alerts: 'Alertas',
        toBuy: 'Comprar',
        seeAll: 'Ver todos',
        tagline: 'Menos desperdício, mais economia.',
        noItems: 'Nenhum item aqui.',
        shoppingItems: 'Lista de compras',
        alertsSection: 'Alertas ativos',
        fridgeSection: 'Itens na geladeira',
        expiringSection: 'Vencendo hoje',
        empty: 'Nenhum item para exibir.',
        searchPlaceholder: 'Buscar itens...',
        tipOfDay: 'Dica do dia',
        tryRecipe: 'Experimentar',
        weeklyProgress: 'Progresso da semana',
        consumed: 'Consumidos',
        wasted: 'Desperdiçados',
        addItem: 'Adicionar item',
        consumablesLow: 'Consumíveis acabando',
        daysLeft: 'd restantes',
        addToList: 'Adicionar à lista',
        goodMorning: 'Bom dia',
        goodAfternoon: 'Boa tarde',
        goodEvening: 'Boa noite',
        greetingExpiring: 'item(ns) vencendo hoje!',
        greetingAlerts: 'alerta(s) pendente(s)',
        greetingAllGood: 'Tudo em dia! 🎉',
        payList: 'Guardar lista',
        noResults: 'Nenhum resultado encontrado.',
        useExpiring: 'Use antes que vença:',
    },
    en: {
        hello: 'Hello',
        yourHome: 'Home',
        monthlyReport: 'Monthly Report',
        monthlyReportSub: 'Month summary',
        nightCheckup: 'Night Check-up',
        nightCheckupSub: 'Daily review',
        expiringSoon: 'Expiring soon',
        items: 'items',
        recentlyAdded: 'Recently added',
        inFridge: 'In fridge',
        expiresToday: 'Expires today',
        alerts: 'Alerts',
        toBuy: 'To buy',
        seeAll: 'See all',
        tagline: 'Less waste, more savings.',
        noItems: 'No items here.',
        shoppingItems: 'Shopping list',
        alertsSection: 'Active alerts',
        fridgeSection: 'Items in fridge',
        expiringSection: 'Expiring today',
        empty: 'Nothing to show here.',
        searchPlaceholder: 'Search items...',
        tipOfDay: 'Tip of the day',
        tryRecipe: 'Try it',
        weeklyProgress: 'Weekly progress',
        consumed: 'Consumed',
        wasted: 'Wasted',
        addItem: 'Add item',
        consumablesLow: 'Low consumables',
        daysLeft: 'd left',
        addToList: 'Add to list',
        goodMorning: 'Good morning',
        goodAfternoon: 'Good afternoon',
        goodEvening: 'Good evening',
        greetingExpiring: 'item(s) expiring today!',
        greetingAlerts: 'pending alert(s)',
        greetingAllGood: 'All good! 🎉',
        payList: 'Save list',
        noResults: 'No results found.',
        useExpiring: 'Use before it expires:',
    },
    es: {
        hello: 'Hola',
        yourHome: 'Inicio',
        monthlyReport: 'Reporte Mensual',
        monthlyReportSub: 'Resumen del mes',
        nightCheckup: 'Chequeo Nocturno',
        nightCheckupSub: 'Revisión diaria',
        expiringSoon: 'Por vencer',
        items: 'artículos',
        recentlyAdded: 'Agregados recientemente',
        inFridge: 'En nevera',
        expiresToday: 'Vence hoy',
        alerts: 'Alertas',
        toBuy: 'Comprar',
        seeAll: 'Ver todos',
        tagline: 'Menos desperdicio, más ahorro.',
        noItems: 'Ningún artículo aquí.',
        shoppingItems: 'Lista de compras',
        alertsSection: 'Alertas activas',
        fridgeSection: 'Artículos en nevera',
        expiringSection: 'Vence hoy',
        empty: 'Nada que mostrar aquí.',
        searchPlaceholder: 'Buscar artículos...',
        tipOfDay: 'Consejo del día',
        tryRecipe: 'Probar',
        weeklyProgress: 'Progreso semanal',
        consumed: 'Consumidos',
        wasted: 'Desperdiciados',
        addItem: 'Agregar artículo',
        consumablesLow: 'Consumibles bajos',
        daysLeft: 'd restantes',
        addToList: 'Agregar a la lista',
        goodMorning: 'Buenos días',
        goodAfternoon: 'Buenas tardes',
        goodEvening: 'Buenas noches',
        greetingExpiring: 'artículo(s) por vencer hoy!',
        greetingAlerts: 'alerta(s) pendiente(s)',
        greetingAllGood: '¡Todo en orden! 🎉',
        payList: 'Guardar lista',
        noResults: 'Sin resultados.',
        useExpiring: 'Usa antes de que venza:',
    },
};

const cardSpring = { type: 'spring' as const, stiffness: 300, damping: 28, mass: 0.8 };

export function HomeTab() {
    const { items, alerts, dismissAlert, onboardingData, shoppingList, consumables, addToShoppingList, toggleShoppingItem, itemHistory, markAllShoppingComplete, toggleSection: toggleContextSection } = useKaza();
    const { subscription } = useSubscription();
    const { language } = useLanguage();
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState<ActiveSection>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const l = labels[language];
    const firstName = onboardingData?.name?.split(' ')[0] || l.yourHome;
    const residents = onboardingData?.residents ?? 1;

    // ── Derived data ──
    const fridgeItems = items.filter(i => i.location === 'fridge');
    const urgentAlerts = alerts.filter(a => a.priority === 'high');
    const pendingShopping = shoppingList.filter(i => !i.isCompleted);
    const expiringToday = items.filter(i => {
        if (!i.expirationDate) return false;
        const days = Math.ceil((new Date(i.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 1 && days >= 0;
    });
    const expiringItems = items
        .filter(i => {
            if (!i.expirationDate) return false;
            const days = Math.ceil((new Date(i.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return days <= 3 && days >= 0;
        })
        .sort((a, b) => {
            const da = Math.ceil((new Date(a.expirationDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const db = Math.ceil((new Date(b.expirationDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return da - db;
        });

    // ── Search filter ──
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase();
        return items.filter(i => i.name.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q));
    }, [searchQuery, items]);

    // ── Weekly progress ──
    const weeklyStats = useMemo(() => {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentHistory = (itemHistory || []).filter(h => new Date(h.timestamp).getTime() >= oneWeekAgo);
        const consumed = recentHistory.filter(h => h.action === 'consumed' || h.action === 'cooked').reduce((sum, h) => sum + (h.quantity || 1), 0);
        const wasted = recentHistory.filter(h => h.action === 'discarded').reduce((sum, h) => sum + (h.quantity || 1), 0);
        const total = consumed + wasted || 1;
        return { consumed, wasted, consumedPct: Math.round((consumed / total) * 100), wastedPct: Math.round((wasted / total) * 100) };
    }, [itemHistory]);

    // ── Tip of the day ──
    const tipOfDay = useMemo(() => {
        const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % allRecipes.length;
        // Session offset: changes each app session so consecutive visits see different tips
        let sessionOffset = 0;
        try {
            const stored = sessionStorage.getItem('kaza_tip_offset');
            if (stored !== null) {
                sessionOffset = parseInt(stored, 10);
            } else {
                sessionOffset = Math.floor(Math.random() * allRecipes.length);
                sessionStorage.setItem('kaza_tip_offset', String(sessionOffset));
            }
        } catch { /* sessionStorage unavailable */ }
        const baseIndex = (dayIndex + sessionOffset) % allRecipes.length;
        const expiringNames = expiringItems.map(i => i.name.toLowerCase());
        if (expiringNames.length === 0) return allRecipes[baseIndex] || null;
        const match = allRecipes.find(r =>
            r.ingredients.some(ing => expiringNames.some(e => ing.toLowerCase().includes(e)))
        );
        return match || allRecipes[baseIndex] || null;
    }, [expiringItems]);

    const INTERVAL_FACTORS = {
        daily: 1,
        weekly: 7,
        fortnightly: 14,
        monthly: 30
    };

    // ── Low consumables ──
    const lowConsumables = useMemo(() => {
        return (consumables || []).filter(c => {
            const factor = INTERVAL_FACTORS[c.usageInterval || 'daily'];
            const dailyUse = (c.dailyConsumption / factor) * residents;
            const daysLeft = dailyUse > 0 ? c.currentStock / dailyUse : Infinity;
            return daysLeft <= 5;
        }).map(c => {
            const factor = INTERVAL_FACTORS[c.usageInterval || 'daily'];
            const dailyUse = (c.dailyConsumption / factor) * residents;
            return {
                ...c,
                daysLeft: dailyUse > 0 ? Math.floor(c.currentStock / dailyUse) : Infinity,
            };
        });
    }, [consumables, residents]);

    const toggleSection = useCallback((section: ActiveSection) => {
        setActiveSection(prev => prev === section ? null : section);
    }, []);

    // ── Dynamic greeting ──
    const hour = new Date().getHours();
    const timeEmoji = hour < 12 ? '☀️' : hour < 18 ? '👋' : '🌙';
    const timeGreeting = hour < 12 ? l.goodMorning : hour < 18 ? l.goodAfternoon : l.goodEvening;
    const dynamicSubtitle = useMemo(() => {
        if (expiringToday.length > 0) return `⚠️ ${expiringToday.length} ${l.greetingExpiring}`;
        if (urgentAlerts.length > 0) return `🔔 ${urgentAlerts.length} ${l.greetingAlerts}`;
        return l.greetingAllGood;
    }, [expiringToday.length, urgentAlerts.length, l]);

    const stats = [
        {
            id: 'fridge' as ActiveSection,
            label: l.inFridge,
            value: fridgeItems.length,
            icon: Refrigerator,
            bg: 'bg-blue-50 dark:bg-blue-950/40',
            activeBg: 'bg-blue-500',
            iconColor: 'text-blue-500',
            activeIconColor: 'text-white',
        },
        {
            id: 'expiring' as ActiveSection,
            label: l.expiresToday,
            value: expiringToday.length,
            icon: Clock,
            bg: 'bg-amber-50 dark:bg-amber-950/40',
            activeBg: 'bg-amber-500',
            iconColor: 'text-amber-500',
            activeIconColor: 'text-white',
        },
        {
            id: 'alerts' as ActiveSection,
            label: l.alerts,
            value: urgentAlerts.length,
            icon: AlertTriangle,
            bg: 'bg-red-50 dark:bg-red-950/40',
            activeBg: 'bg-red-500',
            iconColor: 'text-red-500',
            activeIconColor: 'text-white',
        },
        {
            id: 'shopping' as ActiveSection,
            label: l.toBuy,
            value: pendingShopping.length,
            icon: ShoppingCart,
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            activeBg: 'bg-emerald-500',
            iconColor: 'text-emerald-500',
            activeIconColor: 'text-white',
        },
    ];

    // What to show in the inline expanded section
    const sectionTitle: Record<string, string> = {
        fridge: l.fridgeSection,
        expiring: l.expiringSection,
        alerts: l.alertsSection,
        shopping: l.shoppingItems,
    };

    const handleAddConsumableToShopping = (c: typeof lowConsumables[0]) => {
        addToShoppingList({
            name: c.name,
            quantity: c.minStock * 2,
            unit: c.unit,
            category: c.category === 'hygiene' ? 'hygiene' : 'cleaning',
            store: c.category === 'hygiene' ? 'pharmacy' : 'market',
        });
    };

    return (
        <div className="pb-28 space-y-5">

            {/* ── HERO HEADER ── */}
            <div className="relative -mx-4 -mt-0 overflow-hidden">
                <div
                    className="absolute inset-0 rounded-b-[2rem]"
                    style={{ background: "linear-gradient(135deg, #0F3D38 0%, #165A52 100%)" }}
                />
                <div className="absolute inset-0 rounded-b-[2rem] bg-black/10" />

                <div className="relative px-5 pt-8 pb-7">
                    {/* Top bar */}
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-lg">{timeEmoji}</span>
                                <CurrentPlanBadge />
                            </div>
                            <h1 className="text-[30px] md:text-4xl font-bold tracking-tight text-white leading-tight">
                                {timeGreeting}, {firstName}
                            </h1>
                            <motion.p
                                key={dynamicSubtitle}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-1.5 text-sm md:text-base text-white/60 font-medium"
                            >
                                {dynamicSubtitle}
                            </motion.p>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <button
                                onClick={() => setShowSearch(s => !s)}
                                className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white transition-all active:scale-90 hover:bg-white/20"
                            >
                                <Search className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => navigate('/notifications')}
                                className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white transition-all active:scale-90 hover:bg-white/20"
                            >
                                <Bell className="h-5 w-5" />
                                {alerts.length > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                                        {alerts.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ── SEARCH BAR ── */}
                    <AnimatePresence>
                        {showSearch && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={cardSpring}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                                    <input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder={l.searchPlaceholder}
                                        className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-white/30 transition-colors"
                                        autoFocus
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── ACTION CARDS ── */}
                    <div className="grid grid-cols-3 gap-2 mt-6">
                        <button
                            onClick={() => navigate('/monthly-report')}
                            className="group relative overflow-hidden rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.08] p-3.5 text-left transition-all duration-200 active:scale-[0.97] hover:bg-white/[0.12]"
                        >
                            <div className="absolute top-0 right-0 w-12 h-12 bg-primary/20 rounded-full -translate-y-3 translate-x-3 blur-2xl pointer-events-none" />
                            <div className="relative">
                                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/25">
                                    <BarChart3 className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-[11px] font-semibold text-white leading-snug">{l.monthlyReport}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/night-checkup')}
                            className="group relative overflow-hidden rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.08] p-3.5 text-left transition-all duration-200 active:scale-[0.97] hover:bg-white/[0.12]"
                        >
                            <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/15 rounded-full -translate-y-3 translate-x-3 blur-2xl pointer-events-none" />
                            <div className="relative">
                                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/25">
                                    <Moon className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-[11px] font-semibold text-white leading-snug">{l.nightCheckup}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/add-item')}
                            className="group relative overflow-hidden rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.08] p-3.5 text-left transition-all duration-200 active:scale-[0.97] hover:bg-white/[0.12]"
                        >
                            <div className="absolute top-0 right-0 w-12 h-12 rounded-full -translate-y-3 translate-x-3 blur-2xl pointer-events-none" style={{ background: "rgba(22,90,82,0.25)" }} />
                            <div className="relative">
                                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "rgba(22,90,82,0.30)" }}>
                                    <Plus className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-[11px] font-semibold text-white leading-snug">{l.addItem}</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── SEARCH RESULTS ── */}
            <AnimatePresence>
                {searchResults && (
                    <motion.section
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={cardSpring}
                        className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-sm overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.06]">
                            <h2 className="text-sm font-bold text-foreground">{searchResults.length} {l.items}</h2>
                        </div>
                        <div className="p-4 space-y-2">
                            {searchResults.length === 0
                                ? <p className="py-4 text-center text-sm text-muted-foreground">{l.noResults}</p>
                                : <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                                    {searchResults.slice(0, 10).map(item => (
                                        <ItemCard key={item.id} item={item} onConsume={i => navigate(`/consume/${i.id}`)} />
                                    ))}
                                </div>
                            }
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* ── PLAN LIMIT CARDS ── */}
            {subscription && subscription.plan !== 'premium' && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <PlanLimitCard type="items" currentCount={items.length} onUpgrade={() => navigate('/plans')} />
                    <PlanLimitCard type="recipes" onUpgrade={() => navigate('/plans')} />
                </div>
            )}

            {/* ── WEEKLY PROGRESS ── */}
            {(weeklyStats.consumed > 0 || weeklyStats.wasted > 0) && (
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...cardSpring, delay: 0.05 }}
                    className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-sm p-4"
                >
                    <h2 className="text-sm font-bold text-foreground mb-3">{l.weeklyProgress}</h2>
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 shrink-0">
                            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" stroke="currentColor" className="text-muted/30" />
                                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" stroke="currentColor" className="text-emerald-500"
                                    strokeDasharray={`${weeklyStats.consumedPct} ${100 - weeklyStats.consumedPct}`}
                                    strokeLinecap="round" />
                                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" stroke="currentColor" className="text-red-400"
                                    strokeDasharray={`${weeklyStats.wastedPct} ${100 - weeklyStats.wastedPct}`}
                                    strokeDashoffset={`-${weeklyStats.consumedPct}`}
                                    strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-foreground">{weeklyStats.consumedPct}%</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-xs text-muted-foreground">{l.consumed}</span>
                                </div>
                                <span className="text-sm font-bold text-foreground">{weeklyStats.consumed}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <span className="text-xs text-muted-foreground">{l.wasted}</span>
                                </div>
                                <span className="text-sm font-bold text-foreground">{weeklyStats.wasted}</span>
                            </div>
                        </div>
                    </div>
                </motion.section>
            )}

            {/* ── QUICK STATS with AnimatePresence ── */}
            <div className="grid grid-cols-4 gap-2">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    const isActive = activeSection === stat.id;
                    return (
                        <motion.button
                            key={stat.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ ...cardSpring, delay: i * 0.05 }}
                            onClick={() => toggleSection(stat.id)}
                            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center transition-all duration-200 active:scale-[0.95] ${isActive ? stat.activeBg + ' shadow-lg' : 'bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06]'}`}
                        >
                            <Icon className={`h-[18px] w-[18px] ${isActive ? stat.activeIconColor : stat.iconColor}`} />
                            <span className={`block text-lg font-bold leading-none ${isActive ? 'text-white' : 'text-foreground'}`}>{stat.value}</span>
                            <span className={`block text-[9px] leading-tight font-medium ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>{stat.label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* ── INLINE EXPANDED SECTION ── */}
            <AnimatePresence mode="wait">
                {activeSection && (
                    <motion.section
                        key={activeSection}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={cardSpring}
                        className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-sm overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                            <h2 className="text-sm font-bold text-foreground">{sectionTitle[activeSection]}</h2>
                            <button
                                onClick={() => setActiveSection(null)}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-2">
                            {activeSection === 'fridge' && (
                                fridgeItems.length === 0
                                    ? <p className="py-6 text-center text-sm text-muted-foreground">{l.empty}</p>
                                    : <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                                        {fridgeItems.map(item => (
                                            <ItemCard key={item.id} item={item} onConsume={i => navigate(`/consume/${i.id}`)} />
                                        ))}
                                    </div>
                            )}
                            {activeSection === 'expiring' && (
                                expiringToday.length === 0
                                    ? <p className="py-6 text-center text-sm text-muted-foreground">{l.empty}</p>
                                    : <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                                        {expiringToday.map(item => (
                                            <ItemCard key={item.id} item={item} onConsume={i => navigate(`/consume/${i.id}`)} />
                                        ))}
                                    </div>
                            )}
                            {activeSection === 'alerts' && (
                                urgentAlerts.length === 0
                                    ? <p className="py-6 text-center text-sm text-muted-foreground">{l.empty}</p>
                                    : <div className="space-y-2">
                                        {urgentAlerts.map(alert => (
                                            <AlertCard key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
                                        ))}
                                    </div>
                            )}
                            {activeSection === 'shopping' && (
                                pendingShopping.length === 0
                                    ? <p className="py-6 text-center text-sm text-muted-foreground">{l.empty}</p>
                                    : <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => markAllShoppingComplete()}
                                                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-all active:scale-[0.97]"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {l.payList}
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {pendingShopping.map(item => (
                                                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-white/5 px-4 py-3">
                                                    <button
                                                        onClick={() => toggleShoppingItem(item.id)}
                                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90" style={{ borderColor: "#165A52" }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                                                        {item.quantity && (
                                                            <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                            )}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* ── TIP OF THE DAY ── */}
            {tipOfDay && (
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...cardSpring, delay: 0.1 }}
                    className="rounded-2xl border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/80 dark:bg-amber-950/20 backdrop-blur-xl shadow-sm overflow-hidden"
                >
                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                                <Lightbulb className="h-[18px] w-[18px] text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70 dark:text-amber-400/70 mb-1">{l.tipOfDay}</p>
                                {expiringItems.length > 0 && (
                                    <p className="text-[10px] text-amber-600/60 dark:text-amber-400/60 mb-0.5">{l.useExpiring} {expiringItems.slice(0, 2).map(i => i.name).join(', ')}</p>
                                )}
                                <p className="text-sm font-semibold text-foreground leading-snug">{tipOfDay.name}</p>
                                {tipOfDay.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tipOfDay.description}</p>
                                )}
                                <button
                                    onClick={() => navigate(`/recipe/${tipOfDay.id}`, { state: { recipe: tipOfDay } })}
                                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 active:opacity-70"
                                >
                                    {l.tryRecipe} <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.section>
            )}

            {/* ── CONSUMABLES RUNNING LOW ── */}
            {lowConsumables.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...cardSpring, delay: 0.15 }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <h2 className="text-base font-bold text-foreground">{l.consumablesLow}</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            {!onboardingData?.hiddenSections?.includes('home-low-consumables') && (
                                <span className="text-xs text-muted-foreground">{lowConsumables.length} {l.items}</span>
                            )}
                            <button
                                onClick={() => toggleContextSection('home-low-consumables')}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-90 transition-all"
                                title={onboardingData?.hiddenSections?.includes('home-low-consumables') ? 'Exibir' : 'Ocultar'}
                            >
                                <EyeOff className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                    {!onboardingData?.hiddenSections?.includes('home-low-consumables') && (
                    <div className="space-y-2">
                        {lowConsumables.map(c => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 rounded-2xl border border-red-200/40 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 backdrop-blur-xl px-4 py-3"
                            >
                                <span className="text-xl">{c.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {c.currentStock.toFixed(1)} {c.unit} · {c.daysLeft === Infinity ? '∞' : `${c.daysLeft}${l.daysLeft}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleAddConsumableToShopping(c)}
                                    className="flex h-8 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-semibold text-primary transition-all active:scale-[0.95]"
                                >
                                    <ShoppingCart className="h-3 w-3" />
                                    {l.addToList}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                    )}
                </motion.section>
            )}

            {/* ── EXPIRING SOON ── */}
            {expiringItems.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...cardSpring, delay: 0.2 }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base md:text-lg font-bold text-foreground">{l.expiringSoon}</h2>
                        <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {expiringItems.length} {l.items}
                        </span>
                    </div>
                    <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                        {expiringItems.slice(0, 6).map(item => (
                            <ItemCard key={item.id} item={item} onConsume={i => navigate(`/consume/${i.id}`)} />
                        ))}
                    </div>
                </motion.section>
            )}

            {/* ── RECENTLY ADDED ── */}
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...cardSpring, delay: 0.25 }}
            >
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base md:text-lg font-bold text-foreground">{l.recentlyAdded}</h2>
                    {items.length > 4 && (
                        <button className="flex items-center gap-0.5 text-xs md:text-sm text-primary font-medium active:opacity-70">
                            {l.seeAll} <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                    {[...items]
                        .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
                        .slice(0, 4)
                        .map(item => (
                            <ItemCard key={item.id} item={item} onConsume={i => navigate(`/consume/${i.id}`)} />
                        ))}
                </div>
            </motion.section>
        </div>
    );
}
