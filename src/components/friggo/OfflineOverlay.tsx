import { useState, useEffect } from "react";
import { WifiOff, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const offlineMessages = {
  "pt-BR": {
    title: "Sinal Perdido",
    message:
      "Parece que você está desconectado da rede. Verifique sua conexão à internet para continuar acessando o Kaza de forma fluida e segura.",
    retry: "Tentar Reconectar"
  },
  en: {
    title: "Signal Lost",
    message:
      "It seems you are disconnected from the network. Check your internet connection to continue accessing Kaza smoothly and securely.",
    retry: "Try Reconnecting"
  },
  es: {
    title: "Señal Perdida",
    message:
      "Parece que estás desconectado de la red. Verifica tu conexión a internet para continuar accediendo a Kaza de forma fluida y segura.",
    retry: "Intentar Reconectar"
  }
};

export function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { language } = useLanguage();
  const t = offlineMessages[language] || offlineMessages["pt-BR"];

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    // Suporte para disparar o modo offline manualmente (Ex: timeout ou fetch fail)
    const handleForceOffline = () => setIsOffline(true);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("force-offline", handleForceOffline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("force-offline", handleForceOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-3xl px-6 text-center animate-in fade-in duration-300">

      {/* Container Principal */}
      <div className="relative flex flex-col items-center max-w-[340px] w-full bg-white dark:bg-[#111] border border-black/[0.05] dark:border-white/[0.08] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden shadow-red-500/10">

        {/* Glows */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-red-500/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] translate-x-1/2 translate-y-1/2" />

        {/* Círculo do Logo com "X Vermelho" */}
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-[1.75rem] border border-black/[0.04] dark:border-white/10 shadow-lg flex items-center justify-center shadow-black/10 overflow-hidden relative bg-white">
            <img src="https://cdn-checkout.cakto.com.br/products/a860788b-9cfc-43e2-b233-a602fe205e0c.png?width=180" alt="Kaza Logo" className="w-full h-full object-cover z-10 opacity-40 grayscale" />
            <div className="absolute inset-0 bg-red-500/10 mix-blend-multiply dark:mix-blend-lighten z-20" />
          </div>

          {/* O X Vermelho brilhante anexado */}
          <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-red-500 flex items-center justify-center text-white border-4 border-white dark:border-[#111] shadow-[0_4px_20px_rgba(239,68,68,0.5)] z-30 animate-pulse">
            <WifiOff className="h-5 w-5" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight flex items-center justify-center gap-2">
          {t.title}
        </h2>

        <p className="text-[13px] text-muted-foreground leading-relaxed font-medium mb-8 mx-auto px-2">
          {t.message}
        </p>

        <button
          onClick={() => {
            if (navigator.onLine) {
              setIsOffline(false);
              window.location.reload(); // Hard reload pra tentar forçar reconexão da infra
            } else {
              // Feedback visual de tentar de novo, porém sabendo que falhou
              const el = document.getElementById("retry-icon");
              if (el) {
                el.classList.add("animate-spin");
                setTimeout(() => el.classList.remove("animate-spin"), 1000);
              }
            }
          }}
          className="w-full relative group overflow-hidden h-14 flex items-center justify-center rounded-2xl bg-foreground text-background font-bold active:scale-[0.98] transition-all"
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="flex items-center gap-2">
            <ShieldAlert id="retry-icon" className="h-4 w-4" />
            {t.retry}
          </span>
        </button>

      </div>
    </div>
  );
}
