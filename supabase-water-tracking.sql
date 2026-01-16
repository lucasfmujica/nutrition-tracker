-- =====================================================
-- WATER TRACKING TABLE
-- Run this in Supabase SQL Editor to add water tracking
-- =====================================================

-- Create water_log table
CREATE TABLE IF NOT EXISTS water_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  glasses INTEGER NOT NULL DEFAULT 0, -- Number of glasses (250ml each)
  ml INTEGER NOT NULL DEFAULT 0, -- Total ml for the day
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_water_log_user_date ON water_log(user_id, date DESC);

-- Enable RLS
ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own water log" ON water_log
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own water" ON water_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own water" ON water_log
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own water" ON water_log
  FOR DELETE USING (auth.uid() = user_id);

-- Service role access
CREATE POLICY "Service role full access water" ON water_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_water_log_updated_at
  BEFORE UPDATE ON water_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
