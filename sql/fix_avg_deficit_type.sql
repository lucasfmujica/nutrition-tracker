-- =====================================================
-- FIX AVG_DEFICIT TYPE IN WEEKLY_SNAPSHOTS
-- Change from INTEGER to DECIMAL to support decimal values
-- =====================================================

-- Change avg_deficit from INTEGER to DECIMAL(6,1)
-- This allows values like -28.2, 150.5, etc.
ALTER TABLE weekly_snapshots
ALTER COLUMN avg_deficit TYPE DECIMAL(6,1);

-- Update default value to maintain consistency
ALTER TABLE weekly_snapshots
ALTER COLUMN avg_deficit SET DEFAULT 0.0;

-- Add comment
COMMENT ON COLUMN weekly_snapshots.avg_deficit IS 'Average daily calorie deficit/surplus for the week (1 decimal place)';
