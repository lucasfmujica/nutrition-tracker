-- =====================================================
-- MIGRATE SAFETY NET TO PER-DAY ACTIVATION
-- Changes from global toggle to date-specific activation
-- =====================================================

-- Add new column for per-day safety net
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS safety_net_days TEXT[] DEFAULT '{}';

-- Migrate existing data: if safety_net_enabled is true, add today's date
UPDATE profiles
SET safety_net_days = ARRAY[to_char(CURRENT_DATE, 'YYYY-MM-DD')]
WHERE safety_net_enabled = true
AND (safety_net_days IS NULL OR safety_net_days = '{}');

-- Add column comment for documentation
COMMENT ON COLUMN profiles.safety_net_days IS 'Array of dates (YYYY-MM-DD) where Safety Net (Modo Escudo) is active';
