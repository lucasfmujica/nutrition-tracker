import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHealthSyncToken } from './health-sync-token.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const syncSecret = process.env.SYNC_API_KEY;
    if (!supabaseUrl || !serviceRoleKey || !syncSecret) {
        return res.status(500).json({ error: 'Server Misconfiguration' });
    }

    const authHeader = String(req.headers.authorization || '');
    const accessToken = authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : '';
    if (!accessToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser(accessToken);
    if (error || !user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Token version (tv) is embedded in every v2 token. Rotating it invalidates
    // all previously issued tokens for this user (revocation). If the column has
    // not been migrated yet, or the lookup fails, fall back to 0 so token issuance
    // keeps working (tolerant to the migration not being applied yet).
    const rotate = Boolean((req.body as { rotate?: unknown } | undefined)?.rotate);
    let tokenVersion = 0;
    try {
        if (rotate) {
            // Rotate: bump health_token_version and use the new value, so every
            // token minted before this request is rejected by /api/sync-health.
            const { data: current, error: readErr } = await supabase
                .from('profiles')
                .select('health_token_version')
                .eq('user_id', user.id)
                .maybeSingle();
            if (readErr) throw readErr;
            const next = Number(current?.health_token_version ?? 0) + 1;
            const { error: updErr } = await supabase
                .from('profiles')
                .update({ health_token_version: next })
                .eq('user_id', user.id);
            // (key column on profiles is user_id, mirroring useProfileData.ts)
            if (updErr) throw updErr;
            tokenVersion = next;
        } else {
            const { data: profile, error: readErr } = await supabase
                .from('profiles')
                .select('health_token_version')
                .eq('user_id', user.id)
                .maybeSingle();
            if (readErr) throw readErr;
            tokenVersion = Number(profile?.health_token_version ?? 0);
        }
    } catch (versionError) {
        console.warn(
            '[SyncHealthToken] Could not read/rotate health_token_version, defaulting to 0:',
            versionError,
        );
        tokenVersion = 0;
    }

    return res.status(200).json({
        token: createHealthSyncToken(user.id, syncSecret, Date.now(), tokenVersion),
    });
}
