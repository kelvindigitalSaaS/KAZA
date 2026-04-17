import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Sparkles, ArrowLeft, AlertTriangle, Lightbulb } from 'lucide-react';
import { useKaza } from '@/contexts/KazaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ItemCategory, ItemLocation, MaturationLevel } from '@/types/friggo';
import { toast } from 'sonner';
import { getSmartExpiration, dailyConsumptionDefaults } from '@/data/brazilianRecipes';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Smart unit defaults based on category
const categoryUnitDefaults: Record<ItemCategory, string> = {
    fruit: 'unidades',
    vegetable: 'g',
    meat: 'kg',
    dairy: 'litros',
    cooked: 'g',
    frozen: 'g',
    beverage: 'litros',
    pantry: 'unidades',
    cleaning: 'unidades',
    hygiene: 'unidades',
};

// Smart location defaults based on category
const categoryLocationDefaults: Record<ItemCategory, ItemLocation> = {
    fruit: 'fridge',
    vegetable: 'fridge',
    meat: 'fridge',
    dairy: 'fridge',
    cooked: 'fridge',
    frozen: 'freezer',
    beverage: 'fridge',
    pantry: 'pantry',
    cleaning: 'cleaning',
    hygiene: 'cleaning',
};

// Cooked meat keywords that reduce expiry
const cookedMeatKeywords = ['cozid', 'assad', 'grelh', 'frit', 'refogad', 'guisad', 'cooked', 'grilled', 'fried', 'roast'];

// Category emojis for visual selector
const categoryEmojis: Record<ItemCategory, string> = {
    fruit: '🍎', vegetable: '🥦', meat: '🥩', dairy: '🧀', cooked: '🍲',
    frozen: '🧊', beverage: '🥤', pantry: '🏪', cleaning: '🧹', hygiene: '🧴',
};

// Food storage rules per category
const foodRules: Record<string, Record<ItemCategory, string>> = {
    'pt-BR': {
        fruit: '💡 Lave apenas antes de consumir. Frutas tropicais podem ficar fora; as demais na geladeira.',
        vegetable: '💡 Guarde em sacos ventilados. Legumes folhosos duram mais envoltos em papel toalha úmido.',
        meat: '💡 Refrigere a 0-4°C. Use em até 3 dias ou congele imediatamente após a compra.',
        dairy: '💡 Mantenha na parte mais fria. Após aberto, consuma em até 5 dias. Nunca recongelar.',
        cooked: '💡 Guarde em recipiente hermético. Na geladeira até 3 dias, no freezer até 3 meses.',
        frozen: '💡 Descongele na geladeira, nunca em temperatura ambiente. Não recongelar após descongelado.',
        beverage: '💡 Após aberto, consuma em até 5 dias. Sucos naturais perdem nutrientes rapidamente.',
        pantry: '💡 Local seco, arejado e sem luz. Verifique sempre a data na embalagem.',
        cleaning: '💡 Mantenha longe de alimentos e crianças. Local ventilado e seco.',
        hygiene: '💡 Após aberto, anotar a data. A maioria dura 12 meses após aberto.',
    },
    en: {
        fruit: '💡 Wash only before eating. Tropical fruits can stay out; others belong in the fridge.',
        vegetable: '💡 Store in ventilated bags. Leafy greens last longer wrapped in damp paper towel.',
        meat: '💡 Refrigerate at 32-40°F. Use within 3 days or freeze immediately after purchase.',
        dairy: '💡 Keep in the coldest part. Once opened, consume within 5 days. Never refreeze.',
        cooked: '💡 Store in airtight container. Fridge up to 3 days, freezer up to 3 months.',
        frozen: '💡 Thaw in the fridge, never at room temperature. Do not refreeze after thawing.',
        beverage: '💡 Once opened, consume within 5 days. Fresh juices lose nutrients quickly.',
        pantry: '💡 Dry, airy spot away from light. Always check the date on the package.',
        cleaning: '💡 Keep away from food and children. Ventilated and dry location.',
        hygiene: '💡 After opening, note the date. Most last 12 months once opened.',
    },
    es: {
        fruit: '💡 Lave solo antes de consumir. Las frutas tropicales pueden quedar afuera; las demás en la nevera.',
        vegetable: '💡 Guarde en bolsas ventiladas. Las hojas verdes duran más envueltas en toalla húmeda.',
        meat: '💡 Refrigere a 0-4°C. Use dentro de 3 días o congele inmediatamente.',
        dairy: '💡 Mantenga en la parte más fría. Después de abierto, consuma en 5 días. Nunca recongelar.',
        cooked: '💡 Guarde en recipiente hermético. En nevera hasta 3 días, en congelador hasta 3 meses.',
        frozen: '💡 Descongele en la nevera, nunca a temperatura ambiente. No recongelar.',
        beverage: '💡 Después de abierto, consuma en 5 días. Jugos naturales pierden nutrientes rápido.',
        pantry: '💡 Lugar seco, ventilado y sin luz. Siempre verifique la fecha en el empaque.',
        cleaning: '💡 Mantenga lejos de alimentos y niños. Lugar ventilado y seco.',
        hygiene: '💡 Después de abierto, anotar la fecha. La mayoría dura 12 meses después de abierto.',
    },
};

