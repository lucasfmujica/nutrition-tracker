-- =====================================================
-- MEAL PREP PLAN TABLE MIGRATION
-- =====================================================
-- Purpose: Weekly meal planning with grocery list generation
-- Features: Plan meals 7 days ahead, mark as completed, repeat weeks
-- Created: 2026-02-05

-- 1. Create meal_prep_plan table
CREATE TABLE IF NOT EXISTS meal_prep_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    template_id TEXT,
    planned_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one meal per user per date per meal_type
    UNIQUE(user_id, date, meal_type)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_prep_user_date
    ON meal_prep_plan(user_id, date);

CREATE INDEX IF NOT EXISTS idx_meal_prep_user_date_type
    ON meal_prep_plan(user_id, date, meal_type);

CREATE INDEX IF NOT EXISTS idx_meal_prep_completed
    ON meal_prep_plan(user_id, is_completed)
    WHERE is_completed = FALSE;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE meal_prep_plan ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Policy: Users can view their own meal plans
CREATE POLICY "Users can view own meal prep plans"
    ON meal_prep_plan
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own meal plans
CREATE POLICY "Users can insert own meal prep plans"
    ON meal_prep_plan
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own meal plans
CREATE POLICY "Users can update own meal prep plans"
    ON meal_prep_plan
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own meal plans
CREATE POLICY "Users can delete own meal prep plans"
    ON meal_prep_plan
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_meal_prep_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meal_prep_updated_at_trigger
    BEFORE UPDATE ON meal_prep_plan
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_prep_updated_at();

-- 6. Grant permissions
GRANT ALL ON meal_prep_plan TO authenticated;
GRANT ALL ON meal_prep_plan TO service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Check table exists:
-- SELECT * FROM meal_prep_plan LIMIT 1;

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'meal_prep_plan';

-- Test insert (as authenticated user):
-- INSERT INTO meal_prep_plan (user_id, date, meal_type, planned_items)
-- VALUES (auth.uid(), '2026-02-10', 'breakfast', '[{"name": "Huevos revueltos", "calories": 300}]'::jsonb);
