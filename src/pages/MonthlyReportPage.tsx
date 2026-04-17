import { useNavigate } from 'react-router-dom';
import { useKaza } from '@/contexts/KazaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    ArrowLeft,
    TrendingDown,
    TrendingUp,
    Utensils,
    Trash2,
    Info,
    Thermometer,
    Leaf,
    Trophy,
    Flame,
    Droplets,
} from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { motion } from 'framer-motion';

/* ── Ring chart SVG component ── */
function ProgressRing({ percent, size = 120, stroke = 10, color = '#22c55e', bgColor = '#e5e7eb' }: { percent: number; size?: number; stroke?: number; color?: string; bgColor?: string }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(percent, 100) / 100) * circ;
    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bgColor} strokeWidth={stroke} opacity={0.25} />
            <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
                initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                strokeDasharray={circ} />
        </svg>
    );
}

/* ── Animated number counter ── */
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
    return (
        <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            {prefix}{value}{suffix}
        </motion.span>
    );
}

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function MonthlyReportPage() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { items, itemHistory } = useKaza();

    const labels = {
        'pt-BR': {
            title: 'Relatório Mensal',
            subtitle: 'Resumo do seu consumo este mês',
            consumed: 'Consumidos',
            discarded: 'Descartados',
            savings: 'Economia Estimada',
            efficiency: 'Eficiência',
            impactTitle: 'Seu Impacto Ambiental',
            wasteReduced: 'menos desperdício',
            topItems: 'Mais Consumidos',
            noData: 'Sem dados ainda. Comece a registrar itens!',
            emptyTopItems: 'Nenhum item registrado ainda.',
            defrosted: 'Descongelados',
            waterSaved: 'litros de água economizados',
            co2Saved: 'kg CO₂ evitados',
            mealsFromFridge: 'refeições da geladeira',
            monthOf: 'Mês de',
            itemsTracked: 'itens rastreados',
            greatJob: 'Ótimo trabalho!',
            keepGoing: 'Continue assim!',
            needsAttention: 'Atenção ao desperdício',
            perfect: 'Perfeito! Zero desperdício!',
        },
        'en': {
            title: 'Monthly Report',
            subtitle: 'Summary of your consumption this month',
            consumed: 'Consumed',
            discarded: 'Discarded',
            savings: 'Estimated Savings',
            efficiency: 'Efficiency',
            impactTitle: 'Your Environmental Impact',
            wasteReduced: 'less waste',
            topItems: 'Most Consumed',
            noData: 'No data yet. Start tracking items!',
            emptyTopItems: 'No items registered yet.',
            defrosted: 'Defrosted',
            waterSaved: 'liters of water saved',
            co2Saved: 'kg CO₂ avoided',
            mealsFromFridge: 'meals from the fridge',
            monthOf: 'Month of',
            itemsTracked: 'items tracked',
            greatJob: 'Great job!',
            keepGoing: 'Keep it up!',
            needsAttention: 'Watch your waste',
            perfect: 'Perfect! Zero waste!',
        },
        'es': {
            title: 'Reporte Mensual',
            subtitle: 'Resumen de su consumo este mes',
            consumed: 'Consumidos',
            discarded: 'Descartados',
            savings: 'Ahorro Estimado',
            efficiency: 'Eficiencia',
            impactTitle: 'Tu Impacto Ambiental',
            wasteReduced: 'menos desperdicio',
            topItems: 'Más Consumidos',
            noData: 'Sin datos aún. ¡Comienza a registrar artículos!',
            emptyTopItems: 'Ningún artículo registrado todavía.',
            defrosted: 'Descongelados',
            waterSaved: 'litros de agua ahorrados',
            co2Saved: 'kg CO₂ evitados',
            mealsFromFridge: 'comidas de la nevera',
            monthOf: 'Mes de',
            itemsTracked: 'artículos rastreados',
            greatJob: '¡Buen trabajo!',
            keepGoing: '¡Sigue así!',
            needsAttention: 'Atención al desperdicio',
            perfect: '¡Perfecto! ¡Cero desperdicio!',
        }
    };

    const l = labels[language] || labels['pt-BR'];

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthlyHistory = itemHistory.filter((entry) => isWithinInterval(new Date(entry.timestamp), { start: monthStart, end: monthEnd }));

    const totalItems = items?.length ?? 0;

    const consumed = monthlyHistory.filter((h) => h.action === 'consumed');
    const cooked = monthlyHistory.filter((h) => h.action === 'cooked');
    const discarded = monthlyHistory.filter((h) => h.action === 'discarded');
    const defrosted = monthlyHistory.filter((h) => h.action === 'defrosted');

    const totalConsumed = consumed.reduce((sum, h) => sum + h.quantity, 0) + cooked.reduce((sum, h) => sum + h.quantity, 0);
    const totalDiscarded = discarded.reduce((sum, h) => sum + h.quantity, 0);
    const totalDefrosted = defrosted.reduce((sum, h) => sum + h.quantity, 0);
    const totalActions = totalConsumed + totalDiscarded;
    const efficiencyPercent = totalActions > 0 ? Math.round((totalConsumed / totalActions) * 100) : 100;

    const estimatedSavings = (totalConsumed * 8).toFixed(2).replace('.', ',');
    const waterSaved = Math.round(totalConsumed * 140); // ~140L per food item
    const co2Saved = (totalConsumed * 0.9).toFixed(1); // ~0.9kg CO2 per item

    const consumedByItem = [...consumed, ...cooked].reduce((acc, h) => {
        acc[h.itemName] = (acc[h.itemName] || 0) + h.quantity;
        return acc;
    }, {} as Record<string, number>);
    const topItemsRaw = Object.entries(consumedByItem)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));
    const topMax = topItemsRaw[0]?.quantity || 1;

    const statusMsg = efficiencyPercent === 100 && totalActions > 0 ? l.perfect : efficiencyPercent >= 80 ? l.greatJob : efficiencyPercent >= 50 ? l.keepGoing : l.needsAttention;
    const ringColor = efficiencyPercent >= 80 ? '#22c55e' : efficiencyPercent >= 50 ? '#f59e0b' : '#ef4444';

    const monthName = format(now, 'MMMM yyyy');

    return (
        <PageTransition direction="left" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-20">
            <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-black/[0.04] dark:border-white/[0.06] bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-4 backdrop-blur-2xl">
                <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-foreground bg-white/80 dark:bg-white/10 backdrop-blur-xl active:scale-[0.97] transition-all">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-foreground leading-tight">{l.title}</h1>
                    <p className="text-[11px] text-muted-foreground font-medium capitalize">{l.monthOf} {monthName}</p>
                </div>
            </header>

            <main className="mx-auto max-w-lg px-5 py-6 space-y-6">

                {/* ── Hero Ring Card ── */}
                <motion.div {...fadeUp} transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-white to-gray-50 dark:from-white/[0.06] dark:to-white/[0.02] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.06]">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <ProgressRing percent={efficiencyPercent} size={110} stroke={9} color={ringColor} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                                <span className="text-2xl font-black text-foreground">{efficiencyPercent}%</span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{l.efficiency}</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">{l.savings}</p>
                                <p className="text-3xl font-black text-foreground tracking-tight">
                                    {totalConsumed > 0 ? <AnimatedNumber value={totalConsumed * 8} prefix="R$ " /> : '—'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: ringColor }}>
                                {efficiencyPercent >= 50 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                {statusMsg}
                            </div>
                        </div>
                    </div>
                    {/* Subtle glow */}
                    <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl" style={{ background: ringColor, opacity: 0.07 }} />
                </motion.div>

                {/* ── Stats Strip ── */}
                <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-3 gap-3">
                    {[
                        { label: l.consumed, value: totalConsumed, icon: Utensils, color: '#22c55e', bg: 'bg-emerald-500/10' },
                        { label: l.discarded, value: totalDiscarded, icon: Trash2, color: '#ef4444', bg: 'bg-red-500/10' },
                        { label: l.defrosted, value: totalDefrosted, icon: Thermometer, color: '#3b82f6', bg: 'bg-blue-500/10' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                            className="flex flex-col items-center gap-2 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.bg)}>
                                <s.icon className="h-5 w-5" style={{ color: s.color }} />
                            </div>
                            <span className="text-2xl font-black text-foreground">{s.value > 0 ? s.value : '—'}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center leading-tight">{s.label}</span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ── Fridge summary ── */}
                <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex items-center justify-between rounded-2xl bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Flame className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">{totalItems} {l.itemsTracked}</p>
                            <p className="text-[11px] text-muted-foreground capitalize">{monthName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
                        <TrendingUp className="h-3 w-3" /> {totalActions}
                    </div>
                </motion.div>

                {/* ── Environmental Impact ── */}
                <motion.section {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }} className="space-y-3">
                    <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[2px] px-1">{l.impactTitle}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/[0.06] border border-emerald-200/40 dark:border-emerald-500/10 p-4">
                            <Droplets className="h-5 w-5 text-emerald-500" />
                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">{waterSaved > 0 ? waterSaved : '—'}</p>
                            <p className="text-[10px] font-semibold text-emerald-600/70 dark:text-emerald-400/60 uppercase tracking-wider leading-tight">{l.waterSaved}</p>
                        </div>
                        <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 dark:bg-sky-500/[0.06] border border-sky-200/40 dark:border-sky-500/10 p-4">
                            <Leaf className="h-5 w-5 text-sky-500" />
                            <p className="text-xl font-black text-sky-700 dark:text-sky-400">{totalConsumed > 0 ? co2Saved : '—'}</p>
                            <p className="text-[10px] font-semibold text-sky-600/70 dark:text-sky-400/60 uppercase tracking-wider leading-tight">{l.co2Saved}</p>
                        </div>
                    </div>
                </motion.section>

                {/* ── Top Items ── */}
                <motion.section {...fadeUp} transition={{ duration: 0.5, delay: 0.4 }} className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[2px]">{l.topItems}</h3>
                        <Trophy className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="space-y-2">
                        {topItemsRaw.length > 0 ? topItemsRaw.map((item, i) => {
                            const pct = Math.round((item.quantity / topMax) * 100);
                            const medals = ['🥇', '🥈', '🥉'];
                            return (
                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
                                    className="relative overflow-hidden rounded-2xl bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] px-4 py-3.5">
                                    {/* Progress bar background */}
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.6 + i * 0.06, ease: 'easeOut' }}
                                        className="absolute inset-y-0 left-0 bg-primary/[0.05] dark:bg-primary/[0.08]" />
                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-base">{medals[i] || `${i + 1}.`}</span>
                                            <span className="font-bold text-foreground text-sm">{item.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-primary tabular-nums">{item.quantity}x</span>
                                    </div>
                                </motion.div>
                            );
                        }) : (
                            <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] px-5 py-4 text-muted-foreground">
                                <Info className="h-4 w-4 shrink-0" />
                                <p className="text-sm font-medium">{totalItems > 0 ? l.emptyTopItems : l.noData}</p>
                            </div>
                        )}
                    </div>
                </motion.section>
            </main>
        </PageTransition>
    );
}
