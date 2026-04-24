import { useEffect, useState, ReactNode, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SubscriptionProvider, useSubscription } from "@/contexts/SubscriptionContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { KazaProvider, useKaza } from "@/contexts/KazaContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PWAProvider } from "@/contexts/PWAContext";
import {
  listenForDeepLinks,
  closeInAppBrowser
} from "@/lib/nativeBrowser";
import { registerBackButton } from "@/lib/nativeUI";
import { isNative } from "@/lib/capacitor";
import { supabase } from "@/integrations/supabase/client";
import { Sentry } from "@/lib/sentry";
import { OfflineOverlay } from "@/components/kaza/OfflineOverlay";
import PWAInstallGuide from "@/components/kaza/PWAInstallGuide";
import { AccountSessionTracker } from "@/components/kaza/AccountSessionTracker";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { invalidateCacheIfNeeded } from "@/lib/cacheVersion";
import { initDebugHelper } from "@/lib/debugHelper";

const Index = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SuccessPage = lazy(() => import("./pages/Success"));
const MonthlyReportPage = lazy(() => import("./pages/MonthlyReport"));
const NightCheckupPage = lazy(() => import("./pages/NightCheckup"));
const PlansPage = lazy(() => import("./pages/Plans"));
const TrioSetupPage = lazy(() => import("./pages/TrioSetup"));
const CheckoutSuccessPage = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancelPage = lazy(() => import("./pages/CheckoutCancel"));
const AddItemPage = lazy(() => import("./pages/AddItem"));
const ConsumePage = lazy(() => import("./pages/Consume"));
const RecipePage = lazy(() => import("./pages/Recipe"));
const ConsumableTrackerPage = lazy(() => import("./pages/ConsumableTracker"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const HistoryPage = lazy(() => import("./pages/History"));
const GarbageReminderPage = lazy(() => import("./pages/GarbageReminder"));
const InstallGuidePage = lazy(() => import("./pages/InstallGuide"));
const SubscriptionPage = lazy(() => import("./pages/Subscription"));
const SubscriptionsManagePage = lazy(() => import("./pages/SubscriptionsManage"));
const FAQPage = lazy(() => import("./pages/FAQ"));
const PrivacyPage = lazy(() => import("./pages/Privacy"));
const MealPlannerPage = lazy(() => import("./pages/MealPlanner"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const SalesTermsPage = lazy(() => import("./pages/SalesPage/TermsPage"));
const SalesPrivacyPage = lazy(() => import("./pages/SalesPage/PrivacyPage"));
const InvitePage = lazy(() => import("./pages/Invite").then(m => ({ default: m.InvitePage })));

const queryClient = new QueryClient();

function PageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
    </div>
  );
}

/** Loader premium — apenas ícone + glow + barra shimmer, sem textos. */
function SplashLoader() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center kaza-splash-bg relative overflow-hidden">
      {/* glow verde suave atrás do ícone */}
      <div
        className="absolute w-[240px] h-[240px] rounded-full kaza-glow pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(52,199,89,0.22) 0%, rgba(52,199,89,0.08) 38%, rgba(52,199,89,0) 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* ícone principal com breathing */}
      <div className="relative z-10 kaza-breath">
        <img
          src="/icons/192.png"
          alt=""
          aria-hidden
          className="w-24 h-24 md:w-28 md:h-28 object-contain rounded-[26px]"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.05), 0 18px 48px rgba(0,0,0,0.45), 0 0 40px rgba(52,199,89,0.18)",
          }}
        />
      </div>

      {/* barra discreta com shimmer */}
      <div className="relative z-10 mt-8 w-44 h-[5px] rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full w-2/5 rounded-full kaza-shimmer"
          style={{
            background: "linear-gradient(90deg,#24c85a 0%,#48e07c 100%)",
          }}
        />
      </div>
    </div>
  );
}

