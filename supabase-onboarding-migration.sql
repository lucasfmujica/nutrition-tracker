-- Migration: Add onboarding fields to profiles table
-- Run this in Supabase SQL Editor

-- Add new columns for onboarding data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text DEFAULT 'male';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal_weight numeric(5,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_goal text DEFAULT 'maintain';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_days_per_week integer DEFAULT 4;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN profiles.gender IS 'User gender: male or female';
COMMENT ON COLUMN profiles.goal_weight IS 'Target weight in kg';
COMMENT ON COLUMN profiles.primary_goal IS 'lose, maintain, or gain';
COMMENT ON COLUMN profiles.training_days_per_week IS 'Number of training days per week';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user completed onboarding wizard';

-- Mark existing users as having completed onboarding (they already have data)
UPDATE profiles SET onboarding_completed = true WHERE onboarding_completed IS NULL OR onboarding_completed = false;
