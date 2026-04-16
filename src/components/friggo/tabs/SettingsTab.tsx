import { useState, useEffect } from "react";
import {
  User,
  Trash2,
  History,
  Settings2,
  Package,
  Layout,
  Globe,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Star,
  Zap,
  Crown,
  Edit,
  Bell,
  BellRing,
  Refrigerator,
  KeyRound,
  HelpCircle,
  FileText,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Check,
  ShoppingCart,
  UtensilsCrossed,
  Clock,
  Flame,
  Package2,
  CalendarClock,
  Download,
  Smartphone,
  Laptop,
  MonitorDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useKaza } from "@/contexts/FriggoContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSubscription, PLAN_DETAILS } from "@/contexts/SubscriptionContext";
import { usePWA } from "@/contexts/PWAContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarUpload from "../AvatarUpload";
import { PageTransition } from "@/components/PageTransition";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CurrentPlanBadge } from "../CurrentPlanBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendWebNotification } from "@/lib/pushNotifications";
// Brand hidden in settings per preference

export function SettingsTab() {
  const { user, signOut } = useAuth();
  const { onboardingData, resetOnboarding, updateOnboardingData } = useKaza();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { canInstall, install } = usePWA();
  const { getPlanTier, subscription } = useSubscription();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [confirmReconfigureOpen, setConfirmReconfigureOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [notifDelay, setNotifDelay] = useState(5);
  const planTier = getPlanTier();
  const [editingInlineName, setEditingInlineName] = useState(false);
  const [editingDialogName, setEditingDialogName] = useState(false);
  const [localName, setLocalName] = useState<string>(
    onboardingData?.name || (user?.user_metadata?.name as string) || user?.email?.split("@")[0] || ""
  );

  const labels: Record<string, any> = {
    "pt-BR": {
      title: "Ajustes",
      profile: "Perfil",
      editProfile: "Editar informações pessoais",
      shortcuts: "Atalhos Rápidos",
      notifications: "Notificações",
      appearance: "Aparência",
      language: "Idioma",
      security: "Segurança",
      history: "Histórico",
      historyDesc: "Atividades recentes",
      garbage: "Lembrete do Lixo",
      garbageDesc: "Dias de coleta",
      report: "Relatórios",
      reportDesc: "Consumo do mês",
      logout: "Sair da conta",
      darkMode: "Modo Escuro",
      subscription: "Assinatura",
      subscriptionDesc: "Veja os detalhes do seu plano",
      memberSince: "Membro desde",
      trialStatus: "Status do Trial",
      premiumStatus: "Status Premium",
      daysRemaining: "dias restantes",
      paymentHistory: "Histórico de Pagamento",
      lastPayment: "Último pagamento",
      viewSubscription: "Visualizar Assinatura",
      trial: "Gratuito",
      premium: "Premium",
      residents: "moradores",
      house: "Casa",
      apartment: "Apartamento",
      madeWith: "Feito com ❤️ para sua casa",
      changePassword: "Alterar Senha",
      changePasswordDesc: "Atualize sua senha de acesso",
      deleteAccount: "Excluir Conta",
      deleteAccountDesc: "Remover permanentemente seus dados",
      faq: "Perguntas Frequentes",
      faqDesc: "Dúvidas sobre o app",
      privacy: "Privacidade",
      privacyDesc: "Política de privacidade",
      helpSupport: "Ajuda & Suporte",
      reconfigure: "Reconfigurar Casa",
      reconfigureDesc: "Refazer a configuração inicial",
      notifTitle: "Notificações",
      notifDesc: "Escolha para que deseja ser notificado",
      testNotif: "Testar notificação",
      testNotifDesc: "Enviar uma notificação de teste",
      notifSent: "Notificação de teste agendada!",
      notifSeconds: "segundos",
        notifOptions: {
          expiry: { label: "Validade", desc: "Itens prestes a vencer" },
          shopping: { label: "Compras", desc: "Itens da lista de compras" },
          recipes: { label: "Receitas", desc: "Sugestões de receitas" },
          nightCheckup: { label: "Check-up Noturno", desc: "Lembrete diário" },
          cooking: { label: "Cozinhando", desc: "Temporizadores de cozinha" },
          consumables: { label: "Consumíveis", desc: "Reposição de itens" }
        },
        installGuide: "Como Instalar",
        installGuideDesc: "Guia para Android, iOS e PC",
        pricingTitle: "Seja Premium",
        pricingDesc: "Aproveite todos os recursos sem limites",
        priceTag: "Apenas R$ 27/mês",
        upgradeNow: "Fazer Upgrade Agora",
        premiumFeatures: [
          "Itens e receitas ilimitadas",
          "Rastreamento avançado",
          "Alertas personalizados",
          "Interface exclusiva"
        ],
        install: "Instalar App",
        installDesc: "App para sua tela de início"
      },
    en: {
      title: "Settings",
      profile: "Profile",
      editProfile: "Edit personal information",
      shortcuts: "Quick Shortcuts",
      notifications: "Notifications",
      appearance: "Appearance",
      language: "Language",
      security: "Security",
      history: "History",
      historyDesc: "Recent activities",
      garbage: "Garbage Reminder",
      garbageDesc: "Collection days",
      report: "Reports",
      reportDesc: "Monthly consumption",
      logout: "Log out",
      darkMode: "Dark Mode",
      subscription: "Subscription",
      subscriptionDesc: "View your plan details",
      memberSince: "Member since",
      trialStatus: "Trial Status",
      premiumStatus: "Premium Status",
      daysRemaining: "days remaining",
      paymentHistory: "Payment History",
      lastPayment: "Last payment",
      viewSubscription: "View Subscription",
      trial: "Free",
      premium: "Premium",
      residents: "residents",
      house: "House",
      apartment: "Apartment",
      madeWith: "Made with ❤️ for your home",
      changePassword: "Change Password",
      changePasswordDesc: "Update your access password",
      deleteAccount: "Delete Account",
      deleteAccountDesc: "Permanently remove your data",
      faq: "FAQ",
      faqDesc: "Questions about the app",
      privacy: "Privacy",
      privacyDesc: "Privacy policy",
      helpSupport: "Help & Support",
      reconfigure: "Reconfigure Home",
      reconfigureDesc: "Redo the initial setup",
      notifTitle: "Notifications",
      notifDesc: "Choose what you want to be notified about",
      testNotif: "Test notification",
      testNotifDesc: "Send a test notification",
      notifSent: "Test notification scheduled!",
      notifSeconds: "seconds",
      notifOptions: {
        expiry: { label: "Expiry", desc: "Items about to expire" },
        shopping: { label: "Shopping", desc: "Shopping list items" },
        recipes: { label: "Recipes", desc: "Recipe suggestions" },
        nightCheckup: { label: "Night Checkup", desc: "Daily reminder" },
        cooking: { label: "Cooking", desc: "Kitchen timers" },
        consumables: { label: "Consumables", desc: "Item restocking" }
      }
    },
    es: {
      title: "Ajustes",
      profile: "Perfil",
      editProfile: "Editar información personal",
      shortcuts: "Atalhos Rápidos",
      notifications: "Notificaciones",
      appearance: "Apariencia",
      language: "Idioma",
      security: "Seguridad",
      history: "Historial",
      historyDesc: "Actividades recientes",
      garbage: "Recordatorio de Basura",
      garbageDesc: "Días de recolección",
      report: "Informes",
      reportDesc: "Consumo del mes",
      logout: "Cerrar sesión",
      darkMode: "Modo Oscuro",
      subscription: "Suscripción",
      subscriptionDesc: "Ver los detalles de tu plan",
      memberSince: "Miembro desde",
      trialStatus: "Estado del Trial",
      premiumStatus: "Estado Premium",
      daysRemaining: "días restantes",
      paymentHistory: "Historial de Pagos",
      lastPayment: "Último pago",
      viewSubscription: "Ver Suscripción",
      trial: "Gratis",
      premium: "Premium",
      residents: "residentes",
      house: "Casa",
      apartment: "Apartamento",
      madeWith: "Hecho con ❤️ para tu hogar",
      changePassword: "Cambiar Contraseña",
      changePasswordDesc: "Actualiza tu contraseña de acceso",
      deleteAccount: "Eliminar Cuenta",
      deleteAccountDesc: "Eliminar permanentemente tus datos",
      faq: "Preguntas Frecuentes",
      faqDesc: "Dudas sobre la app",
      privacy: "Privacidad",
      privacyDesc: "Política de privacidad",
      helpSupport: "Ayuda & Soporte",
      reconfigure: "Reconfigurar Hogar",
      reconfigureDesc: "Rehacer la configuración inicial",
      notifTitle: "Notificaciones",
      notifDesc: "Elige para qué quieres ser notificado",
      testNotif: "Probar notificación",
      testNotifDesc: "Enviar una notificación de prueba",
      notifSent: "¡Notificación de prueba programada!",
      notifSeconds: "segundos",
      notifOptions: {
        expiry: { label: "Vencimiento", desc: "Artículos por vencer" },
        shopping: { label: "Compras", desc: "Lista de compras" },
        recipes: { label: "Recetas", desc: "Sugerencias de recetas" },
        nightCheckup: { label: "Chequeo Nocturno", desc: "Recordatorio diario" },
        cooking: { label: "Cocina", desc: "Temporizadores de cocina" },
        consumables: { label: "Consumibles", desc: "Reposición de artículos" }
      }
    }
  };

  const l = labels[language] || labels["en"];
  const homeTypeLabel =
    onboardingData?.homeType === "house" ? l.house : l.apartment;

  // keep localName in sync when onboardingData or user changes
  useEffect(() => {
    setLocalName(onboardingData?.name || (user?.user_metadata?.name as string) || user?.email?.split("@")[0] || "");
  }, [onboardingData?.name, user?.id, confirmReconfigureOpen]);

  return (
    <PageTransition
      direction="right"
      className="min-h-[100dvh] bg-[#165a52] pb-32 pt-8"
    >
      <main className="space-y-6 px-3">
        {/* Premium Profile Header */}
        <section
          className={cn(
            "group relative flex items-center gap-4 rounded-3xl p-5 border shadow-md transition-all",
            planTier === "premium"
              ? "border-amber-500/20 bg-amber-50/20 dark:bg-amber-950/20"
              : "bg-white/10 backdrop-blur-xl border-white/20"
          )}
        >
          <AvatarUpload 
            currentUrl={onboardingData?.avatarUrl} 
            size={72} 
            className="shrink-0 ring-2 ring-white/20"
          />
          <div className="flex-1 min-w-0" onClick={() => navigate("/profile")}>
            <div className="flex items-center gap-2 mb-0.5 min-w-0">
              {editingInlineName ? (
                <div className="flex items-center gap-2 w-full min-w-0">
                  <Input
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateOnboardingData({ name: localName });
                        setEditingInlineName(false);
                        toast.success(language === "pt-BR" ? "Nome atualizado" : "Name updated");
                      }
                    }}
                    className="flex-1"
                  />
                  <Button variant="ghost" onClick={() => { updateOnboardingData({ name: localName }); setEditingInlineName(false); toast.success(language === "pt-BR" ? "Nome atualizado" : "Name updated"); }}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => { setEditingInlineName(false); setLocalName(onboardingData?.name || (user?.user_metadata?.name as string) || user?.email?.split("@")[0] || ""); }}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-white truncate">
                    {onboardingData?.name || user?.email?.split("@")[0]}
                  </h2>
                  <button aria-label="Editar nome" title="Editar nome" onClick={() => setEditingInlineName(true)} className="text-white/60 hover:text-white p-1">
                    <Edit className="h-4 w-4" />
                  </button>
                </>
              )}
              <CurrentPlanBadge showUpgradeSheet={false} />
            </div>
            <p className="text-sm font-medium text-white/70">{l.editProfile}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase text-white tracking-wider">
              {onboardingData?.residents || 1} {l.residents} • {homeTypeLabel}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-active:text-primary transition-colors" onClick={() => navigate("/profile")} />
        </section>

        {/* Quick Shortcuts */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-[1.5px] px-1">
            <Zap className="h-3.5 w-3.5 inline mr-1 mb-0.5" /> {l.shortcuts}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/activity-history")}
              className="flex flex-col items-start gap-2.5 rounded-2xl bg-white/10 backdrop-blur-xl p-4 border border-white/20 transition-all active:scale-[0.97] text-left shadow-sm"
            >
              <div className="rounded-xl bg-white/20 p-2.5">
                <History className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm leading-tight">
                  {l.history}
                </p>
                <p className="text-[10px] font-medium text-white/60">
                  {l.historyDesc}
                </p>
              </div>
            </button>
            <button
              onClick={() => navigate("/settings/install")}
              className="flex flex-col items-start gap-2.5 rounded-2xl bg-white/10 backdrop-blur-xl p-4 border border-white/20 transition-all active:scale-[0.97] text-left shadow-sm"
            >
              <div className="rounded-xl bg-white/20 p-2.5">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm leading-tight">
                  {l.installGuide || "Como Instalar"}
                </p>
                <p className="text-[10px] font-medium text-white/60">
                  {l.installGuideDesc || "Android, iOS e PC"}
                </p>
              </div>
            </button>
            <button
              onClick={() => navigate("/monthly-report")}
              className="flex flex-col items-start gap-2.5 rounded-2xl bg-white/10 backdrop-blur-xl p-4 border border-white/20 transition-all active:scale-[0.97] text-left shadow-sm"
            >
              <div className="rounded-xl bg-emerald-400/20 p-2.5">
                <Package className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm leading-tight">
                  {l.report}
                </p>
                <p className="text-[10px] font-medium text-white/60">
                  {l.reportDesc}
                </p>
              </div>
            </button>
            <button
              onClick={() => navigate("/settings/subscription")}
              className="flex flex-col items-start gap-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-4 border border-amber-300 transition-all active:scale-[0.97] text-left shadow-sm"
            >
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm leading-tight">
                  {l.subscription}
                </p>
                <p className="text-[10px] font-medium text-white/80">
                  {l.subscriptionDesc}
                </p>
              </div>
            </button>
            <button
              onClick={() => setConfirmReconfigureOpen(true)}
              className="flex flex-col items-start gap-2.5 rounded-2xl bg-white/10 backdrop-blur-xl p-4 border border-white/20 transition-all active:scale-[0.97] text-left shadow-sm"
            >
              <div className="rounded-xl bg-amber-500/10 p-2.5">
                <RotateCcw className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm leading-tight">
                  {l.reconfigure}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground">
                  {l.reconfigureDesc}
                </p>
              </div>
            </button>
            <button
              onClick={() => navigate("/garbage-reminder")}
              className="flex flex-col items-start gap-2.5 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 border border-black/[0.04] dark:border-white/[0.06] transition-all active:scale-[0.97] text-left shadow-sm hover:bg-white/90 dark:hover:bg-white/10"
            >
              <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-2.5">
                <Trash2 className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm leading-tight">
                  {l.garbage}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground">
                  {l.garbageDesc}
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-[1.5px] px-1">
            {l.appearance}
          </h3>
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2.5">
                  <Layout className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-white text-[15px]">{l.darkMode}</p>
              </div>
              <div className="flex gap-1.5">
                {(
                  [
                    {
                      value: "light",
                      Icon: Sun,
                      labels: { "pt-BR": "Claro", en: "Light", es: "Claro" }
                    },
                    {
                      value: "dark",
                      Icon: Moon,
                      labels: { "pt-BR": "Escuro", en: "Dark", es: "Oscuro" }
                    },
                    {
                      value: "system",
                      Icon: Monitor,
                      labels: { "pt-BR": "Auto", en: "Auto", es: "Auto" }
                    }
                  ] as const
                ).map(({ value, Icon, labels }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value as any)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 h-12 w-12 rounded-xl text-[9px] font-bold transition-all uppercase tracking-wide",
                      theme === value
                        ? "bg-white text-[#165a52] shadow-lg shadow-black/10"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>
                      {labels[language as keyof typeof labels] ?? labels.en}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2.5">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-white text-[15px]">{l.language}</p>
              </div>
              <div className="flex gap-1.5">
                {(
                  [
                    { value: "pt-BR", flag: "🇧🇷", label: "PT" },
                    { value: "en", flag: "🇺🇸", label: "EN" },
                    { value: "es", flag: "🇪🇸", label: "ES" }
                  ] as const
                ).map(({ value, flag, label }) => (
                  <button
                    key={value}
                    onClick={() => setLanguage(value as any)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 h-12 w-12 rounded-xl text-[9px] font-bold transition-all",
                      language === value
                        ? "bg-white text-[#165a52] shadow-lg shadow-black/10"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    )}
                  >
                    <span className="text-xl leading-none">{flag}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-[1.5px] px-1 flex items-center gap-1">
            <Bell className="h-3.5 w-3.5 inline" /> {l.notifTitle}
          </h3>
          <p className="text-xs text-white/50 px-1">{l.notifDesc}</p>
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden shadow-sm">
            {([
              { key: "expiry", Icon: Clock, color: "text-amber-500" },
              { key: "shopping", Icon: ShoppingCart, color: "text-blue-500" },
              { key: "recipes", Icon: UtensilsCrossed, color: "text-green-500" },
              { key: "nightCheckup", Icon: CalendarClock, color: "text-indigo-500" },
              { key: "cooking", Icon: Flame, color: "text-orange-500" },
              { key: "consumables", Icon: Package2, color: "text-purple-500" },
            ] as const).map(({ key, Icon, color }, idx) => {
              const prefs = onboardingData?.notificationPrefs || ["expiry", "shopping", "nightCheckup"];
              const isActive = prefs.includes(key);
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center justify-between px-5 py-3.5",
                    idx < 5 && "border-b border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-xl p-2", isActive ? "bg-white/20" : "bg-black/10")}>
                      <Icon className={cn("h-4.5 w-4.5", isActive ? color : "text-white/40")} />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-[14px]">{(l.notifOptions as any)[key]?.label}</p>
                      <p className="text-[11px] text-white/60">{(l.notifOptions as any)[key]?.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => {
                      const current = onboardingData?.notificationPrefs || ["expiry", "shopping", "nightCheckup"];
                      const next = isActive
                        ? current.filter((p: string) => p !== key)
                        : [...current, key];
                        if (next.length === 0) {
                          toast.error(language === "pt-BR" ? "Selecione ao menos uma preferência de notificação." : "Select at least one notification preference.");
                          return;
                        }
                        updateOnboardingData({ notificationPrefs: next });
                    }}
                  />
                </div>
              );
            })}
          </div>
          {/* Test Notification Button */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <select
                value={notifDelay}
                onChange={(e) => setNotifDelay(Number(e.target.value))}
                className="h-10 rounded-xl bg-muted/30 border-none px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {[3, 5, 10, 15, 30, 60].map((s) => (
                  <option key={s} value={s}>{s} {l.notifSeconds}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if ("Notification" in window) {
                    Notification.requestPermission().then((permission) => {
                      if (permission === "granted") {
                        setTimeout(() => {
                          sendWebNotification(
                            "🧊 Kaza — Tudo Pronto!",
                            language === "pt-BR"
                              ? "Notificações ativadas! Você será avisado sobre prazos, estoque e coleta de lixo."
                              : language === "es"
                                ? "¡Notificaciones activadas! Serás avisado sobre plazos, inventario y recolección."
                                : "Notifications enabled! You'll be alerted about expiry, stock and garbage collection.",
                            {
                              tag: "test-notification",
                              category: "test"
                            }
                          );
                        }, notifDelay * 1000);
                      }
                    });
                  }
                  toast.success(`${l.notifSent} (${notifDelay}s)`);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary/10 py-3.5 text-primary font-semibold text-sm transition-all active:scale-[0.97]"
              >
                <BellRing className="h-4.5 w-4.5" />
                {l.testNotif}
              </button>
            </div>
          </div>
        </section>

        {/* Help & Support */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-[1.5px] px-1 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 inline" /> {l.helpSupport}
          </h3>
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden shadow-sm">
            <button
              onClick={() => navigate("/settings/faq")}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-white/10 transition-colors active:bg-white/5 group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2.5">
                  <HelpCircle className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white text-[15px]">{l.faq}</p>
                  <p className="text-xs text-white/60">{l.faqDesc}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/60 group-active:text-white transition-colors" />
            </button>

            <button
              onClick={() => navigate("/settings/privacy")}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors active:bg-white/5 group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2.5">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white text-[15px]">{l.privacy}</p>
                  <p className="text-xs text-white/60">{l.privacyDesc}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/60 group-active:text-white transition-colors" />
            </button>
          </div>
        </section>

        {/* Installation Guide */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-[1.5px] px-1 flex items-center gap-1">
            <Download className="h-3.5 w-3.5 inline" /> {l.installGuide}
          </h3>
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden shadow-sm">
            <button
              onClick={() => navigate("/settings/install")}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors active:bg-white/5 group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2.5">
                  <MonitorDown className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white text-[15px]">{l.installGuide}</p>
                  <p className="text-xs text-white/60">{l.installGuideDesc}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/60 group-active:text-white transition-colors" />
            </button>
          </div>
        </section>

        {/* Security & Account */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-[1.5px] px-1">
            {l.security}
          </h3>
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden shadow-sm">
            <button
              onClick={() => setChangePasswordOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-white/20 transition-colors active:bg-white/5 group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2.5">
                  <KeyRound className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white text-[15px]">
                    {l.changePassword}
                  </p>
                  <p className="text-xs text-white/60">
                    {l.changePasswordDesc}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/60 group-active:text-white transition-colors" />
            </button>

            <button
              onClick={() => setDeleteAccountOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-white/20 active:bg-destructive/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-400/20 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-red-200" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-red-200 text-[15px]">
                    {l.deleteAccount}
                  </p>
                  <p className="text-xs text-red-200/60">{l.deleteAccountDesc}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-red-200/60 group-active:text-red-200 transition-colors" />
            </button>

            <button
              onClick={signOut}
              className="w-full flex items-center justify-between px-5 py-4 active:bg-destructive/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-400/20 p-2.5 text-red-200">
                  <LogOut className="h-5 w-5" />
                </div>
                <p className="font-semibold text-red-200 text-[15px]">{l.logout}</p>
              </div>
            </button>
          </div>
        </section>

        <div className="text-center py-6 pb-12">
          <p className="text-[16px] font-cursive italic text-white/50">
            Kaza v2.0.0
          </p>
          <p className="text-xs text-white/40 mt-2">{l.madeWith}</p>
        </div>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={confirmReconfigureOpen} onOpenChange={setConfirmReconfigureOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              {l.reconfigure}
            </DialogTitle>
            <DialogDescription>
              {l.reconfigureDesc}
            </DialogDescription>
            <div className="mt-3">
              <Label className="text-sm">{language === "pt-BR" ? "Nome" : language === "es" ? "Nombre" : "Name"}</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  disabled={!editingDialogName}
                />
                <Button variant="ghost" onClick={() => setEditingDialogName((v) => !v)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReconfigureOpen(false)}>
              {language === "pt-BR" ? "Cancelar" : language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={async () => {
                setConfirmReconfigureOpen(false);
                await resetOnboarding();
                // Preserve name typed by user when restarting onboarding
                updateOnboardingData({ name: localName });
                navigate("/");
                toast.success(language === "pt-BR" ? "Configuração reiniciada" : language === "es" ? "Configuración reiniciada" : "Configuration reset");
              }}
            >
              {language === "pt-BR" ? "Reconfigurar" : language === "es" ? "Reconfigurar" : "Reconfigure"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              {l.changePassword}
            </DialogTitle>
            <DialogDescription>
              {language === "pt-BR"
                ? "Digite sua nova senha com pelo menos 6 caracteres."
                : language === "es"
                  ? "Ingresa tu nueva contraseña con al menos 6 caracteres."
                  : "Enter your new password with at least 6 characters."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>
                {language === "pt-BR"
                  ? "Nova senha"
                  : language === "es"
                    ? "Nueva contraseña"
                    : "New password"}
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>
                {language === "pt-BR"
                  ? "Confirmar senha"
                  : language === "es"
                    ? "Confirmar contraseña"
                    : "Confirm password"}
              </Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangePasswordOpen(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              {language === "pt-BR"
                ? "Cancelar"
                : language === "es"
                  ? "Cancelar"
                  : "Cancel"}
            </Button>
            <Button
              disabled={
                passwordLoading ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
              onClick={async () => {
                setPasswordLoading(true);
                try {
                  const { error } = await supabase.auth.updateUser({
                    password: newPassword
                  });
                  if (error) throw error;
                  toast.success(
                    language === "pt-BR"
                      ? "Senha alterada com sucesso!"
                      : language === "es"
                        ? "¡Contraseña cambiada!"
                        : "Password changed!"
                  );
                  setChangePasswordOpen(false);
                  setNewPassword("");
                  setConfirmPassword("");
                } catch (error: any) {
                  toast.error(error.message || "Error");
                } finally {
                  setPasswordLoading(false);
                }
              }}
            >
              {passwordLoading
                ? "..."
                : language === "pt-BR"
                  ? "Salvar"
                  : language === "es"
                    ? "Guardar"
                    : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {l.deleteAccount}
            </DialogTitle>
            <DialogDescription>
              {language === "pt-BR"
                ? 'Esta ação é irreversível. Todos os seus dados serão perdidos. Digite "EXCLUIR" para confirmar.'
                : language === "es"
                  ? 'Esta acción es irreversible. Todos tus datos se perderán. Escribe "ELIMINAR" para confirmar.'
                  : 'This action is irreversible. All your data will be lost. Type "DELETE" to confirm.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={
                language === "pt-BR"
                  ? "EXCLUIR"
                  : language === "es"
                    ? "ELIMINAR"
                    : "DELETE"
              }
              className="border-destructive/50 focus:border-destructive"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteAccountOpen(false);
                setDeleteConfirmText("");
              }}
            >
              {language === "pt-BR"
                ? "Cancelar"
                : language === "es"
                  ? "Cancelar"
                  : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              disabled={
                (language === "pt-BR" && deleteConfirmText !== "EXCLUIR") ||
                (language === "es" && deleteConfirmText !== "ELIMINAR") ||
                (language === "en" && deleteConfirmText !== "DELETE")
              }
              onClick={async () => {
                try {
                  // Delete user data first
                  if (user) {
                    await supabase
                      .from("items")
                      .delete()
                      .eq("user_id", user.id);
                    await supabase
                      .from("shopping_items")
                      .delete()
                      .eq("user_id", user.id);
                    await supabase
                      .from("saved_recipes")
                      .delete()
                      .eq("user_id", user.id);
                    await supabase
                      .from("subscriptions")
                      .delete()
                      .eq("user_id", user.id);
                    await supabase
                      .from("profiles")
                      .delete()
                      .eq("user_id", user.id);
                  }
                  await signOut();
                  toast.success(
                    language === "pt-BR"
                      ? "Conta excluída."
                      : language === "es"
                        ? "Cuenta eliminada."
                        : "Account deleted."
                  );
                } catch (error: any) {
                  toast.error(error.message || "Error");
                }
              }}
            >
              {language === "pt-BR"
                ? "Excluir Conta"
                : language === "es"
                  ? "Eliminar Cuenta"
                  : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
