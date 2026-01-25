-- =====================================================
-- LUKENFIT SOCIAL FEATURE - DATABASE MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- =====================================================
-- 1. FRIENDSHIPS TABLE
-- Stores friend connections between users (mutual model)
-- =====================================================
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(user_id, friend_id),
    -- Prevent self-friending
    CHECK (user_id != friend_id)
);

-- Indexes for efficient friend queries
CREATE INDEX idx_friendships_user ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend ON friendships(friend_id, status);

-- =====================================================
-- 2. ACTIVITY FEED TABLE
-- Stores shareable activity events for friends
-- =====================================================
CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'workout_logged', 'weight_milestone', 'streak_achieved',
        'goal_reached', 'friend_added', 'weekly_summary'
    )),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient friend feed queries
CREATE INDEX idx_activity_feed_user_date ON activity_feed(user_id, created_at DESC);

-- =====================================================
-- 3. WEEKLY SNAPSHOTS TABLE
-- Denormalized weekly summaries for fast leaderboard queries
-- =====================================================
CREATE TABLE weekly_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    weight_delta DECIMAL(4,2),
    workout_count INTEGER DEFAULT 0,
    consistency_streak INTEGER DEFAULT 0,
    avg_deficit INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Index for leaderboard queries
CREATE INDEX idx_weekly_snapshots_week ON weekly_snapshots(week_start, consistency_streak DESC);

-- =====================================================
-- 4. PROFILES TABLE UPDATES
-- Add friend_code for easy friend discovery
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friend_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Generate friend codes for existing users (8-char uppercase hex from user_id hash)
UPDATE profiles
SET friend_code = UPPER(SUBSTRING(MD5(user_id::text), 1, 8))
WHERE friend_code IS NULL;

-- Function to auto-generate friend code on new profile creation
CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.friend_code IS NULL THEN
        NEW.friend_code = UPPER(SUBSTRING(MD5(NEW.user_id::text), 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate friend code
DROP TRIGGER IF EXISTS set_friend_code ON profiles;
CREATE TRIGGER set_friend_code
    BEFORE INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION generate_friend_code();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_snapshots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FRIENDSHIPS POLICIES
-- =====================================================

-- Users can view their own friendships (sent or received)
CREATE POLICY "Users can view own friendships" ON friendships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update received requests (to accept/block)
CREATE POLICY "Users can update received requests" ON friendships
    FOR UPDATE USING (auth.uid() = friend_id AND status = 'pending');

-- Users can delete their own friendships (remove friend or cancel request)
CREATE POLICY "Users can delete own friendships" ON friendships
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- =====================================================
-- ACTIVITY FEED POLICIES
-- =====================================================

-- Users can insert their own activities
CREATE POLICY "Users can insert own activities" ON activity_feed
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own activities and friends' activities
CREATE POLICY "Users can view friends activities" ON activity_feed
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM friendships
            WHERE status = 'accepted'
            AND ((user_id = auth.uid() AND friend_id = activity_feed.user_id)
                OR (friend_id = auth.uid() AND user_id = activity_feed.user_id))
        )
    );

-- =====================================================
-- WEEKLY SNAPSHOTS POLICIES
-- =====================================================

-- Users can insert/update their own snapshots
CREATE POLICY "Users can manage own snapshots" ON weekly_snapshots
    FOR ALL USING (auth.uid() = user_id);

-- Friends can view each other's snapshots (for leaderboards)
CREATE POLICY "Users can view friends snapshots" ON weekly_snapshots
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM friendships
            WHERE status = 'accepted'
            AND ((user_id = auth.uid() AND friend_id = weekly_snapshots.user_id)
                OR (friend_id = auth.uid() AND user_id = weekly_snapshots.user_id))
        )
    );

-- =====================================================
-- HELPER FUNCTION: Get accepted friends list
-- =====================================================
CREATE OR REPLACE FUNCTION get_accepted_friends(p_user_id UUID)
RETURNS TABLE(friend_user_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN user_id = p_user_id THEN friend_id
            ELSE user_id
        END as friend_user_id
    FROM friendships
    WHERE status = 'accepted'
    AND (user_id = p_user_id OR friend_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Find user by friend code
-- =====================================================
CREATE OR REPLACE FUNCTION find_user_by_friend_code(p_friend_code TEXT)
RETURNS TABLE(
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    friend_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.user_id,
        p.display_name,
        p.avatar_url,
        p.friend_code
    FROM profiles p
    WHERE UPPER(p.friend_code) = UPPER(p_friend_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Done! Social feature tables and policies are ready.
-- =====================================================
