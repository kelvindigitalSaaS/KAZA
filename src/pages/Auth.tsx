/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  KeyRound,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { isNative, isIOS } from "@/lib/capacitor";
import { openExternalUrl } from "@/lib/nativeBrowser";
import LogoNome from "@/assets/logo inicial nome.svg";

type AuthView = "landing" | "login" | "register";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();

  const [view, setView] = useState<AuthView>(() => {
    const state = location.state as { initialView?: AuthView };
    return state?.initialView || "landing";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [splashProgress, setSplashProgress] = useState(0);
  // True while exchanging the OAuth/email-confirmation code from the callback URL
  const [exchangingCode, setExchangingCode] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.has("code") || p.has("error");
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: ""
  });

  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // ── Splash progress ──
  useEffect(() => {
    const duration = 1600;
    const tick = 16;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += tick;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setSplashProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => setSplashDone(true), 260);
      }
    }, tick);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && !authLoading) navigate("/app/home");
  }, [user, authLoading, navigate]);

  // ── Handle OAuth / email-confirmation PKCE callback ──
  // detectSessionInUrl is disabled in the Supabase client, so we exchange the
  // code explicitly here. This avoids any race condition where the SDK tries
  // to read window.location.search after we have already cleaned the URL.
  useEffect(() => {
    const url = new URL(window.location.href);

    // OAuth provider returned an error (e.g. user denied consent, mismatched redirect URL)
    const oauthError = url.searchParams.get("error");
    if (oauthError) {
      const desc = url.searchParams.get("error_description") ?? "Erro na autenticação com Google";
      toast.error(decodeURIComponent(desc.replace(/\+/g, " ")), { duration: 6000 });
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      window.history.replaceState({}, "", url.toString());
      setExchangingCode(false);
      return;
    }

    const code = url.searchParams.get("code");
    const type = url.searchParams.get("type");
    if (!code) return;

    // Clean the URL before the exchange so the code never lingers
    url.searchParams.delete("code");
    url.searchParams.delete("type");
    window.history.replaceState({}, "", url.toString());

    supabase.auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error("[AUTH] code exchange failed:", error);
          const msg = type === "signup"
            ? "Link de confirmação inválido ou expirado. Solicite um novo."
            : "Erro ao autenticar com Google. Tente novamente.";
          toast.error(msg, { duration: 6000 });
        } else if (type === "signup") {
          toast.success("Email confirmado! Bem-vindo ao KAZA!");
        }
        // On OAuth success the SIGNED_IN event fires via onAuthStateChange → navigate
      })
      .catch((err) => {
        console.error("[AUTH] code exchange error:", err);
        toast.error("Erro ao autenticar. Tente novamente.", { duration: 6000 });
      })
      .finally(() => setExchangingCode(false));
  }, []);

  // ── Handlers ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (view === "register") {
      if (formData.password !== formData.confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }
      if (formData.password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        return;
      }
    }
    setLoading(true);
    try {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate("/app/home");
      } else {
        const redirectUrl = isNative
          ? "kaza://auth/callback"
          : `${window.location.origin}/auth`;
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name },
            emailRedirectTo: redirectUrl
          }
        });
        if (error) throw error;
        if (data.user) {
          await (supabase.from("profiles") as any).upsert(
            {
              user_id: data.user.id,
              name: formData.name,
              onboarding_completed: false
            },
            { onConflict: "user_id" }
          );
        }
        if (data.user && !data.session) {
          toast.success("Verifique seu email para confirmar a conta!", {
            duration: 6000,
            description:
              "Enviamos um link de confirmação para " + formData.email
          });
          setView("login");
          return;
        }
        toast.success("Conta criada! Bem-vindo ao KAZA!");
        navigate("/app/home");
      }
    } catch (error: any) {
      let msg = "Erro ao processar. Tente novamente.";
      if (!navigator.onLine) msg = "Sem conexão com a internet.";
      else if (
        error.message?.includes("invalid_credentials") ||
        error.message === "Invalid login credentials"
      )
        msg = "Email ou senha incorretos.";
      else if (error.message?.includes("Email not confirmed"))
        msg = "Confirme seu email antes de entrar.";
      else if (
        error.message?.includes("already registered") ||
        error.message?.includes("User already registered")
      )
        msg = "Este email já está cadastrado. Faça login.";
      else if (error.message?.includes("Password should be at least"))
        msg = "A senha deve ter pelo menos 6 caracteres.";
      else if (
        error.message?.includes("Too many requests") ||
        error.status === 429
      )
        msg = "Muitas tentativas. Aguarde e tente novamente.";
      else if (error.message?.includes("weak_password"))
        msg = "Senha fraca. Use letras, números e símbolos.";
      else if (error.message) msg = error.message;
      toast.error(msg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (isNative) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: "kaza://auth/callback",
            skipBrowserRedirect: true
          }
        });
        if (error) throw error;
        if (data.url) await openExternalUrl(data.url);
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth` }
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao entrar com Google");
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      if (isNative) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: {
            redirectTo: "kaza://auth/callback",
            skipBrowserRedirect: true
          }
        });
        if (error) throw error;
        if (data.url) await openExternalUrl(data.url);
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: { redirectTo: `${window.location.origin}/auth` }
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao entrar com Apple");
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Digite seu email");
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("Email enviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email");
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetDialog = () => {
    setResetDialogOpen(false);
    setResetSent(false);
    setResetEmail("");
  };

  const goToLanding = () => {
    setView("landing");
    setFormData({ email: "", password: "", name: "", confirmPassword: "" });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // ── Splash screen ──
  const PremiumSplash = () => (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden kaza-splash-bg">
      <div
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none kaza-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(144,171,156,0.20) 0%, rgba(84,138,118,0.06) 50%, transparent 70%)",
          filter: "blur(24px)"
        }}
      />
      <div className="relative z-10 kaza-breath">
        <img
          src="/icons/192.png"
          alt=""
          aria-hidden
          className="w-24 h-24 object-contain rounded-[26px]"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.08), 0 20px 50px rgba(0,0,0,0.30), 0 0 40px rgba(22,90,82,0.25)"
          }}
        />
      </div>
      <div
        className="relative z-10 mt-8 w-44 h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.12)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-75 ease-linear"
          style={{
            width: `${Math.max(splashProgress, 6)}%`,
            background: "linear-gradient(90deg, #548A76 0%, #90AB9C 100%)"
          }}
        />
      </div>
    </div>
  );

  // Show dedicated loader while exchanging the OAuth code — avoids flash of
  // the landing page before the session is established
  if (exchangingCode || authLoading) return <PremiumSplash />;
  if (!splashDone) return <PremiumSplash />;

  // ── Input shared style ──
  const inputStyle = {
    borderColor: "rgba(22,90,82,0.20)",
    background: "#f5fdf9"
  };

  const labelStyle = {
    color: "#548A76",
    fontSize: "0.72rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em"
  };

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #165A52 0%, #0e3d38 55%, #091f1c 100%)" }}
    >
      {/* ── Hero area (top) ── */}
      <div className="flex-1 flex flex-col items-center justify-center pb-4 px-6 pt-safe relative overflow-hidden min-h-0">
        {/* Decorative glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(144,171,156,0.18) 0%, transparent 70%)"
          }}
        />

        {/* Back arrow (non-landing) */}
        <AnimatePresence>
          {view !== "landing" && (
            <motion.button
              key="back-btn"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={goToLanding}
              className="absolute top-4 left-5 flex h-9 w-9 items-center justify-center rounded-2xl transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.10)", color: "#fff" }}
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Logo — always visible */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease }}
            className="flex flex-col items-center text-center"
          >
            <div
              className="w-[80px] h-[80px] rounded-[22px] flex items-center justify-center mb-4"
              style={{
                background: "rgba(255,255,255,0.10)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.12)"
              }}
            >
              <img
                src="/icons/192.png"
                alt="KAZA APP"
                className="w-[66px] h-[66px] object-contain rounded-[16px]"
              />
            </div>

            {view === "landing" && (
              <>
                <img
                  src={LogoNome}
                  alt="KAZA APP"
                  className="h-[80px] object-contain mb-2"
                />
                <p
                  className="mt-1 text-[14px] font-medium"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {language === "pt-BR"
                    ? "Tecnologia para sua rotina."
                    : language === "es"
                      ? "Tecnología para tu rutina."
                      : "Technology for your routine."}
                </p>
              </>
            )}

            {view === "login" && (
              <p className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                {language === "pt-BR" ? "Entrar na conta" : language === "es" ? "Iniciar sesión" : "Sign in"}
              </p>
            )}

            {view === "register" && (
              <p className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                {language === "pt-BR" ? "Criar conta grátis" : language === "es" ? "Crear cuenta gratis" : "Create free account"}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom card ── */}
      <div
        className="bg-white w-full"
        style={{
          borderRadius: "1.75rem 1.75rem 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)"
        }}
      >
        <div
          className="overflow-y-auto overscroll-contain pb-safe"
          style={{ maxHeight: "75dvh" }}
        >
          <AnimatePresence mode="wait">
            {/* ──────── LANDING ──────── */}
            {view === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease }}
                className="px-5 pt-6 pb-8"
              >
                <h2
                  className="text-[1.3rem] font-bold text-center mb-1"
                  style={{ color: "#165A52" }}
                >
                  {language === "pt-BR"
                    ? "Bem-vindo!"
                    : language === "es"
                      ? "¡Bienvenido!"
                      : "Welcome!"}
                </h2>
                <p
                  className="text-[13px] text-center mb-5"
                  style={{ color: "#548A76" }}
                >
                  {language === "pt-BR"
                    ? "Escolha como quer continuar"
                    : language === "es"
                      ? "Elige cómo quieres continuar"
                      : "Choose how to continue"}
                </p>

                <div className="space-y-3">
                  {/* Google — botão principal */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full h-[50px] rounded-2xl flex items-center justify-center gap-3 font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{
                      background: "#165A52",
                      color: "#ffffff",
                      boxShadow: "0 6px 22px rgba(22,90,82,0.22)"
                    }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <svg
                          className="h-[18px] w-[18px] shrink-0"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="#fff"
                            fillOpacity=".9"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#fff"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#fff"
                            fillOpacity=".75"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#fff"
                            fillOpacity=".65"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        {language === "pt-BR"
                          ? "Continuar com Google"
                          : language === "es"
                            ? "Continuar con Google"
                            : "Continue with Google"}
                      </>
                    )}
                  </button>

                  {/* Apple — iOS only */}
                  {isIOS && (
                    <button
                      type="button"
                      onClick={handleAppleSignIn}
                      disabled={loading}
                      className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-3 font-semibold text-[15px] bg-black text-white transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.18)" }}
                    >
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.8 1.56-.05 2.88.66 3.65 1.76-3.21 1.95-2.67 6.32.44 7.63-.73 1.63-1.63 3.08-2.75 3.58zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.37-2.03 4.41-3.74 4.25z" />
                      </svg>
                      Continuar com Apple
                    </button>
                  )}

                  {/* Divisor */}
                  <div className="flex items-center gap-3 py-0.5">
                    <div
                      className="flex-1 h-px"
                      style={{ background: "rgba(22,90,82,0.12)" }}
                    />
                    <span
                      className="text-[12px] font-medium"
                      style={{ color: "#548A76" }}
                    >
                      ou
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ background: "rgba(22,90,82,0.12)" }}
                    />
                  </div>

                  {/* Entrar com email — botão secundário */}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="w-full h-[46px] rounded-2xl font-semibold text-[14px] transition-all active:scale-[0.98] border"
                    style={{
                      color: "#165A52",
                      borderColor: "rgba(22,90,82,0.22)",
                      background: "rgba(22,90,82,0.04)"
                    }}
                  >
                    {language === "pt-BR"
                      ? "Entrar com email"
                      : language === "es"
                        ? "Entrar con email"
                        : "Sign in with email"}
                  </button>

                  {/* Criar conta — link */}
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className="w-full py-3 text-center text-[14px] font-semibold transition-opacity active:opacity-50"
                    style={{ color: "#165A52" }}
                  >
                    {language === "pt-BR"
                      ? "Criar conta — 7 dias grátis"
                      : language === "es"
                        ? "Crear cuenta — 7 días gratis"
                        : "Create account — 7 days free"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ──────── LOGIN ──────── */}
            {view === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease }}
                className="px-5 pt-6 pb-8"
              >
                <h2
                  className="text-[1.45rem] font-bold mb-1"
                  style={{ color: "#165A52" }}
                >
                  {language === "pt-BR"
                    ? "Entrar"
                    : language === "es"
                      ? "Entrar"
                      : "Sign in"}
                </h2>
                <p className="text-[14px] mb-6" style={{ color: "#548A76" }}>
                  {language === "pt-BR"
                    ? "Use seu email e senha para continuar"
                    : language === "es"
                      ? "Usa tu email y contraseña"
                      : "Use your email and password"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label style={labelStyle}>Email</Label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: "#548A76" }}
                      />
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="pl-10 h-[50px] rounded-xl border text-[15px]"
                        style={inputStyle}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Senha */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label style={labelStyle}>
                        {language === "pt-BR" ? "Senha" : "Password"}
                      </Label>
                      <button
                        type="button"
                        onClick={() => setResetDialogOpen(true)}
                        className="text-[12px] font-semibold transition-opacity active:opacity-50"
                        style={{ color: "#165A52" }}
                      >
                        {language === "pt-BR"
                          ? "Recuperar senha"
                          : "Forgot password?"}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: "#548A76" }}
                      />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="pl-10 pr-11 h-[50px] rounded-xl border text-[15px]"
                        style={inputStyle}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg active:opacity-60 transition-opacity"
                        style={{ color: "#548A76" }}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[52px] rounded-2xl font-bold text-[15px] text-white mt-2 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                    style={{
                      background: "#165A52",
                      boxShadow: "0 6px 22px rgba(22,90,82,0.22)"
                    }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : language === "pt-BR" ? (
                      "Entrar"
                    ) : language === "es" ? (
                      "Entrar"
                    ) : (
                      "Sign in"
                    )}
                  </button>

                  <p className="text-center text-[13px] pt-1">
                    <span style={{ color: "#548A76" }}>
                      {language === "pt-BR"
                        ? "Não tem conta? "
                        : "Don't have an account? "}
                    </span>
                    <button
                      type="button"
                      onClick={() => setView("register")}
                      className="font-semibold transition-opacity active:opacity-50"
                      style={{ color: "#165A52" }}
                    >
                      {language === "pt-BR"
                        ? "Criar conta grátis"
                        : "Sign up free"}
                    </button>
                  </p>
                </form>
              </motion.div>
            )}

            {/* ──────── REGISTER ──────── */}
            {view === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease }}
                className="px-5 pt-6 pb-8"
              >
                <h2
                  className="text-[1.45rem] font-bold mb-1"
                  style={{ color: "#165A52" }}
                >
                  {language === "pt-BR"
                    ? "Criar conta"
                    : language === "es"
                      ? "Crear cuenta"
                      : "Create account"}
                </h2>
                <p className="text-[14px] mb-6" style={{ color: "#548A76" }}>
                  {language === "pt-BR"
                    ? "7 dias grátis, sem precisar de cartão"
                    : language === "es"
                      ? "7 días gratis, sin tarjeta"
                      : "7 days free, no card needed"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nome */}
                  <div className="space-y-1.5">
                    <Label style={labelStyle}>
                      {language === "pt-BR" ? "Nome" : "Name"}
                    </Label>
                    <div className="relative">
                      <User
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: "#548A76" }}
                      />
                      <Input
                        type="text"
                        placeholder={
                          language === "pt-BR" ? "Seu nome" : "Your name"
                        }
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="pl-10 h-[50px] rounded-xl border text-[15px]"
                        style={inputStyle}
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label style={labelStyle}>Email</Label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: "#548A76" }}
                      />
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="pl-10 h-[50px] rounded-xl border text-[15px]"
                        style={inputStyle}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Senha */}
                  <div className="space-y-1.5">
                    <Label style={labelStyle}>
                      {language === "pt-BR" ? "Senha" : "Password"}
                    </Label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: "#548A76" }}
                      />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="pl-10 pr-11 h-[50px] rounded-xl border text-[15px]"
                        style={inputStyle}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg active:opacity-60 transition-opacity"
                        style={{ color: "#548A76" }}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Senha */}
                  <div className="space-y-1.5">
                    <Label style={labelStyle}>
                      {language === "pt-BR"
                        ? "Confirmar Senha"
                        : "Confirm Password"}
                    </Label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: "#548A76" }}
                      />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value
                          })
                        }
                        className="pl-10 pr-11 h-[50px] rounded-xl border text-[15px]"
                        style={inputStyle}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg active:opacity-60 transition-opacity"
                        style={{ color: "#548A76" }}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[52px] rounded-2xl font-bold text-[15px] text-white mt-2 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                    style={{
                      background: "#165A52",
                      boxShadow: "0 6px 22px rgba(22,90,82,0.22)"
                    }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : language === "pt-BR" ? (
                      "Começar teste grátis"
                    ) : language === "es" ? (
                      "Comenzar prueba gratis"
                    ) : (
                      "Start free trial"
                    )}
                  </button>

                  <p className="text-center text-[13px] pt-1">
                    <span style={{ color: "#548A76" }}>
                      {language === "pt-BR"
                        ? "Já tem conta? "
                        : "Already have an account? "}
                    </span>
                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className="font-semibold transition-opacity active:opacity-50"
                      style={{ color: "#165A52" }}
                    >
                      {language === "pt-BR" ? "Entrar" : "Sign in"}
                    </button>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Recuperar senha dialog ── */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent
          className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-3xl bg-white border shadow-2xl"
          style={{ borderColor: "#DAF1DE" }}
        >
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2 text-lg"
              style={{ color: "#165A52" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(22,90,82,0.09)" }}
              >
                <KeyRound className="h-4 w-4" style={{ color: "#165A52" }} />
              </div>
              Recuperar Senha
            </DialogTitle>
            <DialogDescription
              className="text-[14px]"
              style={{ color: "#548A76" }}
            >
              Digite seu email para receber um link de recuperação.
            </DialogDescription>
          </DialogHeader>

          {resetSent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(22,90,82,0.09)" }}
              >
                <CheckCircle2
                  className="h-8 w-8"
                  style={{ color: "#165A52" }}
                />
              </div>
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: "#165A52" }}
              >
                Email Enviado!
              </h3>
              <p className="text-sm mb-6" style={{ color: "#548A76" }}>
                Verifique sua caixa de entrada em <strong>{resetEmail}</strong>
              </p>
              <button
                onClick={closeResetDialog}
                className="w-full h-[50px] rounded-2xl font-semibold text-[15px] text-white active:scale-[0.98] transition-all"
                style={{ background: "#165A52" }}
              >
                Entendi
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label style={labelStyle}>Email</Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: "#548A76" }}
                  />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10 h-[46px] rounded-xl border text-[14px]"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeResetDialog}
                  className="flex-1 h-[50px] rounded-2xl font-medium text-[15px] active:scale-[0.98] transition-all border"
                  style={{
                    borderColor: "rgba(22,90,82,0.20)",
                    color: "#165A52",
                    background: "rgba(22,90,82,0.04)"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 h-[50px] rounded-2xl font-semibold text-[15px] text-white active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
                  style={{ background: "#165A52" }}
                >
                  {resetLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    "Enviar"
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
