import { useNavigate } from 'react-router-dom';
import { useKaza } from '@/contexts/KazaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { History, Plus, Minus, Trash2, UtensilsCrossed, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { PageTransition } from '@/components/PageTransition';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HistoryPage() {
    const navigate = useNavigate();
    const { itemHistory } = useKaza();
    const { language } = useLanguage();

    const dateLocale = language === 'en' ? enUS : language === 'es' ? es : ptBR;

    const labels = {
        'pt-BR': { title: 'Histórico de Atividades', noActivity: 'Nenhuma atividade', actionsHere: 'Suas ações aparecerão aqui', added: 'Adicionou', consumed: 'Consumiu', cooked: 'Cozinhou', discarded: 'Descartou' },
        en: { title: 'Activity History', noActivity: 'No activity', actionsHere: 'Your actions will appear here', added: 'Added', consumed: 'Consumed', cooked: 'Cooked', discarded: 'Discarded' },
        es: { title: 'Historial de Actividades', noActivity: 'Sin actividad', actionsHere: 'Tus acciones aparecerán aquí', added: 'Agregó', consumed: 'Consumió', cooked: 'Cocinó', discarded: 'Descartó' },
    };

    const l = labels[language];

    const actionIcons = { added: Plus, consumed: Minus, cooked: UtensilsCrossed, discarded: Trash2 };
    const actionLabels: Record<string, string> = { added: l.added, consumed: l.consumed, cooked: l.cooked, discarded: l.discarded };
    const actionColors: Record<string, string> = { added: 'bg-primary/10 text-primary', consumed: 'bg-muted text-foreground', cooked: 'bg-warning/10 text-warning', discarded: 'bg-destructive/10 text-destructive' };

    const sortedHistory = [...(itemHistory || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const groupedByDate = sortedHistory.reduce((acc, item) => {
        const date = format(new Date(item.timestamp), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {} as Record<string, typeof sortedHistory>);

    const formatDateHeader = (date: string) => {
        if (language === 'en') return format(new Date(date), "EEEE, MMMM d", { locale: enUS });
        if (language === 'es') return format(new Date(date), "EEEE, d 'de' MMMM", { locale: es });
        return format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR });
    };

    return (
        <PageTransition direction="left" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-20">
            <header className="sticky top-0 z-50 flex items-center gap-3 bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-4 backdrop-blur-2xl">
                <button
                    onClick={() => navigate(-1)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-foreground bg-white/80 dark:bg-white/10 backdrop-blur-xl active:scale-[0.97] transition-all"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-bold text-foreground capitalize flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" /> {l.title}
                </h1>
            </header>

            <main className="mx-auto max-w-lg px-6 py-6 space-y-8">
                {Object.keys(groupedByDate).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl p-6 text-muted-foreground">
                            <History className="h-12 w-12" />
                        </div>
                        <p className="text-lg font-bold text-foreground">{l.noActivity}</p>
                        <p className="text-sm text-muted-foreground">{l.actionsHere}</p>
                    </div>
                ) : (
                    Object.entries(groupedByDate).map(([date, items]) => (
                        <div key={date} className="space-y-4">
                            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[1.5px] px-1">
                                {formatDateHeader(date)}
                            </h3>
                            <div className="space-y-3">
                                {items.map((item, index) => {
                                    const Icon = actionIcons[item.action] || History;
                                    return (
                                        <div key={index} className="flex items-center gap-4 rounded-2xl bg-muted/30 p-4 border border-white/5 shadow-sm overflow-hidden group hover:bg-muted/50 transition-colors">
                                            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-inner', actionColors[item.action])}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-foreground">
                                                    <span className="opacity-60">{actionLabels[item.action]}</span> {item.itemName}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                    <span>{item.quantity} {item.unit || 'un'}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 opacity-70">
                                                        <User className="h-3 w-3" /> {item.user || 'User'}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{format(new Date(item.timestamp), 'HH:mm')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </main>
        </PageTransition>
    );
}
