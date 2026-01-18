-- =====================================================
-- NUTRITION TRACKER - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- Stores user profile data (height, weight targets, etc.)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  height DECIMAL(5,2) NOT NULL DEFAULT 170,
  current_weight DECIMAL(5,2) NOT NULL DEFAULT 80,
  target_weight DECIMAL(5,2) NOT NULL DEFAULT 75,
  age INTEGER NOT NULL DEFAULT 25,
  activity_level TEXT NOT NULL DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT NOT NULL DEFAULT 'cut' CHECK (goal IN ('cut', 'maintain', 'bulk')),
  -- Custom nutrition targets
  target_calories INTEGER NOT NULL DEFAULT 2100,
  target_protein INTEGER NOT NULL DEFAULT 170,
  target_carbs INTEGER NOT NULL DEFAULT 180,
  target_fat INTEGER NOT NULL DEFAULT 70,
  target_fiber INTEGER NOT NULL DEFAULT 30,
  training_day_calories_bonus INTEGER NOT NULL DEFAULT 200,
  training_day_carbs INTEGER NOT NULL DEFAULT 220,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- 2. WEIGHT HISTORY TABLE
-- Daily weight tracking
-- =====================================================
CREATE TABLE weight_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =====================================================
-- 3. FOOD LOG TABLE
-- Food entries with macro tracking and AI source info
-- =====================================================
CREATE TABLE food_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time TIME,
  meal TEXT NOT NULL CHECK (meal IN ('Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack', 'Pre-entreno', 'Post-entreno')),
  name TEXT NOT NULL,
  description TEXT,
  calories INTEGER NOT NULL DEFAULT 0,
  protein DECIMAL(6,2) NOT NULL DEFAULT 0,
  carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
  fat DECIMAL(6,2) NOT NULL DEFAULT 0,
  fiber DECIMAL(6,2) NOT NULL DEFAULT 0,
  -- AI tracking fields
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai-photo', 'ai-text', 'barcode', 'recipe')),
  reviewed BOOLEAN NOT NULL DEFAULT true,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. WORKOUTS TABLE
-- Workout sessions with exercises stored as JSONB
-- =====================================================
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('gym', 'cardio', 'sport', 'other')),
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0, -- in minutes
  calories INTEGER NOT NULL DEFAULT 0,
  volume INTEGER DEFAULT 0, -- total volume in kg
  exercises JSONB DEFAULT '[]'::jsonb, -- array of exercise objects
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. STEPS LOG TABLE
-- Daily step count
-- =====================================================
CREATE TABLE steps_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  steps INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =====================================================
-- 6. OURA LOG TABLE
-- Oura Ring daily wellness metrics
-- =====================================================
CREATE TABLE oura_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100),
  readiness_score INTEGER CHECK (readiness_score >= 0 AND readiness_score <= 100),
  activity_score INTEGER CHECK (activity_score >= 0 AND activity_score <= 100),
  hrv INTEGER, -- Heart Rate Variability in ms
  resting_hr INTEGER, -- Resting heart rate in BPM
  sleep_hours DECIMAL(4,2), -- Total sleep in hours
  deep_sleep_mins INTEGER,
  rem_sleep_mins INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_weight_history_user_date ON weight_history(user_id, date DESC);
CREATE INDEX idx_food_log_user_date ON food_log(user_id, date DESC);
CREATE INDEX idx_workouts_user_date ON workouts(user_id, date DESC);
CREATE INDEX idx_steps_log_user_date ON steps_log(user_id, date DESC);
CREATE INDEX idx_oura_log_user_date ON oura_log(user_id, date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Users can only access their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE oura_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Weight history policies
CREATE POLICY "Users can view own weight history" ON weight_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight" ON weight_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weight" ON weight_history
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight" ON weight_history
  FOR DELETE USING (auth.uid() = user_id);

-- Food log policies
CREATE POLICY "Users can view own food log" ON food_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food" ON food_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food" ON food_log
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food" ON food_log
  FOR DELETE USING (auth.uid() = user_id);

-- Workouts policies
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Steps log policies
CREATE POLICY "Users can view own steps" ON steps_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own steps" ON steps_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own steps" ON steps_log
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own steps" ON steps_log
  FOR DELETE USING (auth.uid() = user_id);

-- Oura log policies
CREATE POLICY "Users can view own oura data" ON oura_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own oura data" ON oura_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own oura data" ON oura_log
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own oura data" ON oura_log
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_log_updated_at
  BEFORE UPDATE ON food_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Auto-create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- Done! Your database is ready for the nutrition tracker.
-- =====================================================
