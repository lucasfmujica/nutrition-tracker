-- =====================================================
-- SMART HYDRATION & WEATHER LOGGING MIGRATION
-- =====================================================

-- 1. Add smart_hydration setting to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS smart_hydration BOOLEAN NOT NULL DEFAULT true;

-- 2. Add weather and target columns to water_log
ALTER TABLE water_log
  ADD COLUMN IF NOT EXISTS daily_target INTEGER, -- The calculated target for that day
  ADD COLUMN IF NOT EXISTS max_temp NUMERIC(4,1), -- Max temp for that day (e.g. 32.5)
  ADD COLUMN IF NOT EXISTS weather_unit TEXT CHECK (weather_unit IN ('C', 'F')),
  ADD COLUMN IF NOT EXISTS weather_location TEXT;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_water_log_date ON water_log(date);
