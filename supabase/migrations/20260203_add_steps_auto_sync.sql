-- Add steps_auto_sync preference to profiles table
-- Allows users to opt-in to Oura Ring automatic steps synchronization

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS steps_auto_sync BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_steps_auto_sync ON profiles(steps_auto_sync);

COMMENT ON COLUMN profiles.steps_auto_sync IS 'Enable automatic steps sync from Oura Ring (default: false, user opt-in required)';
