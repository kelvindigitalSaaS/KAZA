import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
    Plus, 
    Sparkles, 
    ArrowLeft, 
    AlertTriangle, 
    Lightbulb, 
    ChevronDown, 
    ChevronUp, 
    ShoppingCart,
    PlusCircle,
    MapPin,
    Package,
    Scale
} from 'lucide-react';
import { useKaza } from '@/contexts/FriggoContext';
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
    const { addItem, addToShoppingList, onboardingData } = useKaza();
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
    const [saveToShoppingList, setSaveToShoppingList] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const labels = {
        'pt-BR': {
            addItem: 'Adicionar Item', name: 'Nome', placeholder: 'Ex: Maçã, Leite, Arroz...',
            category: 'Categoria', location: 'Local', quantity: 'Quantidade', unit: 'Unidade',
            expiresIn: 'Vence em (dias)', aiCalc: 'Calculado automaticamente pela IA',
            minStock: 'Estoque Mínimo', dailyUse: 'Uso/dia', maturation: 'Maturação',
            selectMat: 'Selecione...', green: 'Verde', ripe: 'Maduro', veryRipe: 'Muito Maduro',
            overripe: 'Passado', add: 'Salvar Item', added: 'adicionado!', enterName: 'Digite o nome do item',
            units: 'Unidades', kg: 'Kg', grams: 'Gramas', liters: 'Litros', ml: 'mL', portions: 'Porções',
            fruit: 'Fruta', vegetable: 'Legume', meat: 'Carne', dairy: 'Laticínio',
            cooked: 'Pronta', frozen: 'Congelado', beverage: 'Bebida', pantry: 'Dispensa',
            cleaning: 'Limpeza', hygiene: 'Higiene',
            fridge: 'Geladeira', freezer: 'Freezer', pantryLoc: 'Dispensa', cleaningArea: 'Limpeza',
            invalidQty: 'Quantidade deve ser maior que 0',
            invalidExpiry: 'Dias de validade inválido',
            cookedMeatWarning: 'Carne cozida — validade reduzida automaticamente',
            frozenInfo: 'No freezer, a validade é maior',
            addToShopping: 'Adicionar à lista de compras também',
            advancedOptions: 'Opções Avançadas'
        },
        en: {
            addItem: 'Add Item', name: 'Name', placeholder: 'Ex: Apple, Milk, Rice...',
            category: 'Category', location: 'Location', quantity: 'Quantity', unit: 'Unit',
            expiresIn: 'Expires in (days)', aiCalc: 'Automatically calculated by AI',
            minStock: 'Min Stock', dailyUse: 'Daily use', maturation: 'Maturation',
            selectMat: 'Select...', green: 'Green', ripe: 'Ripe', veryRipe: 'Very Ripe',
            overripe: 'Overripe', add: 'Save Item', added: 'added!', enterName: 'Enter the item name',
            units: 'Units', kg: 'Kg', grams: 'Grams', liters: 'Liters', ml: 'mL', portions: 'Portions',
            fruit: 'Fruit', vegetable: 'Veggie', meat: 'Meat', dairy: 'Dairy',
            cooked: 'Cooked', frozen: 'Frozen', beverage: 'Beverage', pantry: 'Pantry',
            cleaning: 'Cleaning', hygiene: 'Hygiene',
            fridge: 'Fridge', freezer: 'Freezer', pantryLoc: 'Pantry', cleaningArea: 'Cleaning',
            invalidQty: 'Quantity must be greater than 0',
            invalidExpiry: 'Invalid expiry days',
            cookedMeatWarning: 'Cooked meat — expiry reduced automatically',
            frozenInfo: 'In the freezer, shelf life is longer',
            addToShopping: 'Also add to shopping list',
            advancedOptions: 'Advanced Options'
        },
        es: {
            addItem: 'Agregar Artículo', name: 'Nombre', placeholder: 'Ej: Manzana, Leche, Arroz...',
            category: 'Categoría', location: 'Ubicación', quantity: 'Cantidad', unit: 'Unidad',
            expiresIn: 'Vence en (días)', aiCalc: 'Calculado automáticamente por IA',
            minStock: 'Stock Mínimo', dailyUse: 'Uso/día', maturation: 'Maduración',
            selectMat: 'Seleccionar...', green: 'Verde', ripe: 'Maduro', veryRipe: 'Muy Maduro',
            overripe: 'Pasado', add: 'Guardar Artículo', added: '¡agregado!', enterName: 'Ingresa el nombre del artículo',
            units: 'Unidades', kg: 'Kg', grams: 'Gramos', liters: 'Litros', ml: 'mL', portions: 'Porciones',
            fruit: 'Fruta', vegetable: 'Verdura', meat: 'Carne', dairy: 'Lácteo',
            cooked: 'Lista', frozen: 'Congelado', beverage: 'Bebida', pantry: 'Despensa',
            cleaning: 'Limpieza', hygiene: 'Higiene',
            fridge: 'Nevera', freezer: 'Congelador', pantryLoc: 'Despensa', cleaningArea: 'Limpieza',
            invalidQty: 'Cantidad debe ser mayor que 0',
            invalidExpiry: 'Días de vencimiento inválido',
            cookedMeatWarning: 'Carne cocida — vencimiento reducido automáticamente',
            frozenInfo: 'En el congelador, la vida útil es mayor',
            addToShopping: 'Agregar a la lista también',
            advancedOptions: 'Opciones Avanzadas'
        },
    };

    const l = labels[language] || labels['pt-BR'];

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

    const handleQuantityInput = (value: string) => {
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

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        const parsedQty = parseFloat(quantity) || 1;
        const parsedExp = parseInt(expirationDays);
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + parsedExp);
        
        // 1. Add to Item List
        await addItem({
            name: name.trim(), 
            category, 
            location, 
            quantity: parsedQty, 
            unit,
            addedDate: new Date(), 
            expirationDate: parsedExp > 0 ? expirationDate : undefined,
            maturation: maturation || undefined, 
            minStock: minStock ? parseFloat(minStock) : undefined,
            dailyConsumption: dailyConsumption ? parseFloat(dailyConsumption) : undefined, 
            isCooked,
        });

        // 2. Add to Shopping List if toggled
        if (saveToShoppingList) {
            await addToShoppingList({
                name: name.trim(),
                category,
                quantity: parsedQty,
                unit,
                store: 'market'
            });
        }

        toast.success(`${name} ${l.added}`);
        navigate(-1);
    };

    const showMaturation = category === 'fruit' || category === 'vegetable';
    const showConsumption = category === 'hygiene' || category === 'cleaning' || category === 'pantry';
    const currentRule = foodRules[language]?.[category] || foodRules['pt-BR'][category];

    return (
        <PageTransition direction="up" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#061413] pb-24">
            <header className="sticky top-0 z-50 flex items-center justify-between bg-[#fafafa]/80 dark:bg-[#061413]/80 px-4 py-4 backdrop-blur-3xl border-b border-black/[0.03] dark:border-white/[0.05]">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-foreground bg-black/5 dark:bg-white/5 active:scale-90 transition-all">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[17px] font-black tracking-tight">{l.addItem}</h1>
                </div>
                <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
            </header>

            <main className="mt-4 space-y-6 px-4 max-w-lg mx-auto">
                {/* 1. Basic Info Section */}
                <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-1.5 px-1">
                        <Label htmlFor="name" className="text-[12px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            {l.name}
                        </Label>
                        <Input 
                            id="name" 
                            placeholder={l.placeholder} 
                            value={name} 
                            onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }} 
                            className={cn(
                                'h-14 rounded-3xl border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/5 text-base font-medium shadow-sm transition-all focus:ring-emerald-500/20',
                                errors.name && 'border-destructive ring-1 ring-destructive/20'
                            )} 
                        />
                        {errors.name && <p className="text-[11px] font-bold text-destructive ml-2 mt-1">{errors.name}</p>}
                    </div>

                    {/* Horizontal Selectors */}
                    <div className="space-y-3">
                        <div className="px-1 flex items-center justify-between">
                            <Label className="text-[12px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                {l.category}
                            </Label>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                {categories.find(c => c.value === category)?.label}
                            </span>
                        </div>
                        <div className="flex overflow-x-auto gap-2.5 pb-2 px-1 scrollbar-none snap-x snap-mandatory">
                            {categories.map((cat) => (
                                <button 
                                    key={cat.value} 
                                    onClick={() => setCategory(cat.value)}
                                    className={cn(
                                        'flex flex-col items-center justify-center min-w-[70px] aspect-square rounded-[2rem] transition-all snap-start border',
                                        category === cat.value 
                                            ? 'bg-emerald-500/10 border-emerald-500/30 scale-105 shadow-md shadow-emerald-500/10' 
                                            : 'bg-white dark:bg-white/[0.03] border-black/[0.04] dark:border-white/[0.06] opacity-60'
                                    )}
                                >
                                    <span className="text-2xl mb-1">{categoryEmojis[cat.value]}</span>
                                    <span className="text-[10px] font-black">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="px-1 flex items-center justify-between">
                            <Label className="text-[12px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                {l.location}
                            </Label>
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="text-[11px] font-bold capitalize">{l[location || 'fridge']}</span>
                            </div>
                        </div>
                        <div className="flex overflow-x-auto gap-3 pb-2 px-1 scrollbar-none">
                            {locations.map((loc) => {
                                const locEmoji = { fridge: '❄️', freezer: '🧊', pantry: '🏢', cleaning: '🧹' }[loc.value] || '📦';
                                return (
                                    <button 
                                        key={loc.value} 
                                        onClick={() => setLocation(loc.value)}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-full px-4 py-3 transition-all border whitespace-nowrap',
                                            location === loc.value 
                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' 
                                                : 'bg-white dark:bg-white/[0.03] border-black/[0.04] dark:border-white/[0.06] text-muted-foreground'
                                        )}
                                    >
                                        <span className="text-base">{locEmoji}</span>
                                        <span className="text-xs font-black uppercase tracking-wider">{loc.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 2. Smart Info & Toggles */}
                <section className="space-y-4 animate-in fade-in duration-500 delay-100">
                    <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-3xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black tracking-tight">{l.addToShopping}</p>
                                <p className="text-[11px] font-medium text-muted-foreground">Sincronização inteligente</p>
                            </div>
                        </div>
                        <Switch checked={saveToShoppingList} onCheckedChange={setSaveToShoppingList} className="data-[state=checked]:bg-emerald-500" />
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/10 p-3.5">
                        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-amber-900/60 dark:text-amber-300/80 leading-relaxed italic">{currentRule}</p>
                    </div>
                </section>

                {/* 3. Measurement Section */}
                <section className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
                    <div className="space-y-1.5 px-0.5">
                        <Label htmlFor="quantity" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                            <PlusCircle className="h-3.5 w-3.5 text-emerald-500" /> {l.quantity}
                        </Label>
                        <Input 
                            id="quantity" 
                            inputMode="decimal" 
                            type="text" 
                            value={quantity} 
                            onChange={(e) => handleQuantityInput(e.target.value)} 
                            className={cn(
                                'h-14 rounded-3xl border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/5 text-base font-black shadow-sm transition-all',
                                errors.quantity && 'border-destructive ring-1 ring-destructive/20'
                            )} 
                        />
                    </div>
                    <div className="space-y-1.5 px-0.5">
                        <Label htmlFor="unit" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                            <Scale className="h-3.5 w-3.5 text-muted-foreground" /> {l.unit}
                        </Label>
                        <Select value={unit} onValueChange={setUnit}>
                            <SelectTrigger className="h-14 rounded-3xl border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/5 font-bold shadow-sm transition-all focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="unidades">{l.units}</SelectItem>
                                <SelectItem value="kg">{l.kg}</SelectItem>
                                <SelectItem value="g">{l.grams}</SelectItem>
                                <SelectItem value="litros">{l.liters}</SelectItem>
                                <SelectItem value="ml">{l.ml}</SelectItem>
                                <SelectItem value="porções">{l.portions}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </section>

                {/* 4. Expiration Section */}
                <section className="space-y-3 p-4 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/[0.03] dark:border-white/[0.06] shadow-sm animate-in fade-in duration-500 delay-200">
                    <div className="flex items-center justify-between px-1">
                        <Label htmlFor="expiration" className="flex items-center gap-2 text-sm font-black tracking-tight uppercase">
                            {l.expiresIn} <Sparkles className="h-4 w-4 text-emerald-500" />
                        </Label>
                        <span className="text-[12px] font-black text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
                            {expirationDays} d
                        </span>
                    </div>
                    <div className="relative">
                        <Input 
                            id="expiration" 
                            type="number" 
                            min="0" 
                            value={expirationDays} 
                            onChange={(e) => setExpirationDays(e.target.value)} 
                            className="h-14 rounded-[1.75rem] border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-black/20 text-lg font-black text-center transition-all focus:ring-emerald-500/20" 
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                            <Plus className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-[10px] text-center font-bold uppercase tracking-tighter text-muted-foreground/60">{l.aiCalc}</p>
                </section>

                {/* 5. Advanced Options Toggle */}
                <section className="space-y-4 animate-in fade-in duration-500 delay-300 px-1">
                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-black/[0.06] dark:border-white/[0.08] rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
                    >
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{l.advancedOptions}</p>
                        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    <AnimatePresence>
                        {showAdvanced && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4 overflow-hidden pt-2"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="minStock" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">{l.minStock}</Label>
                                        <Input id="minStock" type="number" min="0" step="0.5" placeholder="Ex: 2" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="h-14 rounded-2xl border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/5 font-bold" />
                                    </div>
                                    {showConsumption && (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="dailyConsumption" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">{l.dailyUse}</Label>
                                            <Input id="dailyConsumption" type="number" min="0" step="0.1" placeholder="Ex: 0.5" value={dailyConsumption} onChange={(e) => setDailyConsumption(e.target.value)} className="h-14 rounded-2xl border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/5 font-bold" />
                                        </div>
                                    )}
                                </div>
                                {showMaturation && (
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">{l.maturation}</Label>
                                        <Select value={maturation} onValueChange={(v) => setMaturation(v as MaturationLevel)}>
                                            <SelectTrigger className="h-14 rounded-2xl border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/5 font-bold"><SelectValue placeholder={l.selectMat} /></SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                <SelectItem value="green">{l.green}</SelectItem>
                                                <SelectItem value="ripe">{l.ripe}</SelectItem>
                                                <SelectItem value="very-ripe">{l.veryRipe}</SelectItem>
                                                <SelectItem value="overripe">{l.overripe}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-black/[0.04] dark:border-white/[0.06] bg-[#fafafa]/80 dark:bg-[#061413]/80 backdrop-blur-3xl z-50">
                <div className="max-w-lg mx-auto">
                    <Button 
                        onClick={handleSubmit} 
                        className="w-full rounded-[2rem] h-16 text-lg font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 active:scale-[0.96] transition-all"
                    >
                        {l.add}
                    </Button>
                </div>
            </div>
        </PageTransition>
    );
}
