/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWA } from "@/contexts/PWAContext";
import { 
  ChevronLeft, 
  Download, 
  Smartphone, 
  Monitor, 
  MoreVertical, 
  Share, 
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function InstallGuidePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { canInstall, install } = usePWA();

  const labels: Record<string, any> = {
    "pt-BR": {
      title: "Como Instalar",
      subtitle: "Adicione o Kaza à sua tela inicial",
      iosTitle: "iPhone / iPad (Safari)",
      androidTitle: "Android / PC (Chrome/Edge)",
      pcDesc: "Instale diretamente para uma melhor experiência.",
      btnInstall: "Instalar agora",
      ifNoBtn: "Procure o ícone de instalação na barra de endereço ou menu do navegador.",
      step1: "Toque nos três pontos :",
      step2: "Selecione Compartilhar",
      step3: 'Toque em "Adicionar à Tela de Início"'
    },
    en: {
      title: "How to Install",
      subtitle: "Add Kaza to your home screen",
      iosTitle: "iPhone / iPad (Safari)",
      androidTitle: "Android / PC (Chrome/Edge)",
      pcDesc: "Install directly for a better experience.",
      btnInstall: "Install now",
      ifNoBtn: "Look for the install icon in the address bar or browser menu.",
      step1: "Tap the three dots :",
      step2: "Select Share",
      step3: 'Tap "Add to Home Screen"'
    },
    es: {
      title: "Cómo Instalar",
      subtitle: "Añade Kaza a tu pantalla de inicio",
      iosTitle: "iPhone / iPad (Safari)",
      androidTitle: "Android / PC (Chrome/Edge)",
      pcDesc: "Instala directamente para una mejor experiencia.",
      btnInstall: "Instalar ahora",
      ifNoBtn: "Busca el icono de instalación en la barra de direcciones o menú del navegador.",
      step1: "Toca los três pontos :",
      step2: "Selecciona Compartir",
      step3: 'Toca "Añadir a la pantalla de inicio"'
    }
  };

  const l = labels[language as keyof typeof labels] || labels.en;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#091f1c] pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#091f1c]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06] px-4 h-16 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-foreground transition-all active:scale-90"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{l.title}</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/10 mb-2">
            <Download className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-foreground">{l.subtitle}</h2>
        </div>

        {/* iOS */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 px-2 text-sm font-black text-muted-foreground uppercase tracking-widest">
            <Smartphone className="h-4 w-4" /> {l.iosTitle}
          </div>
          
          <div className="rounded-[2rem] bg-white dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06] p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-[#1b43aa] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                1
              </div>
              <p className="text-[15px] font-semibold text-foreground">
                {l.step1} <MoreVertical className="inline-block h-4 w-4 align-middle" /> no canto do Safari
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-[#1b43aa] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                2
              </div>
              <p className="text-[15px] font-semibold text-foreground flex items-center gap-2 flex-wrap">
                {l.step2} <span className="inline-flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-lg border border-black/5"><Share className="h-3.5 w-3.5 text-primary" /> Compartilhar</span>
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-[#1b43aa] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  3
                </div>
                <p className="text-[15px] font-semibold text-foreground">
                  Role a lista, toque em <strong>"Ver mais"</strong> e depois em
                </p>
              </div>
              <div className="ml-12 inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-white/10 border border-black/[0.06] dark:border-white/10 shadow-md">
                <Plus className="h-5 w-5 text-[#1b43aa]" />
                <span className="text-[14px] font-black text-foreground">{l.step3}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-[#1b43aa] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                4
              </div>
              <p className="text-[15px] font-semibold text-foreground">
                Toque em <strong>"Adicionar"</strong> — pronto!
              </p>
            </div>
          </div>
        </motion.section>

        {/* Android / PC */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 px-2 text-sm font-black text-muted-foreground uppercase tracking-widest">
            <Monitor className="h-4 w-4" /> {l.androidTitle}
          </div>
          
          <div className="rounded-[2rem] bg-white dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06] p-8 space-y-6 shadow-sm text-center">
            <p className="text-sm font-bold text-muted-foreground leading-relaxed px-4">
              {l.pcDesc}
            </p>
            
            {canInstall ? (
              <Button 
                onClick={install} 
                className="w-full h-14 rounded-2xl bg-primary text-white font-black text-base gap-3 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <Download className="h-5 w-5" />
                {l.btnInstall}
              </Button>
            ) : (
              <div className="bg-muted/30 p-4 rounded-xl">
                 <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                  {l.ifNoBtn}
                </p>
              </div>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
}
