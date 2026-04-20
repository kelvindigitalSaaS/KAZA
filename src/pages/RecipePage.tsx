/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Recipe } from '@/types/friggo';
import { Clock, Users, Check, ArrowLeft, ArrowRight, Leaf, Play, Pause, ShoppingCart, Timer, TimerOff, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKaza } from '@/contexts/KazaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Heart, CalendarDays, Minus, Plus } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';
import { getCategoryEmoji } from '@/components/friggo/RecipeCard';

// Use unified app icon for notifications
const NOTIF_ICON = '/icon.png';

function useTimer() {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [initialSeconds, setInitialSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const beep = useCallback(() => {
        try {
            const ctx = audioCtxRef.current || new AudioContext();
            audioCtxRef.current = ctx;
            const playTone = (freq: number, start: number, dur: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.5, ctx.currentTime + start);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
                osc.start(ctx.currentTime + start);
                osc.stop(ctx.currentTime + start + dur);
            };
            for (let i = 0; i < 5; i++) {
                playTone(880, i * 0.3, 0.2);
            }
        } catch { /* ignore */ }
    }, []);

    const start = useCallback((mins: number) => {
        const totalSec = Math.max(1, Math.round(mins * 60));
        setInitialSeconds(totalSec);
        setSeconds(totalSec);
        setIsRunning(true);
    }, []);

    const stop = useCallback(() => {
        setIsRunning(false);
        setSeconds(0);
        setInitialSeconds(0);
    }, []);

    const toggle = useCallback(() => setIsRunning(p => !p), []);

    useEffect(() => {
        if (isRunning && seconds > 0) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, seconds]);

    useEffect(() => {
        if (seconds === 0 && initialSeconds > 0) {
            beep();
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⏰ Timer finalizado!', { body: 'O tempo de cozimento acabou!', icon: NOTIF_ICON });
            }
            toast.success('⏰ Timer finalizado!', { duration: 10000 });
        }
    }, [seconds, initialSeconds, beep]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const progress = initialSeconds > 0 ? ((initialSeconds - seconds) / initialSeconds) * 100 : 0;

    return { seconds, isRunning, start, stop, toggle, formatTime: () => formatTime(seconds), progress, initialSeconds };
}

