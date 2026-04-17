import { useState } from 'react';
import { useKaza } from '@/contexts/KazaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ItemCard } from '../ItemCard';
import { BarcodeScanner } from '../BarcodeScanner';
import { useNavigate } from 'react-router-dom';
import { Refrigerator, Snowflake, Package, Droplets, Search, ScanBarcode, ChevronDown, ChevronUp, TrendingDown, CheckSquare, Square, Trash2, X, Edit3, AlertTriangle, EyeOff, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ItemLocation, KazaItem } from '@/types/friggo';
import { toast } from 'sonner';

const locationFilters: { id: ItemLocation | 'all'; label: string; labelEn: string; labelEs: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'Todos', labelEn: 'All', labelEs: 'Todos', icon: Package },
    { id: 'fridge', label: 'Geladeira', labelEn: 'Fridge', labelEs: 'Nevera', icon: Refrigerator },
    { id: 'freezer', label: 'Freezer', labelEn: 'Freezer', labelEs: 'Congelador', icon: Snowflake },
    { id: 'pantry', label: 'Dispensa', labelEn: 'Pantry', labelEs: 'Despensa', icon: Package },
    { id: 'cleaning', label: 'Limpeza', labelEn: 'Cleaning', labelEs: 'Limpieza', icon: Droplets },
];

