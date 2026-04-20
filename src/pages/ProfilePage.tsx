import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKaza } from '@/contexts/KazaContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, User, Home, Users, Refrigerator, Loader2, CreditCard, Lock } from 'lucide-react';
import AvatarUpload from '@/components/friggo/AvatarUpload';
import { isValidCPF, formatCPF } from '@/lib/utils/validation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PageTransition } from '@/components/PageTransition';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { onboardingData, updateProfile, onboarding_completed } = useKaza();
    const { language } = useLanguage();
    const { user } = useAuth();

    const [name, setName] = useState('');
    const [residents, setResidents] = useState('1');
    const [homeType, setHomeType] = useState<'apartment' | 'house'>('house');
    const [fridgeType, setFridgeType] = useState<'regular' | 'smart'>('regular');
    const [fridgeBrand, setFridgeBrand] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
    const [cpf, setCpf] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading] = useState(false);

    useEffect(() => {
        if (onboardingData) {
            setName(onboardingData.name || '');
            setResidents(onboardingData.residents?.toString() || '1');
            setHomeType(onboardingData.homeType || 'house');
            setFridgeType(onboardingData.fridgeType || 'regular');
            setFridgeBrand(onboardingData.fridgeBrand || '');
            setAvatarUrl(onboardingData.avatarUrl);
            setCpf(formatCPF(onboardingData.cpf || ''));
        }
    }, [onboardingData]);

    const labels = {
        'pt-BR': {
            title: 'Editar Perfil',
            name: 'Seu Nome',
            residents: 'Número de Residentes',
            homeType: 'Tipo de Residência',
            house: 'Casa',
            apartment: 'Apartamento',
            fridgeType: 'Tipo de Geladeira',
            regular: 'Convencional',
            smart: 'Smart (Conectada)',
            fridgeBrand: 'Marca da Geladeira',
            save: 'Salvar Alterações',
            uploading: 'Enviando...',
            saving: 'Salvando...',
            success: 'Perfil atualizado!',
            error: 'Erro ao salvar perfil',
            cpf: 'CPF (Necessário para Trial)',
            cpfPlaceholder: '000.000.000-00',
            invalidCpf: 'CPF inválido',
        },
        'en': {
            title: 'Edit Profile',
            name: 'Your Name',
            residents: 'Number of Residents',
            homeType: 'Residence Type',
            house: 'House',
            apartment: 'Apartment',
            fridgeType: 'Fridge Type',
            regular: 'Regular',
            smart: 'Smart (Connected)',
            fridgeBrand: 'Fridge Brand',
            save: 'Save Changes',
            uploading: 'Uploading...',
            saving: 'Saving...',
            success: 'Profile updated!',
            error: 'Error saving profile',
            cpf: 'CPF (Trial purposes)',
            cpfPlaceholder: '000.000.000-00',
            invalidCpf: 'Invalid CPF',
        },
        'es': {
            title: 'Editar Perfil',
            name: 'Tu Nombre',
            residents: 'Número de Residentes',
            homeType: 'Tipo de Residencia',
            house: 'Casa',
            apartment: 'Apartamento',
            fridgeType: 'Tipo de Refrigerador',
            regular: 'Convencional',
            smart: 'Smart (Conectado)',
            fridgeBrand: 'Marca del Refrigerador',
            save: 'Guardar Cambios',
            uploading: 'Subiendo...',
            saving: 'Guardando...',
            success: '¡Perfil actualizado!',
            error: 'Error al guardar perfil',
            cpf: 'CPF (Para fines de prueba)',
            cpfPlaceholder: '000.000.000-00',
            invalidCpf: 'CPF inválido',
        },
    };

    const l = labels[language];

    // AvatarUpload component handle upload and calls updateProfile via KazaContext

    // CPF already saved in DB — never overwrite
    const existingCpf = onboardingData?.cpf || '';
    const cpfIsLocked = Boolean(existingCpf);

    const handleSave = async () => {
        const rawCpf = cpf.replace(/\D/g, '');
        // Only validate / send CPF if not locked and user entered something
        if (!cpfIsLocked && rawCpf && !isValidCPF(rawCpf)) {
            toast.error(l.invalidCpf || 'CPF inválido');
            return;
        }

        setIsSaving(true);
        try {
            // Diff: only include CPF in update if it actually changed and is valid
            const cpfToSave = cpfIsLocked
                ? existingCpf   // never change a locked CPF
                : rawCpf || undefined;

            await updateProfile({
                name,
                residents: parseInt(residents),
                homeType,
                fridgeType,
                fridgeBrand: fridgeType === 'smart' ? fridgeBrand : '',
                avatarUrl,
                ...(cpfToSave !== undefined ? { cpf: cpfToSave } : {}),
            });
            toast.success(l.success);
            navigate(-1);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('[DEV] Error saving profile:', error);
            }
            toast.error(l.error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageTransition direction="left" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-20">
            <header className="sticky top-0 z-50 flex items-center gap-3 bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-3 backdrop-blur-2xl border-b border-black/[0.02] dark:border-white/[0.02]">
                <button
                    onClick={() => navigate(-1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground active:scale-[0.97] transition-all bg-white/80 dark:bg-white/10 shadow-sm border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-xl"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-bold text-foreground">{l.title}</h1>
            </header>

            <main className="mx-auto max-w-lg px-5 py-5 space-y-6">
                <div className="flex flex-col items-center gap-3">
                    <AvatarUpload currentUrl={avatarUrl || null} size={80} className="rounded-full ring-4 ring-primary/10 shadow-xl" />
                </div>

                <div className="rounded-3xl bg-white/80 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-xl p-5 shadow-sm space-y-4">
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            <User className="h-3.5 w-3.5 text-primary" /> {l.name}
                        </Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-2xl bg-muted/30 border-2 focus:border-primary font-semibold text-[15px]" />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            <CreditCard className="h-3.5 w-3.5 text-primary" /> {l.cpf}
                            {cpfIsLocked && <Lock className="h-3 w-3 text-muted-foreground ml-auto" />}
                        </Label>
                        <Input
                            value={cpfIsLocked
                                ? existingCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.$3-**')
                                : cpf
                            }
                            onChange={(e) => !cpfIsLocked && setCpf(formatCPF(e.target.value))}
                            placeholder={l.cpfPlaceholder}
                            maxLength={14}
                            disabled={cpfIsLocked}
                            readOnly={cpfIsLocked}
                            className={cn(
                                "h-11 rounded-2xl bg-muted/30 border-2 font-semibold text-[15px]",
                                cpfIsLocked
                                    ? "opacity-60 cursor-not-allowed select-none"
                                    : "focus:border-primary",
                                !cpfIsLocked && cpf && !isValidCPF(cpf) && "border-destructive focus-visible:ring-destructive"
                            )}
                        />
                        {cpfIsLocked ? (
                            <p className="text-[10px] font-bold text-primary mt-0.5 px-2 flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5" />
                                {language === 'pt-BR'
                                    ? 'CPF já cadastrado. Para alterá-lo, entre em contato com o suporte.'
                                    : language === 'es'
                                    ? 'CPF ya registrado. Para cambiarlo, contacte al soporte.'
                                    : 'CPF already set. To change it, contact support.'}
                            </p>
                        ) : (
                            <p className="text-[10px] text-muted-foreground mt-0.5 px-2">
                                {language === 'pt-BR'
                                    ? 'Necessário para ativação dos 7 dias de trial.'
                                    : language === 'es'
                                    ? 'Necesário para la activación de la prueba de 7 días.'
                                    : 'Required for 7-day trial activation.'}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                <Users className="h-3.5 w-3.5 text-primary" /> {l.residents}
                            </Label>
                            <Select value={residents} onValueChange={setResidents}>
                                <SelectTrigger className="h-11 rounded-2xl bg-muted/30 border-2 font-semibold text-[15px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                <Home className="h-3.5 w-3.5 text-primary" /> {l.homeType}
                            </Label>
                            <Select value={homeType} onValueChange={(v: 'apartment' | 'house') => setHomeType(v)}>
                                <SelectTrigger className="h-11 rounded-2xl bg-muted/30 border-2 font-semibold text-[15px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="house">{l.house}</SelectItem>
                                    <SelectItem value="apartment">{l.apartment}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            <Refrigerator className="h-3.5 w-3.5 text-primary" /> {l.fridgeType}
                        </Label>
                        <Select value={fridgeType} onValueChange={(v: 'regular' | 'smart') => setFridgeType(v)}>
                            <SelectTrigger className="h-11 rounded-2xl bg-muted/30 border-2 font-semibold text-[15px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="regular">{l.regular}</SelectItem>
                                <SelectItem value="smart">{l.smart}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {fridgeType === 'smart' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{l.fridgeBrand}</Label>
                            <Input value={fridgeBrand} onChange={(e) => setFridgeBrand(e.target.value)} className="h-11 rounded-2xl bg-muted/30 border-2 focus:border-primary font-semibold text-[15px]" placeholder="Ex: Samsung, LG..." />
                        </div>
                    )}
                </div>

                <Button onClick={handleSave} className="w-full h-12 md:h-12 rounded-2xl text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20" disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <img src="/icon.png" alt="Salvar" width={20} height={20} className="mr-2 h-5 w-5 object-contain inline-block" loading="lazy" decoding="async" />
                    )}
                        {l.save}
                </Button>
            </main>
        </PageTransition>
    );
}
