-- =============================================================================
-- FRIGGO — FINAL SECURITY AUDIT & SCHEMA UNIFICATION
-- Data: 2026-04-20
-- Unifica a tabela garbage_reminders e reforça RLS em todas as tabelas.
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. GARBAGE_REMINDERS: Unificação de Esquema
-- ═════════════════════════════════════════════════════════════════════════════

-- Garantir colunas necessárias para o modelo por usuário
ALTER TABLE public.garbage_reminders 
  ADD COLUMN IF NOT EXISTS user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- Ajustar a restrição de unicidade para permitir lembretes por usuário em cada casa
-- Primeiro removemos PK ou UNIQUE antigo se existir
DO $$
BEGIN
    -- Se home_id era a PK, removemos a restrição de PK
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'garbage_reminders_pkey' 
          AND conrelid = 'public.garbage_reminders'::regclass
    ) THEN
        ALTER TABLE public.garbage_reminders DROP CONSTRAINT garbage_reminders_pkey;
        -- Adicionamos um ID serial ou uuid como PK se não tiver
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='garbage_reminders' AND column_name='id') THEN
            ALTER TABLE public.garbage_reminders ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        ELSE
            ALTER TABLE public.garbage_reminders ADD PRIMARY KEY (id);
        END IF;
    END IF;
END $$;

-- Garantir o UNIQUE composto
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'garbage_reminders_home_user_unique' 
          AND conrelid = 'public.garbage_reminders'::regclass
    ) THEN
        ALTER TABLE public.garbage_reminders ADD CONSTRAINT garbage_reminders_home_user_unique UNIQUE (home_id, user_id);
    END IF;
END $$;

-- Habilitar RLS e adicionar política
ALTER TABLE public.garbage_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS garbage_rem_owner ON public.garbage_reminders;
CREATE POLICY garbage_rem_owner ON public.garbage_reminders
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. POLÍTICAS DE SEGURANÇA (RLS) - AUDITORIA
-- ═════════════════════════════════════════════════════════════════════════════

-- SUB_ACCOUNT_INVITES
ALTER TABLE public.sub_account_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS master_manage_invites ON public.sub_account_invites;
CREATE POLICY master_manage_invites ON public.sub_account_invites
  FOR ALL USING (master_user_id = auth.uid());

-- SUB_ACCOUNT_MEMBERS
ALTER TABLE public.sub_account_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sam_own_access ON public.sub_account_members;
CREATE POLICY sam_own_access ON public.sub_account_members
  FOR ALL USING (user_id = auth.uid());

-- PROFILES: Reforçar privacidade (apenas o dono)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profile_owner_only ON public.profiles;
CREATE POLICY profile_owner_only ON public.profiles
  FOR ALL USING (user_id = auth.uid());

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. STORAGE POLICIES (Avatars)
-- ═════════════════════════════════════════════════════════════════════════════

-- Política para os usuários lerem avatares (todos podem ver fotos dos membros da casa)
DROP POLICY IF EXISTS "Avatars are public" ON storage.objects;
CREATE POLICY "Avatars are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Política para o usuário enviar sua própria foto de perfil
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- FIM
-- ═════════════════════════════════════════════════════════════════════════════
