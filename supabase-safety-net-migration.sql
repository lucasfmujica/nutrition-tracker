-- =====================================================
-- MODO ESCUDO (SAFETY NET) - DATABASE MIGRATION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add safety_net_enabled to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS safety_net_enabled BOOLEAN DEFAULT false;

-- Add is_safety_net_day to food_log table
ALTER TABLE food_log
ADD COLUMN IF NOT EXISTS is_safety_net_day BOOLEAN DEFAULT false;

-- Create index for efficient querying of safety net days
CREATE INDEX IF NOT EXISTS idx_food_log_safety_net
ON food_log(user_id, is_safety_net_day)
WHERE is_safety_net_day = true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.safety_net_enabled IS
'Indicates if Safety Net (Modo Escudo) maintenance mode is currently active';

COMMENT ON COLUMN food_log.is_safety_net_day IS
'Tags food entries logged during Safety Net days for analytics filtering';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'safety_net_enabled';

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'food_log' AND column_name = 'is_safety_net_day';

-- Success! Schema updated for Modo Escudo.
