-- =============================================================================
-- COMPREHENSIVE FIX — Single file to run in Supabase SQL Editor
-- Fixes ALL known runtime errors. Fully idempotent. Safe to run multiple times.
-- =============================================================================
-- Issues fixed:
--   1. recipes.id / meal_plans.recipe_id are UUID but app sends TEXT ("recipe-1")
--   2. garbage_reminders missing UNIQUE(home_id, user_id) for upsert
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 1a: Discover actual column names & types on recipes table, then convert
-- ─────────────────────────────────────────────────────────────────────────────

-- First, let's inspect what we're working with.
-- If recipes table doesn't exist yet, skip silently.
DO $$
DECLARE
  col_rec RECORD;
BEGIN
  -- Check if the recipes table even exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'recipes'
  ) THEN
    RAISE NOTICE 'Table public.recipes does not exist — skipping FIX 1a';
    RETURN;
  END IF;

  -- Log all columns for debugging
  FOR col_rec IN
    SELECT column_name, udt_name, is_nullable, column_default
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'recipes'
     ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'recipes.% → type=% nullable=% default=%',
      col_rec.column_name, col_rec.udt_name, col_rec.is_nullable, col_rec.column_default;
  END LOOP;

  -- Convert id column from uuid to text if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'recipes'
       AND column_name  = 'id'
       AND udt_name     = 'uuid'
  ) THEN
    -- Drop ALL foreign key constraints that reference recipes.id
    -- Use dynamic SQL to handle any constraint name
    DECLARE
      fk RECORD;
    BEGIN
      FOR fk IN
        SELECT con.conname, rel.relname AS src_table
          FROM pg_constraint con
          JOIN pg_class rel ON con.conrelid = rel.oid
          JOIN pg_class ref ON con.confrelid = ref.oid
         WHERE ref.relname = 'recipes'
           AND ref.relnamespace = 'public'::regnamespace
           AND con.contype = 'f'
      LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', fk.src_table, fk.conname);
        RAISE NOTICE 'Dropped FK: %.%', fk.src_table, fk.conname;
      END LOOP;
    END;

    -- Drop default before type change
    ALTER TABLE public.recipes ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.recipes ALTER COLUMN id SET DATA TYPE TEXT USING id::text;
    RAISE NOTICE 'recipes.id converted from UUID to TEXT ✓';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'recipes'
       AND column_name  = 'id'
       AND udt_name     = 'text'
  ) THEN
    RAISE NOTICE 'recipes.id is already TEXT — no change needed ✓';
  ELSE
    RAISE NOTICE 'recipes.id has unexpected type — please check manually';
  END IF;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 1b: Convert meal_plans.recipe_id from UUID to TEXT
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'meal_plans'
  ) THEN
    RAISE NOTICE 'Table public.meal_plans does not exist — skipping FIX 1b';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'meal_plans'
       AND column_name  = 'recipe_id'
       AND udt_name     = 'uuid'
  ) THEN
    -- Drop any FK from recipe_id before changing type
    DECLARE
      fk RECORD;
    BEGIN
      FOR fk IN
        SELECT con.conname
          FROM pg_constraint con
          JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
         WHERE con.conrelid = 'public.meal_plans'::regclass
           AND con.contype = 'f'
           AND att.attname = 'recipe_id'
      LOOP
        EXECUTE format('ALTER TABLE public.meal_plans DROP CONSTRAINT %I', fk.conname);
        RAISE NOTICE 'Dropped FK: meal_plans.%', fk.conname;
      END LOOP;
    END;

    ALTER TABLE public.meal_plans ALTER COLUMN recipe_id SET DATA TYPE TEXT USING recipe_id::text;
    RAISE NOTICE 'meal_plans.recipe_id converted from UUID to TEXT ✓';
  ELSE
    RAISE NOTICE 'meal_plans.recipe_id is already TEXT (or does not exist) ✓';
  END IF;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 1c: Convert user_recipe_favorites.recipe_id from UUID to TEXT
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'user_recipe_favorites'
  ) THEN
    RAISE NOTICE 'Table public.user_recipe_favorites does not exist — skipping FIX 1c';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'user_recipe_favorites'
       AND column_name  = 'recipe_id'
       AND udt_name     = 'uuid'
  ) THEN
    ALTER TABLE public.user_recipe_favorites
      ALTER COLUMN recipe_id SET DATA TYPE TEXT USING recipe_id::text;
    RAISE NOTICE 'user_recipe_favorites.recipe_id converted from UUID to TEXT ✓';
  ELSE
    RAISE NOTICE 'user_recipe_favorites.recipe_id is already TEXT (or does not exist) ✓';
  END IF;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 2: Ensure UNIQUE(home_id, user_id) constraint on garbage_reminders
-- Step 1: Clean orphaned rows (NULL home_id or user_id)
-- Step 2: Deduplicate any conflicts keeping the newest
-- Step 3: Set NOT NULL (safe now)
-- Step 4: Create UNIQUE index
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'garbage_reminders'
  ) THEN
    RAISE NOTICE 'Table public.garbage_reminders does not exist — skipping FIX 2';
    RETURN;
  END IF;

  -- Step 1: Remove orphan rows
  DELETE FROM public.garbage_reminders
   WHERE home_id IS NULL OR user_id IS NULL;
  RAISE NOTICE 'garbage_reminders: cleaned NULL rows ✓';

  -- Step 2: Remove duplicates keeping the most recently updated per (home_id, user_id)
  DELETE FROM public.garbage_reminders
   WHERE ctid NOT IN (
     SELECT DISTINCT ON (home_id, user_id) ctid
       FROM public.garbage_reminders
      ORDER BY home_id, user_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST
   );
  RAISE NOTICE 'garbage_reminders: deduplicated ✓';

  -- Step 3: Set NOT NULL
  BEGIN
    ALTER TABLE public.garbage_reminders ALTER COLUMN home_id SET NOT NULL;
    ALTER TABLE public.garbage_reminders ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE 'garbage_reminders: SET NOT NULL ✓';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'garbage_reminders: NOT NULL already set or skipped: %', SQLERRM;
  END;
END;
$$;

-- Step 4: Create unique index (runs outside DO block for IF NOT EXISTS support)
CREATE UNIQUE INDEX IF NOT EXISTS garbage_reminders_home_user_unique_idx
  ON public.garbage_reminders (home_id, user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- DONE — All fixes applied. Verify with:
--
--   SELECT column_name, udt_name
--     FROM information_schema.columns
--    WHERE table_name IN ('recipes','meal_plans','user_recipe_favorites')
--      AND column_name IN ('id','recipe_id')
--    ORDER BY table_name;
--
--   SELECT indexname FROM pg_indexes
--    WHERE tablename = 'garbage_reminders';
-- ─────────────────────────────────────────────────────────────────────────────