/** Redireciona para /auth se não estiver logado */
function ProtectedRoute({ element, allowLocked = false, allowOnboarding = false }: { element: JSX.Element, allowLocked?: boolean, allowOnboarding?: boolean }) {
  const { user, loading: authLoading, requireAuth } = useAuth();
  const { isLocked, loading: subLoading } = useSubscription();
  const { isOnboarded, loading: kazaLoading } = useKaza();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      requireAuth();
    }
  }, [user, authLoading, requireAuth]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (authLoading || subLoading || kazaLoading) {
      timeout = setTimeout(() => {
        if (authLoading || subLoading || kazaLoading) {
          setTimedOut(true);
          window.dispatchEvent(new CustomEvent("force-offline"));
        }
      }, 12000);
    }
    return () => clearTimeout(timeout);
  }, [authLoading, subLoading, kazaLoading]);

  if ((authLoading || subLoading || kazaLoading) && !timedOut) {
    return <SplashLoader />;
  }

  // Redirect to auth if explicitly not logged in after loading finishes
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLocked && !allowLocked) {
    return <Navigate to="/app/home?subscription=open" replace />;
  }

  // Mandatory Onboarding Flow
  if (isOnboarded !== undefined && !isOnboarded && !allowOnboarding && window.location.pathname !== "/app/home") {
    return <Navigate to="/app/home" replace />;
  }

  return element;
}

/** Wrapper que verifica autenticação apenas para rotas /app/* */
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, requireAuth } = useAuth();

  useEffect(() => {
    const checkAuth = () => {
      if (!loading && window.location.pathname.startsWith("/app")) {
        requireAuth();
      }
    };

    const interval = setInterval(checkAuth, 30000);
    checkAuth();

    return () => clearInterval(interval);
  }, [loading, requireAuth]);

  useEffect(() => {
    if (!loading && !user && window.location.pathname.startsWith("/app")) {
      window.location.href = "/auth";
    }
  }, [user, loading]);

  return <>{children}</>;
}

/** Layout wrapper — sem moldura de telefone no desktop, tela cheia sempre. */
function MobileFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    // Remove qualquer classe de frame antigo
    document.body.classList.remove("desktop-mobile-frame-active");
  }, [pathname]);

  return <>{children}</>;
}

/** Só exibe o guia de instalação PWA dentro do /app — nunca na página de vendas */
function AppPWAInstallGuide() {
  const { pathname } = useLocation();
  if (!pathname.startsWith("/app")) return null;
  return <PWAInstallGuide />;
}

/** Rota raiz: redireciona logados para /app/home, outros para /auth */
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <SplashLoader />;
  if (user) return <Navigate to="/app/home" replace />;
  return <Navigate to="/auth" replace />;
}

/** Rota /pagina-de-vendas: logados vão para /app/home; visitantes veem a page de vendas */
function SalesPageGuard() {
  return <Suspense fallback={<PageSkeleton />}><SalesPage /></Suspense>;
}

