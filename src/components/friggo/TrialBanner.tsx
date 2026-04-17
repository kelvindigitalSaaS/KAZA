import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Crown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

export function TrialBanner() {
  const { user } = useAuth();
  const { subscription, trialDaysRemaining, isLocked, loading } = useSubscription();
  const navigate = useNavigate();
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem("friggo_trial_banner_dismissed") === "true";
  });
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Auto-hide after 15 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  // Show banner if not logged in OR if trial is active
  const shouldShow = isVisible && !isDismissed && !loading && !isLocked;
  
  if (!shouldShow) return null;

  // Logic for authenticated users
  if (user) {
    if (subscription?.plan === "premium" || trialDaysRemaining <= 0) {
      return null;
    }
  }

  const percentage = user ? Math.max(0, Math.min(100, (trialDaysRemaining / 7) * 100)) : 100;
  const bannerText = user 
    ? `Kaza Premium liberado (${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'dia' : 'dias'})`
    : 'Aproveitar avaliação 7 dias';
  const targetPath = user ? "/app/settings/subscription" : "/auth";

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    sessionStorage.setItem("friggo_trial_banner_dismissed", "true");
  };

  // drag-to-open (pull down) gesture

  const onPointerDown = (e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || startYRef.current === null) return;
    const dy = e.clientY - startYRef.current;
    if (dy <= 0) return;
    setTranslateY(dy > 160 ? 160 : dy);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (translateY > 80) {
      // treat as action: open register/settings
      setIsDismissed(true);
      sessionStorage.setItem("friggo_trial_banner_dismissed", "true");
      navigate(targetPath, { state: !user ? { initialView: "register" } : undefined });
    }
    setTranslateY(0);
    startYRef.current = null;
  };

  return (
    <div className="fixed top-3 left-1/2 transform -translate-x-1/2 z-[9999] w-[min(980px,calc(100%-16px))] md:w-[min(980px,calc(100%-32px))] bg-emerald-600 text-white rounded-2xl shadow-lg animate-in fade-in slide-in-from-top duration-500">
      <div
        ref={bannerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ transform: `translateY(${translateY}px)`, transition: isDragging ? "none" : "transform 180ms ease", touchAction: "pan-y" }}
        className="relative mx-1 md:mx-2"
      >
        <Link
          to={targetPath}
          state={!user ? { initialView: "register" } : undefined}
          className="block px-3 py-1.5 md:px-4 md:py-2 hover:bg-emerald-700/95 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 bg-white/20 p-1 rounded-full h-7 w-7 md:h-8 md:w-8 flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] md:text-[12px] font-bold uppercase tracking-wider truncate leading-tight">
                {bannerText}
              </p>
              {user && (
                <div className="w-full bg-white/30 rounded-full h-1 mt-1 max-w-[120px] md:max-w-[140px]">
                  <div
                    className={cn("bg-white h-1 rounded-full transition-all duration-1000", trialDaysRemaining <= 2 && "bg-red-500")}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </div>

            <div className="ml-3 md:ml-4 flex items-center gap-2">
              <div className="text-[11px] md:text-[12px] font-bold bg-white text-emerald-600 px-2 py-0.5 rounded-full">
                {user ? "Assinar" : "Ativar"}
              </div>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4 text-white/90" />
        </button>
      </div>
    </div>
  );
}
