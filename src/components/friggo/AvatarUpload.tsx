/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useKaza } from "@/contexts/FriggoContext";
import { Camera, Loader2, User, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentUrl?: string | null;
  size?: number;
  className?: string;
}

export default function AvatarUpload({ currentUrl, size = 100, className }: AvatarUploadProps) {
  const { user } = useAuth();
  const { updateProfile } = useKaza();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Você deve selecionar uma imagem para upload.");
      }

      if (!user) throw new Error("Usuário não autenticado.");


      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      // Ensure the uploaded object lives under a folder named with the user id
      // to satisfy the RLS policy in Supabase (storage.foldername(name)[1] === auth.uid()).
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
      const filePath = `${user.id}/${Date.now()}-${safeName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Friendly guidance when the error originates from RLS / permissions
        const message = String(uploadError.message || uploadError.error || uploadError);
        if (message.toLowerCase().includes("row-level") || message.toLowerCase().includes("policy")) {
          toast.error("Permissão negada: o upload foi bloqueado pela política do storage. O arquivo deve ser enviado para a pasta com seu user id (ex: userId/avatar.png).");
          if (import.meta.env.DEV) console.error("[DEV] Upload error (RLS):", uploadError);
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath as string);
      const publicUrl = (publicData as any)?.publicUrl;

      // Update profile
      await updateProfile({ avatarUrl: publicUrl });
      
      toast.success("Foto de perfil atualizada!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload da imagem.");
      if (import.meta.env.DEV) console.error("[DEV] Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("relative group rounded-full", className)}>
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-full bg-muted shadow-xl"
        style={{ width: size, height: size }}
      >
        {currentUrl ? (
          <img 
            src={currentUrl} 
            alt="Profile" 
            className="h-full w-full object-cover transition-transform group-hover:scale-110" 
          />
        ) : (
          <User className="h-1/2 w-1/2 text-muted-foreground" />
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        <button
          onClick={triggerInput}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0"
        >
          <Camera className="h-8 w-8 text-white" />
        </button>
      </div>

      <button
        onClick={triggerInput}
        className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 transition-all hover:scale-110 active:scale-90"
      >
        <Camera className="h-5 w-5" />
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
