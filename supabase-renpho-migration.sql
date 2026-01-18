-- =====================================================
-- MIGRATION: ADD RENPHO INTEGRATION FIELDS
-- Purpose: Store Renpho authentication tokens and state
-- =====================================================

-- Add columns for Renpho integration if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'renpho_token') THEN
        ALTER TABLE profiles ADD COLUMN renpho_token TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'renpho_user_id') THEN
        ALTER TABLE profiles ADD COLUMN renpho_user_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'renpho_last_sync') THEN
        ALTER TABLE profiles ADD COLUMN renpho_last_sync TIMESTAMPTZ;
    END IF;
END $$;
