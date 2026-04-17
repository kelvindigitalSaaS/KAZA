import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react';

type FormData = {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
};

type Props = {
  view: 'login' | 'register';
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  showPassword: boolean;
  setShowPassword: (b: boolean) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
  onApple?: () => void;
  onReset: () => void;
  onToggleView: () => void;
};

export default function KazaLogin({
  view,
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
  onGoogle,
  onApple,
  onReset,
  onToggleView
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-white/95 dark:bg-[#0b1f1c]/90 backdrop-blur-2xl border border-black/[0.04] dark:border-white/[0.06] rounded-[2rem] shadow-2xl p-6 max-w-md mx-auto"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {view === 'register' && (
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Nome</Label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
              <Input
                type="text"
                placeholder="Seu nome"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-11 h-[52px] md:h-[56px] bg-background/60 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 rounded-xl text-[15px] md:text-[16px] transition-all duration-200 focus:bg-background focus:shadow-sm focus:border-primary/30 placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="pl-11 h-[48px] bg-background/60 dark:bg-white/5 border-black/[0.06] dark:border-white/10 rounded-xl text-[14px] transition-all duration-200 focus:bg-background focus:shadow-sm focus:border-primary/30 placeholder:text-muted-foreground/50"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Senha</Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pl-11 pr-12 h-[46px] md:h-[52px] bg-background/60 dark:bg-white/5 border-black/[0.06] dark:border-white/10 rounded-xl text-[14px] md:text-[15px] transition-all duration-200 focus:bg-background focus:shadow-sm focus:border-primary/30 placeholder:text-muted-foreground/50"
              autoComplete={view === 'login' ? 'current-password' : 'new-password'}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg active:bg-muted/50"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {view === 'register' && (
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Confirmar Senha</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword || ''}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pl-11 h-[46px] md:h-[52px] bg-background/60 dark:bg-white/5 border-black/[0.06] dark:border-white/10 rounded-xl text-[14px] md:text-[15px] transition-all duration-200 focus:bg-background focus:shadow-sm focus:border-primary/30 placeholder:text-muted-foreground/50"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
        )}

        {view === 'login' && (
          <div className="text-right -mt-1">
            <button type="button" onClick={onReset} className="text-[13px] text-primary hover:text-primary/80 font-medium transition-colors">Esqueceu a senha?</button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 md:h-16 rounded-2xl text-lg font-black bg-primary text-primary-foreground shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-2"
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          ) : (
            <>
              <span>{view === 'login' ? 'Entrar' : 'Começar teste — 7 dias'}</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>

        <div className="text-center pt-1 pb-4">
          <span className="text-[13px] text-muted-foreground">{view === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}</span>
          <button type="button" onClick={onToggleView} className="text-[13px] text-primary font-semibold hover:text-primary/80 transition-colors">{view === 'login' ? 'Cadastrar' : 'Entrar'}</button>
        </div>
      </form>
    </motion.div>
  );
}
