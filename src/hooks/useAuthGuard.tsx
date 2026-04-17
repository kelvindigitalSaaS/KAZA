import { useEffect } from "react";
import { useAuth } from "./useAuth";

/**
 * Hook que verifica autenticação periodicamente e redireciona para login se necessário
 * Deve ser usado em componentes que precisam de proteção adicional
 */
export function useAuthGuard() {
  const { user, loading, requireAuth } = useAuth();

  useEffect(() => {
    // Verificar autenticação imediatamente
    if (!loading) {
      requireAuth();
    }

    // Verificar autenticação a cada 30 segundos
    const interval = setInterval(() => {
      if (!loading) {
        requireAuth();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, requireAuth]);

  // Redirecionar se não estiver autenticado — apenas em rotas /app/*
  useEffect(() => {
    const path = window.location.pathname;
    if (!loading && !user && path.startsWith("/app") && path !== "/auth") {
      window.location.href = "/auth";
    }
  }, [user, loading]);

  return { user, loading, isAuthenticated: !!user };
}
