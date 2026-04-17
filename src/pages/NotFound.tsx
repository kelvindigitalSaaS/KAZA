import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="relative mb-8"
      >
        <div className="h-32 w-32 rounded-[2.5rem] border border-black/[0.04] dark:border-white/10 shadow-xl flex items-center justify-center shadow-black/5 overflow-hidden relative bg-white">
          <img 
            src="https://cdn-checkout.cakto.com.br/products/a860788b-9cfc-43e2-b233-a602fe205e0c.png?width=180" 
            alt="Kaza Logo" 
            className="w-full h-full object-cover z-10 opacity-40 grayscale" 
          />
          
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              y: [0, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <span className="text-7xl font-black text-foreground/10 tracking-tighter">404</span>
          </motion.div>
        </div>
        
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-3 -right-3 h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground border-4 border-background shadow-lg z-30"
        >
          <SearchX className="h-6 w-6" />
        </motion.div>
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black tracking-tight mb-3"
      >
        Página não encontrada!
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground mb-8 max-w-xs mx-auto"
      >
        Parece que você procurou por algo que não existe. Que tal voltar para o início?
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button 
          onClick={() => navigate("/")}
          size="lg"
          className="rounded-2xl h-14 px-8 font-bold gap-2 shadow-xl shadow-primary/20"
        >
          <Home className="h-5 w-5" />
          Voltar para Home
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