export default function RecipePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const recipe = location.state?.recipe as Recipe | undefined;

    const [currentStep, setCurrentStep] = useState(0);
    const [cookingMode, setCookingMode] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [timerMinutes, setTimerMinutes] = useState('');
    const [showTimerSetup, setShowTimerSetup] = useState(false);
    const timer = useTimer();
    const { language } = useLanguage();
    const { 
      items, 
      addToShoppingList, 
      favoriteRecipes, 
      toggleFavoriteRecipe,
      addToMealPlan 
    } = useKaza();

    const [servings, setServings] = useState(recipe.servings || 2);
    const [plannerOpen, setPlannerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

    const isFavorite = favoriteRecipes.includes(recipe.id);

    // Helper per escalar quantidades
    const scaleQuantity = (ingredient: string) => {
      const originalServings = recipe.servings || 2;
      const ratio = servings / originalServings;
      
      // Regex per encontrar números (inteiros, decimais ou frações)
      // Ajuste fino para o padrão brasileiro/porcentagem
      return ingredient.replace(/(\d+([,.]\d+)?|\d+\/\d+)/g, (match) => {
        let value: number;
        if (match.includes('/')) {
          const [num, den] = match.split('/').map(Number);
          value = num / den;
        } else {
          value = parseFloat(match.replace(',', '.'));
        }
        
        const scaledValue = value * ratio;
        
        // Formatar de volta
        if (Number.isInteger(scaledValue)) return scaledValue.toString();
        return scaledValue.toFixed(1).replace('.', ',');
      });
    };

    if (!recipe) {
        return (
            <PageTransition direction="left" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] p-6 flex flex-col items-center justify-center">
                <p>Receita não encontrada.</p>
                <Button onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
            </PageTransition>
        );
    }

    const missingIngredients = recipe.missingIngredients && recipe.missingIngredients.length > 0
        ? recipe.missingIngredients
        : recipe.ingredients.filter(ingredient => {
            const ingredientLower = ingredient.toLowerCase();
            return !items.some(item => ingredientLower.includes(item.name.toLowerCase()));
        });

    const handleAddMissingToShoppingList = async () => {
        const labels = {
            'pt-BR': { added: 'Itens adicionados à lista de compras!', noMissing: 'Você já tem todos os ingredientes!' },
            'en': { added: 'Items added to shopping list!', noMissing: 'You already have all ingredients!' },
            'es': { added: '¡Artículos añadidos a la lista de compras!', noMissing: '¡Ya tienes todos los ingredientes!' },
        };
        const l = labels[language];
        if (missingIngredients.length === 0) {
            toast.info(l.noMissing);
            return;
        }
        for (const ingredient of missingIngredients) {
            await addToShoppingList({ name: ingredient, quantity: 1, unit: 'un', category: 'pantry', store: 'market' });
        }
        toast.success(l.added);
    };

    const toggleStep = (index: number) => {
        setCompletedSteps(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const nextStep = () => {
        if (currentStep < (recipe.instructions ?? []).length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const progress = (completedSteps.length / (recipe.instructions ?? []).length) * 100;

    return (
        <PageTransition direction="up" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-6">
            {/* Compact Header */}
            <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-black/[0.04] dark:border-white/[0.06] bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-3 backdrop-blur-2xl">
                <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl text-foreground active:scale-[0.97] transition-all">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="text-2xl">{getCategoryEmoji(recipe.category)}</span>
                <h1 className="flex-1 text-base font-bold text-foreground truncate">{recipe.name}</h1>
                <div className="flex items-center gap-2">
                    {recipe.usesExpiringItems && (
                        <span className="flex items-center gap-1 rounded-full bg-warning px-2.5 py-1 text-warning-foreground text-[10px] font-bold uppercase">
                            <Leaf className="h-3 w-3" />Pri
                        </span>
                    )}
                    <button 
                        onClick={() => toggleFavoriteRecipe(recipe.id)}
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-90",
                            isFavorite ? "bg-red-500/10 text-red-500" : "bg-white/80 dark:bg-white/10 text-foreground"
                        )}
                    >
                        <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                    </button>
                </div>
            </header>

            <main className="px-6 py-6 max-w-lg mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold leading-tight text-foreground">{recipe.name}</h1>
                    {recipe.description && (
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{recipe.description}</p>
                    )}
                </header>

                {/* Stats */}
                <div className="mb-6 flex gap-3">
                    <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] px-3 py-3 shadow-sm">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="text-sm font-bold text-foreground">{recipe.prepTime} min</span>
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] px-4 py-3 shadow-sm">
                        <button 
                            onClick={() => setServings(Math.max(1, servings - 1))}
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary active:scale-90"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="text-sm font-bold text-foreground">{servings} {servings === 1 ? 'porção' : 'porções'}</span>
                        </div>
                        <button 
                            onClick={() => setServings(servings + 1)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary active:scale-90"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Planner & Shopping */}
                <div className="mb-6 flex gap-3">
                    <Dialog open={plannerOpen} onOpenChange={setPlannerOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 rounded-2xl py-6 border-primary/20 text-primary hover:bg-primary/5 font-bold"
                            >
                                <CalendarDays className="h-5 w-5" />
                                Agendar
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl max-w-[90vw] mx-auto">
                            <DialogHeader>
                                <DialogTitle>Agendar Refeição</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Dia da semana</label>
                                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                                        <SelectTrigger className="rounded-xl h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {Array.from({ length: 7 }).map((_, i) => {
                                                const d = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
                                                return (
                                                    <SelectItem key={i} value={format(d, 'yyyy-MM-dd')}>
                                                        {format(d, 'eeee', { locale: ptBR })} ({format(d, 'dd/MM')})
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Refeição</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'breakfast', label: 'Café', emoji: '☕' },
                                            { id: 'lunch', label: 'Almoço', emoji: '🍽️' },
                                            { id: 'dinner', label: 'Jantar', emoji: '🌙' },
                                            { id: 'snack', label: 'Lanche', emoji: '🥪' }
                                        ].map(meal => (
                                            <button
                                                key={meal.id}
                                                onClick={() => setSelectedMeal(meal.id as any)}
                                                className={cn(
                                                    "p-3 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all",
                                                    selectedMeal === meal.id 
                                                        ? "bg-primary text-white border-primary" 
                                                        : "bg-white dark:bg-white/5 border-border"
                                                )}
                                            >
                                                <span>{meal.emoji}</span>
                                                {meal.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button 
                                    className="w-full h-12 rounded-xl mt-4 font-bold"
                                    onClick={() => {
                                        addToMealPlan({
                                            recipe_id: recipe.id,
                                            recipe_name: recipe.name,
                                            planned_date: selectedDate,
                                            meal_type: selectedMeal
                                        });
                                        setPlannerOpen(false);
                                    }}
                                >
                                    Confirmar Agendamento
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {missingIngredients.length > 0 && (
                        <Button
                            onClick={handleAddMissingToShoppingList}
                            variant="outline"
                            className="flex-1 gap-2 rounded-2xl py-6 border-warning/30 text-warning hover:bg-warning/10 font-bold"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            Lista
                        </Button>
                    )}
                </div>

                {/* Cooking Mode Toggle */}
                <Button
                    onClick={() => setCookingMode(!cookingMode)}
                    variant={cookingMode ? "default" : "outline"}
                    className="mb-8 w-full gap-2 rounded-2xl py-6 font-bold shadow-sm shadow-primary/25 transition-all"
                >
                    {cookingMode ? (
                        <>
                            <Pause className="h-5 w-5" />
                            Sair do Modo Cozinha
                        </>
                    ) : (
                        <>
                            <Play className="h-5 w-5 text-primary" />
                            Iniciar Modo Cozinha
                        </>
                    )}
                </Button>

                {cookingMode ? (
                    /* Cooking Mode - Step by Step */
                    <div className="space-y-6 animate-fade-in">
                        {/* Progress Bar */}
                        <div>
                            <div className="mb-2 flex justify-between text-xs font-bold text-muted-foreground">
                                <span>Progresso</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="absolute left-0 top-0 h-full bg-primary transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="mt-3 text-center text-sm font-semibold text-muted-foreground">
                                Passo {currentStep + 1} de {(recipe.instructions ?? []).length}
                            </p>
                        </div>

                        {/* Timer */}
                        <div className="rounded-2xl border border-primary/15 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 shadow-sm">
                            {timer.initialSeconds > 0 ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative flex items-center justify-center">
                                        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="6" />
                                            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" className="text-primary" strokeWidth="6" strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 44}`}
                                                strokeDashoffset={`${2 * Math.PI * 44 * (1 - timer.progress / 100)}`}
                                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                                            />
                                        </svg>
                                        <span className="absolute text-2xl font-black tabular-nums text-foreground">{timer.formatTime()}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="rounded-xl gap-1.5 font-bold" onClick={timer.toggle}>
                                            {timer.isRunning ? <><Pause className="h-4 w-4" />Pausar</> : <><Play className="h-4 w-4" />Continuar</>}
                                        </Button>
                                        <Button size="sm" variant="ghost" className="rounded-xl gap-1.5 font-bold text-destructive" onClick={timer.stop}>
                                            <TimerOff className="h-4 w-4" />Cancelar
                                        </Button>
                                    </div>
                                </div>
                            ) : showTimerSetup ? (
                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-sm font-bold text-foreground">⏱️ Definir Timer (minutos)</p>
                                    <div className="flex items-center gap-2">
                                        {[1, 3, 5, 10, 15, 20, 30].map(m => (
                                            <button key={m} onClick={() => { timer.start(m); setShowTimerSetup(false); }}
                                                className="h-10 min-w-[40px] rounded-xl bg-primary/10 text-primary text-sm font-bold transition-all active:scale-95 hover:bg-primary/20 px-2">
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="number" min="1" placeholder="Min" value={timerMinutes} onChange={e => setTimerMinutes(e.target.value)}
                                            className="h-10 w-20 rounded-xl bg-muted/50 text-center text-sm font-bold border-none focus:ring-2 focus:ring-primary/30" />
                                        <Button size="sm" className="rounded-xl font-bold" disabled={!timerMinutes || Number(timerMinutes) <= 0}
                                            onClick={() => { timer.start(Number(timerMinutes)); setShowTimerSetup(false); setTimerMinutes(''); }}>
                                            Iniciar
                                        </Button>
                                        <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setShowTimerSetup(false)}>Fechar</Button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowTimerSetup(true)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/5 py-3 text-sm font-bold text-primary transition-all active:scale-[0.98] hover:bg-primary/10">
                                    <Timer className="h-4 w-4" />
                                    {language === 'en' ? 'Set Cooking Timer' : language === 'es' ? 'Configurar Temporizador' : 'Definir Timer de Cozimento'}
                                </button>
                            )}
                        </div>

                        {/* Current Step */}
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 dark:bg-primary/10 p-6 shadow-sm">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                                {currentStep + 1}
                            </div>
                            <p className="text-lg font-medium leading-relaxed text-foreground">
                                {(recipe.instructions ?? [])[currentStep]}
                            </p>
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className="flex-1 rounded-2xl py-6 font-bold"
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Anterior
                            </Button>
                            <Button
                                onClick={() => {
                                    toggleStep(currentStep);
                                    nextStep();
                                }}
                                className="flex-1 rounded-2xl py-6 font-bold shadow-sm shadow-primary/25"
                                disabled={currentStep === (recipe.instructions ?? []).length - 1 && completedSteps.includes(currentStep)}
                            >
                                {currentStep === (recipe.instructions ?? []).length - 1 ? (
                                    <>
                                        <Check className="mr-2 h-5 w-5" />
                                        Concluir
                                    </>
                                ) : (
                                    <>
                                        Próximo
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Normal View */
                    <div className="animate-fade-in space-y-8">
                        {/* Ingredients */}
                        <section>
                            <h3 className="mb-4 text-lg font-bold text-foreground">Ingredientes</h3>
                            <div className="space-y-2.5">
                                {recipe.ingredients.map((ingredient, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl px-4 py-3.5 shadow-sm"
                                    >
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">{scaleQuantity(ingredient)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Instructions */}
                        <section>
                            <h3 className="mb-4 text-lg font-bold text-foreground">Modo de Preparo</h3>
                            <div className="space-y-3">
                                {(recipe.instructions ?? []).map((instruction, index) => (
                                    <div
                                        key={index}
                                        onClick={() => toggleStep(index)}
                                        className={cn(
                                            'flex cursor-pointer gap-4 rounded-2xl border p-4 transition-all active:scale-[0.99] shadow-sm',
                                            completedSteps.includes(index)
                                                ? 'border-primary/20 bg-primary/5 dark:bg-primary/10'
                                                : 'border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-white/5 backdrop-blur-xl'
                                        )}
                                    >
                                        <div className={cn(
                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all',
                                            completedSteps.includes(index)
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'bg-muted/50 text-muted-foreground'
                                        )}>
                                            {completedSteps.includes(index) ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                index + 1
                                            )}
                                        </div>
                                        <p className={cn(
                                            'text-sm leading-relaxed pt-1.5',
                                            completedSteps.includes(index)
                                                ? 'text-muted-foreground line-through'
                                                : 'text-foreground font-medium'
                                        )}>
                                            {instruction}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </PageTransition>
    );
}
