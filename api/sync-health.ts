import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Database } from '../src/types/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Setup
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    );

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        // 0. Environment Check (Critical for Vercel)
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[SyncHealth] Missing SUPABASE_SERVICE_ROLE_KEY');
            return res.status(500).json({
                error: 'Server Misconfiguration: Missing Service Role Key',
            });
        }
        if (!process.env.VITE_SUPABASE_URL) {
            console.error('[SyncHealth] Missing VITE_SUPABASE_URL');
            return res
                .status(500)
                .json({ error: 'Server Misconfiguration: Missing Supabase URL' });
        }

        // Initialize Supabase Client inside handler to catch config errors
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        ) as any;

        // Parse Input
        // Support new polymorphic (type/value) and legacy (data object) for backward compat
        let { apiKey, userId, type, value, date, data } = req.body;

        console.log(
            `[SyncHealth] Request received. apiKey present: ${!!apiKey}, userId: ${userId}, type: ${type}`,
        );

        // 1. Security Check
        if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
            console.warn('[SyncHealth] Unauthorized access attempt.');
            return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
        }

        // 2. Normalize Payload (Backward Compatibility Layer)
        // If 'data' exists (old weight shortcut), map it to new format
        if (data && data.weight && data.date) {
            type = 'weight';
            value = data.weight;
            date = data.date;
        }

        // 3. Validation
        if (!userId || !type || value === undefined || !date) {
            console.warn('[SyncHealth] Missing required fields:', {
                userId,
                type,
                value,
                date,
            });
            return res.status(400).json({
                error: 'Bad Request: Missing userId, type, value, or date',
            });
        }

        console.log(
            `[SyncHealth] Processing ${type} sync for User: ${userId}, Date: ${date}, Value: ${value}`,
        );

        // 4. Date Logic (Crucial for Timezones)
        let argentinaDate: string;
        try {
            console.log(`[SyncHealth] Raw input date: "${date}"`);

            // Check if input is already strictly YYYY-MM-DD
            const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (simpleDateRegex.test(date)) {
                argentinaDate = date;
                console.log(
                    `[SyncHealth] Simple date detected. Using directly: ${argentinaDate}`,
                );
            } else {
                // It's likely an ISO string (e.g. 2026-01-18T08:00:00Z) or iOS localized format.
                // We must convert this instant to Argentina time.
                const dateObj = new Date(date);
                if (isNaN(dateObj.getTime())) throw new Error('Invalid Date Object');

                // 'en-CA' outputs YYYY-MM-DD format directly, which is handy.
                argentinaDate = new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                }).format(dateObj);

                console.log(
                    `[SyncHealth] ISO/Complex date converted to Argentina Time: ${argentinaDate}`,
                );
            }
        } catch (dateError) {
            console.error('[SyncHealth] Date parsing error:', dateError);
            return res
                .status(400)
                .json({ error: 'Invalid Date Format. Use YYYY-MM-DD or ISO 8601.' });
        }

        // 5. Database Operations
        let table: string, payload: any, conflictTarget: string;

        if (type === 'weight') {
            table = 'weight_history';
            payload = {
                user_id: userId,
                date: argentinaDate,
                weight: parseFloat(value),
            };
            conflictTarget = 'user_id, date';
        } else if (type === 'steps') {
            table = 'steps_log';
            payload = {
                user_id: userId,
                date: argentinaDate,
                steps: parseInt(value, 10),
                source: 'ios-health', // Tag as iOS Health source for smart merge
            };
            conflictTarget = 'user_id, date';
        } else {
            return res.status(400).json({ error: `Unsupported type: ${type}` });
        }

        // 6. Upsert to Supabase
        const { data: inserted, error } = await supabase
            .from(table)
            .upsert(payload, { onConflict: conflictTarget })
            .select();

        if (error) {
            console.error(`[SyncHealth] Supabase Error (${table}):`, error);
            return res
                .status(500)
                .json({ error: 'Database Error', details: error.message });
        }

        console.log(`[SyncHealth] Success (${table}):`, inserted);
        return res.status(200).json({
            success: true,
            message: `${type} synced successfully`,
            data: inserted,
        });
    } catch (error: any) {
        console.error('[SyncHealth] Internal Critical Error:', error);
        return res
            .status(500)
            .json({ error: 'Internal Server Error', details: error.message });
    }
}
