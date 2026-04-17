import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKaza } from '@/contexts/KazaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingCart, TrendingDown, Calendar, Package, Bell, Plus, Minus, Settings2, ArrowLeft, Users, EyeOff, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';

import { ConsumableItem } from '@/types/friggo';

const INTERVAL_FACTORS = {
    daily: 1,
    weekly: 7,
    fortnightly: 14,
    monthly: 30
};

const ICON_OPTIONS = [
    '🧻', '🧺', '🧴', '🧼', '🪥', '🧽', '🫧', '🪣',
    '🧹', '🪒', '💊', '🩹', '🩺', '🧪', '🪤', '📦',
    '🧃', '🥤', '🧊', '🕯️', '💡', '🔋', '🗑️', '🛁',
];

const defaultConsumables: ConsumableItem[] = [
    { id: '1', name: 'Papel Higiênico', icon: '🧻', currentStock: 12, unit: 'rolos', dailyConsumption: 1, minStock: 4, hidden: false, usageInterval: 'daily' },
    { id: '2', name: 'Papel Toalha', icon: '🧺', currentStock: 4, unit: 'rolos', dailyConsumption: 0.5, minStock: 2, hidden: false, usageInterval: 'daily' },
    { id: '3', name: 'Detergente', icon: '🧴', currentStock: 2, unit: 'unidades', dailyConsumption: 0.1, minStock: 1, hidden: false, usageInterval: 'daily' },
    { id: '4', name: 'Sabonete', icon: '🧼', currentStock: 3, unit: 'unidades', dailyConsumption: 0.15, minStock: 2, hidden: false, usageInterval: 'daily' },
    { id: '5', name: 'Pasta de Dente', icon: '🪥', currentStock: 2, unit: 'tubos', dailyConsumption: 0.05, minStock: 1, hidden: false, usageInterval: 'daily' },
];

const LABELS = {
    'pt-BR': {
        title: 'Consumíveis',
        consumptionLogged: 'Consumo registrado!',
        restocked: 'Estoque atualizado!',
        save: 'Salvo!',
        addedToList: 'adicionado à lista',
        itemAdded: 'Item adicionado!',
        newItem: 'Novo Item',
        chooseIcon: 'Escolha um ícone',
        itemName: 'Nome do item',
        currentStock: 'Estoque atual',
        unit: 'Unidade',
        dailyUse: 'Consumo por período',
        perPerson: 'por pessoa',
        daily: 'Por dia',
        weekly: 'Por semana',
        fortnightly: 'Por quinzena',
        monthly: 'Por mês',
        dailyTotal: 'Total diário',
        people: 'pessoas',
        minStock: 'Estoque mínimo',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        deleteItem: 'Remover',
        customAmount: 'Quantidade personalizada',
        howItWorks: 'Como funciona?',
        howItWorksDesc: 'O Kaza calcula automaticamente quando seu estoque vai acabar com base no consumo diário e número de moradores.',
        showHidden: 'Mostrar ocultos',
        daysLeft: 'd',
        debit: 'Usar',
        restock: 'Repor',
        addItem: 'Adicionar item',
        editItem: 'Editar item',
        ok: 'OK',
        warning: 'Atenção',
        danger: 'Urgente',
    },
    'en': {
        title: 'Consumables',
        consumptionLogged: 'Consumption logged!',
        restocked: 'Stock updated!',
        save: 'Saved!',
        addedToList: 'added to list',
        itemAdded: 'Item added!',
        newItem: 'New Item',
        chooseIcon: 'Choose an icon',
        itemName: 'Item name',
        currentStock: 'Current stock',
        unit: 'Unit',
        dailyUse: 'Consumption per period',
        perPerson: 'per person',
        daily: 'Per day',
        weekly: 'Per week',
        fortnightly: 'Fortnightly',
        monthly: 'Per month',
        dailyTotal: 'Daily total',
        people: 'people',
        minStock: 'Minimum stock',
        cancel: 'Cancel',
        confirm: 'Confirm',
        deleteItem: 'Remove',
        customAmount: 'Custom amount',
        howItWorks: 'How does it work?',
        howItWorksDesc: 'Kaza automatically calculates when your stock will run out based on daily consumption and number of residents.',
        showHidden: 'Show hidden',
        daysLeft: 'd',
        debit: 'Use',
        restock: 'Restock',
        addItem: 'Add item',
        editItem: 'Edit item',
        ok: 'OK',
        warning: 'Warning',
        danger: 'Urgent',
    },
    'es': {
        title: 'Consumibles',
        consumptionLogged: '¡Consumo registrado!',
        restocked: '¡Stock actualizado!',
        save: '¡Guardado!',
        addedToList: 'agregado a la lista',
        itemAdded: '¡Artículo agregado!',
        newItem: 'Nuevo artículo',
        chooseIcon: 'Elige un ícono',
        itemName: 'Nombre del artículo',
        currentStock: 'Stock actual',
        unit: 'Unidad',
        dailyUse: 'Consumo por período',
        perPerson: 'por persona',
        daily: 'Por día',
        weekly: 'Por semana',
        fortnightly: 'Por quincena',
        monthly: 'Por mes',
        dailyTotal: 'Total diario',
        people: 'personas',
        minStock: 'Stock mínimo',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        deleteItem: 'Eliminar',
        customAmount: 'Cantidad personalizada',
        howItWorks: '¿Cómo funciona?',
        howItWorksDesc: 'Kaza calcula automáticamente cuándo se agotará tu stock según el consumo diario y el número de residentes.',
        showHidden: 'Mostrar ocultos',
        daysLeft: 'd',
        debit: 'Usar',
        restock: 'Reponer',
        addItem: 'Agregar artículo',
        editItem: 'Editar artículo',
        ok: 'OK',
        warning: 'Atención',
        danger: 'Urgente',
    },
} as const;

