/**
 * AccountSessionTracker
 *
 * Componente sem UI que monta no App e registra/mantém a sessão do dispositivo.
 * - Faz upsert em account_sessions ao logar.
 * - Verifica force_disconnected a cada 30s.
 * - Para multiPRO: sincroniza group_id da subscription.
 */

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getDeviceId(): string {
  const KEY = "friggo_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : generateUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

function getPlatform(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "web";
}

export function AccountSessionTracker() {
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription();
  const deviceId = useRef(getDeviceId());
  const platform = useRef(getPlatform());

  useEffect(() => {
    if (!user) return;

    const groupId = subscription?.groupId ?? null;

    // Upsert inicial
    const upsert = async () => {
      try {
        const { data, error } = await supabase
          .from("account_sessions")
          .upsert(
            {
              user_id: user.id,
              group_id: groupId,
              device_id: deviceId.current,
              platform: platform.current,
              is_connected: true,
              force_disconnected: false,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "user_id,device_id" }
          )
          .select("force_disconnected")
          .single();

        if (error) throw error;
        if ((data as any)?.force_disconnected) {
          signOut();
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("[AccountSessionTracker] Upsert session error:", err);
        }
      }
    };

    upsert();

    // Heartbeat: atualiza last_seen_at + verifica force_disconnect
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("account_sessions")
          .update({
            last_seen_at: new Date().toISOString(),
            is_connected: true,
            group_id: groupId,
          })
          .eq("user_id", user.id)
          .eq("device_id", deviceId.current)
          .select("force_disconnected")
          .single();

        if (error) throw error;
        if ((data as any)?.force_disconnected) {
          signOut();
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("[AccountSessionTracker] Heartbeat error:", err);
        }
      }
    }, 30 * 1000);

    // Ao desmontar / sair: marca desconectado
    return () => {
      clearInterval(interval);
      supabase
        .from("account_sessions")
        .update({ is_connected: false })
        .eq("user_id", user.id)
        .eq("device_id", deviceId.current)
        .then(() => {})
        .catch(() => {}); // silencia erro na limpeza
    };
  }, [user, subscription?.groupId, signOut]);

  return null;
}
