-- =====================================================
-- WEEKLY PLAN TABLE
-- Stores user's customizable weekly training plan
-- =====================================================

CREATE TABLE IF NOT EXISTS weekly_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    workout_type TEXT NOT NULL CHECK (workout_type IN ('gym', 'sport', 'cardio', 'rest', 'other')),
    workout_name TEXT,
    intensity TEXT CHECK (intensity IN ('recovery', 'moderate', 'high')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, day_of_week)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_weekly_plan_user_id ON weekly_plan(user_id);

-- RLS Policies
ALTER TABLE weekly_plan ENABLE ROW LEVEL SECURITY;

-- Users can only see their own plan
CREATE POLICY "Users can view their own weekly plan"
    ON weekly_plan FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own plan
CREATE POLICY "Users can create their own weekly plan"
    ON weekly_plan FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own plan
CREATE POLICY "Users can update their own weekly plan"
    ON weekly_plan FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own plan
CREATE POLICY "Users can delete their own weekly plan"
    ON weekly_plan FOR DELETE
    USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weekly_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weekly_plan_updated_at
    BEFORE UPDATE ON weekly_plan
    FOR EACH ROW
    EXECUTE FUNCTION update_weekly_plan_updated_at();

-- Add comment
COMMENT ON TABLE weekly_plan IS 'User customizable weekly training plan (0=Monday, 6=Sunday)';
