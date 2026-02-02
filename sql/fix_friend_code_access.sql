-- =====================================================
-- FIX FRIEND CODE ACCESS
-- Ensures users can read their own friend_code from profiles
-- =====================================================

-- First, let's verify the current RLS policies on profiles
-- Users should be able to read their own profile including friend_code

-- Add explicit policy for users to read their own friend_code if it doesn't exist
DO $$
BEGIN
    -- Check if a policy for reading own profile exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON profiles
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Also ensure users can view friend codes of their friends (for friend discovery)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = 'Users can view friend profiles'
    ) THEN
        CREATE POLICY "Users can view friend profiles" ON profiles
            FOR SELECT USING (
                user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM friendships
                    WHERE status = 'accepted'
                    AND ((user_id = auth.uid() AND friend_id = profiles.user_id)
                        OR (friend_id = auth.uid() AND user_id = profiles.user_id))
                )
            );
    END IF;
END $$;

-- Ensure all existing users have valid friend codes (backup check)
UPDATE profiles
SET friend_code = UPPER(SUBSTRING(MD5(user_id::text || NOW()::text), 1, 8))
WHERE friend_code IS NULL OR friend_code = '' OR LENGTH(friend_code) != 8;

-- Verify the fix
SELECT
    COUNT(*) as total_profiles,
    COUNT(friend_code) as profiles_with_code,
    COUNT(CASE WHEN LENGTH(friend_code) = 8 THEN 1 END) as valid_codes
FROM profiles;
