/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useAccountSession
 *
 * Rastreia a sessão ativa do dispositivo e, para planos multiPRO,
 * lista os membros do grupo com status de conexão em tempo real.
 *
 * - Ao montar (com usuário logado): faz upsert em account_sessions.
 * - Atualiza last_seen_at a cada 2 minutos.
 * - Verifica force_disconnected — se true, faz signOut automaticamente.
 * - Para conta mestre (multiPRO): expõe disconnectMember(userId).
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SubAccountMember, AccountSession } from "@/integrations/supabase/types";

// Gera/recupera um device_id estável por dispositivo
function getDeviceId(): string {
  const KEY = "friggo_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
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

export interface GroupMemberStatus extends SubAccountMember {
  /** Sessões ativas deste membro (pode ter múltiplos dispositivos) */
  sessions: Pick<AccountSession, "id" | "device_id" | "device_name" | "platform" | "is_connected" | "last_seen_at">[];
  isOnline: boolean;
}

export interface UseAccountSessionReturn {
  /** Sessão do dispositivo atual */
  currentSession: AccountSession | null;
  /** Membros do grupo (apenas multiPRO) */
  groupMembers: GroupMemberStatus[];
  /** Se o usuário atual é a conta mestre */
  isGroupMaster: boolean;
  /** ID do grupo multiPRO (null se não for multiPRO) */
  groupId: string | null;
  loading: boolean;
  /** Master desconecta um membro à força (invalida todas as sessões dele no grupo) */
  disconnectMember: (targetUserId: string) => Promise<void>;
  /** Conta mestre pode re-conectar (desfaz force_disconnect) */
  reconnectMember: (targetUserId: string) => Promise<void>;
}

export function useAccountSession(groupId: string | null = null): UseAccountSessionReturn {
  const { user, signOut } = useAuth();
  const [currentSession, setCurrentSession] = useState<AccountSession | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberStatus[]>([]);
  const [isGroupMaster, setIsGroupMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const deviceId = useRef(getDeviceId());
  const platform = useRef(getPlatform());

  // ── Upsert da sessão local ──────────────────────────────────────────
  const upsertSession = useCallback(async (gid: string | null) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("account_sessions")
        .upsert(
          {
            user_id: user.id,
            group_id: gid,
            device_id: deviceId.current,
            platform: platform.current,
            is_connected: true,
            force_disconnected: false,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "user_id,device_id" }
        )
        .select()
        .single();

      if (!error && data) {
        setCurrentSession(data as AccountSession);

        // Verifica se foi force-disconnected por outro membro
        if ((data as AccountSession).force_disconnected) {
          await signOut();
          return;
        }
      }
    } catch {
      // silently fail — não crítico
    }
  }, [user, signOut]);

  // ── Buscar membros do grupo e suas sessões ──────────────────────────
  const fetchGroupData = useCallback(async (gid: string) => {
    if (!user) return;
    try {
      // Verifica se é master
      const { data: groupData } = await supabase
        .from("sub_account_groups")
        .select("master_user_id")
        .eq("id", gid)
        .maybeSingle();
      const isMaster = (groupData as any)?.master_user_id === user.id;
      setIsGroupMaster(isMaster);

      // Busca membros
      const { data: members } = await supabase
        .from("sub_account_members")
        .select("*")
        .eq("group_id", gid)
        .eq("is_active", true);

      if (!members || members.length === 0) {
        setGroupMembers([]);
        return;
      }

      const memberIds = members.map((m: any) => m.user_id);

      // Busca sessões dos membros
      const { data: sessions } = await supabase
        .from("account_sessions")
        .select("id, user_id, device_id, device_name, platform, is_connected, last_seen_at")
        .in("user_id", memberIds)
        .eq("group_id", gid);

      const sessionsByUser: Record<string, any[]> = {};
      (sessions || []).forEach((s: any) => {
        if (!sessionsByUser[s.user_id]) sessionsByUser[s.user_id] = [];
        sessionsByUser[s.user_id].push(s);
      });

      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
      const membersWithStatus: GroupMemberStatus[] = members.map((m: any) => {
        const userSessions = sessionsByUser[m.user_id] || [];
        const isOnline = userSessions.some(
          (s) => s.is_connected && new Date(s.last_seen_at) > twoMinAgo
        );
        return {
          ...m,
          sessions: userSessions,
          isOnline,
        };
      });

      setGroupMembers(membersWithStatus);
    } catch {
      // silently fail
    }
  }, [user]);

  // ── Efeito principal: upsert + fetch grupo ─────────────────────────
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const init = async () => {
      await upsertSession(groupId);
      if (groupId && mounted) {
        await fetchGroupData(groupId);
      }
      if (mounted) setLoading(false);
    };

    init();

    // Atualiza last_seen_at a cada 2 minutos
    const heartbeat = setInterval(() => {
      if (!user) return;
      supabase
        .from("account_sessions")
        .update({ last_seen_at: new Date().toISOString(), is_connected: true })
        .eq("user_id", user.id)
        .eq("device_id", deviceId.current)
        .then(({ data }) => {
          // Verifica force_disconnect no retorno
          if (Array.isArray(data) && data[0]?.force_disconnected) {
            signOut();
          }
        });
    }, 2 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(heartbeat);
      // Marca sessão como desconectada ao sair
      if (user) {
        supabase
          .from("account_sessions")
          .update({ is_connected: false })
          .eq("user_id", user.id)
          .eq("device_id", deviceId.current)
          .then(() => {});
      }
    };
  }, [user, groupId, upsertSession, fetchGroupData, signOut]);

  // ── Realtime: escuta mudanças nas sessões do grupo ──────────────────
  useEffect(() => {
    if (!groupId || !user) return;

    const channel = supabase
      .channel(`group-sessions-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "account_sessions",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          // Verifica force_disconnect para o usuário atual
          const row = payload.new as AccountSession;
          if (row?.user_id === user.id && row?.force_disconnected) {
            signOut();
            return;
          }
          // Atualiza lista de membros
          fetchGroupData(groupId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user, fetchGroupData, signOut]);

  // ── Ações do master ─────────────────────────────────────────────────
  const disconnectMember = useCallback(async (targetUserId: string) => {
    if (!isGroupMaster || !groupId) return;
    await supabase
      .from("account_sessions")
      .update({ force_disconnected: true, is_connected: false })
      .eq("user_id", targetUserId)
      .eq("group_id", groupId);
    // Atualiza local
    await fetchGroupData(groupId);
  }, [isGroupMaster, groupId, fetchGroupData]);

  const reconnectMember = useCallback(async (targetUserId: string) => {
    if (!isGroupMaster || !groupId) return;
    await supabase
      .from("account_sessions")
      .update({ force_disconnected: false })
      .eq("user_id", targetUserId)
      .eq("group_id", groupId);
    await fetchGroupData(groupId);
  }, [isGroupMaster, groupId, fetchGroupData]);

  return {
    currentSession,
    groupMembers,
    isGroupMaster,
    groupId,
    loading,
    disconnectMember,
    reconnectMember,
  };
}
