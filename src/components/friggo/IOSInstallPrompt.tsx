/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { X, Share, MoreVertical, Plus } from "lucide-react";

/**
 * iOS Safari PWA install prompt.
 * Shows high-quality instructions: ⋯ > Share > Add to Home Screen.
 * Only dismisses when the user explicitly taps the close button.
 */
export function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari =
      /safari/i.test(navigator.userAgent) &&
      !/crios|fxios|opios|chrome/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as any).standalone);
    const dismissed = localStorage.getItem("friggo-ios-install-dismissed");

    if (isIOSDevice && isSafari && !isStandalone && !dismissed) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("friggo-ios-install-dismissed", Date.now().toString());
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop — blocks interaction until closed */}
      <div className="fixed inset-0 z-[9997] bg-black/30 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Card */}
      <div className="fixed bottom-0 left-0 right-0 z-[9998] animate-in slide-in-from-bottom duration-400 px-4 pb-6 safe-area-bottom">
        <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-start gap-3 p-5 pb-3">
            <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shrink-0 overflow-hidden">
              <img
                src="/icon.png"
                alt="Kaza"
                className="w-full h-full object-cover transform scale-[1.4]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="font-bold text-foreground text-[16px] leading-tight">
                Instalar Kaza
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                Adicione o app à sua tela de início para uma experiência completa, rápida e sem navegador.
              </p>
            </div>
            {/* Close — only way to dismiss */}
            <button
              onClick={handleDismiss}
              className="p-2 -mr-1 -mt-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Steps */}
          <div className="mx-5 mb-5 rounded-2xl bg-[#f4f4f7] dark:bg-white/[0.05] p-5 space-y-5">
            {/* Step 1 */}
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1b43aa] text-[13px] font-bold text-white shrink-0">
                1
              </div>
              <p className="text-[14px] text-foreground font-medium">
                Toque nos <strong>três pontos</strong> <MoreVertical className="inline-block h-4 w-4" /> no canto do Safari
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1b43aa] text-[13px] font-bold text-white shrink-0">
                2
              </div>
              <p className="text-[14px] text-foreground font-medium flex items-center gap-1.5 flex-wrap">
                Selecione <span className="inline-flex items-center gap-1 bg-white dark:bg-white/10 px-2 py-0.5 rounded border border-black/5"><Share className="h-3 w-3 text-primary" /> Compartilhar</span>
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1b43aa] text-[13px] font-bold text-white shrink-0">
                  3
                </div>
                <p className="text-[14px] text-foreground font-medium">
                  Role a lista, toque em <strong>"Ver mais"</strong> e depois em
                </p>
              </div>
              <div className="ml-12 mt-1 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-black/[0.06] shadow-sm self-start">
                <Plus className="h-4 w-4 text-[#1b43aa]" />
                <span className="text-[14px] font-bold text-foreground">Adicionar à Tela de Início</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1b43aa] text-[13px] font-bold text-white shrink-0">
                4
              </div>
              <p className="text-[14px] text-foreground font-medium">
                Toque em <strong>"Adicionar"</strong> — pronto!
              </p>
            </div>
          </div>

          {/* Close button */}
          <div className="px-5 pb-5">
            <button
              onClick={handleDismiss}
              className="w-full h-[44px] md:h-[50px] rounded-2xl bg-primary text-primary-foreground font-semibold text-[14px] md:text-[15px] active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
            >
              Entendi, fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
