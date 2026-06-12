-- Client code no longer calls this SECURITY DEFINER migration helper.
-- Revoke it to prevent authenticated users from passing another user's id.
REVOKE ALL ON FUNCTION public.migrate_food_log_times(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.migrate_food_log_times(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.migrate_food_log_times(uuid, text) FROM authenticated;

-- The app queries friendships through RLS and does not use this definer helper.
-- Keep it unavailable until it can derive the caller from auth.uid().
ALTER FUNCTION public.get_accepted_friends(uuid) SET search_path = public;
REVOKE ALL ON FUNCTION public.get_accepted_friends(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_accepted_friends(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_accepted_friends(uuid) FROM authenticated;