export function FridgeTab() {
    const { items, removeItem, updateItem, consumables, onboardingData, toggleSection: toggleContextSection } = useKaza();
    const { language, t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'items' | 'consumables'>('items');
    const [activeFilter, setActiveFilter] = useState<ItemLocation | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [editingItem, setEditingItem] = useState<KazaItem | null>(null);
    const [editQty, setEditQty] = useState('');
    const [editLocation, setEditLocation] = useState<ItemLocation>('fridge');

    const filteredItems = items.filter((item) => {
        const matchesLocation = activeFilter === 'all' || item.location === activeFilter;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLocation && matchesSearch;
    });

    const groupedItems = filteredItems.reduce((acc, item) => {
        const key = item.category;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    const categoryLabels: Record<string, Record<string, string>> = {
        fruit: { 'pt-BR': '🍎 Frutas', en: '🍎 Fruits', es: '🍎 Frutas' },
        vegetable: { 'pt-BR': '🥬 Legumes e Verduras', en: '🥬 Vegetables', es: '🥬 Verduras' },
        meat: { 'pt-BR': '🍖 Carnes', en: '🍖 Meat', es: '🍖 Carnes' },
        dairy: { 'pt-BR': '🥛 Laticínios', en: '🥛 Dairy', es: '🥛 Lácteos' },
        cooked: { 'pt-BR': '🍲 Comidas Prontas', en: '🍲 Prepared Foods', es: '🍲 Comidas Preparadas' },
        frozen: { 'pt-BR': '❄️ Congelados', en: '❄️ Frozen', es: '❄️ Congelados' },
        beverage: { 'pt-BR': '🥤 Bebidas', en: '🥤 Beverages', es: '🥤 Bebidas' },
        pantry: { 'pt-BR': '🏪 Dispensa', en: '🏪 Pantry', es: '🏪 Despensa' },
        cleaning: { 'pt-BR': '🧹 Limpeza', en: '🧹 Cleaning', es: '🧹 Limpieza' },
        hygiene: { 'pt-BR': '🧴 Higiene', en: '🧴 Hygiene', es: '🧴 Higiene' },
    };

    const labels = {
        'pt-BR': {
            pantry: 'Dispensa', itemsTotal: 'itens no total', scanner: 'Scanner',
            searchItems: 'Buscar itens...', noItems: 'Nenhum item encontrado',
            tryAnother: 'Tente outra busca', addItems: 'Adicione itens usando o botão +',
            items: 'Itens', consumables: 'Consumíveis', select: 'Selecionar',
            selectAll: 'Todos', deleteSelected: 'Excluir', cancel: 'Cancelar',
            selected: 'selecionados', deleted: 'itens excluídos', edit: 'Editar',
            editItem: 'Editar Item', save: 'Salvar', qty: 'Quantidade', location: 'Local',
            refreeze: 'Recongelar', refrozen: 'recongelado', lowStock: 'Estoque baixo',
            daysLeft: 'dias restantes', runningLow: 'Acabando',
        },
        en: {
            pantry: 'Pantry', itemsTotal: 'total items', scanner: 'Scanner',
            searchItems: 'Search items...', noItems: 'No items found',
            tryAnother: 'Try another search', addItems: 'Add items using the + button',
            items: 'Items', consumables: 'Consumables', select: 'Select',
            selectAll: 'All', deleteSelected: 'Delete', cancel: 'Cancel',
            selected: 'selected', deleted: 'items deleted', edit: 'Edit',
            editItem: 'Edit Item', save: 'Save', qty: 'Quantity', location: 'Location',
            refreeze: 'Re-freeze', refrozen: 're-frozen', lowStock: 'Low stock',
            daysLeft: 'days left', runningLow: 'Running low',
        },
        es: {
            pantry: 'Despensa', itemsTotal: 'artículos en total', scanner: 'Escáner',
            searchItems: 'Buscar artículos...', noItems: 'No se encontraron artículos',
            tryAnother: 'Intenta otra búsqueda', addItems: 'Añade artículos usando el botón +',
            items: 'Artículos', consumables: 'Consumibles', select: 'Seleccionar',
            selectAll: 'Todos', deleteSelected: 'Eliminar', cancel: 'Cancelar',
            selected: 'seleccionados', deleted: 'artículos eliminados', edit: 'Editar',
            editItem: 'Editar Artículo', save: 'Guardar', qty: 'Cantidad', location: 'Ubicación',
            refreeze: 'Recongelar', refrozen: 'recongelado', lowStock: 'Stock bajo',
            daysLeft: 'días restantes', runningLow: 'Agotándose',
        },
    };

    const l = labels[language];

    const toggleCategory = (category: string) => {
        setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
    };

    const getFilterLabel = (filter: typeof locationFilters[0]) => {
        if (language === 'en') return filter.labelEn;
        if (language === 'es') return filter.labelEs;
        return filter.label;
    };

    // Selection handlers
    const toggleSelection = (id: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedItems.size === filteredItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredItems.map(i => i.id)));
        }
    };

    const deleteSelected = () => {
        selectedItems.forEach(id => removeItem(id));
        const count = selectedItems.size;
        setSelectedItems(new Set());
        setSelectionMode(false);
        toast.success(`${count} ${l.deleted}`);
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedItems(new Set());
    };

    // Edit handlers
    const startEdit = (item: KazaItem) => {
        setEditingItem(item);
        setEditQty(String(item.quantity));
        setEditLocation(item.location);
    };

    const saveEdit = () => {
        if (!editingItem) return;
        const qty = parseFloat(editQty);
        if (!qty || qty <= 0) return;
        updateItem(editingItem.id, { quantity: qty, location: editLocation });
        setEditingItem(null);
        toast.success(`${editingItem.name} atualizado`);
    };

    // Re-freeze handler
    const refreezeItem = (item: KazaItem) => {
        updateItem(item.id, { location: 'freezer' });
        toast.success(`${item.name} ${l.refrozen}`);
    };

    const INTERVAL_FACTORS = {
        daily: 1,
        weekly: 7,
        fortnightly: 14,
        monthly: 30
    };

    const residents = onboardingData?.residents || 1;

    // Calculate low-stock consumables
    const lowStockConsumables = consumables.filter(c => {
        const factor = INTERVAL_FACTORS[c.usageInterval || 'daily'];
        const dailyUse = (c.dailyConsumption / factor) * residents;
        const daysLeft = dailyUse > 0 ? c.currentStock / dailyUse : Infinity;
        return daysLeft <= 7 || c.currentStock <= (c.minStock || 0);
    });

    const allSelected = selectionMode && selectedItems.size === filteredItems.length && filteredItems.length > 0;

    return (
        <div className="space-y-4 pb-24">

            {/* Selection toolbar (when active) */}
            {selectionMode && (
                <div className="flex items-center justify-between rounded-2xl bg-primary/5 border border-primary/10 p-3 animate-slide-down">
                    <div className="flex items-center gap-3">
                        <button onClick={selectAll} className="flex items-center gap-2 text-sm font-semibold text-primary active:scale-[0.97] transition-all">
                            {selectedItems.size === filteredItems.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            {l.selectAll}
                        </button>
                        <span className="text-xs text-muted-foreground">{selectedItems.size} {l.selected}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedItems.size > 0 && (
                            <Button onClick={deleteSelected} variant="destructive" size="sm" className="rounded-xl h-9 gap-1.5 active:scale-[0.97] transition-all">
                                <Trash2 className="h-3.5 w-3.5" />
                                {l.deleteSelected} ({selectedItems.size})
                            </Button>
                        )}
                        <button
                            onClick={exitSelectionMode}
                            className="flex items-center gap-1.5 rounded-xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/10 px-3 py-2 text-sm font-semibold text-foreground transition-all active:scale-[0.97] shadow-sm"
                        >
                            <X className="h-4 w-4" />
                            {l.cancel}
                        </button>
                    </div>
                </div>
            )}

            {/* Low-stock consumables alert */}
            {lowStockConsumables.length > 0 && !selectionMode && !onboardingData?.hiddenSections?.includes('fridge-low-stock') && (
                <div className="rounded-2xl bg-warning/10 border border-warning/20 p-4 animate-scale-in">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            <p className="text-sm font-bold text-warning">{l.runningLow}</p>
                        </div>
                        <button
                            onClick={() => toggleContextSection('fridge-low-stock')}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-warning hover:bg-warning/30 active:scale-90 transition-all"
                        >
                            <EyeOff className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {lowStockConsumables.map(c => {
                            const factor = INTERVAL_FACTORS[c.usageInterval || 'daily'];
                            const dailyUse = (c.dailyConsumption / factor) * residents;
                            const daysLeft = dailyUse ? Math.floor(c.currentStock / dailyUse) : 0;
                            return (
                                <div key={c.id} className="flex items-center justify-between rounded-xl bg-white/60 dark:bg-white/5 px-3 py-2">
                                    <span className="text-sm font-medium">{c.icon} {c.name}</span>
                                    <span className="text-xs font-bold text-warning">{daysLeft} {l.daysLeft}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tabs for Items vs Consumables */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'items' | 'consumables')} className="w-full">
                <TabsList className="w-full grid grid-cols-2 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] p-1">
                    <TabsTrigger value="items" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm gap-2 font-semibold">
                        <Package className="h-4 w-4" />
                        {l.items}
                    </TabsTrigger>
                    <TabsTrigger value="consumables" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm gap-2 font-semibold">
                        <TrendingDown className="h-4 w-4" />
                        {l.consumables}
                        {lowStockConsumables.length > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-warning-foreground">{lowStockConsumables.length}</span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="mt-4 space-y-4">
                    {/* Search row with scanner + select-all icons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setScannerOpen(true)}
                            title={l.scanner}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 text-primary shadow-sm transition-all active:scale-[0.95]"
                        >
                            <ScanBarcode className="h-5 w-5" />
                        </button>
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={l.searchItems}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 rounded-2xl border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl pl-10 text-[15px] shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => { setSelectionMode(true); selectAll(); }}
                            title={l.selectAll}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 text-foreground shadow-sm transition-all active:scale-[0.95]"
                        >
                            <CheckSquare className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Location Filters — hidden when all items selected */}
                    {!allSelected && <div className="flex flex-wrap gap-2">
                        {locationFilters.map((filter) => {
                            const Icon = filter.icon;
                            const isActive = activeFilter === filter.id;
                            const count = filter.id === 'all'
                                ? items.length
                                : items.filter(i => i.location === filter.id).length;

                            return (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.97]',
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                            : 'bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] text-foreground'
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {getFilterLabel(filter)}
                                    <span className={cn(
                                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                        isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-white/10 text-muted-foreground'
                                    )}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>}

                    {/* Items by Category with Collapsible */}
                    {Object.entries(groupedItems).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 rounded-2xl bg-muted/50 p-5">
                                <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold text-foreground">{l.noItems}</p>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchQuery ? l.tryAnother : l.addItems}
                            </p>
                            {searchQuery.trim().length > 0 && (
                                <button
                                    onClick={() => window.location.href = `/app/add-item?name=${encodeURIComponent(searchQuery.trim())}`}
                                    className="mt-4 flex items-center gap-2 rounded-2xl bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition-all active:scale-[0.97]"
                                >
                                    <Plus className="h-4 w-4" />
                                    {language === 'pt-BR' ? `Cadastrar "${searchQuery.trim()}"` : language === 'es' ? `Registrar "${searchQuery.trim()}"` : `Register "${searchQuery.trim()}"`}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(groupedItems).map(([category, categoryItems]) => (
                                <section key={category} className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/5"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <h2 className="text-sm font-bold text-foreground">
                                                {categoryLabels[category]?.[language] || category}
                                            </h2>
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                                                {categoryItems.length}
                                            </span>
                                        </div>
                                        {collapsedCategories[category] ? (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </button>
                                    {!collapsedCategories[category] && (
                                        <div className="space-y-2 px-3 pb-3 pt-1 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                                            {categoryItems.map((item) => (
                                                <div key={item.id} className="relative">
                                                    {selectionMode && (
                                                        <button
                                                            onClick={() => toggleSelection(item.id)}
                                                            className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-black shadow transition-all active:scale-90"
                                                        >
                                                            {selectedItems.has(item.id) ? (
                                                                <CheckSquare className="h-5 w-5 text-primary" />
                                                            ) : (
                                                                <Square className="h-5 w-5 text-muted-foreground" />
                                                            )}
                                                        </button>
                                                    )}
                                                    <div className={cn(selectionMode && "ml-8 transition-all")}>
                                                        <ItemCard
                                                            item={item}
                                                            onConsume={(i) => selectionMode ? toggleSelection(i.id) : navigate(`/app/consume/${i.id}`)}
                                                            onEdit={!selectionMode ? startEdit : undefined}
                                                            onRefreeze={!selectionMode && item.location !== 'freezer' ? refreezeItem : undefined}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="consumables" className="mt-4 space-y-4">
                    {/* Low stock alerts */}
                    {lowStockConsumables.length > 0 && !onboardingData?.hiddenSections?.includes('fridge-low-stock') && (
                        <div className="space-y-2 animate-fade-in mb-6">
                            <div className="flex items-center justify-between px-1 mb-2">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{l.lowStock}</h3>
                                <button
                                    onClick={() => toggleContextSection('fridge-low-stock')}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-90 transition-all"
                                >
                                    <EyeOff className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            {lowStockConsumables.map(c => {
                                const factor = INTERVAL_FACTORS[c.usageInterval || 'daily'];
                                const dailyUse = (c.dailyConsumption / factor) * residents;
                                const daysLeft = dailyUse ? Math.floor(c.currentStock / dailyUse) : 0;
                                const isOut = c.currentStock <= 0;
                                const isCritical = daysLeft <= 2;
                                return (
                                    <div key={c.id} className={cn(
                                        "flex items-center justify-between rounded-2xl border p-4 transition-all",
                                        isOut ? "bg-destructive/10 border-destructive/20" :
                                        isCritical ? "bg-warning/10 border-warning/20" :
                                        "bg-primary/5 border-primary/10"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{c.icon}</span>
                                            <div>
                                                <p className="text-sm font-semibold">{c.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {c.currentStock.toFixed(2)} {c.unit} • {c.dailyConsumption}/{language === 'pt-BR' ? 'dia' : language === 'en' ? 'day' : 'día'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "rounded-full px-3 py-1 text-xs font-bold",
                                            isOut ? "bg-destructive/20 text-destructive" :
                                            isCritical ? "bg-warning/20 text-warning" :
                                            "bg-primary/10 text-primary"
                                        )}>
                                            {isOut ? (language === 'pt-BR' ? 'Esgotado' : 'Out') : `${daysLeft}d`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="rounded-2xl border border-black/[0.04] dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl overflow-hidden shadow-sm">
                        <button
                            onClick={() => navigate('/app/consumables')}
                            className="flex w-full items-center justify-between p-4 text-left transition-all hover:bg-muted/50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                                    <TrendingDown className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">
                                        {language === 'pt-BR' ? 'Rastrear Consumíveis' : language === 'en' ? 'Track Consumables' : 'Rastrear Consumibles'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {language === 'pt-BR' ? 'Papel higiênico, detergente, etc.' : language === 'en' ? 'Toilet paper, detergent, etc.' : 'Papel higiénico, detergente, etc.'}
                                    </p>
                                </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-primary/10 p-2">
                                <TrendingDown className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">
                                    {language === 'pt-BR' ? 'Como funciona?' : language === 'en' ? 'How it works?' : '¿Cómo funciona?'}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {language === 'pt-BR'
                                        ? 'Adicione itens de uso diário e o app calcula quando você precisa comprar novamente. Debite o consumo à noite e receba alertas de reposição.'
                                        : language === 'en'
                                            ? 'Add daily use items and the app calculates when you need to buy again. Log consumption at night and receive replenishment alerts.'
                                            : 'Añade artículos de uso diario y la app calcula cuándo necesitas comprar de nuevo. Registra el consumo por la noche y recibe alertas de reposición.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Quick Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center animate-backdrop bg-black/40" onClick={() => setEditingItem(null)}>
                    <div className="w-full max-w-lg rounded-t-3xl bg-[#fafafa] dark:bg-[#1a1a1a] p-6 pb-10 animate-sheet-up" onClick={e => e.stopPropagation()}>
                        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Edit3 className="h-5 w-5 text-primary" />
                            {l.editItem}: {editingItem.name}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold">{l.qty}</label>
                                <Input
                                    inputMode="decimal"
                                    type="text"
                                    value={editQty}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(',', '.');
                                        if (v === '' || /^\d*\.?\d*$/.test(v)) setEditQty(v);
                                    }}
                                    className="h-14 rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl text-base shadow-sm mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold">{l.location}</label>
                                <div className="flex gap-2 mt-2">
                                    {locationFilters.filter(f => f.id !== 'all').map(loc => (
                                        <button
                                            key={loc.id}
                                            onClick={() => setEditLocation(loc.id as ItemLocation)}
                                            className={cn(
                                                "flex-1 rounded-xl py-3 text-xs font-bold transition-all active:scale-95",
                                                editLocation === loc.id
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "bg-white/80 dark:bg-white/5 text-muted-foreground border border-black/[0.04] dark:border-white/[0.06]"
                                            )}
                                        >
                                            {getFilterLabel(loc)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={saveEdit} className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.97]">
                                {l.save}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Barcode Scanner Modal */}
            <BarcodeScanner
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
            />
        </div>
    );
}
