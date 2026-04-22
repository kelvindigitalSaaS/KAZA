/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  canInstall: boolean;
  isIOS: boolean;
  install: () => Promise<void>;
  showGuide: boolean;
  setShowGuide: (show: boolean) => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      // Only allow install prompt on /auth and /app routes, never on sales/marketing pages
      const path = window.location.pathname;
      if (!path.startsWith("/app") && !path.startsWith("/auth")) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setIsIOS(isIOSDevice || isSafari);

    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    // Auto-show guide on /app if not already installed and not shown in this session
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const path = window.location.pathname;
    const hasSeenGuide = sessionStorage.getItem("pwa-guide-shown");

    if (!isStandalone && path.startsWith("/app") && !hasSeenGuide) {
      setTimeout(() => {
        setShowGuide(true);
        sessionStorage.setItem("pwa-guide-shown", "true");
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const install = async () => {
    if (isIOS) {
      setShowGuide(true);
      return;
    }

    if (!deferredPrompt) {
      setShowGuide(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } catch (_error) { /* prompt failed silently */ }
  };

  return (
    <PWAContext.Provider 
      value={{ 
        deferredPrompt, 
        canInstall: !!deferredPrompt || isIOS, 
        isIOS,
        install,
        showGuide,
        setShowGuide
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}
