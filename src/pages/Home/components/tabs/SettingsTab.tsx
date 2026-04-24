/* eslint-disable @typescript-eslint/no-explicit-any */
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
  MonitorDown,
  Home,
  Users,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useKaza } from "@/contexts/KazaContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSubscription, PLAN_DETAILS } from "@/contexts/SubscriptionContext";
import { GroupMembersCard } from "../GroupMembersCard";
import { usePWA } from "@/contexts/PWAContext";
import { Switch } from "@/components/ui/switch";
import { getCategoryEmoji } from '../RecipeCard';
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
  const { onboardingData, resetOnboarding, updateOnboardingData, isSubAccount } = useKaza();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { canInstall, install } = usePWA();
  const { getPlanTier, subscription, trialDaysRemaining, isMultiPro } = useSubscription();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [confirmReconfigureOpen, setConfirmReconfigureOpen] = useState(false);
  const [confirmFactoryResetOpen, setConfirmFactoryResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [notifDelay, setNotifDelay] = useState(5);
  const [nightCheckupTime, setNightCheckupTime] = useState<string>(
    () => onboardingData?.nightCheckupTime || "21:00"
  );
  const planTier = getPlanTier();
  const [editingInlineName, setEditingInlineName] = useState(false);
  const [editingDialogName, setEditingDialogName] = useState(false);
  const [localName, setLocalName] = useState<string>(
    onboardingData?.name || (user?.user_metadata?.name as string) || user?.email?.split("@")[0] || ""
  );

  const labels: Record<string, any> = {
    "pt-BR": {
      title: "Ajustes",
      profile: "Ajustes",
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
      subscription: isSubAccount ? "Minha Home" : "Assinatura",
      subscriptionDesc: isSubAccount ? "Gerencie a casa onde está conectado" : "Veja os detalhes do seu plano",
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
      testNotif: "Testar",
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
      subscription: isSubAccount ? "My Home" : "Subscription",
      subscriptionDesc: isSubAccount ? "Manage the home you are connected to" : "View your plan details",
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
      subscription: isSubAccount ? "Mi Hogar" : "Suscripción",
      subscriptionDesc: isSubAccount ? "Administra el hogar al que estás conectado" : "Ver los detalles de tu plan",
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
      className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-nav-safe pt-8"
    >
      <main className="space-y-6 px-3">
        {/* Profile — horizontal layout: avatar left, info right */}
        <section className="flex items-center gap-4 pt-2 pb-1 px-1">
          <div onClick={(e) => {
            // Prevent navigation if the user clicks the file upload buttons inside AvatarUpload
            if ((e.target as HTMLElement).closest('button')) return;
            navigate("/app/profile")
          }} className="relative group shrink-0 cursor-pointer">
            <AvatarUpload
              currentUrl={onboardingData?.avatarUrl}
              size={72}
              className="shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-[#11302c] border border-[#E2E1DC] dark:border-white/10 flex items-center justify-center shadow-sm">
              <Edit className="h-3 w-3 text-[#7A7A72] dark:text-white/60" />
            </div>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <p className="text-[18px] font-bold text-[#2C2C2A] dark:text-white leading-tight truncate">
                {onboardingData?.name || user?.email?.split("@")[0]}
              </p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Online</span>
              </div>
            </div>
            {planTier === "premium" && trialDaysRemaining <= 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3D6B55]/10 border border-[#3D6B55]/25 text-[#3D6B55] text-[11px] font-black uppercase tracking-wider w-fit">
                <Crown className="h-3 w-3" /> Premium
              </span>
            ) : trialDaysRemaining > 0 ? (
              <button
                onClick={() => navigate("/app/settings/subscription/manage")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-400/30 text-amber-600 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider w-fit hover:bg-amber-500/20 dark:hover:bg-amber-500/30 transition-colors active:scale-95"
              >
                <Star className="h-3 w-3 fill-amber-500/20" />
                {language === "pt-BR" ? `Trial · ${trialDaysRemaining}d` : language === "es" ? `Trial · ${trialDaysRemaining}d` : `Trial · ${trialDaysRemaining}d`}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0EFE8] dark:bg-white/10 border border-[#E2E1DC] dark:border-white/10 text-[#9A998F] dark:text-white/40 text-[11px] font-black uppercase tracking-wider w-fit">
                {language === "pt-BR" ? "Gratuito" : language === "es" ? "Gratis" : "Free"}
              </span>
            )}
            {subscription?.nextBillingDate && planTier === "premium" && (
              <p className="text-[11px] text-[#9A998F] dark:text-white/40 font-medium">
                {language === "pt-BR" ? "Próximo pagamento: " : language === "es" ? "Próximo pago: " : "Next payment: "}
                {new Date(subscription.nextBillingDate).toLocaleDateString(language === "pt-BR" ? "pt-BR" : language === "es" ? "es-ES" : "en-US")}
              </p>
            )}
          </div>
        </section>

        {/* Group Members Card (MultiPRO only) */}
        {isMultiPro && (
          <section>
            <GroupMembersCard />
          </section>
        )}

        {/* Quick Shortcuts */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-[#9A998F] dark:text-white/40 uppercase tracking-[1.5px] px-1 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5" /> {l.shortcuts}
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {([
              { label: l.history, desc: l.historyDesc, icon: History, color: "text-[#3D3D3A] dark:text-white/80", bg: "bg-[#EDECEA] dark:bg-white/10", onClick: () => navigate("/app/activity-history"), subAllowed: true },
              { label: l.installGuide || "Como Instalar", desc: l.installGuideDesc || "Android, iOS e PC", icon: Download, color: "text-[#3D3D3A] dark:text-white/80", bg: "bg-[#EDECEA] dark:bg-white/10", onClick: () => navigate("/app/settings/install"), subAllowed: true },
              { label: l.report, desc: l.reportDesc, icon: Package, color: "text-[#3D6B55] dark:text-emerald-400", bg: "bg-[#3D6B55]/10 dark:bg-emerald-500/20", onClick: () => navigate("/app/monthly-report"), subAllowed: true },
              { label: l.subscription, desc: l.subscriptionDesc, icon: isSubAccount ? Home : Crown, color: "text-[#3D3D3A] dark:text-white/80", bg: "bg-[#EDECEA] dark:bg-white/10", onClick: () => isSubAccount ? navigate("/app/home") : navigate("/app/settings/subscription/manage"), subAllowed: true },
              { label: l.reconfigure, desc: l.reconfigureDesc, icon: RotateCcw, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/20", onClick: () => setConfirmReconfigureOpen(true), subAllowed: false },
              { label: l.garbage, desc: l.garbageDesc, icon: Trash2, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/20", onClick: () => navigate("/app/garbage-reminder"), subAllowed: true },
            ] as const).filter(s => !isSubAccount || s.subAllowed).map(({ label, desc, icon: Icon, color, bg, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex flex-col items-start gap-2.5 rounded-2xl bg-white dark:bg-[#11302c] p-4 border border-[#E2E1DC] dark:border-white/10 transition-all active:scale-[0.97] text-left shadow-sm"
              >
                <div className={cn("rounded-xl p-2.5", bg)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
                <div>
                  <p className="font-semibold text-[#2C2C2A] dark:text-white text-sm leading-tight">{label}</p>
                  <p className="text-[10px] font-medium text-[#9A998F] dark:text-white/40 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Subscription Section */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-[#9A998F] dark:text-white/40 uppercase tracking-[1.5px] px-1 flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5" /> {l.subscription}
          </h3>

          {/* Current plan row */}
          <div className="rounded-2xl bg-white dark:bg-[#11302c] border border-[#E2E1DC] dark:border-white/10 overflow-hidden shadow-sm">
            {planTier === "premium" || (isSubAccount && planTier !== "free") ? (
              /* Premium paid or inherited — CLICKABLE → subscription page (or home info for sub-account) */
              <button
                onClick={() => isSubAccount ? navigate("/app/home") : navigate("/app/settings/subscription/manage")}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-[#F7F6F3] dark:active:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-[#3D6B55]/10 border border-[#3D6B55]/20 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-[#3D6B55]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#2C2C2A] dark:text-white text-[15px] leading-tight">
                      {isSubAccount ? onboardingData?.homeName || "Kaza Home" : "Kaza Premium"}
                    </p>
                    <p className="text-[12px] text-[#7A7A72] dark:text-white/60 font-medium">
                      {isSubAccount 
                        ? (language === "pt-BR" ? "Plano compartilhado ativo" : "Shared plan active")
                        : (language === "pt-BR" ? "Acesso completo ativo" : "Full access active")}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-[#B0AFA7] dark:text-white/30 group-active:text-[#3D3D3A] dark:text-white/80" />
              </button>
            ) : (
              /* Trial / Free — NOT clickable, just status */
              <div className="flex items-center gap-3.5 px-5 py-4">
                <div className={cn(
                  "h-11 w-11 rounded-2xl flex items-center justify-center",
                  trialDaysRemaining > 0 ? "bg-amber-500/20 border border-amber-400/30" : "bg-[#F0EFE8] dark:bg-white/10 border border-[#E2E1DC] dark:border-white/10"
                )}>
                  {trialDaysRemaining > 0
                    ? <Star className="h-5 w-5 text-amber-500" />
                    : <Zap className="h-5 w-5 text-[#B0AFA7] dark:text-white/30" />
                  }
                </div>
                <div>
                  <p className="font-bold text-[#2C2C2A] dark:text-white text-[15px] leading-tight">
                    {trialDaysRemaining > 0
                      ? (language === "pt-BR" ? "Período de Teste" : language === "es" ? "Período de Prueba" : "Trial Period")
                      : (language === "pt-BR" ? "Plano Gratuito" : language === "es" ? "Plan Gratuito" : "Free Plan")
                    }
                  </p>
                  <p className="text-[12px] text-[#7A7A72] dark:text-white/60 font-medium">
                    {trialDaysRemaining > 0
                      ? (language === "pt-BR" ? `${trialDaysRemaining} dias restantes` : language === "es" ? `${trialDaysRemaining} días restantes` : `${trialDaysRemaining} days left`)
                      : (language === "pt-BR" ? "Recursos limitados" : language === "es" ? "Recursos limitados" : "Limited features")
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Plan cards — always visible for upgrade/subscribe (hidden only if actively paid) */}

        </section>

        {/* Preferences */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-[#9A998F] dark:text-white/40 uppercase tracking-[1.5px] px-1">{l.appearance}</h3>
          <div className="rounded-2xl bg-white dark:bg-[#11302c] border border-[#E2E1DC] dark:border-white/10 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E1DC] dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#EDECEA] dark:bg-white/10 p-2.5">
                  <Layout className="h-5 w-5 text-[#3D3D3A] dark:text-white/80" />
                </div>
                <p className="font-semibold text-[#2C2C2A] dark:text-white text-[15px]">{l.darkMode}</p>
              </div>
              <div className="flex gap-1.5">
                {([
                  { value: "light", Icon: Sun, labels: { "pt-BR": "Claro", en: "Light", es: "Claro" } },
                  { value: "dark", Icon: Moon, labels: { "pt-BR": "Escuro", en: "Dark", es: "Oscuro" } },
                  { value: "system", Icon: Monitor, labels: { "pt-BR": "Auto", en: "Auto", es: "Auto" } },
                ] as const).map(({ value, Icon, labels }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value as any)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 h-12 w-12 rounded-xl text-[9px] font-black transition-all uppercase tracking-wide border",
                      theme === value
                        ? "bg-white text-[#165A52] border-[#165A52]/20 shadow-[0_4px_12px_rgba(22,90,82,0.12)]"
                        : "bg-[#F0EFE8] text-[#7A7A72] border-transparent dark:bg-white/10 dark:text-white/50 hover:bg-[#E8E7E0] dark:hover:bg-white/15"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{labels[language as keyof typeof labels] ?? labels.en}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#EDECEA] dark:bg-white/10 p-2.5">
                  <Globe className="h-5 w-5 text-[#3D3D3A] dark:text-white/80" />
                </div>
                <p className="font-semibold text-[#2C2C2A] dark:text-white text-[15px]">{l.language}</p>
              </div>
              <div className="flex gap-1.5">
                {([
                  { value: "pt-BR", label: "PT" },
                  { value: "en", label: "EN" },
                  { value: "es", label: "ES" },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setLanguage(value as any)}
                    className={cn(
                      "flex items-center justify-center h-12 w-12 rounded-xl text-[13px] font-black tracking-wide transition-all uppercase border",
                      language === value
                        ? "bg-white text-[#165A52] border-[#165A52]/20 shadow-[0_4px_12px_rgba(22,90,82,0.12)]"
                        : "bg-[#F0EFE8] text-[#7A7A72] border-transparent dark:bg-white/10 dark:text-white/50 hover:bg-[#E8E7E0] dark:hover:bg-white/15"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-[#9A998F] dark:text-white/40 uppercase tracking-[1.5px] px-1 flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" /> {l.notifTitle}
          </h3>
          <p className="text-xs text-[#9A998F] dark:text-white/40 px-1">{l.notifDesc}</p>
          <div className="rounded-2xl bg-white dark:bg-[#11302c] border border-[#E2E1DC] dark:border-white/10 overflow-hidden shadow-sm">
            {([
              { key: "expiry", Icon: Clock, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/20" },
              { key: "shopping", Icon: ShoppingCart, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/20" },
              { key: "recipes", Icon: UtensilsCrossed, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/20" },
              { key: "nightCheckup", Icon: CalendarClock, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/20" },
              { key: "cooking", Icon: Flame, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/20" },
              { key: "consumables", Icon: Package2, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/20" },
            ] as const).map(({ key, Icon, color, bg }, idx) => {
              const prefs = onboardingData?.notificationPrefs || ["expiry", "shopping", "nightCheckup"];
              const isActive = prefs.includes(key);
              return (
                <div key={key} className={cn("flex items-center justify-between px-5 py-3.5", idx < 5 && "border-b border-[#E2E1DC] dark:border-white/10")}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("rounded-xl p-2 shrink-0", isActive ? bg : "bg-[#EDECEA] dark:bg-white/10")}>
                      <Icon className={cn("h-4 w-4", isActive ? color : "text-[#B0AFA7] dark:text-white/30")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#2C2C2A] dark:text-white text-[14px]">{(l.notifOptions as any)[key]?.label}</p>
                      {key === "nightCheckup" ? (
                        <input
                          type="time"
                          value={nightCheckupTime}
                          onChange={(e) => setNightCheckupTime(e.target.value)}
                          className="mt-0.5 h-7 rounded-lg border border-[#E2E1DC] dark:border-white/10 bg-[#F5F5F5] dark:bg-white/10 px-2 text-[12px] font-semibold text-[#3D6B55] dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/40"
                        />
                      ) : (
                        <p className="text-[11px] text-[#9A998F] dark:text-white/40">{(l.notifOptions as any)[key]?.desc}</p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => {
                      const current = onboardingData?.notificationPrefs || ["expiry", "shopping", "nightCheckup"];
                      const next = isActive ? current.filter((p: string) => p !== key) : [...current, key];
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
          <div className="flex items-center gap-2.5">
            <select
              value={notifDelay}
              onChange={(e) => setNotifDelay(Number(e.target.value))}
              className="h-11 rounded-xl bg-[#F5F5F5] dark:bg-white/10 border border-[#E2E1DC] dark:border-white/10 px-3 text-sm font-semibold text-[#2C2C2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D6B55]/30"
            >
              {[3, 5, 10, 15, 30, 60].map((s) => (
                <option key={s} value={s}>{s} {l.notifSeconds}</option>
              ))}
            </select>
            <button
              onClick={() => {
                updateOnboardingData({ nightCheckupTime, notificationPrefs: onboardingData?.notificationPrefs || ["expiry", "shopping", "nightCheckup"] });
                toast.success(language === "pt-BR" ? "Preferências salvas!" : language === "es" ? "¡Preferencias guardadas!" : "Preferences saved!");
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#F5F5F5] dark:bg-white/10 border border-[#E2E1DC] dark:border-white/10 py-3 px-4 text-[#3D6B55] dark:text-emerald-400 font-semibold text-sm transition-all active:scale-[0.97] shadow-sm"
            >
              <Check className="h-4 w-4" />
              {language === "pt-BR" ? "Salvar" : language === "es" ? "Guardar" : "Save"}
            </button>
            <button
              onClick={async () => {
                if (!("Notification" in window)) {
                  toast.error(language === "pt-BR" ? "Notificações não suportadas neste navegador." : "Notifications not supported in this browser.");
                  return;
                }
                let permission = Notification.permission;
                if (permission === "default") permission = await Notification.requestPermission();
                if (permission !== "granted") {
                  toast.error(language === "pt-BR" ? "Permissão de notificação negada. Habilite nas configurações do navegador." : "Notification permission denied.");
                  return;
                }
                toast.success(`${l.notifSent} (${notifDelay}s)`);

                const testNotifs = language === "pt-BR" ? [
                  { title: "🧊 Kaza — Tudo Pronto!", body: "Notificações ativadas com sucesso." },
                  { title: "🕰️ Kaza — Vencimento", body: "Atenção: A maçã vence amanhã!" },
                  { title: "🛒 Kaza — Lista Compras", body: "O item 'Leite' foi adicionado." },
                  { title: "🍳 Kaza — Cozinha", body: "Seu timer de 15 minutos terminou!" },
                  { title: "🌙 Kaza — Check-up", body: "Tudo certo na cozinha para dormir?" },
                  { title: "📦 Kaza — Estoque", body: "O sabão em pó está acabando." }
                ] : [
                  { title: "🧊 Kaza — All Set!", body: "Notifications successfully enabled." },
                  { title: "🕰️ Kaza — Expiry", body: "Warning: Apple expires tomorrow!" },
                  { title: "🛒 Kaza — Shopping List", body: "Item 'Milk' was added." },
                  { title: "🍳 Kaza — Kitchen", body: "Your 15 minute timer is up!" },
                  { title: "🌙 Kaza — Check-up", body: "All good in the kitchen for the night?" },
                  { title: "📦 Kaza — Stock", body: "Detergent is running low." }
                ];

                testNotifs.forEach((notif, index) => {
                  setTimeout(() => {
                    sendWebNotification(notif.title, notif.body, { tag: `test-notif-${index}`, category: "general" });
                  }, (notifDelay * 1000) + (index * 5000));
                });
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-secondary dark:bg-white/10 border border-border dark:border-white/10 py-3 text-primary dark:text-emerald-400 font-semibold text-sm transition-all active:scale-[0.97] shadow-sm"
            >
              <BellRing className="h-4 w-4" />
              {l.testNotif}
            </button>
          </div>
        </section>

        {/* Help & Support */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-[#9A998F] dark:text-white/40 uppercase tracking-[1.5px] px-1 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> {l.helpSupport}
          </h3>
          <div className="rounded-2xl bg-white dark:bg-card border border-border dark:border-white/10 overflow-hidden shadow-sm">
            {[
              { label: l.faq, desc: l.faqDesc, icon: HelpCircle, onClick: () => navigate("/app/settings/faq") },
              { label: "Suporte", desc: "Entre em contato via WhatsApp", icon: MessageCircle, onClick: () => window.open("https://wa.me/5511914878708", "_blank") },
              { label: l.privacy, desc: l.privacyDesc, icon: FileText, onClick: () => navigate("/app/settings/privacy") },
            ].map(({ label, desc, icon: Icon, onClick }, idx, arr) => (
              <button
                key={label}
                onClick={onClick}
                className={cn("w-full flex items-center justify-between px-5 py-4 active:bg-secondary dark:active:bg-white/5 transition-colors group", idx < arr.length - 1 && "border-b border-border dark:border-white/10")}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-secondary dark:bg-white/10 p-2.5">
                    <Icon className="h-5 w-5 text-[#3D3D3A] dark:text-white/80" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-[#2C2C2A] dark:text-white text-[15px]">{label}</p>
                    <p className="text-xs text-[#9A998F] dark:text-white/40">{desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-[#B0AFA7] dark:text-white/30" />
              </button>
            ))}
          </div>
        </section>

        {/* Security & Account */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold text-[#9A998F] dark:text-white/40 uppercase tracking-[1.5px] px-1">{l.security}</h3>
          <div className="rounded-2xl bg-white dark:bg-card border border-border dark:border-white/10 overflow-hidden shadow-sm">
            <button
              onClick={() => setChangePasswordOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-border dark:border-white/10 active:bg-secondary dark:active:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-secondary dark:bg-white/10 p-2.5">
                  <KeyRound className="h-5 w-5 text-[#3D3D3A] dark:text-white/80" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#2C2C2A] dark:text-white text-[15px]">{l.changePassword}</p>
                  <p className="text-xs text-[#9A998F] dark:text-white/40">{l.changePasswordDesc}</p>
                </div>
              </div>
              <ChevronRight className="h-4.5 w-4.5 text-[#B0AFA7] dark:text-white/30" />
            </button>
            {!isSubAccount && <button
              onClick={() => setDeleteAccountOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-border dark:border-white/10 active:bg-red-50 dark:active:bg-red-500/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-50 dark:bg-red-500/20 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-red-500 text-[15px]">{l.deleteAccount}</p>
                  <p className="text-xs text-red-400/70">{l.deleteAccountDesc}</p>
                </div>
              </div>
              <ChevronRight className="h-4.5 w-4.5 text-red-300" />
            </button>}
            {!isSubAccount && <button
              onClick={() => setConfirmFactoryResetOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-border dark:border-white/10 active:bg-red-50 dark:active:bg-red-500/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-50 dark:bg-red-500/20 p-2.5">
                  <RotateCcw className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-red-500 text-[15px]">{l.clearData || "Limpar Dados da Kaza"}</p>
                  <p className="text-xs text-red-400/70">Apagar todos os itens e configurações</p>
                </div>
              </div>
              <ChevronRight className="h-4.5 w-4.5 text-red-300" />
            </button>}
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-5 py-4 active:bg-red-50 dark:active:bg-red-500/10 transition-colors"
            >
              <div className="rounded-xl bg-red-50 dark:bg-red-500/20 p-2.5">
                <LogOut className="h-5 w-5 text-red-500" />
              </div>
              <p className="font-semibold text-red-500 text-[15px]">{l.logout}</p>
            </button>
          </div>
        </section>

        <div className="text-center py-6 pb-12">
          <p className="text-[13px] text-[#B0AFA7] dark:text-white/30 font-medium">KAZA App</p>
          <p className="text-xs text-[#B0AFA7] dark:text-white/30 mt-1">{l.madeWith}</p>
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
                navigate("/app/home");
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
      {/* Factory Reset Dialog */}
      <Dialog open={confirmFactoryResetOpen} onOpenChange={setConfirmFactoryResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <RotateCcw className="h-5 w-5" />
              {l.clearData || "Limpar Tudo"}
            </DialogTitle>
            <DialogDescription>
              {language === "pt-BR"
                ? "Isso removerá permanentemente todos os seus itens, lista de compras e histórico. Você precisará reconfigurar sua Kaza."
                : "This will permanently remove all your items, shopping list, and history. You will need to reconfigure your Kaza."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFactoryResetOpen(false)}>
              {l.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const { factoryReset } = (await import("@/contexts/KazaContext")).useKaza();
                setConfirmFactoryResetOpen(false);
                await factoryReset();
              }}
            >
              {language === "pt-BR" ? "Apagar Tudo" : "Wipe Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
