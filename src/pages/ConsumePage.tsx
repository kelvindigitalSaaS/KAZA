import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useKaza } from '@/contexts/KazaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Minus, Plus, Utensils, Trash2, ChefHat, Scale, Check, ArrowLeft, Snowflake, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';

type ActionType = 'consumed' | 'cooked' | 'discarded' | 'defrost-consume';
const quickQuantities = [0.5, 1, 2, 3, 5];

// Smart default unit based on item's current unit
function getDefaultUnit(itemUnit: string | undefined): string {
    const u = (itemUnit || 'un').toLowerCase();
    if (['kg', 'g'].includes(u)) return 'g'; // Default to grams for weight items
    if (['l', 'litros', 'ml'].includes(u)) return 'ml'; // Default to ml for volume items
    return u;
}

export default function ConsumePage() {
    const { itemId } = useParams<{ itemId: string }>();
    const navigate = useNavigate();
    const { items, updateItem, removeItem, addItemHistory, defrostItem } = useKaza();
    const { language } = useLanguage();

    const labels = {
        'pt-BR': {
            available: 'Disponível', consume: 'Consumir', cook: 'Cozinhar', discard: 'Descartar',
            quantity: 'Quantidade', selectUnit: 'Selecione a unidade', weight: 'Peso', volume: 'Volume',
            count: 'Contagem', grams: 'Gramas', kilos: 'Quilos', milliliters: 'Mililitros', liters: 'Litros',
            units: 'Unidades', slices: 'Fatias', portions: 'Porções', spoons: 'Colheres', cups: 'Xícaras',
            confirmConsume: '✓ Confirmar Consumo', confirmCook: '✓ Confirmar Cozimento', confirmDiscard: '✓ Confirmar Descarte',
            consumed: 'consumido', cooked: 'usado em receita', discarded: 'descartado', completely: 'completamente',
            invalidQty: 'Quantidade inválida',
            frozenWarning: 'Este item está congelado',
            defrostAndConsume: 'Descongelar e Consumir',
            defrostFirst: 'Descongele antes de consumir',
            confirmDefrostConsume: '✓ Descongelar e Consumir',
        },
        'en': {
            available: 'Available', consume: 'Consume', cook: 'Cook', discard: 'Discard',
            quantity: 'Quantity', selectUnit: 'Select unit', weight: 'Weight', volume: 'Volume',
            count: 'Count', grams: 'Grams', kilos: 'Kilos', milliliters: 'Milliliters', liters: 'Liters',
            units: 'Units', slices: 'Slices', portions: 'Portions', spoons: 'Spoons', cups: 'Cups',
            confirmConsume: '✓ Confirm Consumption', confirmCook: '✓ Confirm Cooking', confirmDiscard: '✓ Confirm Discard',
            consumed: 'consumed', cooked: 'used in recipe', discarded: 'discarded', completely: 'completely',
            invalidQty: 'Invalid quantity',
            frozenWarning: 'This item is frozen',
            defrostAndConsume: 'Defrost & Consume',
            defrostFirst: 'Defrost before consuming',
            confirmDefrostConsume: '✓ Defrost & Consume',
        },
        'es': {
            available: 'Disponible', consume: 'Consumir', cook: 'Cocinar', discard: 'Descartar',
            quantity: 'Cantidad', selectUnit: 'Selecciona unidad', weight: 'Peso', volume: 'Volumen',
            count: 'Conteo', grams: 'Gramos', kilos: 'Kilos', milliliters: 'Mililitros', liters: 'Litros',
            units: 'Unidades', slices: 'Rodajas', portions: 'Porciones', spoons: 'Cucharas', cups: 'Tazas',
            confirmConsume: '✓ Confirmar Consumo', confirmCook: '✓ Confirmar Cocción', confirmDiscard: '✓ Confirmar Descarte',
            consumed: 'consumido', cooked: 'usado en receta', discarded: 'descartado', completely: 'completamente',
            invalidQty: 'Cantidad inválida',
            frozenWarning: 'Este artículo está congelado',
            defrostAndConsume: 'Descongelar y Consumir',
            defrostFirst: 'Descongele antes de consumir',
            confirmDefrostConsume: '✓ Descongelar y Consumir',
        },
    };
    const l = labels[language];

    const item = items.find((i) => i.id === itemId);
    const isFrozen = item?.location === 'freezer';

    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState(() => getDefaultUnit(item?.unit));
    const [action, setAction] = useState<ActionType>(isFrozen ? 'defrost-consume' : 'consumed');
    const [showUnitSelector, setShowUnitSelector] = useState(false);

    const unitCategories = [
        { label: l.weight, units: [{ value: 'g', label: l.grams, factor: 1 }, { value: 'kg', label: l.kilos, factor: 1000 }] },
        { label: l.volume, units: [{ value: 'ml', label: l.milliliters, factor: 1 }, { value: 'l', label: l.liters, factor: 1000 }] },
        {
            label: l.count, units: [
                { value: 'un', label: l.units, factor: 1 },
                { value: 'fatia', label: l.slices, factor: 1 },
                { value: 'porção', label: l.portions, factor: 1 },
                { value: 'colher', label: l.spoons, factor: 1 },
                { value: 'xícara', label: l.cups, factor: 1 },
            ]
        },
    ];
    const allUnits = unitCategories.flatMap(cat => cat.units);

    if (!item) return (
        <PageTransition direction="left" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] p-6 flex flex-col items-center justify-center">
            <p>Item not found</p>
            <Button onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
        </PageTransition>
    );

    const handleAction = () => {
        const consumedQty = parseFloat(quantity) || 0;
        if (consumedQty <= 0) { toast.error(l.invalidQty); return; }

        // Block consumption of frozen items unless defrost-consume is selected
        if (isFrozen && action !== 'defrost-consume' && action !== 'discarded') {
            toast.error(l.defrostFirst);
            return;
        }

        let adjustedQty = consumedQty;
        const itemUnit = item.unit?.toLowerCase() || 'un';
        const selectedUnit = unit.toLowerCase();

        if (['g', 'kg'].includes(itemUnit) && ['g', 'kg'].includes(selectedUnit)) {
            adjustedQty = (consumedQty * (selectedUnit === 'kg' ? 1000 : 1)) / (itemUnit === 'kg' ? 1000 : 1);
        } else if (['ml', 'l'].includes(itemUnit) && ['ml', 'l'].includes(selectedUnit)) {
            adjustedQty = (consumedQty * (selectedUnit === 'l' ? 1000 : 1)) / (itemUnit === 'l' ? 1000 : 1);
        }

        const newQuantity = Math.max(0, item.quantity - adjustedQty);

        // If defrost-consume, defrost first then consume
        if (action === 'defrost-consume') {
            defrostItem(item.id);
            addItemHistory(item.id, item.name, 'consumed', consumedQty, unit);
        } else {
            addItemHistory(item.id, item.name, action as 'consumed' | 'cooked' | 'discarded', consumedQty, unit);
        }

        const actionText = action === 'consumed' || action === 'defrost-consume' ? l.consumed : action === 'cooked' ? l.cooked : l.discarded;

        if (newQuantity <= 0) {
            removeItem(item.id);
            toast.success(`${item.name} ${actionText} ${l.completely}`);
        } else {
            updateItem(item.id, { quantity: newQuantity, ...(action === 'defrost-consume' ? { location: 'fridge' as const } : {}) });
            toast.success(`${consumedQty} ${unit} ${item.name} ${actionText}`);
        }
        navigate(-1);
    };

    const handleQuantityChange = (newQty: number) => setQuantity(String(Math.min(Math.max(0.1, newQty), item?.quantity || 999)));
    const handleQuantityInput = (value: string) => {
        const sanitized = value.replace(',', '.');
        if (sanitized === '' || /^\d*\.?\d*$/.test(sanitized)) {
            setQuantity(sanitized);
        }
    };
    const getCurrentUnitLabel = () => allUnits.find(u => u.value === unit)?.label || unit;

    return (
        <PageTransition direction="up" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-20">
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-4 backdrop-blur-2xl">
                <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-foreground bg-white/80 dark:bg-white/10 backdrop-blur-xl active:scale-[0.97] transition-all">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-bold text-foreground mx-4 flex-1 text-center truncate">{item.name}</h1>
                <div className="h-10 w-10" />
            </header>

            <main className="max-w-md mx-auto px-6 py-6 space-y-6 stagger-children">
                <div className="flex items-center justify-center">
                    <div className="rounded-full bg-primary/10 px-4 py-2 font-medium text-primary border border-primary/20">
                        {l.available}: <span className="font-bold">{item.quantity} {item.unit}</span>
                    </div>
                </div>

                {/* Frozen item warning */}
                {isFrozen && (
                    <div className="flex items-center gap-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-4 animate-scale-in">
                        <Snowflake className="h-5 w-5 text-cyan-600 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">{l.frozenWarning}</p>
                            <p className="text-xs text-cyan-600/70 dark:text-cyan-400/70 mt-0.5">{l.defrostFirst}</p>
                        </div>
                    </div>
                )}

                <div className={cn("grid gap-3", isFrozen ? "grid-cols-2" : "grid-cols-3")}>
                    {isFrozen ? (
                        <>
                            <button onClick={() => setAction('defrost-consume')} className={cn(
                                'flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-all duration-200 active:scale-95 border-2',
                                action === 'defrost-consume'
                                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-600 shadow-sm'
                                    : 'bg-white/80 dark:bg-white/5 backdrop-blur-xl border-black/[0.04] dark:border-white/[0.06] text-muted-foreground'
                            )}>
                                <Flame className="h-6 w-6" /><span className="text-xs font-bold">{l.defrostAndConsume}</span>
                            </button>
                            <button onClick={() => setAction('discarded')} className={cn(
                                'flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-all duration-200 active:scale-95 border-2',
                                action === 'discarded'
                                    ? 'bg-destructive/10 border-destructive text-destructive shadow-sm'
                                    : 'bg-white/80 dark:bg-white/5 backdrop-blur-xl border-black/[0.04] dark:border-white/[0.06] text-muted-foreground'
                            )}>
                                <Trash2 className="h-6 w-6" /><span className="text-xs font-bold">{l.discard}</span>
                            </button>
                        </>
                    ) : (
                        <>
                            {([
                                { type: 'consumed' as ActionType, icon: Utensils, label: l.consume, color: 'primary' },
                                { type: 'cooked' as ActionType, icon: ChefHat, label: l.cook, color: 'warning' },
                                { type: 'discarded' as ActionType, icon: Trash2, label: l.discard, color: 'destructive' },
                            ]).map(({ type, icon: Icon, label, color }) => (
                                <button key={type} onClick={() => setAction(type)} className={cn(
                                    'flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-all duration-200 active:scale-95 border-2',
                                    action === type
                                        ? color === 'primary' ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                            : color === 'warning' ? 'bg-warning/10 border-warning text-warning shadow-sm'
                                                : 'bg-destructive/10 border-destructive text-destructive shadow-sm'
                                        : 'bg-white/80 dark:bg-white/5 backdrop-blur-xl border-black/[0.04] dark:border-white/[0.06] text-muted-foreground'
                                )}>
                                    <Icon className="h-6 w-6" /><span className="text-xs font-bold">{label}</span>
                                </button>
                            ))}
                        </>
                    )}
                </div>

                <div className="space-y-4 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-foreground">{l.quantity}</label>
                        <button onClick={() => setShowUnitSelector(!showUnitSelector)} className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-secondary active:scale-[0.97]">
                            <Scale className="h-3.5 w-3.5" />{getCurrentUnitLabel()}
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {quickQuantities.map(qty => (
                            <button key={qty} onClick={() => setQuantity(String(qty))} className={cn(
                                'flex-1 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95',
                                parseFloat(quantity) === qty ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25' : 'bg-white/80 dark:bg-white/5 text-muted-foreground'
                            )}>{qty}</button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => handleQuantityChange(parseFloat(quantity) - 1)} className="h-14 w-14 shrink-0 rounded-xl border-2 text-lg font-bold transition-all active:scale-95 shadow-sm">
                            <Minus className="h-5 w-5" />
                        </Button>
                        <Input inputMode="decimal" type="text" value={quantity} onChange={(e) => handleQuantityInput(e.target.value)} className="h-14 flex-1 rounded-xl text-center text-3xl font-black border-2 shadow-sm focus:ring-primary focus:border-primary transition-all" />
                        <Button variant="outline" size="icon" onClick={() => handleQuantityChange(parseFloat(quantity) + 1)} className="h-14 w-14 shrink-0 rounded-xl border-2 text-lg font-bold transition-all active:scale-95 shadow-sm">
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {showUnitSelector && (
                    <div className="space-y-4 animate-scale-in rounded-2xl bg-muted/50 p-5 border border-black/[0.04] dark:border-white/[0.06]">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{l.selectUnit}</p>
                        {unitCategories.map(category => (
                            <div key={category.label}>
                                <p className="text-xs text-muted-foreground mb-2 font-medium">{category.label}</p>
                                <div className="flex flex-wrap gap-2">
                                    {category.units.map(u => (
                                        <button key={u.value} onClick={() => { setUnit(u.value); setShowUnitSelector(false); }} className={cn(
                                            'flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95',
                                            unit === u.value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white/80 dark:bg-white/5 text-foreground hover:bg-secondary border border-black/[0.04] dark:border-white/[0.06]'
                                        )}>
                                            {u.label}{unit === u.value && <Check className="h-3.5 w-3.5" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4">
                    <Button onClick={handleAction} className={cn(
                        "h-16 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.97]",
                        action === 'consumed' && "",
                        action === 'defrost-consume' && "bg-cyan-600 hover:bg-cyan-700 text-white",
                        action === 'cooked' && "bg-warning hover:bg-warning/90 text-warning-foreground",
                        action === 'discarded' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    )}>
                        {action === 'consumed' ? l.confirmConsume : action === 'defrost-consume' ? l.confirmDefrostConsume : action === 'cooked' ? l.confirmCook : l.confirmDiscard}
                    </Button>
                </div>
            </main>
        </PageTransition>
    );
}
