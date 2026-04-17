import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Smartphone, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ChefHat,
  CalendarDays,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const SuccessPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const benefits = [
    {
      title: "Desperdício Zero",
      desc: "Alertas inteligentes antes dos alimentos vencerem.",
      icon: ShieldCheck,
      color: "text-green-500 bg-green-500/10"
    },
    {
      title: "Cozinha Inteligente",
      desc: "Receitas baseadas no que você já tem em casa.",
      icon: ChefHat,
      color: "text-primary bg-primary/10"
    },
    {
      title: "Planejamento Fácil",
      desc: "Organize sua semana e economize tempo.",
      icon: CalendarDays,
      color: "text-blue-500 bg-blue-500/10"
    },
    {
      title: "Saúde em Foco",
      desc: "Sugestões nutritivas para você e sua família.",
      icon: Target,
      color: "text-orange-500 bg-orange-500/10"
    }
  ];

  const l = {
    "pt-BR": {
      title: "Tudo pronto!",
      subtitle: "Sua jornada com a Kaza começou. Agora você tem o controle total da sua cozinha.",
      installText: "Para a melhor experiência, instale o Kaza no seu celular.",
      btnInstall: "Como instalar no meu celular",
      btnStart: "Começar a usar agora",
      benefitsTitle: "O que você vai desfrutar:"
    },
    "en": {
      title: "All set!",
      subtitle: "Your Kaza journey has begun. You now have full control of your kitchen.",
      installText: "For the best experience, install Kaza on your phone.",
      btnInstall: "How to install on my phone",
      btnStart: "Start using now",
      benefitsTitle: "What you will enjoy:"
    }
  }[language === "pt-BR" ? "pt-BR" : "en"];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div
      className="min-h-screen pb-12 overflow-x-hidden relative text-white"
      style={{ background: "linear-gradient(160deg, #165A52 0%, #0e3d38 55%, #091f1c 100%)" }}
    >
      {/* Radial sage glow — mesmo do login */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[60vh] -z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(144,171,156,0.18) 0%, transparent 70%)",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-lg mx-auto px-6 pt-16 space-y-10"
      >
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="w-24 h-24 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl"
            style={{
              background: "linear-gradient(90deg, #548A76 0%, #90AB9C 100%)",
              boxShadow: "0 20px 40px -10px rgba(84,138,118,0.55)",
            }}
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl font-black tracking-tight text-white">
            {l.title}
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg text-white/75 font-medium leading-relaxed">
            {l.subtitle}
          </motion.p>
        </div>

        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[2px] text-white/60 px-2 flex items-center gap-2">
            <Zap className="w-3 h-3 text-[#90AB9C]" />
            {l.benefitsTitle}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="group p-4 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/10 flex items-center gap-4 transition-all hover:border-[#90AB9C]/40 shadow-sm"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 text-white"
                  style={{ background: "linear-gradient(135deg, rgba(84,138,118,0.45) 0%, rgba(144,171,156,0.25) 100%)" }}
                >
                  <benefit.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{benefit.title}</h3>
                  <p className="text-xs text-white/65 mt-0.5">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.div variants={itemVariants} className="space-y-4 pt-4">
          <div className="bg-white/[0.06] rounded-[2rem] p-6 border border-white/10 text-center space-y-4 backdrop-blur-xl">
            <div className="flex justify-center -space-x-2 mb-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#0e3d38] bg-white/10 flex items-center justify-center text-[10px]">🍎</div>
              <div className="w-8 h-8 rounded-full border-2 border-[#0e3d38] bg-white/10 flex items-center justify-center text-[10px]">🍗</div>
              <div className="w-8 h-8 rounded-full border-2 border-[#0e3d38] bg-white/10 flex items-center justify-center text-[10px]">🥦</div>
            </div>
            <p className="text-sm font-medium text-white px-4 italic leading-relaxed">
              "{l.installText}"
            </p>
            <Button
              onClick={() => navigate("/app/settings/install")}
              variant="outline"
              className="w-full h-12 rounded-2xl border-[#90AB9C]/40 bg-transparent text-white font-bold hover:bg-white/5 hover:text-white"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              {l.btnInstall}
            </Button>
          </div>

          <Button
            onClick={() => navigate("/app/home")}
            className="w-full h-16 rounded-[2rem] text-lg font-black text-white shadow-xl group border-0"
            style={{
              background: "linear-gradient(90deg, #548A76 0%, #90AB9C 100%)",
              boxShadow: "0 20px 40px -10px rgba(84,138,118,0.55)",
            }}
          >
            {l.btnStart}
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
