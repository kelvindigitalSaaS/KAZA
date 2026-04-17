import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useKaza } from '@/contexts/KazaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Moon, Trash2, UtensilsCrossed, Check, ArrowLeft, Apple, ChefHat, ThumbsUp, Sparkles, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckupAction {
    itemId: string;
    action: 'consumed' | 'cooked' | 'discarded';
    quantity: number;
}

type CheckupStep = 'question' | 'items' | 'done';
type DayAnswer = 'consumed' | 'discarded' | 'both' | null;

export default function NightCheckupPage() {
    const navigate = useNavigate();
    const { items, updateItem, removeItem, addItemHistory } = useKaza();
    const { language } = useLanguage();
    const [actions, setActions] = useState<CheckupAction[]>([]);
    const [step, setStep] = useState<CheckupStep>('question');
    const [dayAnswer, setDayAnswer] = useState<DayAnswer>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionType, setActionType] = useState<'consumed' | 'discarded'>('consumed');

    const labels = {
        'pt-BR': {
            title: 'Check-up Noturno',
            subtitle: 'O que aconteceu com seus alimentos hoje?',
            noPerishable: 'Nenhum item perecível no momento',
            consume: 'Consumir',
            cook: 'Cozinhar',
            discard: 'Descartar',
            complete: 'Concluir Check-up',
            done: 'Check-up concluído!',
            questionTitle: 'Como foi seu dia?',
            questionSubtitle: 'Conte-nos o que aconteceu com seus alimentos hoje',
            optConsumed: 'Consumi alimentos',
            optConsumedDesc: 'Comi ou usei ingredientes da geladeira',
            optDiscarded: 'Descartei alimentos',
            optDiscardedDesc: 'Joguei fora itens vencidos ou estragados',
            optBoth: 'Consumi e descartei',
            optBothDesc: 'Usei alguns e descartei outros',
            optNothing: 'Nada aconteceu',
            optNothingDesc: 'Não mexi na geladeira hoje',
            next: 'Continuar',
            selectConsumed: 'Selecione o que consumiu',
            selectDiscarded: 'Selecione o que descartou',
            selectBoth: 'Selecione os itens',
            ok: 'OK',
            doneTitle: 'Tudo certo! 🌙',
            doneSubtitle: 'Seu check-up noturno foi registrado com sucesso.',
            doneConsumed: 'itens consumidos/cozinhados',
            doneDiscarded: 'itens descartados',
            doneSaved: 'Menos desperdício = mais economia!',
            goBack: 'Voltar ao início',
            nothingDone: 'Nenhuma alteração registrada.',
            searchPlaceholder: 'Buscar itens...',
            consumedTab: 'Consumidos',
            discardedTab: 'Descartados',
            switchToDiscard: 'Marcar descartados',
            switchToConsume: 'Marcar consumidos',
        },
        en: {
            title: 'Night Check-up',
            subtitle: 'What happened with your food today?',
            noPerishable: 'No perishable items at the moment',
            consume: 'Consume',
            cook: 'Cook',
            discard: 'Discard',
            complete: 'Complete Check-up',
            done: 'Check-up completed!',
            questionTitle: 'How was your day?',
            questionSubtitle: 'Tell us what happened with your food today',
            optConsumed: 'I consumed food',
            optConsumedDesc: 'I ate or used ingredients from the fridge',
            optDiscarded: 'I discarded food',
            optDiscardedDesc: 'I threw away expired or spoiled items',
            optBoth: 'Consumed and discarded',
            optBothDesc: 'I used some and discarded others',
            optNothing: 'Nothing happened',
            optNothingDesc: "I didn't touch the fridge today",
            next: 'Continue',
            selectConsumed: 'Select what you consumed',
            selectDiscarded: 'Select what you discarded',
            selectBoth: 'Select items',
            ok: 'OK',
            doneTitle: 'All done! 🌙',
            doneSubtitle: 'Your night check-up has been recorded successfully.',
            doneConsumed: 'items consumed/cooked',
            doneDiscarded: 'items discarded',
            doneSaved: 'Less waste = more savings!',
            goBack: 'Go back home',
            nothingDone: 'No changes recorded.',
            searchPlaceholder: 'Search items...',
            consumedTab: 'Consumed',
            discardedTab: 'Discarded',
            switchToDiscard: 'Mark discarded',
            switchToConsume: 'Mark consumed',
        },
        es: {
            title: 'Chequeo Nocturno',
            subtitle: '¿Qué pasó con tus alimentos hoy?',
            noPerishable: 'No hay artículos perecederos al momento',
            consume: 'Consumir',
            cook: 'Cocinar',
            discard: 'Descartar',
            complete: 'Completar Chequeo',
            done: '¡Chequeo completado!',
            questionTitle: '¿Cómo fue tu día?',
            questionSubtitle: 'Cuéntanos qué pasó con tus alimentos hoy',
            optConsumed: 'Consumí alimentos',
            optConsumedDesc: 'Comí o usé ingredientes de la nevera',
            optDiscarded: 'Descarté alimentos',
            optDiscardedDesc: 'Tiré artículos vencidos o dañados',
            optBoth: 'Consumí y descarté',
            optBothDesc: 'Usé algunos y descarté otros',
            optNothing: 'Nada pasó',
            optNothingDesc: 'No toqué la nevera hoy',
            next: 'Continuar',
            selectConsumed: 'Selecciona lo que consumiste',
            selectDiscarded: 'Selecciona lo que descartaste',
            selectBoth: 'Selecciona los artículos',
            ok: 'OK',
            doneTitle: '¡Todo listo! 🌙',
            doneSubtitle: 'Tu chequeo nocturno fue registrado con éxito.',
            doneConsumed: 'artículos consumidos/cocinados',
            doneDiscarded: 'artículos descartados',
            doneSaved: '¡Menos desperdicio = más ahorro!',
            goBack: 'Volver al inicio',
            nothingDone: 'Ningún cambio registrado.',
            searchPlaceholder: 'Buscar artículos...',
            consumedTab: 'Consumidos',
            discardedTab: 'Descartados',
            switchToDiscard: 'Marcar descartados',
            switchToConsume: 'Marcar consumidos',
        },
    };

    const l = labels[language];

    const perishableItems = items.filter(item =>
        ['fruit', 'vegetable', 'dairy', 'meat', 'cooked'].includes(item.category)
    );

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return perishableItems;
        const q = searchQuery.toLowerCase();
        return perishableItems.filter(i => i.name.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q));
    }, [perishableItems, searchQuery]);

    const toggleItem = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleConfirmSelection = () => {
        const newActions: CheckupAction[] = selectedIds.map(id => ({
            itemId: id,
            action: actionType,
            quantity: 1,
        }));

        // Merge with existing actions
        const merged = [...actions.filter(a => !selectedIds.includes(a.itemId)), ...newActions];
        setActions(merged);

        if (dayAnswer === 'both' && actionType === 'consumed') {
            // Switch to discard phase
            setSelectedIds([]);
            setActionType('discarded');
            setSearchQuery('');
        } else {
            setStep('done');
            applyActions(merged);
        }
    };

    const applyActions = (finalActions: CheckupAction[]) => {
        finalActions.forEach(({ itemId, action, quantity }) => {
            const item = items.find(i => i.id === itemId);
            if (!item) return;
            if (action === 'discarded') {
                removeItem(itemId);
                addItemHistory?.(itemId, item.name, 'discarded', quantity);
            } else {
                const newQty = item.quantity - quantity;
                if (newQty <= 0) removeItem(itemId);
                else updateItem(itemId, { quantity: newQty });
                addItemHistory?.(itemId, item.name, action, quantity);
            }
        });
    };

    const handleNothingToday = () => {
        toast.success(l.nothingDone);
        navigate(-1);
    };

    const handleContinueToItems = () => {
        if (!dayAnswer) return;
        setActionType(dayAnswer === 'discarded' ? 'discarded' : 'consumed');
        setStep('items');
    };

    const consumedCount = actions.filter(a => a.action === 'consumed' || a.action === 'cooked').length;
    const discardedCount = actions.filter(a => a.action === 'discarded').length;

    // Label for the current selection phase
    const getSelectionTitle = () => {
        if (dayAnswer === 'both' && actionType === 'consumed') return l.selectConsumed;
        if (dayAnswer === 'both' && actionType === 'discarded') return l.selectDiscarded;
        if (dayAnswer === 'consumed') return l.selectConsumed;
        if (dayAnswer === 'discarded') return l.selectDiscarded;
        return l.selectBoth;
    };

    const actionColor = actionType === 'consumed' ? '#165A52' : '#ef4444';
    const actionBg = actionType === 'consumed' ? 'rgba(22,90,82,0.10)' : 'rgba(239,68,68,0.10)';

    return (
        <PageTransition direction="up" className="pb-8 min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] text-foreground">
            <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-black/[0.04] dark:border-white/[0.06] bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-4 backdrop-blur-2xl">
                <button
                    onClick={() => step === 'items' ? setStep('question') : navigate(-1)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl active:scale-[0.97] transition-all text-foreground"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="flex items-center gap-2 text-lg font-bold">
                    <Moon className="h-5 w-5 text-primary" />{l.title}
                </h1>
            </header>

            <AnimatePresence mode="wait">
                {/* ── QUESTION STEP ── */}
                {step === 'question' && (
                    <motion.main
                        key="question"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-5 px-6 py-6 pb-24 max-w-lg mx-auto"
                    >
                        <div className="text-center space-y-2 py-4">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring' }}
                                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                                style={{ background: "rgba(22,90,82,0.10)" }}
                            >
                                <Moon className="h-8 w-8 text-primary" />
                            </motion.div>
                            <h2 className="text-xl font-bold">{l.questionTitle}</h2>
                            <p className="text-sm text-muted-foreground">{l.questionSubtitle}</p>
                        </div>

                        <div className="space-y-3">
                            {[
                                { key: 'consumed' as const, icon: Apple, label: l.optConsumed, desc: l.optConsumedDesc, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', activeBg: 'bg-emerald-500/20 border-emerald-500/50 ring-2 ring-emerald-500/30' },
                                { key: 'discarded' as const, icon: Trash2, label: l.optDiscarded, desc: l.optDiscardedDesc, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', activeBg: 'bg-red-500/20 border-red-500/50 ring-2 ring-red-500/30' },
                                { key: 'both' as const, icon: ChefHat, label: l.optBoth, desc: l.optBothDesc, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', activeBg: 'bg-amber-500/20 border-amber-500/50 ring-2 ring-amber-500/30' },
                            ].map((opt, i) => (
                                <motion.button
                                    key={opt.key}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 + i * 0.08 }}
                                    onClick={() => setDayAnswer(opt.key)}
                                    className={cn('w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98]', dayAnswer === opt.key ? opt.activeBg : opt.bg)}
                                >
                                    <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', dayAnswer === opt.key ? 'bg-white/80 dark:bg-white/20' : 'bg-white/60 dark:bg-white/10')}>
                                        <opt.icon className={cn('h-5 w-5', opt.color)} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-foreground">{opt.label}</p>
                                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                    </div>
                                    {dayAnswer === opt.key && (
                                        <div className="ml-auto shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 dark:bg-white/20">
                                            <Check className="h-3.5 w-3.5 text-foreground" />
                                        </div>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            onClick={handleNothingToday}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 transition-all active:scale-[0.98]"
                        >
                            <ThumbsUp className="h-4 w-4" />
                            {l.optNothing} — {l.optNothingDesc}
                        </motion.button>

                        {dayAnswer && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                                <Button
                                    onClick={handleContinueToItems}
                                    className="w-full h-12 gap-2 rounded-xl font-bold text-base"
                                    style={{ background: "#165A52" }}
                                >
                                    {l.next} →
                                </Button>
                            </motion.div>
                        )}
                    </motion.main>
                )}

                {/* ── ITEMS SELECTION STEP ── */}
                {step === 'items' && (
                    <motion.main
                        key="items"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4 px-5 py-5 pb-32 max-w-lg mx-auto"
                    >
                        {/* Selection header */}
                        <div
                            className="rounded-2xl p-4 flex items-center gap-3"
                            style={{ background: actionBg }}
                        >
                            <div className="flex-1">
                                <p className="font-bold text-foreground">{getSelectionTitle()}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {selectedIds.length > 0 ? `${selectedIds.length} selecionado(s)` : "Toque nos itens para selecionar"}
                                </p>
                            </div>
                            {dayAnswer === 'both' && (
                                <div
                                    className="rounded-xl px-3 py-1.5 text-xs font-bold text-white shrink-0"
                                    style={{ background: actionColor }}
                                >
                                    {actionType === 'consumed' ? '1/2' : '2/2'}
                                </div>
                            )}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={l.searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 rounded-2xl bg-white/80 dark:bg-white/5 border-black/[0.04] dark:border-white/[0.06]"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Items list */}
                        <div className="space-y-2">
                            {filteredItems.length === 0 ? (
                                <p className="py-8 text-center text-muted-foreground text-sm">{l.noPerishable}</p>
                            ) : (
                                filteredItems.map((item, i) => {
                                    const isSelected = selectedIds.includes(item.id);
                                    return (
                                        <motion.button
                                            key={item.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            onClick={() => toggleItem(item.id)}
                                            className={cn(
                                                'w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98]',
                                                isSelected
                                                    ? 'border-2'
                                                    : 'border border-black/[0.05] dark:border-white/[0.07] bg-white dark:bg-card'
                                            )}
                                            style={isSelected ? {
                                                borderColor: actionColor,
                                                background: actionBg,
                                            } : {}}
                                        >
                                            {/* Checkbox */}
                                            <div
                                                className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all')}
                                                style={{
                                                    borderColor: isSelected ? actionColor : 'rgba(0,0,0,0.2)',
                                                    background: isSelected ? actionColor : 'transparent',
                                                    color: '#fff'
                                                }}
                                            >
                                                {isSelected && <Check className="h-3.5 w-3.5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-foreground truncate">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                                            </div>
                                            {item.expirationDate && (
                                                <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                                                    {Math.ceil((new Date(item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })
                            )}
                        </div>
                    </motion.main>
                )}

                {/* ── DONE STEP ── */}
                {step === 'done' && (
                    <motion.main
                        key="done"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, type: 'spring' }}
                        className="flex flex-col items-center justify-center px-6 py-12 max-w-lg mx-auto text-center space-y-6"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                            className="flex h-20 w-20 items-center justify-center rounded-full"
                            style={{ background: "rgba(22,90,82,0.10)" }}
                        >
                            <Sparkles className="h-10 w-10 text-primary" />
                        </motion.div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">{l.doneTitle}</h2>
                            <p className="text-muted-foreground">{l.doneSubtitle}</p>
                        </div>
                        <div className="flex gap-4 py-2">
                            {consumedCount > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-col items-center gap-1 rounded-2xl px-5 py-3"
                                    style={{ background: "rgba(22,90,82,0.10)" }}
                                >
                                    <span className="text-2xl font-bold text-primary">{consumedCount}</span>
                                    <span className="text-xs text-muted-foreground">{l.doneConsumed}</span>
                                </motion.div>
                            )}
                            {discardedCount > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-col items-center gap-1 rounded-2xl bg-red-500/10 px-5 py-3"
                                >
                                    <span className="text-2xl font-bold text-red-600">{discardedCount}</span>
                                    <span className="text-xs text-muted-foreground">{l.doneDiscarded}</span>
                                </motion.div>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground italic">{l.doneSaved}</p>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
                            className="w-full h-12 gap-2 rounded-xl font-medium mt-4"
                        >
                            <ArrowLeft className="h-4 w-4" />{l.goBack}
                        </Button>
                    </motion.main>
                )}
            </AnimatePresence>

            {/* ── Fixed OK button for items step ── */}
            {step === 'items' && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#fafafa]/90 dark:bg-[#091f1c]/90 backdrop-blur-2xl border-t border-black/[0.04] dark:border-white/[0.06]">
                    <div className="max-w-lg mx-auto">
                        <Button
                            onClick={handleConfirmSelection}
                            disabled={selectedIds.length === 0}
                            className="w-full h-12 gap-2 rounded-xl font-bold text-white"
                            style={{ background: selectedIds.length > 0 ? actionColor : undefined }}
                        >
                            <Check className="h-5 w-5" />
                            {l.ok}
                            {selectedIds.length > 0 && ` (${selectedIds.length})`}
                        </Button>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
