-- =====================================================
-- COMPLETE FIX FOR "Database error saving new user"
--
-- Run this ENTIRE script in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste > Run
-- =====================================================

-- Step 1: Drop ALL problematic triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 2: Make sure RLS policies allow the service role to insert
-- (The app will create profiles, not the database trigger)

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Recreate with proper permissions
-- Policy for authenticated users
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for service role (used by Supabase internally)
CREATE POLICY "Service role full access" ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 3: Also ensure other tables have service_role access
-- Weight History
DROP POLICY IF EXISTS "Service role full access weight" ON weight_history;
CREATE POLICY "Service role full access weight" ON weight_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Food Log
DROP POLICY IF EXISTS "Service role full access food" ON food_log;
CREATE POLICY "Service role full access food" ON food_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Workouts
DROP POLICY IF EXISTS "Service role full access workouts" ON workouts;
CREATE POLICY "Service role full access workouts" ON workouts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Steps Log
DROP POLICY IF EXISTS "Service role full access steps" ON steps_log;
CREATE POLICY "Service role full access steps" ON steps_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Oura Log
DROP POLICY IF EXISTS "Service role full access oura" ON oura_log;
CREATE POLICY "Service role full access oura" ON oura_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 4: Verify RLS is enabled (it should be, but just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE oura_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DONE! Now do this in Supabase Dashboard:
--
-- 1. Go to Authentication > Providers > Email
-- 2. DISABLE "Confirm email" (uncheck the box)
-- 3. Save
--
-- This allows users to sign up without email confirmation
-- =====================================================

-- Test query: This should return empty (no trigger)
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
