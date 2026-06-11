-- =====================================================
-- SECURITY HARDENING (review fixes #4 and #5)
-- =====================================================
-- Run this in the Supabase SQL editor AFTER reviewing it.
-- Prerequisite: Row Level Security MUST be enabled on every table in `public`
-- (these grants rely on RLS to constrain which rows each user can touch).
--
-- Verify RLS is on first:
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relnamespace = 'public'::regnamespace AND relkind = 'r';
-- Any table with relrowsecurity = false must get:  ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;
-- =====================================================

-- -----------------------------------------------------
-- FIX #5: Remove the blanket `GRANT ALL ... TO anon`
-- (supabase-fix-trigger.sql:38-39). The anonymous role must not be able to
-- write to every table; any future table created without RLS would be wide open.
-- -----------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Least privilege: only authenticated users get CRUD, still constrained by RLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Make the above apply to tables/sequences created in the future too.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- -----------------------------------------------------
-- FIX #4: Harden find_user_by_friend_code (SECURITY DEFINER, was callable by
-- anyone and enumerable by brute force over 8-hex codes).
--   * Require an authenticated caller (closes anonymous enumeration).
--   * Pin search_path (SECURITY DEFINER best practice).
--   * Validate the code shape and LIMIT 1.
-- NOTE: per-user brute-force rate limiting cannot be expressed cleanly in pure
-- SQL — enforce it at the edge (API gateway / Supabase rate limits) as well.
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION find_user_by_friend_code(p_friend_code TEXT)
RETURNS TABLE(
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    friend_code TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_friend_code IS NULL OR LENGTH(TRIM(p_friend_code)) <> 8 THEN
        RETURN; -- invalid shape, return no rows
    END IF;

    RETURN QUERY
    SELECT
        p.user_id,
        p.display_name,
        p.avatar_url,
        p.friend_code
    FROM profiles p
    WHERE UPPER(p.friend_code) = UPPER(TRIM(p_friend_code))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION find_user_by_friend_code(TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION find_user_by_friend_code(TEXT) TO authenticated;