export default function AddItemPage() {
    const navigate = useNavigate();
    const { addItem, onboardingData } = useKaza();
    const { language } = useLanguage();
    const [name, setName] = useState('');
    const [category, setCategory] = useState<ItemCategory>('fruit');
    const [location, setLocation] = useState<ItemLocation>('fridge');
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('unidades');
    const [expirationDays, setExpirationDays] = useState('7');
    const [maturation, setMaturation] = useState<MaturationLevel | ''>('');
    const [minStock, setMinStock] = useState('');
    const [dailyConsumption, setDailyConsumption] = useState('');
    const [isCooked, setIsCooked] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const labels = {
        'pt-BR': {
            addItem: 'Adicionar Item', name: 'Nome', placeholder: 'Ex: Maçã, Leite, Arroz...',
            category: 'Categoria', location: 'Local', quantity: 'Quantidade', unit: 'Unidade',
            expiresIn: 'Vence em (dias)', aiCalc: 'Calculado automaticamente pela IA',
            minStock: 'Estoque Mínimo', dailyUse: 'Uso/dia', maturation: 'Maturação',
            selectMat: 'Selecione...', green: 'Verde', ripe: 'Maduro', veryRipe: 'Muito Maduro',
            overripe: 'Passado', add: 'Adicionar Item', added: 'adicionado!', enterName: 'Digite o nome do item',
            units: 'Unidades', kg: 'Kg', grams: 'Gramas', liters: 'Litros', ml: 'mL', portions: 'Porções',
            fruit: 'Fruta', vegetable: 'Legume/Verdura', meat: 'Carne', dairy: 'Laticínio',
            cooked: 'Comida Pronta', frozen: 'Congelado', beverage: 'Bebida', pantry: 'Dispensa',
            cleaning: 'Limpeza', hygiene: 'Higiene',
            fridge: 'Geladeira', freezer: 'Freezer', pantryLoc: 'Dispensa', cleaningArea: 'Área de Limpeza',
            invalidQty: 'Quantidade deve ser maior que 0',
            invalidExpiry: 'Dias de validade inválido',
            cookedMeatWarning: 'Carne cozida — validade reduzida automaticamente',
            frozenInfo: 'No freezer, a validade é maior',
        },
        en: {
            addItem: 'Add Item', name: 'Name', placeholder: 'Ex: Apple, Milk, Rice...',
            category: 'Category', location: 'Location', quantity: 'Quantity', unit: 'Unit',
            expiresIn: 'Expires in (days)', aiCalc: 'Automatically calculated by AI',
            minStock: 'Min Stock', dailyUse: 'Daily use', maturation: 'Maturation',
            selectMat: 'Select...', green: 'Green', ripe: 'Ripe', veryRipe: 'Very Ripe',
            overripe: 'Overripe', add: 'Add Item', added: 'added!', enterName: 'Enter the item name',
            units: 'Units', kg: 'Kg', grams: 'Grams', liters: 'Liters', ml: 'mL', portions: 'Portions',
            fruit: 'Fruit', vegetable: 'Vegetable', meat: 'Meat', dairy: 'Dairy',
            cooked: 'Prepared Food', frozen: 'Frozen', beverage: 'Beverage', pantry: 'Pantry',
            cleaning: 'Cleaning', hygiene: 'Hygiene',
            fridge: 'Fridge', freezer: 'Freezer', pantryLoc: 'Pantry', cleaningArea: 'Cleaning Area',
            invalidQty: 'Quantity must be greater than 0',
            invalidExpiry: 'Invalid expiry days',
            cookedMeatWarning: 'Cooked meat — expiry reduced automatically',
            frozenInfo: 'In the freezer, shelf life is longer',
        },
        es: {
            addItem: 'Agregar Artículo', name: 'Nombre', placeholder: 'Ej: Manzana, Leche, Arroz...',
            category: 'Categoría', location: 'Ubicación', quantity: 'Cantidad', unit: 'Unidad',
            expiresIn: 'Vence en (días)', aiCalc: 'Calculado automáticamente por IA',
            minStock: 'Stock Mínimo', dailyUse: 'Uso/día', maturation: 'Maduración',
            selectMat: 'Seleccionar...', green: 'Verde', ripe: 'Maduro', veryRipe: 'Muy Maduro',
            overripe: 'Pasado', add: 'Agregar Artículo', added: '¡agregado!', enterName: 'Ingresa el nombre del artículo',
            units: 'Unidades', kg: 'Kg', grams: 'Gramos', liters: 'Litros', ml: 'mL', portions: 'Porciones',
            fruit: 'Fruta', vegetable: 'Verdura', meat: 'Carne', dairy: 'Lácteo',
            cooked: 'Comida Preparada', frozen: 'Congelado', beverage: 'Bebida', pantry: 'Despensa',
            cleaning: 'Limpieza', hygiene: 'Higiene',
            fridge: 'Nevera', freezer: 'Congelador', pantryLoc: 'Despensa', cleaningArea: 'Área de Limpieza',
            invalidQty: 'Cantidad debe ser mayor que 0',
            invalidExpiry: 'Días de vencimiento inválido',
            cookedMeatWarning: 'Carne cocida — vencimiento reducido automáticamente',
            frozenInfo: 'En el congelador, la vida útil es mayor',
        },
    };

    const l = labels[language];

    const categories: { value: ItemCategory; label: string }[] = [
        { value: 'fruit', label: l.fruit }, { value: 'vegetable', label: l.vegetable },
        { value: 'meat', label: l.meat }, { value: 'dairy', label: l.dairy },
        { value: 'cooked', label: l.cooked }, { value: 'frozen', label: l.frozen },
        { value: 'beverage', label: l.beverage }, { value: 'pantry', label: l.pantry },
        { value: 'cleaning', label: l.cleaning }, { value: 'hygiene', label: l.hygiene },
    ];

    const locations: { value: ItemLocation; label: string }[] = [
        { value: 'fridge', label: l.fridge }, { value: 'freezer', label: l.freezer },
        { value: 'pantry', label: l.pantryLoc }, { value: 'cleaning', label: l.cleaningArea },
    ];

    // Smart defaults when category changes
    useEffect(() => {
        setUnit(categoryUnitDefaults[category] || 'unidades');
        setLocation(categoryLocationDefaults[category] || 'fridge');
    }, [category]);

    // Smart expiration calculation
    useEffect(() => {
        if (name.trim().length > 2) {
            let smartDays = getSmartExpiration(name, location, category === 'cooked');
            setIsCooked(category === 'cooked');

            // Check for cooked meat — reduce expiry by ~60%
            const normalizedName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const isCookedMeat = category === 'meat' && cookedMeatKeywords.some(kw => normalizedName.includes(kw));
            if (isCookedMeat) {
                smartDays = Math.max(2, Math.ceil(smartDays * 0.4));
                setIsCooked(true);
            }

            // Freezer items get extended shelf life
            if (location === 'freezer' && category !== 'frozen') {
                smartDays = Math.max(smartDays, 30);
            }

            setExpirationDays(smartDays.toString());

            const defaultConsumption = Object.entries(dailyConsumptionDefaults).find(([key]) => normalizedName.includes(key));
            if (defaultConsumption) {
                const residents = onboardingData?.residents || 2;
                setDailyConsumption((defaultConsumption[1].perPerson * residents).toFixed(1));
            }
        }
    }, [name, location, category, onboardingData]);

    // Smart quantity input — accepts decimals like 1.2 for kg
    const handleQuantityInput = (value: string) => {
        // Allow empty value, digits, dots and commas (convert comma to dot)
        const sanitized = value.replace(',', '.');
        if (sanitized === '' || /^\d*\.?\d*$/.test(sanitized)) {
            setQuantity(sanitized);
            setErrors(prev => ({ ...prev, quantity: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = l.enterName;
        const qty = parseFloat(quantity);
        if (!qty || qty <= 0) newErrors.quantity = l.invalidQty;
        const exp = parseInt(expirationDays);
        if (isNaN(exp) || exp < 0) newErrors.expiration = l.invalidExpiry;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays));
        addItem({
            name: name.trim(), category, location, quantity: parseFloat(quantity) || 1, unit,
            addedDate: new Date(), expirationDate: parseInt(expirationDays) > 0 ? expirationDate : undefined,
            maturation: maturation || undefined, minStock: minStock ? parseFloat(minStock) : undefined,
            dailyConsumption: dailyConsumption ? parseFloat(dailyConsumption) : undefined, isCooked,
        });
        toast.success(`${name} ${l.added}`);
        navigate(-1);
    };

    const showMaturation = category === 'fruit' || category === 'vegetable';
    const showConsumption = category === 'hygiene' || category === 'cleaning' || category === 'pantry';
    const isCookedMeat = category === 'meat' && cookedMeatKeywords.some(kw => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(kw));
    const currentRule = foodRules[language]?.[category] || foodRules['pt-BR'][category];

    return (
        <PageTransition direction="up" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-20">
            <header className="sticky top-0 z-50 flex items-center gap-3 bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-4 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06]">
                <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-foreground bg-white/80 dark:bg-white/10 backdrop-blur-xl active:scale-[0.97] transition-all">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="flex items-center gap-2 text-lg font-bold">
                    <Plus className="h-5 w-5 text-primary" />
                    {l.addItem}
                </h1>
            </header>

            <main className="mt-2 space-y-4 px-5 pb-24 max-w-lg mx-auto">
                {/* Name input */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">{l.name}</Label>
                    <Input id="name" placeholder={l.placeholder} value={name} onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }} className={cn('h-14 rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl text-base focus:ring-primary shadow-sm', errors.name && 'border-destructive ring-1 ring-destructive/30')} />
                    {errors.name && <p className="text-xs text-destructive animate-slide-up">{errors.name}</p>}
                </motion.div>

                {/* Visual category selector */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
                    <Label className="text-sm font-semibold">{l.category}</Label>
                    <div className="grid grid-cols-5 gap-2">
                        {categories.map((cat) => (
                            <button key={cat.value} onClick={() => setCategory(cat.value)}
                                className={cn('flex flex-col items-center gap-1 rounded-2xl p-2.5 transition-all active:scale-95 border',
                                    category === cat.value ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20 shadow-sm' : 'bg-white dark:bg-white/[0.04] border-black/[0.04] dark:border-white/[0.06]')}>
                                <span className="text-xl">{categoryEmojis[cat.value]}</span>
                                <span className={cn('text-[10px] font-semibold leading-tight text-center', category === cat.value ? 'text-primary' : 'text-muted-foreground')}>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Food storage rule card */}
                <AnimatePresence mode="wait">
                    <motion.div key={category} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-200/50 dark:border-amber-500/15 p-3">
                            <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">{currentRule}</p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Location */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-2">
                    <Label className="text-sm font-semibold">{l.location}</Label>
                    <div className="grid grid-cols-4 gap-2">
                        {locations.map((loc) => {
                            const locEmoji = { fridge: '❄️', freezer: '🧊', pantry: '🏪', cleaning: '🧹' }[loc.value] || '📦';
                            return (
                                <button key={loc.value} onClick={() => setLocation(loc.value)}
                                    className={cn('flex flex-col items-center gap-1 rounded-2xl py-2.5 px-2 transition-all active:scale-95 border',
                                        location === loc.value ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20' : 'bg-white dark:bg-white/[0.04] border-black/[0.04] dark:border-white/[0.06]')}>
                                    <span className="text-lg">{locEmoji}</span>
                                    <span className={cn('text-[10px] font-semibold', location === loc.value ? 'text-primary' : 'text-muted-foreground')}>{loc.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Quantity & Unit */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm font-semibold">{l.quantity}</Label>
                        <Input id="quantity" inputMode="decimal" type="text" value={quantity} onChange={(e) => handleQuantityInput(e.target.value)} className={cn('h-14 rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl text-base shadow-sm', errors.quantity && 'border-destructive ring-1 ring-destructive/30')} />
                        {errors.quantity && <p className="text-xs text-destructive animate-slide-up">{errors.quantity}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unit" className="text-sm font-semibold">{l.unit}</Label>
                        <Select value={unit} onValueChange={setUnit}>
                            <SelectTrigger className="h-14 rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unidades">{l.units}</SelectItem>
                                <SelectItem value="kg">{l.kg}</SelectItem>
                                <SelectItem value="g">{l.grams}</SelectItem>
                                <SelectItem value="litros">{l.liters}</SelectItem>
                                <SelectItem value="ml">{l.ml}</SelectItem>
                                <SelectItem value="porções">{l.portions}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </motion.div>

                {isCookedMeat && (
                    <div className="flex items-center gap-2 rounded-2xl bg-warning/10 border border-warning/20 p-3 animate-scale-in">
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                        <p className="text-xs font-medium text-warning">{l.cookedMeatWarning}</p>
                    </div>
                )}

                {location === 'freezer' && category !== 'frozen' && (
                    <div className="flex items-center gap-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-3 animate-scale-in">
                        <Sparkles className="h-4 w-4 text-cyan-600 shrink-0" />
                        <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400">{l.frozenInfo}</p>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="expiration" className="flex items-center gap-2 text-sm font-semibold">{l.expiresIn}<Sparkles className="h-3.5 w-3.5 text-primary" /></Label>
                    <Input id="expiration" type="number" min="0" value={expirationDays} onChange={(e) => setExpirationDays(e.target.value)} className={`h-14 rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl text-base shadow-sm ${errors.expiration ? 'border-destructive ring-1 ring-destructive/30' : ''}`} />
                    <p className="text-xs text-muted-foreground">{l.aiCalc}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="minStock" className="text-sm font-semibold">{l.minStock}</Label>
                        <Input id="minStock" type="number" min="0" step="0.5" placeholder="Ex: 2" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="h-14 rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl text-base shadow-sm" />
                    </div>
                    {showConsumption && (
                        <div className="space-y-2">
                            <Label htmlFor="dailyConsumption" className="text-sm font-semibold">{l.dailyUse}</Label>
                            <Input id="dailyConsumption" type="number" min="0" step="0.1" placeholder="Ex: 0.5" value={dailyConsumption} onChange={(e) => setDailyConsumption(e.target.value)} className="h-14 rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl text-base shadow-sm" />
                        </div>
                    )}
                </div>

                {showMaturation && (
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">{l.maturation}</Label>
                        <Select value={maturation} onValueChange={(v) => setMaturation(v as MaturationLevel)}>
                            <SelectTrigger className="h-14 rounded-2xl border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-sm"><SelectValue placeholder={l.selectMat} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="green">{l.green}</SelectItem>
                                <SelectItem value="ripe">{l.ripe}</SelectItem>
                                <SelectItem value="very-ripe">{l.veryRipe}</SelectItem>
                                <SelectItem value="overripe">{l.overripe}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-black/[0.04] dark:border-white/[0.06] bg-[#fafafa]/80 dark:bg-[#091f1c]/80 backdrop-blur-2xl z-50">
                    <div className="max-w-base mx-auto">
                        <Button onClick={handleSubmit} className="w-full rounded-2xl h-14 text-base font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.97]">
                            {l.add}
                        </Button>
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}
