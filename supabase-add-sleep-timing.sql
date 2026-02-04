-- =====================================================
-- Migration: Add bedtime and wakeTime columns to oura_log
-- Date: 2026-02-04
-- Purpose: Enable sleep schedule analysis and meal timing insights
-- =====================================================

-- Add bedtime and wake_time columns to oura_log table
ALTER TABLE oura_log
ADD COLUMN IF NOT EXISTS bedtime TIME,
ADD COLUMN IF NOT EXISTS wake_time TIME;

-- Add comments for documentation
COMMENT ON COLUMN oura_log.bedtime IS 'Time when user went to bed (HH:MM format)';
COMMENT ON COLUMN oura_log.wake_time IS 'Time when user woke up (HH:MM format)';
