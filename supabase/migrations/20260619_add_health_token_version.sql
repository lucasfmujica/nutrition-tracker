-- Adds a per-user version counter used to REVOKE Apple Health sync tokens.
--
-- Each issued v2 sync token embeds the user's current health_token_version (tv).
-- /api/sync-health rejects any token whose tv != the user's current version, so
-- bumping this counter (via a token rotation request) instantly invalidates every
-- previously issued token for that user. Closes the replay window on stolen tokens.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS health_token_version integer NOT NULL DEFAULT 0;
