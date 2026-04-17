import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (import.meta.env.DEV) { console.log("[DEV] Auth state changed:", event, !!session); }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Redirect to login if signed out — only for protected /app/* routes
      if (event === "SIGNED_OUT" || !session) {
        const path = window.location.pathname;
        if (path.startsWith("/app") && path !== "/auth") {
          window.location.href = "/auth";
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const requireAuth = () => {
    if (!user || !session) {
      const path = window.location.pathname;
      if (path.startsWith("/app") && path !== "/auth") {
        window.location.href = "/auth";
      }
      return false;
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signOut, requireAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