export default function ConsumableTrackerPage() {
    const navigate = useNavigate();
    const {
        addToShoppingList,
        onboardingData,
        consumables,
        addConsumable,
        updateConsumable,
        removeConsumable
    } = useKaza();
    const { language } = useLanguage();
    const residents = onboardingData?.residents || 2;
    const l = LABELS[language as keyof typeof LABELS] || LABELS['pt-BR'];

    const [screen, setScreen] = useState<'list' | 'add' | 'edit' | 'custom'>('list');
    const [hideMissing, setHideMissing] = useState(false);
    
    // Using strings for inputs to handle comma/dot and empty states reliably
    const [newItem, setNewItem] = useState({ 
        name: '', 
        icon: '📦', 
        dailyConsumption: '1', 
        unit: 'unidades', 
        currentStock: '10', 
        minStock: '2', 
        usageInterval: 'daily' as ConsumableItem['usageInterval'] 
    });

    const [customAction, setCustomAction] = useState<{ id: string; type: 'debit' | 'restock' } | null>(null);
    const [customAmount, setCustomAmount] = useState('1');

    const [editItem, setEditItem] = useState<ConsumableItem | null>(null);
    const [editIcon, setEditIcon] = useState('');
    const [editDailyConsumption, setEditDailyConsumption] = useState('');
    const [editUsageInterval, setEditUsageInterval] = useState<ConsumableItem['usageInterval']>('daily');
    const [editMinStock, setEditMinStock] = useState('');
    const [editName, setEditName] = useState('');

    // Helper to format/parse numeric strings with comma/dot support
    const parseFormattedNumber = (val: string): number => {
        if (!val) return 0;
        return parseFloat(val.replace(',', '.')) || 0;
    };

    const handleNumericInput = (val: string, setter: (v: string) => void) => {
        // Allow empty string, numbers, one dot or one comma
        const sanitized = val.replace(/[^0-9.,]/g, '');
        // Prevent multiple dots/commas
        const dots = (sanitized.match(/[.,]/g) || []).length;
        if (dots <= 1) {
            setter(sanitized);
        }
    };

    const calculateDaysUntilEmpty = (item: ConsumableItem) => {
        const factor = INTERVAL_FACTORS[item.usageInterval || 'daily'];
        const totalDailyUse = (item.dailyConsumption / factor) * residents;
        if (totalDailyUse <= 0) return Infinity;
        const days = item.currentStock / totalDailyUse;
        return days === Infinity ? Infinity : Math.floor(days);
    };

    const getAlertLevel = (daysLeft: number): 'ok' | 'warning' | 'danger' => {
        if (daysLeft <= 3) return 'danger';
        if (daysLeft <= 7) return 'warning';
        return 'ok';
    };

    const handleDebit = (id: string, amount?: number) => {
        const item = consumables.find(i => i.id === id);
        if (item) {
            const debitAmount = amount ?? item.dailyConsumption;
            updateConsumable(id, { currentStock: Math.max(0, item.currentStock - debitAmount) });
            toast.success(l.consumptionLogged);
        }
    };

    const handleAddStock = (id: string, amount: number) => {
        const item = consumables.find(i => i.id === id);
        if (item) {
            updateConsumable(id, { currentStock: item.currentStock + amount });
            toast.success(l.restocked);
        }
    };

    const handleCustomConfirm = () => {
        if (!customAction) return;
        const amt = parseFormattedNumber(customAmount);
        if (Number.isNaN(amt) || amt <= 0) return;
        if (customAction.type === 'debit') handleDebit(customAction.id, amt);
        else handleAddStock(customAction.id, amt);
        setCustomAction(null);
        setCustomAmount('1');
        setScreen('list');
    };

    const handleSaveEdit = () => {
        if (!editItem) return;
        const newDaily = editDailyConsumption === '' ? editItem.dailyConsumption : parseFormattedNumber(editDailyConsumption);
        const newMin = editMinStock === '' ? editItem.minStock : parseFormattedNumber(editMinStock);
        
        updateConsumable(editItem.id, {
            name: editName || editItem.name,
            icon: editIcon || editItem.icon,
            dailyConsumption: newDaily,
            usageInterval: editUsageInterval,
            minStock: newMin,
        });
        
        setEditItem(null);
        setScreen('list');
        toast.success(l.save);
    };

    const openEdit = (item: ConsumableItem) => {
        setEditItem(item);
        setEditName(item.name);
        setEditIcon(item.icon);
        setEditDailyConsumption(String(item.dailyConsumption).replace('.', ','));
        setEditUsageInterval(item.usageInterval || 'daily');
        setEditMinStock(String(item.minStock).replace('.', ','));
        setScreen('edit');
    };

    const handleDelete = (id: string) => {
        removeConsumable(id);
        setScreen('list');
        toast.success(language === 'pt-BR' ? 'Item removido!' : 'Item removed!');
    };

    const handleAddToShopping = (item: ConsumableItem) => {
        addToShoppingList({ 
            name: item.name, 
            quantity: item.minStock * 2, 
            unit: item.unit, 
            category: 'hygiene', 
            store: 'market' 
        });
        toast.success(`${item.name} ${l.addedToList}`);
    };

    const toggleHideItem = (id: string) => {
        const item = consumables.find(i => i.id === id);
        if (item) {
            updateConsumable(id, { hidden: !item.hidden } as any);
        }
    };

    const handleAddNewItem = () => {
        const newConsumable: Omit<ConsumableItem, 'id'> = {
            name: newItem.name, 
            icon: newItem.icon,
            category: 'other',
            currentStock: parseFormattedNumber(newItem.currentStock), 
            unit: newItem.unit,
            dailyConsumption: parseFormattedNumber(newItem.dailyConsumption), 
            usageInterval: newItem.usageInterval,
            minStock: parseFormattedNumber(newItem.minStock),
        };
        addConsumable(newConsumable);
        setNewItem({ 
            name: '', 
            icon: '📦', 
            dailyConsumption: '1', 
            unit: 'unidades', 
            currentStock: '10', 
            minStock: '2', 
            usageInterval: 'daily' 
        });
        setScreen('list');
        toast.success(l.itemAdded);
    };

    const renderScreenContent = () => {
        if (screen === 'add') {
            const dailyTotal = (parseFormattedNumber(newItem.dailyConsumption) / INTERVAL_FACTORS[newItem.usageInterval]) * residents;
            return (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setScreen('list')} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl transition-all active:scale-[0.97] text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-xl font-black text-foreground">{l.newItem}</h2>
                    </div>
                    
                    <div className="bg-white/50 dark:bg-white/5 rounded-3xl p-6 border border-black/[0.03] dark:border-white/[0.03] space-y-6">
                        <div>
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 block">{l.chooseIcon}</Label>
                            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                                {ICON_OPTIONS.map((icon) => (
                                    <button
                                        key={icon}
                                        onClick={() => setNewItem(p => ({ ...p, icon }))}
                                        className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all active:scale-95 border-2', newItem.icon === icon ? 'bg-primary/10 border-primary shadow-sm' : 'border-transparent bg-muted/50 hover:bg-secondary')}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{l.itemName}</Label>
                            <Input 
                                placeholder="Ex: Amaciante" 
                                value={newItem.name} 
                                onChange={(e) => setNewItem(p => ({ ...p, name: e.target.value }))} 
                                className="h-14 rounded-2xl border-2 focus:border-primary transition-all text-base font-bold" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{l.currentStock}</Label>
                                <Input 
                                    inputMode="decimal"
                                    value={newItem.currentStock} 
                                    onChange={(e) => handleNumericInput(e.target.value, (v) => setNewItem(p => ({ ...p, currentStock: v })))} 
                                    className="h-14 rounded-2xl border-2 focus:border-primary transition-all text-base font-bold" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{l.unit}</Label>
                                <Select value={newItem.unit} onValueChange={(v) => setNewItem(p => ({ ...p, unit: v }))}>
                                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unidades">un</SelectItem>
                                        <SelectItem value="rolos">rolos</SelectItem>
                                        <SelectItem value="ml">ml</SelectItem>
                                        <SelectItem value="L">L</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                {l.dailyUse} <span className="text-[10px] opacity-60">({l.perPerson})</span>
                            </Label>
                            <div className="flex gap-2">
                                <Input 
                                    inputMode="decimal"
                                    value={newItem.dailyConsumption} 
                                    onChange={(e) => handleNumericInput(e.target.value, (v) => setNewItem(p => ({ ...p, dailyConsumption: v })))} 
                                    className="h-14 rounded-2xl border-2 focus:border-primary transition-all text-base font-bold flex-1" 
                                />
                                <Select value={newItem.usageInterval} onValueChange={(v: any) => setNewItem(p => ({ ...p, usageInterval: v }))}>
                                    <SelectTrigger className="h-14 rounded-2xl border-2 w-32 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">{l.daily}</SelectItem>
                                        <SelectItem value="weekly">{l.weekly}</SelectItem>
                                        <SelectItem value="fortnightly">{l.fortnightly}</SelectItem>
                                        <SelectItem value="monthly">{l.monthly}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {residents > 1 && (
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                                    {l.dailyTotal}: {dailyTotal.toFixed(2)} /dia ({residents} {l.people})
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{l.minStock}</Label>
                            <Input 
                                inputMode="decimal"
                                value={newItem.minStock} 
                                onChange={(e) => handleNumericInput(e.target.value, (v) => setNewItem(p => ({ ...p, minStock: v })))} 
                                className="h-14 rounded-2xl border-2 focus:border-primary transition-all text-base font-bold" 
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 pb-12">
                        <Button variant="outline" className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest shadow-sm" onClick={() => setScreen('list')}>{l.cancel}</Button>
                        <Button className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={handleAddNewItem} disabled={!newItem.name}>{l.confirm}</Button>
                    </div>
                </div>
            );
        }

        if (screen === 'edit') {
            const dailyTotal = (parseFormattedNumber(editDailyConsumption) / INTERVAL_FACTORS[editUsageInterval]) * residents;
            return (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setScreen('list')} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl transition-all active:scale-[0.97] text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-xl font-black text-foreground truncate">{editItem?.name}</h2>
                    </div>

                    <div className="bg-white/50 dark:bg-white/5 rounded-3xl p-6 border border-black/[0.03] dark:border-white/[0.03] space-y-6">
                         <div>
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 block">{l.chooseIcon}</Label>
                            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                                {ICON_OPTIONS.map((icon) => (
                                    <button
                                        key={icon}
                                        onClick={() => setEditIcon(icon)}
                                        className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all active:scale-95 border-2', editIcon === icon ? 'bg-primary/10 border-primary shadow-sm' : 'border-transparent bg-muted/50 hover:bg-secondary')}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{l.itemName}</Label>
                            <Input 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)} 
                                className="h-14 rounded-2xl border-2 focus:border-primary transition-all text-base font-bold" 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                {l.dailyUse} <span className="text-[10px] opacity-60">({l.perPerson})</span>
                            </Label>
                            <div className="flex gap-2">
                                <Input 
                                    inputMode="decimal"
                                    value={editDailyConsumption} 
                                    onChange={(e) => handleNumericInput(e.target.value, setEditDailyConsumption)} 
                                    className="h-14 rounded-2xl border-2 focus:border-primary transition-all text-base font-bold flex-1" 
                                />
                                <Select value={editUsageInterval} onValueChange={(v: any) => setEditUsageInterval(v)}>
                                    <SelectTrigger className="h-14 rounded-2xl border-2 w-32 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">{l.daily}</SelectItem>
                                        <SelectItem value="weekly">{l.weekly}</SelectItem>
                                        <SelectItem value="fortnightly">{l.fortnightly}</SelectItem>
                                        <SelectItem value="monthly">{l.monthly}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {residents > 1 && (
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                                    {l.dailyTotal}: {dailyTotal.toFixed(2)} /dia ({residents} {l.people})
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{l.minStock}</Label>
                            <Input 
                                inputMode="decimal"
                                value={editMinStock} 
                                onChange={(e) => handleNumericInput(e.target.value, setEditMinStock)} 
                                className="h-14 rounded-2xl border-2 focus:border-primary transition-all text-base font-bold" 
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 pb-12">
                        <Button variant="destructive" className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest shadow-sm" onClick={() => editItem && handleDelete(editItem.id)}>{l.deleteItem}</Button>
                        <Button className="flex-[2] h-16 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={handleSaveEdit}>{l.save}</Button>
                    </div>
                </div>
            );
        }

        if (screen === 'custom') {
            return (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setCustomAction(null); setScreen('list'); }} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl transition-all active:scale-[0.97] text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">{l.customAmount}</h2>
                    </div>
                    <div className="flex flex-col items-center gap-6 py-10">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => {
                                    const next = Math.max(0, parseFormattedNumber(customAmount) - 0.5);
                                    setCustomAmount(String(next).replace('.', ','));
                                }}
                                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-foreground transition-all active:scale-90 border-2"
                            >
                                <Minus className="h-6 w-6" />
                            </button>
                            <Input
                                inputMode="decimal"
                                value={customAmount}
                                onChange={(e) => handleNumericInput(e.target.value, setCustomAmount)}
                                className="h-20 w-40 rounded-3xl text-center text-5xl font-black border-4 shadow-xl focus:ring-primary focus:border-primary transition-all"
                            />
                            <button
                                onClick={() => {
                                    const next = parseFormattedNumber(customAmount) + 0.5;
                                    setCustomAmount(String(next).replace('.', ','));
                                }}
                                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all active:scale-90 border-2 border-primary/20"
                            >
                                <Plus className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    <div className="pt-4 pb-12">
                        <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={handleCustomConfirm}>{l.confirm}</Button>
                    </div>
                </div>
            );
        }

        // List view
        const hiddenCount = consumables.filter(i => i.hidden).length;
        const visibleItems = consumables.filter(item => !hideMissing || !item.hidden);

        return (
            <div className="space-y-6 pb-24">
                <div className="rounded-2xl bg-primary/5 p-4 border border-primary/20 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Bell className="h-5 w-5 animate-bounce" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-foreground tracking-tight">{l.howItWorks}</p>
                            <p className="text-xs font-bold text-muted-foreground mt-0.5 opacity-80 leading-relaxed">{l.howItWorksDesc}</p>
                        </div>
                    </div>
                </div>

                {hiddenCount > 0 && (
                    <div className="flex items-center justify-between rounded-2xl bg-white/50 dark:bg-white/5 px-5 py-4 border border-black/[0.02] dark:border-white/[0.02] backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                                {hideMissing ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <span className="text-sm font-black text-foreground uppercase tracking-widest">
                                {l.showHidden} <span className="text-primary font-black ml-1">({hiddenCount})</span>
                            </span>
                        </div>
                        <Switch checked={!hideMissing} onCheckedChange={(v) => setHideMissing(!v)} className="data-[state=checked]:bg-primary" />
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                    {visibleItems.map((item) => {
                        const daysLeft = calculateDaysUntilEmpty(item);
                        const alertLevel = getAlertLevel(daysLeft);

                        return (
                            <div key={item.id} className={cn(
                                "rounded-[1.25rem] border border-black/[0.04] dark:border-white/[0.06] p-4 transition-all shadow-sm ring-0 hover:ring-2 hover:ring-primary/10",
                                item.hidden && "opacity-40 grayscale-[0.5]",
                                alertLevel === 'danger' && !item.hidden && "bg-destructive/[0.02] border-destructive/20 shadow-destructive/5",
                                alertLevel === 'warning' && !item.hidden && "bg-warning/[0.02] border-warning/20 shadow-warning/5",
                                (alertLevel === 'ok' || item.hidden) && "bg-white dark:bg-[#1a1a1a] border-gray-100 dark:border-white/5"
                            )}>
                                <div
                                    className="flex items-center gap-3 mb-4 cursor-pointer active:opacity-70 transition-opacity"
                                    onClick={() => openEdit(item)}
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-xl shadow-inner border border-black/[0.02] dark:border-white/[0.02]">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-black text-foreground tracking-tight truncate">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0 bg-white/50 dark:bg-black/20 border-black/[0.03] dark:border-white/[0.03]">
                                                {Number.isFinite(Number(item.currentStock)) ? Number(item.currentStock).toFixed(2) : String(item.currentStock)} {item.unit}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-muted-foreground opacity-60">•</span>
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                                {Number.isFinite(Number(item.dailyConsumption)) ? Number(item.dailyConsumption).toFixed(2) : String(item.dailyConsumption)} {item.unit}/{l[item.usageInterval || 'daily']}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm border-b-2",
                                            alertLevel === 'danger' && "bg-destructive/10 text-destructive border-destructive/20",
                                            alertLevel === 'warning' && "bg-warning/10 text-warning border-warning/20",
                                            alertLevel === 'ok' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        )}>
                                            <Calendar className="h-3.5 w-3.5" />
                                            {daysLeft === Infinity ? '∞' : `${daysLeft}${l.daysLeft}`}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden border border-black/[0.02] dark:border-white/[0.02]">
                                        <div className={cn(
                                            "h-full rounded-full transition-all duration-700",
                                            alertLevel === 'danger' && "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]",
                                            alertLevel === 'warning' && "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]",
                                            alertLevel === 'ok' && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                        )} style={{ width: `${Math.min(100, (item.currentStock / (item.minStock * 4)) * 100)}%` }} />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <div className="flex flex-1 min-w-[100px] gap-1 group/control">
                                        <Button 
                                            variant="secondary" 
                                            className="h-10 flex-1 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest bg-muted/50 hover:bg-muted shadow-sm" 
                                            onClick={() => handleDebit(item.id)}
                                        >
                                            <Minus className="h-3 w-3" />{l.debit}
                                        </Button>
                                        <Button 
                                            variant="secondary" 
                                            size="icon" 
                                            className="h-10 w-10 shrink-0 rounded-xl bg-muted/30 shadow-sm" 
                                            onClick={() => { 
                                                setCustomAction({ id: item.id, type: 'debit' }); 
                                                setCustomAmount(String(item.dailyConsumption).replace('.', ',')); 
                                                setScreen('custom'); 
                                            }}
                                        >
                                            <Settings2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex flex-1 min-w-[100px] gap-1 group/control">
                                        <Button 
                                            className="h-10 flex-1 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/10" 
                                            onClick={() => handleAddStock(item.id, 1)}
                                        >
                                            <Plus className="h-3 w-3" />{l.restock}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-10 w-10 shrink-0 rounded-xl shadow-sm border border-black/[0.04] dark:border-white/[0.04]" 
                                            onClick={() => { 
                                                setCustomAction({ id: item.id, type: 'restock' }); 
                                                setCustomAmount('1'); 
                                                setScreen('custom'); 
                                            }}
                                        >
                                            <Settings2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    
                                    <div className="flex gap-1 shrink-0 ml-auto">
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className={cn("h-10 w-10 rounded-xl transition-all shadow-sm border border-black/[0.04] dark:border-white/[0.04]", item.hidden ? "bg-primary text-white border-primary" : "bg-transparent")} 
                                            onClick={() => toggleHideItem(item.id)}
                                        >
                                            {item.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>

                                        {alertLevel !== 'ok' && !item.hidden && (
                                            <Button 
                                                size="icon" 
                                                className="h-10 w-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20" 
                                                onClick={() => handleAddToShopping(item)}
                                            >
                                                <ShoppingCart className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="fixed bottom-0 top-auto left-0 right-0 p-4 border-t border-black/[0.04] dark:border-white/[0.06] bg-[#fafafa]/90 dark:bg-[#091f1c]/90 backdrop-blur-3xl z-50">
                    <div className="max-w-lg mx-auto">
                        <Button className="w-full h-14 rounded-2xl gap-2 font-black uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setScreen('add')}>
                            <Package className="h-5 w-5" />{l.addItem}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <PageTransition direction="up" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c]">
            <header className="sticky top-0 z-50 flex items-center gap-4 border-b border-black/[0.02] dark:border-white/[0.02] bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-3 backdrop-blur-3xl">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground bg-white/80 dark:bg-white/10 shadow-sm border border-black/[0.03] dark:border-white/[0.03] active:scale-[0.95] transition-all"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h1 className="flex items-center gap-2 text-xl font-black tracking-tight">
                        <TrendingDown className="h-6 w-6 text-primary" />
                        {l.title}
                    </h1>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 border border-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-black text-primary tracking-tighter">{residents}</span>
                </div>
            </header>
            <main className="max-w-lg mx-auto px-5 py-6">
                {renderScreenContent()}
            </main>
        </PageTransition>
    );
}