const App = () => {
  // Check cache version on app load
  useEffect(() => {
    invalidateCacheIfNeeded().catch(err => {
      console.error('Error checking cache version:', err);
    });
    initDebugHelper();
  }, []);

  // Listen for deep-link returns (auth callback)
  useEffect(() => {
    listenForDeepLinks(async (url) => {
      // Handle OAuth callback (Google/Apple sign-in return)
      if (url.includes("auth/callback") || url.includes("auth%2Fcallback")) {
        await closeInAppBrowser();
        try {
          const normalized = url.replace("kaza://", "https://kaza.app/").replace("kaza://", "https://kaza.app/");
          const urlObj = new URL(normalized);

          // PKCE flow: exchange code for session
          const code = urlObj.searchParams.get("code");
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
            return;
          }

          // Implicit flow: set session from URL hash tokens
          const hashPart = url.split("#")[1];
          if (hashPart) {
            const hashParams = new URLSearchParams(hashPart);
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
            }
          }
        } catch {
          // Auth callback failed silently — user will be prompted to log in again
        }
        return;
      }
    });

    registerBackButton(() => window.history.back());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <LanguageProvider>
            <KazaProvider>
              <PWAProvider>
                <ThemeProvider>
                  <TooltipProvider>
                    <OfflineOverlay />
                    <AccountSessionTracker />
                    <UpdatePrompt />
                    <Toaster />
                    <Sonner />
                    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
                      <AppPWAInstallGuide />
                      <MobileFrame>
                        <AuthGuard>
                          <Suspense fallback={<PageSkeleton />}>
                            <Routes>
                              {/* Raiz: redireciona logados para /app/home, outros veem vendas */}
                              <Route path="/" element={<RootRoute />} />

                              {/* Páginas públicas */}
                              <Route path="/auth" element={<Auth />} />
                              <Route path="/sucesso" element={<SuccessPage />} />
                              <Route path="/success" element={<SuccessPage />} />
                              <Route path="/invite" element={<InvitePage />} />
                              <Route path="/pagina-de-vendas" element={<SalesPageGuard />} />
                              <Route path="/pagina-de-vendas/termos-de-uso" element={<SalesTermsPage />} />
                              <Route path="/pagina-de-vendas/privacidade" element={<SalesPrivacyPage />} />

                              {/* App interno — todas as rotas protegidas sob /app */}
                              <Route
                                path="/app/home"
                                element={<ProtectedRoute element={<Index />} allowLocked={true} />}
                              />
                              <Route
                                path="/app/monthly-report"
                                element={<ProtectedRoute element={<MonthlyReportPage />} />}
                              />
                              <Route
                                path="/app/night-checkup"
                                element={<ProtectedRoute element={<NightCheckupPage />} />}
                              />
                              <Route
                                path="/app/plans"
                                element={<Navigate to="/app/settings/subscription" replace />}
                              />
                              <Route
                                path="/app/trio-setup"
                                element={<ProtectedRoute element={<TrioSetupPage />} />}
                              />
                              <Route
                                path="/app/checkout/success"
                                element={<ProtectedRoute element={<CheckoutSuccessPage />} allowLocked={true} />}
                              />
                              <Route
                                path="/app/checkout/cancel"
                                element={<ProtectedRoute element={<CheckoutCancelPage />} allowLocked={true} />}
                              />
                              <Route
                                path="/app/add-item"
                                element={<ProtectedRoute element={<AddItemPage />} />}
                              />
                              <Route
                                path="/app/consume/:itemId"
                                element={<ProtectedRoute element={<ConsumePage />} />}
                              />
                              <Route
                                path="/app/recipe/:recipeId"
                                element={<ProtectedRoute element={<RecipePage />} />}
                              />
                              <Route
                                path="/app/consumables"
                                element={<ProtectedRoute element={<ConsumableTrackerPage />} />}
                              />
                              <Route
                                path="/app/notifications"
                                element={<ProtectedRoute element={<NotificationsPage />} />}
                              />
                              <Route
                                path="/app/profile"
                                element={<ProtectedRoute element={<ProfilePage />} />}
                              />
                              <Route
                                path="/app/activity-history"
                                element={<ProtectedRoute element={<HistoryPage />} />}
                              />
                              <Route
                                path="/app/garbage-reminder"
                                element={<ProtectedRoute element={<GarbageReminderPage />} />}
                              />
                              <Route
                                path="/app/settings/subscription"
                                element={<ProtectedRoute element={<SubscriptionPage />} />}
                              />
                              <Route
                                path="/app/settings/subscription/manage"
                                element={<ProtectedRoute element={<SubscriptionsManagePage />} />}
                              />
                              <Route
                                path="/app/settings/install"
                                element={<ProtectedRoute element={<InstallGuidePage />} />}
                              />
                              <Route
                                path="/app/settings/faq"
                                element={<ProtectedRoute element={<FAQPage />} />}
                              />
                              <Route
                                path="/app/settings/privacy"
                                element={<ProtectedRoute element={<PrivacyPage />} />}
                              />
                              <Route
                                path="/app/plan/meal-planner"
                                element={<ProtectedRoute element={<MealPlannerPage />} />}
                              />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </AuthGuard>
                      </MobileFrame>
                    </BrowserRouter>
                  </TooltipProvider>
                </ThemeProvider>
              </PWAProvider>
            </KazaProvider>
          </LanguageProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Sentry.withErrorBoundary(App, {
  fallback: ({ error }) => (
    <div className="flex h-screen items-center justify-center bg-background p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Ops! Algo deu errado
        </h1>
        <p className="text-muted-foreground mb-4">
          O app encontrou um erro inesperado.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Recarregar App
        </button>
      </div>
    </div>
  )
});
