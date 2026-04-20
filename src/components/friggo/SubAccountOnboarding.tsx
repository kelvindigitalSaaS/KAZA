/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTransition } from "@/components/PageTransition";
import { ArrowLeft, Check, Eye, EyeOff, Mail, Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const PENDING_INVITE_KEY = "pending_invite_setup";

interface SubAccountOnboardingProps {
  inviteToken: string;
  invitedEmail: string;
  masterName: string;
  groupId: string;
  planTier?: string;
  inTrial?: boolean;
  onComplete?: () => void;
}

const DEFAULT_CONSUMABLES = [
  { name: "Papel Higiênico", icon: "🧻" },
  { name: "Papel Toalha", icon: "🧺" },
  { name: "Detergente", icon: "🧴" },
  { name: "Sabonete", icon: "🧼" },
  { name: "Pasta de Dente", icon: "🪥" },
  { name: "Shampoo", icon: "🧴" },
  { name: "Desodorante", icon: "🚿" },
  { name: "Álcool em Gel", icon: "🧴" },
];

type Step = "loading" | "name" | "consumables" | "password" | "complete" | "verify-email";

const STEP_NUMBERS: Record<string, number> = {
  name: 1,
  password: 2,
  consumables: 3,
  complete: 4,
};

export function SubAccountOnboarding({
  inviteToken,
  invitedEmail,
  masterName,
  groupId,
  planTier = "multiPRO",
  inTrial = false,
  onComplete,
}: SubAccountOnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("loading");
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [selectedConsumables, setSelectedConsumables] = useState<Set<string>>(new Set());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resending || resendCooldown > 0) return;
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "resend-confirmation-email",
        {
          body: {
            email: invitedEmail,
            redirect_to: `${window.location.origin}/auth`,
            invite_token: inviteToken,
          },
        }
      );
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao reenviar");
      toast.success("Email de confirmação reenviado!");
      setResendCooldown(60);
    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes("security purposes")) {
        toast.error("Aguarde um momento antes de reenviar.");
        setResendCooldown(60);
      } else {
        toast.error(error?.message || "Erro ao reenviar email");
      }
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_invite_progress", {
          p_token: inviteToken,
        });
        if (error || !data || data.length === 0) {
          setStep("name");
          return;
        }
        const progress = data[0];
        const saved = (progress.step_data ?? {}) as Record<string, any>;

        if (saved.name) setName(saved.name);
        if (saved.cpf) setCpf(saved.cpf);
        if (Array.isArray(saved.consumables)) {
          setSelectedConsumables(new Set(saved.consumables));
        }

        const resumeStep = progress.current_step ?? 0;
        if (resumeStep >= 2) setStep("consumables");    // password done
        else if (resumeStep >= 1) setStep("password");  // name/cpf done
        else setStep("name");
      } catch {
        setStep("name");
      }
    })();
  }, [inviteToken]);

  const saveStep = async (stepNum: number, data: Record<string, unknown>) => {
    const { error } = await supabase.rpc("save_invite_step", {
      p_token: inviteToken,
      p_step_data: data,
      p_step: stepNum,
    });
    if (error) throw error;
  };

  const handleNameNext = async () => {
    if (!name.trim()) { toast.error("Digite seu nome"); return; }
    if (name.trim().length < 2) { toast.error("Nome muito curto"); return; }
    if (cpf.trim().length < 11) { toast.error("Digite um CPF válido"); return; }
    
    setLoading(true);
    try {
      await saveStep(STEP_NUMBERS.name, { 
        name: name.trim(),
        cpf: cpf.trim() 
      });
      setStep("password");
    } catch {
      toast.error("Erro ao salvar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordNext = async () => {
    if (!password || password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await saveStep(STEP_NUMBERS.password, { password: true }); // Just mark as done
      setStep("consumables");
    } catch {
      toast.error("Erro ao salvar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleConsumablesNext = async () => {
    setLoading(true);
    try {
      await saveStep(STEP_NUMBERS.consumables, {
        consumables: Array.from(selectedConsumables),
      });
      setStep("complete");
    } catch {
      toast.error("Erro ao salvar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitedEmail,
        password,
        options: {
          data: {
            name: name.trim(),
            cpf: cpf.trim(),
            invite_token: inviteToken,
            invited_to_group: groupId,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Falha ao criar conta");

      if (!authData.session) {
        setStep("verify-email");
        return;
      }

      await completeInviteSetup(authData.user.id, inviteToken);
      toast.success("Bem-vindo! Sua conta foi criada.");
      if (onComplete) onComplete();
      else navigate("/app/home");
    } catch (error: any) {
      const msg =
        error?.message?.includes("already registered")
          ? "Este email já tem uma conta. Faça login."
          : "Erro ao criar sua conta. Tente novamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepOrder: Step[] = ["name", "password", "consumables", "complete"];
  const handleBack = () => {
    const idx = stepOrder.indexOf(step);
    if (idx > 0) setStep(stepOrder[idx - 1]);
  };
  const canGoBack = stepOrder.indexOf(step) > 0;

  const stepIndex = stepOrder.indexOf(step);
  const progressPct = stepIndex >= 0 ? ((stepIndex + 1) / stepOrder.length) * 100 : 0;

  if (step === "loading") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const effectivePlanName = planTier === "multiPRO" ? "MultiPRO" : planTier;
  const trialText = inTrial ? " (Benefício de Teste Ativo)" : "";

  return (
    <PageTransition direction="left" className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-24">
      <header className="sticky top-0 z-50 bg-[#fafafa]/90 dark:bg-[#091f1c]/90 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06] px-4 h-16 flex items-center gap-3">
        <button
          onClick={handleBack}
          disabled={!canGoBack}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-foreground transition-all active:scale-90",
            !canGoBack && "opacity-30 cursor-not-allowed"
          )}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-foreground">Ativar sua conta</h1>
          <p className="text-xs text-muted-foreground truncate">
            Convidado por {masterName} — Plano {effectivePlanName}{trialText}
          </p>
        </div>
      </header>

      {step !== "verify-email" && (
        <div className="h-1 bg-black/5 dark:bg-white/5">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <main className="mx-auto max-w-lg px-4 py-8 space-y-6">

        {step === "name" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Identificação</p>
              <h2 className="text-2xl font-black text-foreground">Quem é você?</h2>
              <p className="text-sm text-muted-foreground">Precisamos do seu nome e CPF para o cadastro</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground ml-1">NOME COMPLETO</span>
                <Input
                  placeholder="Seu nome"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-base rounded-xl"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground ml-1">CPF</span>
                <Input
                  placeholder="000.000.000-00"
                  value={cpf}
                  maxLength={14}
                  onChange={(e) => {
                    // Máscara simples de CPF
                    const val = e.target.value.replace(/\D/g, "");
                    setCpf(val);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                  className="h-12 text-base rounded-xl"
                />
              </div>
            </div>
            <Button onClick={handleNameNext} size="lg" className="w-full h-14 rounded-2xl font-bold text-base" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Continuar
            </Button>
          </div>
        )}

        {step === "consumables" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Estoque Inicial</p>
              <h2 className="text-2xl font-black text-foreground">O que tem na despensa?</h2>
              <p className="text-sm text-muted-foreground">Selecione o que você já usa no dia a dia</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DEFAULT_CONSUMABLES.map((item) => (
                <label
                  key={item.name}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer",
                    selectedConsumables.has(item.name)
                      ? "bg-primary/10 border-primary ring-4 ring-primary/5"
                      : "bg-white dark:bg-white/5 border-black/[0.04] dark:border-white/[0.08] grayscale opacity-60"
                  )}
                >
                  <Checkbox
                    checked={selectedConsumables.has(item.name)}
                    className="sr-only"
                    onCheckedChange={(checked) => {
                      const next = new Set(selectedConsumables);
                      if (checked) next.add(item.name);
                      else next.delete(item.name);
                      setSelectedConsumables(next);
                    }}
                  />
                  <span className="text-3xl mb-2">{item.icon}</span>
                  <span className="text-xs font-bold text-foreground text-center line-clamp-1">{item.name}</span>
                </label>
              ))}
            </div>
            <Button onClick={handleConsumablesNext} size="lg" className="w-full h-14 rounded-2xl font-bold text-base" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tudo pronto, continuar
            </Button>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Segurança</p>
              <h2 className="text-2xl font-black text-foreground">Defina sua senha</h2>
              <p className="text-sm text-muted-foreground">Mínimo 6 caracteres para sua proteção</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Crie uma senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordNext()}
                  className="w-full h-14 px-5 rounded-2xl bg-white dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.08] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordNext()}
                  className="w-full h-14 px-5 rounded-2xl bg-white dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.08] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button onClick={handlePasswordNext} size="lg" className="w-full h-14 rounded-2xl font-bold text-base">
              Continuar
            </Button>
          </div>
        )}

        {step === "complete" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center">
                <Check className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Confirmação</p>
              <h2 className="text-2xl font-black text-foreground">Quase lá!</h2>
              <p className="text-sm text-muted-foreground px-4">
                Ao clicar abaixo, você receberá um link de ativação no seu e-mail. A conta será ativada e vinculada automaticamente após o clique.
              </p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-black/[0.04] dark:border-white/[0.06] p-5 text-left space-y-3">
              <SummaryRow label="Nome" value={name} />
              <SummaryRow label="CPF" value={cpf} />
              <SummaryRow label="Email" value={invitedEmail} />
              <SummaryRow
                label="Consumíveis"
                value={selectedConsumables.size > 0 ? `${selectedConsumables.size} itens` : "Nenhum"}
              />
            </div>

            <Button onClick={handleComplete} size="lg" className="w-full h-16 rounded-[1.75rem] font-black uppercase tracking-widest text-base shadow-xl shadow-emerald-500/20" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Criar e Confirmar
            </Button>
          </div>
        )}

        {step === "verify-email" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-[2rem] bg-blue-500/10 flex items-center justify-center">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-foreground">Verifique seu e-mail</h2>
              <p className="text-sm text-muted-foreground leading-relaxed px-4">
                Enviamos o link de ativação para <span className="font-bold text-foreground">{invitedEmail}</span>.
                <br /><br />
                Clique no botão de acesso dentro do e-mail para **ativar sua conta instantaneamente**.
              </p>
            </div>
            <Button
              onClick={handleResendEmail}
              size="lg"
              variant="outline"
              className="w-full h-14 rounded-2xl font-bold"
              disabled={resending || resendCooldown > 0}
            >
              {resending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCw className="h-4 w-4 mr-2" />
              )}
              {resendCooldown > 0
                ? `Reenviar em ${resendCooldown}s`
                : "Reenviar e-mail de ativação"}
            </Button>
          </div>
        )}

      </main>
    </PageTransition>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/[0.03] dark:border-white/[0.03] pb-2 last:border-0 last:pb-0">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm font-black text-foreground">{value}</span>
    </div>
  );
}

export async function completeInviteSetup(userId: string, inviteToken: string) {
  const { data: progressRows } = await supabase.rpc("get_invite_progress", {
    p_token: inviteToken,
  });
  const progress = progressRows?.[0];
  const saved = (progress?.step_data ?? {}) as Record<string, any>;

  // Detect fallback from user_metadata if progress RPC fails
  const { data: { user } } = await supabase.auth.getUser();
  const userName = saved.name || user?.user_metadata?.name || "";
  const userCpf = saved.cpf || user?.user_metadata?.cpf || null;

  const { error: inviteErr } = await supabase.rpc("accept_invite", {
    invite_token: inviteToken,
  });
  if (inviteErr) throw inviteErr;

  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        name: userName,
        cpf: userCpf,
        onboarding_completed: true,
      },
      { onConflict: "user_id" }
    );
  if (profileErr) throw profileErr;

  // Use progress consumables or fallback empty
  const consumablesList = Array.isArray(saved.consumables) ? saved.consumables : [];

  if (consumablesList.length > 0) {
    const { data: membership } = await supabase
      .from("home_members")
      .select("home_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (membership?.home_id) {
      const DEFAULT_CONSUMABLES_MAP: Record<string, { icon: string; category: string }> = {
        "Papel Higiênico": { icon: "🧻", category: "hygiene" },
        "Papel Toalha": { icon: "🧺", category: "cleaning" },
        "Detergente": { icon: "🧴", category: "cleaning" },
        "Sabonete": { icon: "🧼", category: "hygiene" },
        "Pasta de Dente": { icon: "🪥", category: "hygiene" },
        "Shampoo": { icon: "🧴", category: "hygiene" },
        "Desodorante": { icon: "🚿", category: "hygiene" },
        "Álcool em Gel": { icon: "🧴", category: "hygiene" },
      };

      const rows = consumablesList.map((name: string) => {
        const info = DEFAULT_CONSUMABLES_MAP[name] || { icon: "📦", category: "other" };
        return {
          home_id: membership.home_id,
          name,
          icon: info.icon,
          category: info.category,
          current_stock: 1,
          unit: "un",
          daily_consumption: 0,
          min_stock: 1,
          usage_interval: "weekly",
        };
      });

      await supabase
        .from("consumables")
        .upsert(rows, { onConflict: "home_id,name" });
    }
  }
}
