-- Migration: Add multi-user support columns to profiles table
-- Date: 2026-01-23

-- Add new profile columns for multi-user support
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_oura_ring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS oura_personal_token TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ios_shortcuts_configured BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.has_oura_ring IS 'Whether user has an Oura Ring for biometric sync';
COMMENT ON COLUMN profiles.oura_personal_token IS 'User personal access token for Oura API (encrypted)';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed onboarding wizard';
COMMENT ON COLUMN profiles.tutorial_completed IS 'Whether user has completed the guided tutorial';
COMMENT ON COLUMN profiles.ios_shortcuts_configured IS 'Whether user has set up iOS Shortcuts for Apple Health sync';
