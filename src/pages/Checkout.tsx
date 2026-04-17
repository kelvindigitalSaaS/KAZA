import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { ChevronLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CheckoutState {
  clientSecret: string;
  publishableKey: string;
  planName: string;
  planPrice: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CheckoutState | null;
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);

  useEffect(() => {
    if (state?.publishableKey) {
      setStripePromise(loadStripe(state.publishableKey));
    }
  }, [state?.publishableKey]);

  if (!state?.clientSecret || !state?.publishableKey) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 p-6 pt-safe">
        <p className="text-muted-foreground text-sm text-center">
          Sessão de checkout inválida ou expirada.
        </p>
        <Button variant="outline" onClick={() => navigate('/app/settings/subscription')}>
          Ver planos
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[var(--100dvh,100dvh)] bg-background flex flex-col pt-safe">
      <header className="sticky top-0 z-50 flex items-center gap-3 bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-3 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06] shrink-0">
        <button
          onClick={() => navigate('/app/settings/subscription')}
          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl transition-colors active:scale-[0.97]"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold leading-tight truncate">
            Assinar {state.planName}
          </h1>
          {state.planPrice && (
            <p className="text-xs text-muted-foreground">{state.planPrice}/mês</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium shrink-0">
          <ShieldCheck className="h-4 w-4" />
          <span>Seguro</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {stripePromise && state.clientSecret ? (
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret: state.clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        ) : (
          <div className="flex h-full min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
