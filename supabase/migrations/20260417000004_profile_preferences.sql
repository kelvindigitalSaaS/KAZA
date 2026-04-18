-- =============================================================================
-- Adiciona colunas de preferências de usuário na tabela profiles
-- Permite sync cross-device de tema e idioma
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference    TEXT DEFAULT 'system'
    CHECK (theme_preference IN ('light','dark','system')),
  ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'pt-BR'
    CHECK (language_preference IN ('pt-BR','en','es'));
