/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
// NOTE: Stripe Embedded Checkout can be unreliable in WebView environments (Capacitor) and
// requires HTTPS in production. We prefer redirecting to Stripe Checkout via session.url.

import { supabase } from "@/integrations/supabase/client";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { openExternalUrl } from "@/lib/nativeBrowser";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PLAN_DETAILS, SubscriptionPlan } from "@/contexts/SubscriptionContext";

interface StripeCheckoutProps {
  planId: string;
  planName: string;
  planPrice: string;
  onClose: () => void;
  onSuccess?: (sessionId: string) => void;
}

type CheckoutStage = "method" | "payment" | "success";

class StripeCheckoutErrorBoundary extends React.Component<
  { onError: (error: Error) => void; children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default function StripeCheckout({
  planId,
  planName,
  planPrice,
  onClose,
  onSuccess
}: StripeCheckoutProps) {
  const { user, loading: authLoading } = useAuthGuard();
  const [stage, setStage] = useState<CheckoutStage>("method");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("card");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(() => {
    // Validar se o planId é um plano válido
    const validPlans: SubscriptionPlan[] = ["basic", "premium", "family"];
    return validPlans.includes(planId as SubscriptionPlan)
      ? (planId as SubscriptionPlan)
      : "basic";
  });

  // Verificar se está carregando autenticação
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // Verificar se usuário não está autenticado
  if (!user) {
    return null; // useAuthGuard vai redirecionar
  }

  // Criar checkout session
  const createCheckoutSession = async () => {
    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sessão expirada");
      }

      const { data, error: functionError } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: JSON.stringify({ plan: selectedPlan }),
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.debug("[Checkout] create-checkout response", {
        data,
        functionError
      });

      if (functionError) {
        if (import.meta.env.DEV) console.error("[DEV][Checkout] functionError", functionError);
        const detail =
          (functionError as any).details || (functionError as any).hint || "";
        const message = `${functionError.message}${
          detail ? `: ${detail}` : ""
        }`;
        throw new Error(message || "Erro ao criar sessão de checkout");
      }

      if (!data?.clientSecret) {
        if (import.meta.env.DEV) console.error("[DEV][Checkout] missing clientSecret", data);
        throw new Error("Sessão de checkout não foi criada corretamente");
      }

      setClientSecret(data.clientSecret);
      setCheckoutUrl(data.url ?? null);

      // Prefer redirecting to Stripe Checkout (avoids embedded issues / HTTP limitation)
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setStage("payment");
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[DEV][Checkout] Erro:", err);
      const errorMsg = err?.message || "Erro ao iniciar checkout";
      setError(errorMsg);
      toast.error(errorMsg);
      setStage("method");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSelect = async (method: string) => {
    setSelectedPaymentMethod(method);

    // Criar sessão de checkout com o método selecionado
    // Ao retornar a URL, abrimos o Stripe Checkout (HTTPS) em vez de usar Embedded.
    await createCheckoutSession();
  };

  const handleRetry = () => {
    setError(null);
    if (selectedPaymentMethod) {
      handlePaymentSelect(selectedPaymentMethod);
    }
  };

  // Navegação de página completa
  return (
    <div className="fixed inset-0 bg-background z-50">
      {/* Header - sempre visível */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          {stage !== "method" && (
            <button
              onClick={() => {
                if (stage === "payment") {
                  setStage("method");
                  setError(null);
                } else if (stage === "success") {
                  onClose();
                }
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-black">
              {PLAN_DETAILS[selectedPlan].name}
            </h1>
            <p className="text-sm text-muted-foreground">
              R$ {PLAN_DETAILS[selectedPlan].price.toFixed(2).replace(".", ",")}
              /mês
            </p>
          </div>
        </div>
      </div>

      {/* Container de conteúdo com transições */}
      <div className="relative flex-1 overflow-hidden">
        {/* Stage 1: Escolher método de pagamento (mobile first) */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ${
            stage === "method"
              ? "translate-x-0"
              : stage === "payment"
              ? "-translate-x-full"
              : "translate-x-full"
          }`}
        >
          <div className="h-full p-4 flex flex-col justify-between">
            <div className="space-y-4 overflow-y-auto">
              <div>
                <p className="text-sm font-bold text-muted-foreground mb-2">
                  Escolha o método de pagamento
                </p>
                <p className="text-xs text-muted-foreground">
                  Depois você preencherá os dados de pagamento.
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-destructive font-bold">
                    <AlertCircle className="h-5 w-5" />
                    Erro ao carregar checkout
                  </div>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              )}

              <Button
                onClick={() => handlePaymentSelect("card")}
                disabled={loading}
                className="w-full h-12 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Continuar com Cartão"
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              💳 Pagamento seguro via Stripe
            </p>
          </div>
        </div>

        {/* Stage 2: Embedded Checkout */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ${
            stage === "payment"
              ? "translate-x-0"
              : stage === "method"
              ? "translate-x-full"
              : "-translate-x-full"
          }`}
        >
          <div className="h-full">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3 max-w-md">
                  <div className="flex items-center justify-center gap-2 text-destructive font-bold">
                    <AlertCircle className="h-5 w-5" />
                    Erro no checkout
                  </div>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button
                    onClick={() => {
                      setStage("method");
                      setError(null);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Gerando sessão de pagamento...
                </p>
              </div>
            ) : checkoutUrl ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Abrindo checkout do Stripe...
                </p>
                <p className="text-xs text-muted-foreground">
                  Caso não abra automaticamente, clique abaixo.
                </p>
                <Button
                  onClick={() => openExternalUrl(checkoutUrl)}
                  variant="outline"
                >
                  Ir para Stripe
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar o formulário de pagamento.
                </p>
                <p className="text-xs text-muted-foreground">
                  Verifique a conexão e se a sua chave do Stripe está
                  configurada.
                </p>
                <Button
                  onClick={() => {
                    setStage("method");
                    setError(null);
                  }}
                  variant="outline"
                >
                  Voltar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stage 3: Success */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ${
            stage === "success" ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-4">
            <div className="space-y-2">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-black text-green-600">
                Pagamento Aprovado!
              </h2>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-2 max-w-sm">
              <p className="text-green-700 font-bold">
                Assinatura ativada com sucesso!
              </p>
              <p className="text-sm text-green-600">
                Bem-vindo ao {PLAN_DETAILS[selectedPlan].name}! Você agora tem
                acesso completo a todos os recursos.
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full max-w-sm h-12 rounded-lg font-bold"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
