import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyHealthSyncToken } from './health-sync-token';

/**
 * Marker used to tag Apple Health workouts in the `workouts.notes` column,
 * since the table has no `source` column. Used for dedupe on re-sync.
 */
const APPLE_HEALTH_MARKER = '[apple_health]';

/** Reject oversized payloads before doing any DB work (matches gemini-proxy). */
const MAX_REQUEST_BYTES = 1 * 1024 * 1024;

/**
 * Converts an incoming date (YYYY-MM-DD or ISO 8601) to a YYYY-MM-DD string
 * in Argentina time. Throws on invalid input.
 */
function toLocalDate(date: string): string {
    const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (simpleDateRegex.test(date)) return date;
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) throw new Error('Invalid Date');
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(dateObj);
}

/** Maps an Apple Health / HKWorkoutActivityType-ish name to the workouts.type CHECK values. */
function mapWorkoutType(
    raw: string | undefined,
): 'gym' | 'cardio' | 'sport' | 'other' {
    const s = (raw || '').toLowerCase();
    if (/strength|weight|functional|core|cross|hiit|gym|pilates|yoga/.test(s))
        return 'gym';
    if (/run|walk|cycl|bike|swim|row|ellip|stair|hik|cardio/.test(s))
        return 'cardio';
    if (
        /soccer|football|tennis|basket|paddle|padel|volley|golf|boxing|martial|climb|sport/.test(
            s,
        )
    )
        return 'sport';
    return 'other';
}

type MetricResult = {
    metric: string;
    status: 'synced' | 'skipped' | 'error';
    reason?: string;
};

