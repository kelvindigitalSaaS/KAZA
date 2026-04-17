import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CheckoutCancelPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const labels = {
    "pt-BR": {
      canceled: "❌ Pagamento Cancelado",
      subtitle: "Você cancelou o processo de pagamento",
      message: "Sem problemas! Você pode tentar novamente a qualquer momento.",
      reasons: "Por que você cancelou?",
      retry: "Tentar Novamente",
      goHome: "Voltar para Home",
      explore: "Continuar com Plano Grátis",
      support: "Precisa de ajuda?",
      supportText: "Entre em contato com suporte@kaza.app se tiver dúvidas",
      freeFeatures: "Continue desfrutando do plano grátis:",
      features: [
        "5 itens na geladeira",
        "1 receita por dia",
        "20 itens na lista",
        "Suporte por email"
      ]
    },
    en: {
      canceled: "❌ Payment Canceled",
      subtitle: "You canceled the payment process",
      message: "No problem! You can try again anytime.",
      reasons: "Why did you cancel?",
      retry: "Try Again",
      goHome: "Go to Home",
      explore: "Continue with Free Plan",
      support: "Need help?",
      supportText: "Contact support@kaza.app if you have any questions",
      freeFeatures: "Continue enjoying the free plan:",
      features: [
        "5 items in the fridge",
        "1 recipe per day",
        "20 items in the list",
        "Email support"
      ]
    },
    es: {
      canceled: "❌ Pago Cancelado",
      subtitle: "Cancelaste el proceso de pago",
      message:
        "¡Sin problemas! Puedes intentarlo de nuevo en cualquier momento.",
      reasons: "¿Por qué cancelaste?",
      retry: "Intentar de Nuevo",
      goHome: "Ir a Inicio",
      explore: "Continuar con Plan Gratis",
      support: "¿Necesitas ayuda?",
      supportText: "Contacta con support@kaza.app si tienes dudas",
      freeFeatures: "Continúa disfrutando del plan gratuito:",
      features: [
        "5 artículos en la nevera",
        "1 receta por día",
        "20 artículos en la lista",
        "Soporte por correo"
      ]
    }
  };

  const l = labels[language] || labels["pt-BR"];

  return (
    <PageTransition
      direction="down"
      className="min-h-[100dvh] bg-gradient-to-b from-amber-50/50 via-[#fafafa] to-[#fafafa] dark:from-amber-950/20 dark:via-[#091f1c] dark:to-[#091f1c] pb-20"
    >
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Canceled Animation */}
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Alert Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {l.canceled}
            </h1>
            <p className="text-base text-muted-foreground">{l.subtitle}</p>
            <p className="text-sm text-muted-foreground pt-2">{l.message}</p>
          </div>

          {/* Free Plan Features */}
          <div className="w-full bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200/50 dark:border-amber-900/30 space-y-3">
            <p className="text-sm font-bold text-foreground">
              {l.freeFeatures}
            </p>
            <ul className="space-y-2">
              {l.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Why Section */}
          <div className="w-full bg-muted/20 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              {l.reasons}
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 💰 Preço fora do orçamento?</p>
              <p>• ❓ Dúvidas sobre o que é incluído?</p>
              <p>• ⏸️ Quer tentar depois?</p>
              <p>• 🎯 Precisa de um plano diferente?</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2">
            <Button
              onClick={() => navigate("/app/settings/subscription")}
              className="w-full h-12 rounded-xl font-bold text-base shadow-lg"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {l.retry}
            </Button>
            <Button
              onClick={() => navigate("/app/home")}
              variant="outline"
              className="w-full h-12 rounded-xl font-bold text-base"
            >
              <Home className="h-5 w-5 mr-2" />
              {l.explore}
            </Button>
          </div>

          {/* Support Section */}
          <div className="w-full text-center space-y-2 pt-6 border-t border-muted/50">
            <p className="text-xs font-bold text-foreground flex items-center justify-center gap-2">
              <HelpCircle className="h-4 w-4" />
              {l.support}
            </p>
            <p className="text-xs text-muted-foreground">{l.supportText}</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
