-- =====================================================
-- DISABLE TRIGGER - Let the app handle profile creation
-- Run this in Supabase SQL Editor to fix registration errors
-- =====================================================

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- The app will now create profiles when users first log in
-- This is more reliable than database triggers

-- =====================================================
-- ALSO: Disable email confirmation (optional but recommended for testing)
-- Go to: Supabase Dashboard > Authentication > Providers > Email
-- Uncheck "Confirm email"
-- =====================================================
