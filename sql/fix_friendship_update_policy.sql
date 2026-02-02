-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update received requests" ON friendships;

-- Re-create the policy with separate USING and WITH CHECK clauses
-- USING: Ensures the user can only modify requests sent TO them that are currently PENDING
-- WITH CHECK: Ensures they can only change the status to 'accepted' (or keep it pending, though unlikely)
CREATE POLICY "Users can update received requests" ON friendships
    FOR UPDATE
    USING (
        auth.uid() = friend_id
        AND status = 'pending'
    )
    WITH CHECK (
        auth.uid() = friend_id
        AND (status = 'accepted' OR status = 'pending')
    );
