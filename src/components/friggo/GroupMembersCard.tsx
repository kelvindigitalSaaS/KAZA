import { useState, useEffect } from "react";
import { Users, Plus, Mail, Trash2, Loader2, RefreshCw, X, ChevronUp, ChevronDown } from "lucide-react";
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
import { SubAccountInvite } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const SESSION_KEY = "kaza_group_card_collapsed";

export function GroupMembersCard() {
  const { slots, filledSlots, maxSlots, inviteByEmail, removeMember, cancelInvite, resendInvite, loading } =
    useGroupMembers();
  const { language } = useLanguage();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{
    memberId: string;
    memberName: string;
  } | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<SubAccountInvite | null>(null);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) return saved === "true";
      return true; // Default to closed as requested
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, String(collapsed));
    } catch { /* ignore */ }
  }, [collapsed]);

  const l = {
    "pt-BR": {
      title: "Membros do Plano",
      slots: "slots",
      invite: "Convidar pessoa",
      inviteTitle: "Convidar pessoa",
      inviteDesc: "Digite o email da pessoa que deseja convidar para seu plano.",
      cancel: "Cancelar",
      send: "Enviar convite",
      sending: "Enviando...",
      removeTitle: "Remover membro",
      removeDesc: (name: string) => `Tem certeza que quer remover ${name} do plano? Ele voltará para o plano gratuito, mas sua conta continua ativa.`,
      remove: "Remover",
      cancelInviteTitle: "Cancelar convite",
      cancelInviteDesc: (email: string) => `Cancelar o convite enviado para ${email}? O link enviado por email deixará de funcionar.`,
      cancelInvite: "Cancelar convite",
      back: "Voltar",
      pending: "Aguardando confirmação",
      online: "Online",
      offline: "Offline",
      emailInvalid: "Email inválido",
      emailEmpty: "Digite um email",
    },
    en: {
      title: "Plan Members",
      slots: "slots",
      invite: "Invite person",
      inviteTitle: "Invite person",
      inviteDesc: "Enter the email of the person you want to invite to your plan.",
      cancel: "Cancel",
      send: "Send invite",
      sending: "Sending...",
      removeTitle: "Remove member",
      removeDesc: (name: string) => `Are you sure you want to remove ${name} from the plan? They will return to the free plan, but their account remains active.`,
      remove: "Remove",
      cancelInviteTitle: "Cancel invite",
      cancelInviteDesc: (email: string) => `Cancel the invite sent to ${email}? The link sent by email will stop working.`,
      cancelInvite: "Cancel invite",
      back: "Back",
      pending: "Awaiting confirmation",
      online: "Online",
      offline: "Offline",
      emailInvalid: "Invalid email",
      emailEmpty: "Enter an email",
    },
    es: {
      title: "Miembros del Plan",
      slots: "slots",
      invite: "Invitar persona",
      inviteTitle: "Invitar persona",
      inviteDesc: "Ingrese el email de la persona que desea invitar a su plan.",
      cancel: "Cancelar",
      send: "Enviar invitación",
      sending: "Enviando...",
      removeTitle: "Eliminar miembro",
      removeDesc: (name: string) => `¿Estás seguro de eliminar a ${name} del plan? Volverá al plan gratuito, pero su cuenta seguirá activa.`,
      remove: "Eliminar",
      cancelInviteTitle: "Cancelar invitación",
      cancelInviteDesc: (email: string) => `¿Cancelar la invitación enviada a ${email}? El enlace dejará de funcionar.`,
      cancelInvite: "Cancelar invitación",
      back: "Volver",
      pending: "Esperando confirmación",
      online: "En línea",
      offline: "Desconectado",
      emailInvalid: "Email inválido",
      emailEmpty: "Ingrese un email",
    },
  };
  const t = l[language as keyof typeof l] || l["pt-BR"];

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) {
      toast.error(t.emailEmpty);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t.emailInvalid);
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
    setResendingId(inviteId);
    await resendInvite(inviteId, email);
    setResendingId(null);
  };

  const handleCancelInvite = async () => {
    if (!cancelConfirm) return;
    await cancelInvite(cancelConfirm.id);
    setCancelConfirm(null);
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
      <div className="rounded-2xl bg-white dark:bg-[#11302c] border border-[#E2E1DC] dark:border-white/10 overflow-hidden shadow-sm">
        {/* Header — clickable to collapse/expand */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#E2E1DC] dark:border-white/10 transition-colors active:bg-[#F7F6F3] dark:active:bg-white/5"
        >
          <div className="h-8 w-8 rounded-xl bg-[#EDECEA] dark:bg-white/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-[#3D3D3A] dark:text-white/80" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-foreground">{t.title}</p>
            <p className="text-xs text-muted-foreground">
              {filledSlots} de {maxSlots} {t.slots}
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0 transition-transform duration-200">
            {collapsed ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Collapsible content */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            collapsed ? "max-h-0 opacity-0" : "max-h-[600px] opacity-100"
          )}
        >
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
                              {t.online}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{t.offline}</span>
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
                          {t.pending}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleResend(slot.invite!.id, slot.invite!.invited_email)}
                        disabled={resendingId === slot.invite.id}
                        title="Reenviar convite"
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                      >
                        {resendingId === slot.invite.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setCancelConfirm(slot.invite!)}
                        title="Cancelar convite"
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
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
                    <span className="text-xs font-semibold">{t.invite}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Dialog */}
      <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent className="rounded-[1.5rem] p-6 gap-6 sm:max-w-[425px]">
          <div className="space-y-2">
             <AlertDialogTitle className="text-xl font-black">{t.inviteTitle}</AlertDialogTitle>
             <AlertDialogDescription className="text-sm font-medium">
               {t.inviteDesc}
             </AlertDialogDescription>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50 pointer-events-none" />
              <Input
                type="email"
                inputMode="email"
                placeholder={language === "pt-BR" ? "email@exemplo.com" : "email@example.com"}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !inviting) handleInvite();
                }}
                className="h-14 pl-11 rounded-2xl bg-muted/40 border-2 border-transparent text-base font-bold shadow-sm focus-visible:ring-0 focus-visible:border-primary transition-all placeholder:font-medium"
              />
            </div>
            {inviteEmail && !inviteEmail.includes("@") && (
              <div className="flex flex-wrap gap-2 pt-1 animate-in slide-in-from-top-1 fade-in duration-200">
                {["@gmail.com", "@hotmail.com", "@outlook.com", "@icloud.com"].map(domain => (
                  <button
                    key={domain}
                    onClick={() => setInviteEmail(inviteEmail.trim() + domain)}
                    className="px-3.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[12px] font-bold tracking-wide transition-colors border border-primary/10 active:scale-[0.95]"
                  >
                    {domain}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <AlertDialogCancel className="h-12 rounded-xl font-bold border-2 border-muted hover:bg-muted/50 w-full sm:w-auto px-6 mt-0">{t.cancel}</AlertDialogCancel>
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="h-12 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 w-full sm:w-auto px-6 border-0"
            >
              {inviting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t.sending}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.send}
                </>
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>{t.removeTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {removeConfirm && t.removeDesc(removeConfirm.memberName)}
          </AlertDialogDescription>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700">
              {t.remove}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invite Confirmation Dialog */}
      <AlertDialog open={!!cancelConfirm} onOpenChange={() => setCancelConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>{t.cancelInviteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {cancelConfirm && t.cancelInviteDesc(cancelConfirm.invited_email)}
          </AlertDialogDescription>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>{t.back}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvite} className="bg-red-600 hover:bg-red-700">
              {t.cancelInvite}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
