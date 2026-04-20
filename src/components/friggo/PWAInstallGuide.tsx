/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { usePWA } from "@/contexts/PWAContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Share, PlusSquare, Smartphone, ChevronRight, X } from "lucide-react";
import { motion } from "framer-motion";

export default function PWAInstallGuide() {
  const { showGuide, setShowGuide, isIOS } = usePWA();
  const { language } = useLanguage();

  const labels: Record<string, any> = {
    "pt-BR": {
      title: "Instalar Kaza",
      desc: "Tenha a melhor experiência instalando o Kaza na sua tela de início.",
      step1: "Toque no ícone de 'Compartilhar' na barra inferior do Safari.",
      step2: "Role para baixo e toque em 'Adicionar à Tela de Início'.",
      step3: "Toque em 'Adicionar' no canto superior direito para confirmar.",
      button: "Entendi",
    },
    en: {
      title: "Install Kaza",
      desc: "Get the best experience by installing Kaza to your home screen.",
      step1: "Tap the 'Share' icon in the bottom bar of Safari.",
      step2: "Scroll down and tap 'Add to Home Screen'.",
      step3: "Tap 'Add' in the top right corner to confirm.",
      button: "Got it",
    },
    es: {
      title: "Instalar Kaza",
      desc: "Obtén la mejor experiencia instalando Kaza en tu pantalla de inicio.",
      step1: "Toca el ícone de 'Compartir' en la barra inferior de Safari.",
      step2: "Desliza hacia abajo y toca 'Agregar a la pantalla de inicio'.",
      step3: "Toca 'Agregar' en la esquina superior derecha para confirmar.",
      button: "Entendido",
    },
  };

  const l = labels[language] || labels.en;

  const appleSpring = { type: "spring", stiffness: 300, damping: 30 };

  return (
    <Dialog open={showGuide} onOpenChange={setShowGuide}>
      <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] border-none bg-background p-0 overflow-hidden shadow-2xl">
        <div className="relative overflow-hidden bg-primary/5 p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          
          <DialogHeader className="relative z-10 text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/25 mb-4">
              <Smartphone className="h-7 w-7 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              {l.title}
            </DialogTitle>
            <DialogDescription className="text-[15px] font-medium text-muted-foreground leading-relaxed">
              {l.desc}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...appleSpring, delay: 0.1 }}
              className="flex items-start gap-4 group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                <Share className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground leading-tight py-1">
                {l.step1}
              </p>
            </motion.div>

            <div className="ml-5 h-6 w-0.5 bg-muted" />

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...appleSpring, delay: 0.2 }}
              className="flex items-start gap-4 group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                <PlusSquare className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground leading-tight py-1">
                {l.step2}
              </p>
            </motion.div>

            <div className="ml-5 h-6 w-0.5 bg-muted" />

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...appleSpring, delay: 0.3 }}
              className="flex items-start gap-4 group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                <span className="text-xs font-bold text-primary">ADD</span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-tight py-1">
                {l.step3}
              </p>
            </motion.div>
          </div>

          <button
            onClick={() => setShowGuide(false)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98] hover:opacity-90 mt-4"
          >
            {l.button}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