/**
 * Health sync endpoint for iOS Shortcuts (Apple Health → Supabase).
 *
 * Dedupe rules:
 * - steps:   upsert ONLY if no row exists for the day, or the existing row's
 *            source is already 'ios-health'. Manual and Oura entries always win.
 * - weight:  insert ONLY if no row exists for the day (weight_history has no
 *            source column, so any existing entry — manual or prior sync — wins).
 * - workout: tagged with "[apple_health]" in notes. Skipped if a workout with
 *            the same date + name already exists (manual or imported).
 * - sleep:   written to oura_log ONLY if no row exists for the day (Oura data
 *            is richer and always wins). Only sleep fields are populated.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Server-to-server endpoint (iOS Shortcuts) — no wildcard browser access needed.
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    );

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        // Reject oversized bodies up front to bound memory / DB work.
        const requestBytes = Buffer.byteLength(
            JSON.stringify(req.body ?? {}),
            'utf8',
        );
        if (requestBytes > MAX_REQUEST_BYTES) {
            return res.status(413).json({ error: 'Request body is too large' });
        }

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

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        ) as any;

        // The per-user capability token is created by /api/sync-health-token after
        // authenticating the user's Supabase session. Never trust a body userId.
        let { syncToken, type, value, date, data, metrics } = req.body ?? {};
        const expectedKey = process.env.SYNC_API_KEY;
        if (!expectedKey) {
            console.error('[SyncHealth] Missing SYNC_API_KEY');
            return res.status(500).json({ error: 'Server Misconfiguration' });
        }
        const tokenPayload = syncToken
            ? verifyHealthSyncToken(String(syncToken), expectedKey)
            : null;
        if (!tokenPayload) {
            console.warn('[SyncHealth] Unauthorized access attempt.');
            return res.status(401).json({ error: 'Unauthorized: Invalid sync token' });
        }
        const userId = tokenPayload.sub;

        // Backward-compatible metric shapes remain supported, but authentication
        // now always uses syncToken and derives the user from it.
        if (data && data.weight && data.date) {
            type = 'weight';
            value = data.weight;
            date = data.date;
        }

        // Build the unified metrics object
        const m: { steps?: any; weight?: any; sleep?: any; workouts?: any[] } =
            {};

        if (metrics && typeof metrics === 'object' && !Array.isArray(metrics)) {
            // Batch mode (Apple Health shortcut). Must be a plain object, not an array.
            if (metrics.steps !== undefined && metrics.steps !== '')
                m.steps = metrics.steps;
            if (metrics.weight !== undefined && metrics.weight !== '')
                m.weight = metrics.weight;
            if (metrics.sleep !== undefined && metrics.sleep !== '')
                m.sleep = metrics.sleep;
            if (Array.isArray(metrics.workouts)) m.workouts = metrics.workouts;
        } else if (type) {
            // Single-metric mode
            if (type === 'steps') m.steps = value;
            else if (type === 'weight') m.weight = value;
            else if (type === 'sleep') m.sleep = value;
            else if (type === 'workout') m.workouts = [value];
            else if (type === 'workouts')
                m.workouts = Array.isArray(value) ? value : [value];
            else
                return res
                    .status(400)
                    .json({ error: `Unsupported type: ${type}` });
        }

        if (
            m.steps === undefined &&
            m.weight === undefined &&
            m.sleep === undefined &&
            !(m.workouts && m.workouts.length)
        ) {
            return res.status(400).json({
                error: 'Bad Request: No metrics provided (steps, weight, sleep, workouts)',
            });
        }

        // 4. Date resolution (Argentina timezone). Defaults to "today" if missing.
        let argentinaDate: string;
        try {
            argentinaDate = toLocalDate(String(date ?? new Date().toISOString()));
        } catch {
            return res
                .status(400)
                .json({ error: 'Invalid Date Format. Use YYYY-MM-DD or ISO 8601.' });
        }

        console.log(
            `[SyncHealth] Processing for ${userId} @ ${argentinaDate}:`,
            Object.keys(m),
        );

        const results: MetricResult[] = [];

        // ---- STEPS ----
        if (m.steps !== undefined) {
            const steps = parseInt(m.steps, 10);
            if (!Number.isFinite(steps) || steps < 0 || steps > 200000) {
                results.push({
                    metric: 'steps',
                    status: 'error',
                    reason: 'Invalid steps value',
                });
            } else {
                const { data: existing, error: selErr } = await supabase
                    .from('steps_log')
                    .select('id, source')
                    .eq('user_id', userId)
                    .eq('date', argentinaDate)
                    .maybeSingle();
                if (selErr) {
                    console.error('[SyncHealth] steps select error:', selErr);
                    results.push({
                        metric: 'steps',
                        status: 'error',
                        reason: 'Database Error',
                    });
                } else if (
                    existing &&
                    existing.source &&
                    existing.source !== 'ios-health'
                ) {
                    // Manual or Oura entry wins — never clobber it.
                    results.push({
                        metric: 'steps',
                        status: 'skipped',
                        reason: `Existing '${existing.source}' entry preserved`,
                    });
                } else {
                    const { error } = await supabase.from('steps_log').upsert(
                        {
                            user_id: userId,
                            date: argentinaDate,
                            steps,
                            source: 'ios-health',
                        },
                        { onConflict: 'user_id, date' },
                    );
                    if (error) {
                        console.error('[SyncHealth] steps upsert error:', error);
                        results.push({
                            metric: 'steps',
                            status: 'error',
                            reason: 'Database Error',
                        });
                    } else results.push({ metric: 'steps', status: 'synced' });
                }
            }
        }

        // ---- WEIGHT ----
        if (m.weight !== undefined) {
            const weight = parseFloat(m.weight);
            if (!Number.isFinite(weight) || weight <= 0 || weight > 500) {
                results.push({
                    metric: 'weight',
                    status: 'error',
                    reason: 'Invalid weight value',
                });
            } else {
                const { data: existing, error: selErr } = await supabase
                    .from('weight_history')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('date', argentinaDate)
                    .maybeSingle();
                if (selErr) {
                    console.error('[SyncHealth] weight select error:', selErr);
                    results.push({
                        metric: 'weight',
                        status: 'error',
                        reason: 'Database Error',
                    });
                } else if (existing) {
                    // No source column on weight_history: existing entry for the day wins.
                    results.push({
                        metric: 'weight',
                        status: 'skipped',
                        reason: 'Existing entry for date preserved',
                    });
                } else {
                    const { error } = await supabase
                        .from('weight_history')
                        .insert({ user_id: userId, date: argentinaDate, weight });
                    if (error) {
                        console.error('[SyncHealth] weight insert error:', error);
                        results.push({
                            metric: 'weight',
                            status: 'error',
                            reason: 'Database Error',
                        });
                    } else results.push({ metric: 'weight', status: 'synced' });
                }
            }
        }

        // ---- WORKOUTS ----
        if (m.workouts && m.workouts.length) {
            for (const w of m.workouts.slice(0, 20)) {
                if (!w || typeof w !== 'object') {
                    results.push({
                        metric: 'workout',
                        status: 'error',
                        reason: 'Invalid workout object',
                    });
                    continue;
                }
                const name = String(
                    w.name || w.activityType || 'Apple Health Workout',
                ).slice(0, 120);
                const duration = Math.round(parseFloat(w.duration) || 0); // minutes
                const calories = Math.round(
                    parseFloat(w.calories ?? w.activeEnergy) || 0,
                );
                let wDate: string;
                try {
                    wDate = w.date ? toLocalDate(String(w.date)) : argentinaDate;
                } catch {
                    results.push({
                        metric: 'workout',
                        status: 'error',
                        reason: `Invalid date for '${name}'`,
                    });
                    continue;
                }
                const wType = mapWorkoutType(w.type || w.activityType || name);
                if (
                    duration <= 0 ||
                    duration > 1440 ||
                    calories < 0 ||
                    calories > 10000
                ) {
                    results.push({
                        metric: 'workout',
                        status: 'error',
                        reason: `Invalid duration/calories for '${name}'`,
                    });
                    continue;
                }
                // Dedupe: skip if a workout with same date + name already exists
                // (covers re-syncs and manual entries logged for the same session).
                const { data: existing, error: selErr } = await supabase
                    .from('workouts')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('date', wDate)
                    .eq('name', name)
                    .limit(1);
                if (selErr) {
                    console.error('[SyncHealth] workout select error:', selErr);
                    results.push({
                        metric: 'workout',
                        status: 'error',
                        reason: 'Database Error',
                    });
                    continue;
                }
                if (existing && existing.length > 0) {
                    results.push({
                        metric: 'workout',
                        status: 'skipped',
                        reason: `'${name}' already logged for ${wDate}`,
                    });
                    continue;
                }
                const { error } = await supabase.from('workouts').insert({
                    user_id: userId,
                    date: wDate,
                    type: wType,
                    name,
                    duration,
                    calories,
                    notes: APPLE_HEALTH_MARKER,
                });
                if (error) {
                    console.error('[SyncHealth] workout insert error:', error);
                    results.push({
                        metric: 'workout',
                        status: 'error',
                        reason: 'Database Error',
                    });
                } else results.push({ metric: 'workout', status: 'synced' });
            }
        }

        // ---- SLEEP (→ oura_log, only if Oura hasn't written that day) ----
        if (m.sleep !== undefined) {
            const sleepObj =
                typeof m.sleep === 'object' && m.sleep !== null
                    ? m.sleep
                    : { hours: m.sleep };
            const hours = parseFloat(sleepObj.hours);
            if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
                results.push({
                    metric: 'sleep',
                    status: 'error',
                    reason: 'Invalid sleep hours',
                });
            } else {
                const { data: existing, error: selErr } = await supabase
                    .from('oura_log')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('date', argentinaDate)
                    .maybeSingle();
                if (selErr) {
                    console.error('[SyncHealth] sleep select error:', selErr);
                    results.push({
                        metric: 'sleep',
                        status: 'error',
                        reason: 'Database Error',
                    });
                } else if (existing) {
                    // Oura (or a previous sync) already owns this day — its data is richer.
                    results.push({
                        metric: 'sleep',
                        status: 'skipped',
                        reason: 'Existing oura_log entry preserved',
                    });
                } else {
                    const payload: any = {
                        user_id: userId,
                        date: argentinaDate,
                        sleep_hours: Math.round(hours * 100) / 100,
                    };
                    if (sleepObj.bedtime) payload.bedtime = String(sleepObj.bedtime);
                    if (sleepObj.wakeTime || sleepObj.wake_time)
                        payload.wake_time = String(
                            sleepObj.wakeTime || sleepObj.wake_time,
                        );
                    const { error } = await supabase
                        .from('oura_log')
                        .insert(payload);
                    if (error) {
                        console.error('[SyncHealth] sleep insert error:', error);
                        results.push({
                            metric: 'sleep',
                            status: 'error',
                            reason: 'Database Error',
                        });
                    } else results.push({ metric: 'sleep', status: 'synced' });
                }
            }
        }

        const anyError = results.some((r) => r.status === 'error');
        const anySynced = results.some((r) => r.status === 'synced');
        console.log('[SyncHealth] Results:', JSON.stringify(results));

        return res.status(anyError && !anySynced ? 500 : 200).json({
            success: !anyError,
            date: argentinaDate,
            results,
        });
    } catch (error: any) {
        console.error('[SyncHealth] Internal Critical Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
