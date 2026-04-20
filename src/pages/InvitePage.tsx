import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SubAccountOnboarding } from "@/components/friggo/SubAccountOnboarding";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export function InvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<{
    invited_email: string;
    master_name: string;
    group_id: string;
    plan_tier?: string;
    in_trial?: boolean;
  } | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    const processInvite = async () => {
      if (!token) {
        setError("Token não fornecido");
        setLoading(false);
        return;
      }

      try {
        // Fetch invite info (public RPC, doesn't require auth)
        const { data: invData, error: invError } = await supabase.rpc("get_invite_info", {
          invite_token: token,
        });

        if (invError) throw invError;
        if (!invData || invData.length === 0) {
          throw new Error("Convite inválido ou expirado");
        }

        const invite = invData[0];
        setInviteInfo({
          invited_email: invite.invited_email,
          master_name: invite.master_name,
          group_id: invite.group_id,
          plan_tier: invite.plan_tier,
          in_trial: invite.in_trial,
        });

        // If user is already logged in, accept the invite via backend
        if (user) {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          if (!accessToken) {
            throw new Error("Session token not found");
          }

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-invite`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ token }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to accept invite");
          }

          setShowWelcomeModal(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao processar convite");
      } finally {
        setLoading(false);
      }
    };

    processInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleWelcomeClose = () => {
    navigate("/app");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Processando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Erro ao processar convite</AlertDialogTitle>
          <AlertDialogDescription>{error}</AlertDialogDescription>
          <AlertDialogAction onClick={() => navigate("/app")}>Voltar</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // User is logged in - show welcome modal
  if (user && showWelcomeModal && inviteInfo) {
    return (
      <>
        <AlertDialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
          <AlertDialogContent>
            <AlertDialogTitle>Bem-vindo ao KAZA!</AlertDialogTitle>
            <AlertDialogDescription>
              Você foi convidado por <strong>{inviteInfo.master_name}</strong> e agora faz parte
              do plano KAZA {inviteInfo.plan_tier === "multiPRO" ? "MultiPRO" : inviteInfo.plan_tier}{inviteInfo.in_trial ? " (Teste)" : ""}. Você pode compartilhar o planejador de refeições,
              consumíveis e alertas com os membros do seu grupo.
            </AlertDialogDescription>
            <AlertDialogAction onClick={handleWelcomeClose}>Continuar</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // User is not logged in - show onboarding
  if (!user && inviteInfo) {
    return (
      <SubAccountOnboarding
        inviteToken={token!}
        invitedEmail={inviteInfo.invited_email}
        masterName={inviteInfo.master_name}
        groupId={inviteInfo.group_id}
        planTier={inviteInfo.plan_tier}
        inTrial={inviteInfo.in_trial}
        onComplete={() => navigate("/app/home")}
      />
    );
  }

  return null;
}
