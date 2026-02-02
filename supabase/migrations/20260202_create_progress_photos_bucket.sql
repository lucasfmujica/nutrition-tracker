-- Migration: Create storage bucket for progress photos
-- Date: 2026-02-02
-- Purpose: Configure Supabase Storage bucket for user progress photos

-- Create storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for the bucket
-- Policy: Users can view all files in the bucket (public bucket)
CREATE POLICY IF NOT EXISTS "Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'progress-photos');

-- Policy: Users can upload their own photos
CREATE POLICY IF NOT EXISTS "Users can upload own photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'progress-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: Users can update their own photos
CREATE POLICY IF NOT EXISTS "Users can update own photos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'progress-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: Users can delete their own photos
CREATE POLICY IF NOT EXISTS "Users can delete own photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'progress-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Add comment for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets for user uploads';
