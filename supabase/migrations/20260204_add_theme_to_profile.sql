-- Add theme column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'system';

-- Update RLS policies if needed (though usually profiles policies cover updates to own profile)
-- Ensure check constraint for valid values
ALTER TABLE profiles
ADD CONSTRAINT profiles_theme_check
CHECK (theme IN ('light', 'dark', 'system'));
