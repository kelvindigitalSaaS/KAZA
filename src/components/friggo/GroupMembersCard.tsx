import { useState } from "react";
import { Users, Plus, Mail, Trash2, Loader2, RefreshCw, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function GroupMembersCard() {
  const { slots, filledSlots, maxSlots, inviteByEmail, removeMember, cancelInvite, loading } =
    useGroupMembers();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<{
    memberId: string;
    memberName: string;
  } | null>(null);

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) {
      toast.error("Digite um email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email inválido");
      return;
    }

    setInviting(true);
    const success = await inviteByEmail(email);
    setInviting(false);

    if (success) {
      setInviteEmail("");
      setShowInviteDialog(false);
    }
  };

  const handleRemove = async () => {
    if (!removeConfirm) return;
    await removeMember(removeConfirm.memberId, removeConfirm.memberName);
    setRemoveConfirm(null);
  };

  const handleResend = async (inviteId: string, email: string) => {
    // Delete the old invite
    await cancelInvite(inviteId);
    // Send a new one
    await inviteByEmail(email);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.08] p-4 flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.08] overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.03] dark:border-white/[0.05]">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Membros do Plano</p>
            <p className="text-xs text-muted-foreground">
              {filledSlots} de {maxSlots} slots
            </p>
          </div>
        </div>

        {/* Slots */}
        <div className="divide-y divide-black/[0.03] dark:divide-white/[0.05]">
          {slots.map((slot, idx) => (
            <div key={idx} className="px-4 py-3 flex items-center justify-between gap-3">
              {slot.type === "filled" && slot.member && (
                <>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      {(slot.member.display_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {slot.member.display_name || slot.member.user_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {slot.member.isOnline ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            Online
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Offline</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {slot.member.role === "member" && (
                    <button
                      onClick={() =>
                        setRemoveConfirm({
                          memberId: slot.member!.id,
                          memberName: slot.member!.display_name || "Membro",
                        })
                      }
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}

              {slot.type === "pending" && slot.invite && (
                <>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {slot.invite.invited_email}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                        Convite enviado
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleResend(slot.invite!.id, slot.invite!.invited_email)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      title="Reenviar convite"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => cancelInvite(slot.invite!.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Cancelar convite"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {slot.type === "empty" && (
                <button
                  onClick={() => setShowInviteDialog(true)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed",
                    "text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5",
                    "transition-colors"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs font-semibold">Convidar pessoa</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite Dialog */}
      <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Convidar pessoa</AlertDialogTitle>
          <AlertDialogDescription>
            Digite o email da pessoa que deseja convidar para seu plano.
          </AlertDialogDescription>

          <div className="py-4">
            <Input
              type="email"
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !inviting) handleInvite();
              }}
              className="h-11"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {inviting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                "Enviar convite"
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Remover membro</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que quer remover <strong>{removeConfirm?.memberName}</strong> do plano?
            Ele voltará para o plano gratuito, mas sua conta continua ativa.
          </AlertDialogDescription>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
