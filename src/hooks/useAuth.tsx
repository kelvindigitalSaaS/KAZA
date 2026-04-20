/* eslint-disable @typescript-eslint/no-explicit-any */
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
    if (import.meta.env.DEV) console.log("[AUTH] getSession: start");
    const t0 = performance.now();

    // onAuthStateChange fires INITIAL_SESSION synchronously before getSession
    // resolves, so we let it drive the initial state and skip the redundant
    // setUser from getSession when a session is already known.
    let initialSessionResolved = false;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (import.meta.env.DEV) console.log("[AUTH] onAuthStateChange:", event, "hasSession=", !!session);
      if (event === "INITIAL_SESSION") {
        initialSessionResolved = true;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // After email confirmation or first sign-in, ensure profile name is synced
      // from auth user_metadata (set during signUp) to the profiles table.
      // IMPORTANT: defer Supabase calls out of this callback — running them
      // inside onAuthStateChange holds the auth mutex and deadlocks every
      // other Supabase query in the app.
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        const metaName = session.user.user_metadata?.name;
        const userId = session.user.id;
        setTimeout(async () => {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name")
              .eq("user_id", userId)
              .maybeSingle();
            if (!profile) {
              // New OAuth user — create profile so subsequent loads work correctly
              await supabase.from("profiles").upsert(
                { user_id: userId, name: metaName ?? null, onboarding_completed: false },
                { onConflict: "user_id" }
              );
            } else if (!profile.name && metaName) {
              await supabase
                .from("profiles")
                .update({ name: metaName })
                .eq("user_id", userId);
            }
          } catch { /* best-effort */ }
        }, 0);
      }

      // Redirect to login if signed out — only for protected /app/* routes
      if (event === "SIGNED_OUT" && !session) {
        const path = window.location.pathname;
        if (path.startsWith("/app")) {
          window.location.href = "/auth";
        }
      }
    });

    // getSession is a fallback: if INITIAL_SESSION already fired and resolved
    // the session, skip redundant state updates to prevent double fetchData.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (import.meta.env.DEV) console.log("[AUTH] getSession: done in", (performance.now() - t0).toFixed(0), "ms, hasSession=", !!session);
      if (!initialSessionResolved) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }).catch((err) => {
      if (import.meta.env.DEV) console.error("[AUTH] getSession: ERROR", err);
      if (!initialSessionResolved) setLoading(false);
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
