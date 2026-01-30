-- =====================================================
-- ACTIVITY REACTIONS TABLE
-- Kudos/Reactions system for Activity Feed
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL DEFAULT 'fire', -- 'fire' is the only reaction for now
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Prevent duplicate reactions: one reaction per user per activity
    UNIQUE(activity_id, user_id)
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_activity_reactions_activity
    ON activity_reactions(activity_id);

CREATE INDEX IF NOT EXISTS idx_activity_reactions_user
    ON activity_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_reactions_created
    ON activity_reactions(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Users can see reactions on activities from their friends and themselves
CREATE POLICY "Users can view reactions on activities they can see"
    ON activity_reactions
    FOR SELECT
    USING (
        -- Can see reactions on own activities
        EXISTS (
            SELECT 1 FROM activity_feed
            WHERE activity_feed.id = activity_reactions.activity_id
            AND activity_feed.user_id = auth.uid()
        )
        OR
        -- Can see reactions on friends' activities
        EXISTS (
            SELECT 1 FROM activity_feed
            INNER JOIN friendships ON (
                (friendships.user_id = auth.uid() AND friendships.friend_id = activity_feed.user_id)
                OR
                (friendships.friend_id = auth.uid() AND friendships.user_id = activity_feed.user_id)
            )
            WHERE activity_feed.id = activity_reactions.activity_id
            AND friendships.status = 'accepted'
        )
    );

-- Users can add their own reactions
CREATE POLICY "Users can add their own reactions"
    ON activity_reactions
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND
        -- Can only react to activities they can see (own or friends')
        (
            EXISTS (
                SELECT 1 FROM activity_feed
                WHERE activity_feed.id = activity_reactions.activity_id
                AND activity_feed.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM activity_feed
                INNER JOIN friendships ON (
                    (friendships.user_id = auth.uid() AND friendships.friend_id = activity_feed.user_id)
                    OR
                    (friendships.friend_id = auth.uid() AND friendships.user_id = activity_feed.user_id)
                )
                WHERE activity_feed.id = activity_reactions.activity_id
                AND friendships.status = 'accepted'
            )
        )
    );

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
    ON activity_reactions
    FOR DELETE
    USING (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTION: Get reaction count for activity
-- =====================================================

CREATE OR REPLACE FUNCTION get_activity_reaction_count(p_activity_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM activity_reactions
    WHERE activity_id = p_activity_id;
$$;

-- =====================================================
-- HELPER FUNCTION: Check if user reacted to activity
-- =====================================================

CREATE OR REPLACE FUNCTION has_user_reacted(p_activity_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS(
        SELECT 1
        FROM activity_reactions
        WHERE activity_id = p_activity_id
        AND user_id = p_user_id
    );
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE activity_reactions IS 'Stores kudos/reactions from users on activity feed items';
COMMENT ON COLUMN activity_reactions.reaction_type IS 'Type of reaction (currently only "fire" emoji)';
