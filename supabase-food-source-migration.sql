-- Migration: widen food_log.source CHECK constraint
--
-- Root cause: the app writes source='ai-voice' (voice food logging, FoodCameraInput)
-- and source='template' (favorites/meal templates, useMealTemplates), but the original
-- CHECK only allowed ('manual','ai-photo','ai-text','barcode','recipe'). Postgres rejected
-- those inserts, so voice- and template-logged meals never persisted to the cloud.
--
-- This migration drops the old CHECK and recreates it including 'ai-voice' and 'template'.
-- Idempotent: safe to run multiple times.

DO $$
DECLARE
  con_name text;
BEGIN
  -- Find and drop the existing CHECK constraint on food_log.source (name may vary).
  FOR con_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'food_log'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%source%'
  LOOP
    EXECUTE format('ALTER TABLE public.food_log DROP CONSTRAINT %I', con_name);
  END LOOP;

  -- Recreate with the widened allowed set.
  ALTER TABLE public.food_log
    ADD CONSTRAINT food_log_source_check
    CHECK (source IN ('manual', 'ai-photo', 'ai-text', 'ai-voice', 'barcode', 'recipe', 'template'));
END $$;
