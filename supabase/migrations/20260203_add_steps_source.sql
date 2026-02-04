-- Add source tracking and updated_at to steps_log
-- This enables smart merge for Oura Ring auto-sync vs manual/iOS Health entries

ALTER TABLE steps_log
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'oura', 'ios-health')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for efficient filtering by source
CREATE INDEX IF NOT EXISTS idx_steps_log_source ON steps_log(source);

-- Create trigger to auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_steps_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist (safe for re-runs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_steps_log_updated_at'
  ) THEN
    CREATE TRIGGER trigger_steps_log_updated_at
      BEFORE UPDATE ON steps_log
      FOR EACH ROW
      EXECUTE FUNCTION update_steps_log_updated_at();
  END IF;
END;
$$;

-- Backfill existing entries with 'manual' source (already default)
-- No action needed as column has DEFAULT 'manual'

COMMENT ON COLUMN steps_log.source IS 'Source of steps data: manual (user input), oura (Oura Ring auto-sync), ios-health (iOS Health shortcut)';
COMMENT ON COLUMN steps_log.updated_at IS 'Timestamp of last update to this record';
