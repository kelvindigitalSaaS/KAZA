/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageTransition } from "@/components/PageTransition";
import { ArrowLeft, Users, UserPlus, Check, ExternalLink, Trash2, Mail, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TRIO_CHECKOUT_URL = "https://pay.cakto.com.br/wbjq4ne_846287";

interface Member {
  name: string;
  email: string;
}

export default function TrioSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [members, setMembers] = useState<Member[]>([
    { name: "", email: "" },
    { name: "", email: "" },
  ]);

  const updateMember = (idx: number, field: keyof Member, value: string) => {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const handleCheckout = () => {
    const filled = members.filter((m) => m.name.trim());
    if (filled.length > 0) {
      try {
        localStorage.setItem("trio_members", JSON.stringify(filled));
      } catch { /* ignore */ }
    }
    window.open(TRIO_CHECKOUT_URL, "_blank");
    toast.success(
      language === "pt-BR"
        ? "Redirecionando para o pagamento..."
        : "Redirecting to payment..."
    );
  };

  const myName =
    (user?.user_metadata?.name as string) ||
    user?.email?.split("@")[0] ||
    "Você";

  return (
    <PageTransition direction="left" className="min-h-[100dvh] bg-[#F7F6F3] dark:bg-[#091f1c] pb-24">
      <header className="sticky top-0 z-50 flex items-center gap-3 bg-[#F7F6F3]/80 dark:bg-[#091f1c]/80 px-4 py-4 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.04]">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#2C2C2A] dark:text-white bg-white dark:bg-white/10 border border-[#E2E1DC] dark:border-white/10 active:scale-[0.97] transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-[#2C2C2A] dark:text-white">
            {language === "pt-BR" ? "Configurar Trio" : "Set Up Trio"}
          </h1>
          <p className="text-xs text-[#9A998F] dark:text-white/40 font-medium">
            {language === "pt-BR" ? "Adicione até 2 pessoas ao seu plano" : "Add up to 2 people to your plan"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="rounded-3xl bg-[#3D6B55] p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)" }} />
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-black text-lg leading-tight">Plano Trio</p>
              <p className="text-sm text-white/70">R$ 27,00/mês · 3 perfis</p>
            </div>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            {language === "pt-BR"
              ? "Cada pessoa terá seu próprio perfil sincronizado. Adicione os membros da sua casa abaixo — você pode pular essa etapa e configurar depois."
              : "Each person will have their own synced profile. Add your household members below — you can skip and configure later."}
          </p>
        </div>

        {/* Members */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold text-[#9A998F] dark:text-white/40 uppercase tracking-[1.5px] px-1 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {language === "pt-BR" ? "Membros do Trio" : "Trio Members"}
          </h2>

          {/* Current user (fixed) */}
          <div className="rounded-2xl bg-white dark:bg-[#11302c] border border-[#E2E1DC] dark:border-white/10 shadow-sm px-5 py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#3D6B55]/10 border border-[#3D6B55]/20 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-[#3D6B55]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#2C2C2A] dark:text-white text-[14px] truncate">{myName}</p>
              <p className="text-[11px] text-[#9A998F] dark:text-white/40 truncate">{user?.email}</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#3D6B55] bg-[#3D6B55]/10 px-2.5 py-1 rounded-full border border-[#3D6B55]/20">
              {language === "pt-BR" ? "Você" : "You"}
            </span>
          </div>

          {/* Extra members */}
          {members.map((member, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-[#11302c] border border-[#E2E1DC] dark:border-white/10 shadow-sm px-5 py-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-[#EDECEA] dark:bg-white/10 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-[#7A7A72] dark:text-white/60" />
                  </div>
                  <p className="font-semibold text-[#2C2C2A] dark:text-white text-[13px]">
                    {language === "pt-BR" ? `Pessoa ${idx + 2}` : `Person ${idx + 2}`}
                    <span className="ml-1.5 text-[10px] font-bold text-[#B0AFA7] dark:text-white/30 uppercase">
                      {language === "pt-BR" ? "opcional" : "optional"}
                    </span>
                  </p>
                </div>
                {(member.name || member.email) && (
                  <button
                    onClick={() => setMembers((p) => p.map((m, i) => i === idx ? { name: "", email: "" } : m))}
                    className="text-[#B0AFA7] dark:text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0AFA7] dark:text-white/30" />
                  <Input
                    placeholder={language === "pt-BR" ? "Nome" : "Name"}
                    value={member.name}
                    onChange={(e) => updateMember(idx, "name", e.target.value)}
                    className="pl-9 h-11 rounded-xl bg-[#F7F6F3] dark:bg-white/5 border-[#E2E1DC] dark:border-white/10 text-[14px] font-semibold text-[#2C2C2A] dark:text-white placeholder:text-[#B0AFA7] dark:placeholder:text-white/20"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0AFA7] dark:text-white/30" />
                  <Input
                    placeholder={language === "pt-BR" ? "E-mail (opcional)" : "Email (optional)"}
                    type="email"
                    value={member.email}
                    onChange={(e) => updateMember(idx, "email", e.target.value)}
                    className="pl-9 h-11 rounded-xl bg-[#F7F6F3] dark:bg-white/5 border-[#E2E1DC] dark:border-white/10 text-[14px] font-semibold text-[#2C2C2A] dark:text-white placeholder:text-[#B0AFA7] dark:placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits reminder */}
        <div className="rounded-2xl bg-white dark:bg-[#11302c] border border-[#E2E1DC] dark:border-white/10 shadow-sm px-5 py-4 space-y-2.5">
          <p className="text-[11px] font-bold text-[#9A998F] dark:text-white/40 uppercase tracking-[1.5px]">
            {language === "pt-BR" ? "Cada perfil inclui" : "Each profile includes"}
          </p>
          {[
            language === "pt-BR" ? "Geladeira e estoque próprios" : "Own fridge & inventory",
            language === "pt-BR" ? "Lista de compras sincronizada" : "Synced shopping list",
            language === "pt-BR" ? "Receitas e planejamento de refeições" : "Recipes & meal planning",
            language === "pt-BR" ? "Notificações de vencimento" : "Expiry notifications",
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2.5">
              <div className="h-5 w-5 rounded-full bg-[#3D6B55]/10 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-[#3D6B55]" />
              </div>
              <span className="text-[13px] font-medium text-[#7A7A72] dark:text-white/60">{feat}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheckout}
            className="w-full h-16 rounded-2xl bg-[#3D6B55] hover:bg-[#2f5543] text-white font-black text-[16px] tracking-wide transition-all active:scale-[0.97] shadow-lg shadow-[#3D6B55]/20 flex items-center justify-center gap-3"
          >
            <ExternalLink className="h-5 w-5" />
            {language === "pt-BR" ? "Continuar para Pagamento" : "Continue to Payment"}
          </button>
          <button
            onClick={() => {
              try { localStorage.setItem("trio_members", JSON.stringify(members.filter(m => m.name.trim()))); } catch { /* ignore */ }
              window.open(TRIO_CHECKOUT_URL, "_blank");
              navigate(-1);
            }}
            className="w-full h-12 rounded-2xl bg-transparent border border-[#E2E1DC] dark:border-white/10 text-[#9A998F] dark:text-white/40 font-semibold text-[14px] transition-all active:scale-[0.97]"
          >
            {language === "pt-BR" ? "Pular e ir para pagamento" : "Skip and go to payment"}
          </button>
        </div>

        <p className="text-center text-[11px] text-[#B0AFA7] dark:text-white/30 font-medium pb-4">
          {language === "pt-BR"
            ? "Você pode adicionar ou editar membros a qualquer momento nas configurações."
            : "You can add or edit members at any time in settings."}
        </p>
      </main>
    </PageTransition>
  );
}
