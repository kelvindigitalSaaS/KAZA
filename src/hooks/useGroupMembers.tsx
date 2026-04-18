import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubAccountMember, SubAccountInvite } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface GroupMemberWithStatus extends SubAccountMember {
  isOnline?: boolean;
}

interface GroupSlot {
  type: "filled" | "pending" | "empty";
  member?: GroupMemberWithStatus;
  invite?: SubAccountInvite;
}

export function useGroupMembers() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [members, setMembers] = useState<GroupMemberWithStatus[]>([]);
  const [pendingInvites, setPendingInvites] = useState<SubAccountInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const groupId = subscription?.groupId;

  // Fetch members and invites
  useEffect(() => {
    if (!groupId || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch members
        const { data: membersData } = await supabase
          .from("sub_account_members")
          .select("*")
          .eq("group_id", groupId);

        // Fetch pending invites
        const { data: invitesData } = await supabase
          .from("sub_account_invites")
          .select("*")
          .eq("group_id", groupId)
          .eq("status", "pending");

        // Fetch online status from account_sessions
        if (membersData) {
          const { data: sessionsData } = await supabase
            .from("account_sessions")
            .select("user_id, is_connected, last_seen_at")
            .eq("group_id", groupId);

          const onlineMap = new Map(
            (sessionsData || []).map((s) => [
              s.user_id,
              s.is_connected && new Date(s.last_seen_at).getTime() > Date.now() - 2 * 60000,
            ])
          );

          setMembers(
            membersData.map((m) => ({
              ...m,
              isOnline: onlineMap.get(m.user_id) ?? false,
            }))
          );
        }

        setPendingInvites(invitesData || []);
      } catch (err) {
        console.error("Error fetching group members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime updates
    const membersChannel = supabase
      .channel(`group_members_${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sub_account_members",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMember = payload.new as SubAccountMember;
            setMembers((prev) => [...prev, { ...newMember, isOnline: false }]);
            // Notify master that someone joined
            const name = newMember.display_name || "Uma pessoa";
            toast.success(`${name} se juntou ao seu plano!`);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as SubAccountMember;
            setMembers((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as SubAccountMember;
            setMembers((prev) => prev.filter((m) => m.id !== deleted.id));
          }
        }
      )
      .subscribe();

    const invitesChannel = supabase
      .channel(`group_invites_${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sub_account_invites",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPendingInvites((prev) => [...prev, payload.new as SubAccountInvite]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as SubAccountInvite;
            if (updated.status !== "pending") {
              setPendingInvites((prev) => prev.filter((i) => i.id !== updated.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(invitesChannel);
    };
  }, [groupId, user]);

  // Calculate slots
  const maxSlots = subscription?.subscription?.max_members ?? 1;
  const filledSlots = members.filter((m) => m.is_active).length;
  const pendingSlots = pendingInvites.filter((i) => i.status === "pending").length;
  const freeSlots = maxSlots - filledSlots - pendingSlots;

  // Build slots array
  const slots: GroupSlot[] = [
    ...members
      .filter((m) => m.is_active)
      .map((m) => ({ type: "filled" as const, member: m })),
    ...pendingInvites
      .filter((i) => i.status === "pending")
      .map((i) => ({ type: "pending" as const, invite: i })),
    ...Array(Math.max(0, freeSlots))
      .fill(null)
      .map(() => ({ type: "empty" as const })),
  ];

  const inviteByEmail = useCallback(
    async (email: string) => {
      if (!user) {
        toast.error("Você precisa estar logado para enviar convites.");
        return false;
      }

      try {
        // Pass group_id if we already have it; the edge function will
        // auto-create a group for multiPRO users who don't have one yet.
        const body: Record<string, string> = { invited_email: email };
        if (groupId) body.group_id = groupId;

        const { data, error } = await supabase.functions.invoke("send-invite-email", {
          body,
        });

        if (error) {
          let errorMsg = "Erro ao enviar convite";
          
          // Try to extract JSON from FunctionsHttpError context
          if (error && typeof error === 'object' && 'context' in error) {
            try {
              const res = (error as any).context as Response;
              // Clone the response so we don't lock the stream if already read
              const errorBody = await res.clone().json();
              if (errorBody && errorBody.error) {
                errorMsg = errorBody.error;
              }
            } catch (e) {
              // Ignore if not JSON
            }
          }

          if (errorMsg === "Erro ao enviar convite") {
            const msg =
              typeof error === "object" && error !== null
                ? (error as any).message ?? ""
                : String(error);

            if (msg.includes("Unauthorized")) {
              errorMsg = "Você não tem permissão para enviar convites";
            } else if (msg.includes("já foi convidado") || msg.includes("já possui um convite")) {
              errorMsg = "Este email já tem um convite pendente";
            } else if (msg.includes("plano PRO")) {
              errorMsg = "Você precisa de um plano PRO para convidar membros";
            } else if (msg && msg !== "FunctionsHttpError: Edge Function returned a non-2xx status code") {
              errorMsg = msg;
            }
          }

          toast.error(errorMsg);
          console.error("Error sending invite:", error);
          return false;
        }

        if (!data?.success) {
          toast.error("Erro ao enviar convite. Tente novamente.");
          return false;
        }

        toast.success(`Convite enviado para ${email}! ✓`);
        return true;
      } catch (err) {
        console.error("Error sending invite:", err);
        toast.error(err instanceof Error ? err.message : "Erro ao enviar convite");
        return false;
      }
    },
    [groupId, user]
  );

  const removeMember = useCallback(
    async (memberId: string, memberName: string) => {
      if (!groupId || !user) return;

      try {
        // Send notification to member before removing
        await supabase.functions.invoke("send-push-notification", {
          body: {
            group_id: groupId,
            title: "Removido do plano",
            body: `Você foi removido do plano Trio. Sua conta continua ativa normalmente.`,
            data: {
              type: "member-removed",
            },
            exclude_user_id: user.id,
          },
        }).catch(() => {}); // Best effort

        // Remove member
        const { error } = await supabase
          .from("sub_account_members")
          .update({ is_active: false })
          .eq("id", memberId)
          .eq("group_id", groupId);

        if (error) throw error;

        toast.success(`${memberName} foi removido do plano`);
      } catch (err) {
        console.error("Error removing member:", err);
        toast.error("Erro ao remover membro");
      }
    },
    [groupId, user]
  );

  return {
    members,
    pendingInvites,
    slots,
    loading,
    filledSlots,
    freeSlots,
    maxSlots,
    inviteByEmail,
    removeMember,
  };
}
