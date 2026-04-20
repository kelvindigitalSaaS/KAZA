/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Apple,
  Loader2,
  Shield,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PLAN_DETAILS, SubscriptionPlan } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { openExternalUrl } from "@/lib/nativeBrowser";
import { isNative } from "@/lib/capacitor";

interface MiniCheckoutProps {
  plan: SubscriptionPlan;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentMethod = "google_pay" | "apple_pay" | "card";

const labels = {
  "pt-BR": {
    checkout: "Checkout",
    finalize: "Finalize sua assinatura",
    orderSummary: "Resumo do Pedido",
    plan: "Plano",
    monthly: "Cobrança mensal",
    total: "Total",
    paymentMethod: "Método de Pagamento",
    choosePayment: "Escolha como deseja pagar",
    creditCard: "Cartão de Crédito",
    secure: "Pagamento 100% seguro e criptografado",
    pay: "Pagar",
    processing: "Redirecionando...",
    confirmed: "Pagamento Confirmado!",
    welcome: "Bem-vindo ao plano",
    error: "Erro no pagamento",
    errorDesc: "Não foi possível iniciar o checkout. Tente novamente.",
    terms:
      "Ao continuar, você concorda com os Termos de Serviço e Política de Privacidade. A assinatura será renovada automaticamente.",
    perMonth: "/mês",
    redirecting: "Você será redirecionado para o pagamento seguro"
  },
  en: {
    checkout: "Checkout",
    finalize: "Finalize your subscription",
    orderSummary: "Order Summary",
    plan: "Plan",
    monthly: "Monthly billing",
    total: "Total",
    paymentMethod: "Payment Method",
    choosePayment: "Choose how to pay",
    creditCard: "Credit Card",
    secure: "100% secure and encrypted payment",
    pay: "Pay",
    processing: "Redirecting...",
    confirmed: "Payment Confirmed!",
    welcome: "Welcome to the",
    error: "Payment error",
    errorDesc: "Could not start checkout. Try again.",
    terms:
      "By continuing, you agree to the Terms of Service and Privacy Policy. Subscription renews automatically.",
    perMonth: "/mo",
    redirecting: "You will be redirected to secure payment"
  },
  es: {
    checkout: "Checkout",
    finalize: "Finaliza tu suscripción",
    orderSummary: "Resumen del Pedido",
    plan: "Plan",
    monthly: "Cobro mensual",
    total: "Total",
    paymentMethod: "Método de Pago",
    choosePayment: "Elige cómo pagar",
    creditCard: "Tarjeta de Crédito",
    secure: "Pago 100% seguro y encriptado",
    pay: "Pagar",
    processing: "Redirigiendo...",
    confirmed: "¡Pago Confirmado!",
    welcome: "Bienvenido al plan",
    error: "Error de pago",
    errorDesc: "No se pudo iniciar el checkout. Intenta de nuevo.",
    terms:
      "Al continuar, aceptas los Términos de Servicio y Política de Privacidad. La suscripción se renueva automáticamente.",
    perMonth: "/mes",
    redirecting: "Serás redirigido al pago seguro"
  }
};

export function MiniCheckout({ plan, onSuccess, onCancel }: MiniCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"select" | "success">("select");
  const { toast } = useToast();
  const { language } = useLanguage();

  const l = labels[language];
  const planDetails = PLAN_DETAILS[plan];

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: { plan }
        }
      );

      if (error) {
        // Extrair mensagem real do body da resposta
        const ctx = (error as any).context as Response | undefined;
        if (ctx) {
          try {
            const errBody = await ctx.json();
            throw new Error(errBody?.error ?? error.message);
          } catch (e: any) {
            if (e?.message && e.message !== error.message) throw e;
          }
        }
        throw error;
      }

      if (!data?.url) throw new Error("Nenhuma URL de checkout retornada");

      if (isNative) {
        // Mobile: abre Stripe no browser nativo, detecta quando fecha
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: data.url, presentationStyle: "popover" });
        const listener = await Browser.addListener(
          "browserFinished",
          async () => {
            await listener.remove();
            // Sincroniza status da assinatura com o Stripe
            try {
              await supabase.functions.invoke("check-subscription");
            } catch (_) { /* best-effort subscription sync */ }
            setProcessing(false);
            setStep("success");
            setTimeout(() => onSuccess(), 2000);
          }
        );
      } else {
        // Web: redireciona para a Stripe Hosted Page
        window.location.href = data.url;
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error("[DEV] Checkout error:", error);
      const msg =
        error?.message &&
        error.message !== "Edge Function returned a non-2xx status code"
          ? error.message
          : l.errorDesc;
      toast({ title: l.error, description: msg, variant: "destructive" });
      setProcessing(false);
    }
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case "google_pay":
        return <Smartphone className="h-5 w-5" />;
      case "apple_pay":
        return <Apple className="h-5 w-5" />;
      case "card":
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentLabel = (method: PaymentMethod) => {
    switch (method) {
      case "google_pay":
        return "Google Pay";
      case "apple_pay":
        return "Apple Pay";
      case "card":
        return l.creditCard;
    }
  };

  if (step === "success") {
    return (
      <div className="flex items-center justify-center p-6 min-h-[60vh]">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">
            {l.confirmed}
          </h2>
          <p className="text-sm text-gray-500">
            {l.welcome} {planDetails.name}!
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-5 pb-10">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-muted transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{l.checkout}</h1>
            <p className="text-xs text-gray-500">{l.finalize}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-4 rounded-md border border-border bg-card p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {l.orderSummary}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {l.plan} {planDetails.name}
              </p>
              <p className="text-xs text-gray-500">{l.monthly}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                R$ {planDetails.price.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500">{l.perMonth}</p>
            </div>
          </div>
          <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">{l.total}</span>
            <span className="text-base font-bold text-primary">
              R$ {planDetails.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-4 rounded-md border border-border bg-card p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {l.paymentMethod}
          </p>
          <p className="text-[10px] text-gray-500 mb-3">{l.choosePayment}</p>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            className="space-y-2"
          >
            {(["card", "google_pay", "apple_pay"] as PaymentMethod[]).map(
              (method) => (
                <Label
                  key={method}
                  htmlFor={method}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-all active:scale-[0.98]",
                    paymentMethod === method
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={method} id={method} />
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md",
                      method === "google_pay" && "bg-muted text-foreground",
                      method === "apple_pay" && "bg-foreground text-background",
                      method === "card" && "bg-muted text-foreground"
                    )}
                  >
                    {getPaymentIcon(method)}
                  </div>
                  <span className="text-sm font-medium">
                    {getPaymentLabel(method)}
                  </span>
                </Label>
              )
            )}
          </RadioGroup>
        </div>

        <div className="mb-3 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="h-3.5 w-3.5" />
          <span>{l.secure}</span>
        </div>

        <p className="mb-3 text-center text-[10px] text-gray-500">
          {l.redirecting}
        </p>

        <Button
          className={cn(
            "w-full h-12 text-base font-semibold rounded-md",
            plan === "premium"
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : ""
          )}
          onClick={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {l.processing}
            </>
          ) : (
            <>
              {l.pay} R$ {planDetails.price.toFixed(2)}
            </>
          )}
        </Button>

        <p className="mt-4 text-center text-[10px] text-gray-500 leading-relaxed">
          {l.terms}
        </p>
      </div>
    </ScrollArea>
  );
}
