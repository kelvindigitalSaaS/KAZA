/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogOut, Check } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

function PaywallPage() {
  const { signOut } = useAuth();
  const { language } = useLanguage();

  const labels: Record<string, any> = {
    "pt-BR": {
      title: "Seu trial de 7 dias encerrou",
      subtitle: "Escolha um plano para continuar usando o KAZA",
      logout: "Sair da conta",
    },
    en: {
      title: "Your 7-day trial has ended",
      subtitle: "Choose a plan to continue using KAZA",
      logout: "Sign out",
    },
    es: {
      title: "Tu prueba de 7 días ha terminado",
      subtitle: "Elige un plan para continuar usando KAZA",
      logout: "Cerrar sesión",
    },
  };

  const l = labels[language] || labels["pt-BR"];

  const plans = [
    {
      id: "individual",
      label: "Individual",
      tagline: language === "pt-BR" ? "Para 1 dispositivo" : language === "es" ? "Para 1 dispositivo" : "For 1 device",
      price: "R$ 19,90",
      period: language === "pt-BR" ? "/mês" : "/mo",
      url: "https://pay.cakto.com.br/356go8z",
      features: [
        language === "pt-BR" ? "Itens e receitas ilimitados" : language === "es" ? "Items y recetas ilimitados" : "Unlimited items & recipes",
        language === "pt-BR" ? "Alertas inteligentes" : language === "es" ? "Alertas inteligentes" : "Smart alerts",
        language === "pt-BR" ? "Planejador semanal" : language === "es" ? "Planificador semanal" : "Weekly planner",
      ],
      popular: false,
    },
    {
      id: "trio",
      label: "Trio",
      tagline: language === "pt-BR" ? "Para até 3 dispositivos" : language === "es" ? "Para hasta 3 dispositivos" : "Up to 3 devices",
      price: "R$ 37,90",
      period: language === "pt-BR" ? "/mês" : "/mo",
      url: "https://pay.cakto.com.br/wbjq4ne_846287",
      features: [
        language === "pt-BR" ? "Tudo do Individual" : language === "es" ? "Todo del Individual" : "Everything in Individual",
        language === "pt-BR" ? "Compartilhe com a família" : language === "es" ? "Comparte con la familia" : "Share with family",
        language === "pt-BR" ? "Sincronização entre telas" : language === "es" ? "Sincronización entre pantallas" : "Cross-device sync",
      ],
      popular: true,
    },
  ];

  return (
    <PageTransition
      className="min-h-screen bg-[#F7F6F3] dark:bg-[#091f1c] flex flex-col"
      direction="up"
    >
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="w-full max-w-md text-center mb-8">
          <h1 className="text-3xl font-black text-[#2C2C2A] dark:text-white mb-2">
            {l.title}
          </h1>
          <p className="text-[15px] text-[#7A7A72] dark:text-white/60 font-medium">
            {l.subtitle}
          </p>
        </div>

        {/* Plan Cards */}
        <div className="w-full max-w-md space-y-2.5 mb-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl bg-white dark:bg-[#11302c] border border-[#E2E1DC] dark:border-white/10 overflow-hidden shadow-sm"
            >
              {plan.popular && (
                <div className="absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full bg-[#3D6B55] text-white text-[9px] font-black uppercase tracking-widest">
                  {language === "pt-BR" ? "Mais Popular" : language === "es" ? "Más popular" : "Most Popular"}
                </div>
              )}
              <div className="px-5 pt-5 pb-3">
                <p className="font-black text-[#2C2C2A] dark:text-white text-[17px] leading-tight">
                  {plan.label}
                </p>
                <p className="text-[12px] text-[#9A998F] dark:text-white/40 font-medium mt-0.5">
                  {plan.tagline}
                </p>
                <div className="flex items-baseline gap-1 mt-2.5">
                  <span className="text-[26px] font-black text-[#2C2C2A] dark:text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-[13px] font-semibold text-[#B0AFA7] dark:text-white/30">
                    {plan.period}
                  </span>
                </div>
              </div>
              <div className="px-5 pb-3 space-y-1.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <Check className="h-3.5 w-3.5 text-[#3D6B55] shrink-0" />
                    <span className="text-[13px] text-[#7A7A72] dark:text-white/60 font-medium">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 pt-1">
                <button
                  onClick={() => window.open(plan.url, "_blank")}
                  className="w-full h-12 rounded-xl bg-[#3D6B55] hover:bg-[#2f5543] text-white font-black text-[14px] tracking-wide transition-all active:scale-[0.97] shadow-sm"
                >
                  {language === "pt-BR" ? "Assinar" : language === "es" ? "Suscribirse" : "Subscribe"}
                </button>
              </div>
            </div>
          ))}
          <p className="text-center text-[10px] text-[#B0AFA7] dark:text-white/30 font-medium pt-0.5">
            {language === "pt-BR"
              ? "Cancele quando quiser · PIX e cartão via Cakto"
              : language === "es"
              ? "Cancela en cualquier momento · PIX y tarjeta vía Cakto"
              : "Cancel anytime · PIX and card via Cakto"}
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => signOut()}
          className="w-full max-w-md h-12 rounded-xl border border-[#E2E1DC] dark:border-white/10 text-[#2C2C2A] dark:text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#FAFAF8] dark:hover:bg-white/5 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {l.logout}
        </button>
      </main>
    </PageTransition>
  );
}

export default PaywallPage;
