-- Migration: Create body_measurements table
-- Date: 2026-02-02
-- Purpose: Store comprehensive body measurements for tracking physical changes

-- Create body_measurements table
CREATE TABLE IF NOT EXISTS body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,

    -- Upper body measurements (in cm)
    chest NUMERIC(5, 2),
    shoulders NUMERIC(5, 2),
    biceps_left NUMERIC(5, 2),
    biceps_right NUMERIC(5, 2),
    forearm_left NUMERIC(5, 2),
    forearm_right NUMERIC(5, 2),

    -- Core measurements (in cm)
    waist NUMERIC(5, 2),
    hips NUMERIC(5, 2),
    neck NUMERIC(5, 2),

    -- Lower body measurements (in cm)
    thigh_left NUMERIC(5, 2),
    thigh_right NUMERIC(5, 2),
    calf_left NUMERIC(5, 2),
    calf_right NUMERIC(5, 2),

    -- Body composition
    body_fat_percent NUMERIC(4, 2),

    -- Additional info
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements(user_id);

-- Add RLS policies
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own measurements
CREATE POLICY "Users can view own body measurements"
    ON body_measurements
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own measurements
CREATE POLICY "Users can insert own body measurements"
    ON body_measurements
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own measurements
CREATE POLICY "Users can update own body measurements"
    ON body_measurements
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own measurements
CREATE POLICY "Users can delete own body measurements"
    ON body_measurements
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE body_measurements IS 'Stores comprehensive body measurements for tracking physical changes beyond weight';
COMMENT ON COLUMN body_measurements.date IS 'Date of measurement in YYYY-MM-DD format (Argentina timezone)';
COMMENT ON COLUMN body_measurements.chest IS 'Chest circumference in cm';
COMMENT ON COLUMN body_measurements.waist IS 'Waist circumference in cm';
COMMENT ON COLUMN body_measurements.hips IS 'Hip circumference in cm';
COMMENT ON COLUMN body_measurements.body_fat_percent IS 'Body fat percentage';
