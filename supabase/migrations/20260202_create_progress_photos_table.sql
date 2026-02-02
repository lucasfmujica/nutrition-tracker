-- Migration: Create progress_photos table
-- Date: 2026-02-02
-- Purpose: Store user progress photos with metadata for body transformation tracking

-- Create progress_photos table
CREATE TABLE IF NOT EXISTS progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    angle TEXT, -- 'front', 'side', 'back', 'other'
    weight NUMERIC(5, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_date ON progress_photos(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON progress_photos(user_id);

-- Add RLS policies
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own photos
CREATE POLICY "Users can view own progress photos"
    ON progress_photos
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own photos
CREATE POLICY "Users can insert own progress photos"
    ON progress_photos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own photos
CREATE POLICY "Users can update own progress photos"
    ON progress_photos
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own progress photos"
    ON progress_photos
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE progress_photos IS 'Stores user progress photos for body transformation tracking';
COMMENT ON COLUMN progress_photos.date IS 'Date of photo in YYYY-MM-DD format (Argentina timezone)';
COMMENT ON COLUMN progress_photos.angle IS 'Photo angle: front, side, back, or other';
COMMENT ON COLUMN progress_photos.weight IS 'User weight in kg at time of photo';
