-- =====================================================
-- NUCLEAR FIX - Completely removes all triggers from auth.users
-- 
-- The error "Database error saving new user" happens because
-- Supabase has a trigger on auth.users that fails.
--
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- Step 1: Find and remove ALL triggers on auth.users
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname, tgrelid::regclass as table_name
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass
        AND NOT tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_record.tgname, trigger_record.table_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- Step 2: Drop the function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 3: Drop these specific triggers (just to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

-- Step 4: Check that no triggers exist anymore
-- Run this separately to verify:
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;
-- Should return 0 rows (empty)

-- =====================================================
-- IMPORTANT: After running this, you MUST also do:
--
-- 1. Go to Supabase Dashboard > Authentication > Providers > Email
-- 2. UNCHECK "Confirm email"
-- 3. Click SAVE
--
-- This is the most common cause of the error!
-- =====================================================
