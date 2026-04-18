import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const LS_KEY = 'friggo-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Leitura inicial do localStorage — rápida, sem flash
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem(LS_KEY) as Theme) || 'system';
  });

  // Aplica o tema no DOM sempre que mudar
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(sys);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem(LS_KEY, theme);
  }, [theme]);

  // Escuta mudanças do sistema quando tema = 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handle = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mq.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, [theme]);

  // Sincroniza DO banco quando o usuário loga (fonte de verdade = DB)
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('theme_preference')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const dbTheme = (data as any)?.theme_preference as Theme | undefined;
        if (dbTheme && dbTheme !== localStorage.getItem(LS_KEY)) {
          setThemeState(dbTheme);
          localStorage.setItem(LS_KEY, dbTheme);
        }
      })
      .catch(() => { /* falha silenciosa — localStorage mantém o valor */ });
  }, [user?.id]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(LS_KEY, newTheme);
    // Persiste no banco (best-effort)
    if (user) {
      (supabase as any)
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('user_id', user.id)
        .then(() => {})
        .catch(() => {});
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
