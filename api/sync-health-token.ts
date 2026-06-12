import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHealthSyncToken } from './health-sync-token';

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

    return res.status(200).json({
        token: createHealthSyncToken(user.id, syncSecret),
    });
}
