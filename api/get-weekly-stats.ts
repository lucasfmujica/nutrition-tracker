import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import type { Database } from '../src/types/supabase';
import { checkRateLimit } from './_rateLimit';

/**
 * Weekly Stats API - Social Accountability Reports
 *
 * Calculates weekly progress metrics for shareable report cards.
 * Strictly uses Argentina Timezone (-03:00) for all date operations.
 *
 * @returns {Object} { workouts, proteinAdherence, weightDelta, weekRange }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Setup — restrict to the app's own origin(s). No wildcard: this endpoint
    // returns personal data and must not be readable cross-site.
    if (!process.env.ALLOWED_ORIGINS) {
        console.error(
            '[WeeklyStats] ALLOWED_ORIGINS is not set — CORS will reject all browser origins.',
        );
    }
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    const origin = req.headers.origin as string | undefined;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    );

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. Environment Check
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[WeeklyStats] Missing SUPABASE_SERVICE_ROLE_KEY');
            return res.status(500).json({ error: 'Server Misconfiguration' });
        }
        if (!process.env.VITE_SUPABASE_URL) {
            console.error('[WeeklyStats] Missing VITE_SUPABASE_URL');
            return res.status(500).json({ error: 'Server Misconfiguration' });
        }

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        ) as any;

        // 2. Authenticate: derive userId from the caller's Supabase JWT.
        // SECURITY: never trust a userId from the query/body — that was an IDOR
        // allowing anyone to read any user's stats via the service-role client.
        const authHeader = (req.headers.authorization as string) || '';
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length).trim()
            : '';

        if (!token) {
            return res
                .status(401)
                .json({ error: 'Unauthorized: Missing bearer token' });
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user?.id) {
            console.warn('[WeeklyStats] Invalid token');
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        const userId = user.id;
        console.log(`[WeeklyStats] Processing request for authenticated user`);

        const rl = await checkRateLimit(`weekly-stats:${userId}`, 30, 60);
        if (!rl.allowed) {
            res.setHeader('Retry-After', String(rl.retryAfter));
            return res.status(429).json({ error: 'Too Many Requests' });
        }

        // 3. Calculate Week Boundaries (Monday-Sunday in Argentina TZ)
        const now = new Date();
        const argentinaFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        // Get today's date in Argentina
        const todayArgentina = argentinaFormatter.format(now);

        // Get day of week in Argentina (0 = Sunday, 1 = Monday, ...)
        const dayFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Argentina/Buenos_Aires',
            weekday: 'short',
        });
        const dayName = dayFormatter.format(now) as
            | 'Sun'
            | 'Mon'
            | 'Tue'
            | 'Wed'
            | 'Thu'
            | 'Fri'
            | 'Sat';
        const daysMap: Record<string, number> = {
            Sun: 0,
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
        };
        const currentDayOfWeek = daysMap[dayName];

        // Calculate Monday of this week
        const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        const mondayDate = new Date(now);
        mondayDate.setDate(mondayDate.getDate() - daysToMonday);
        const monday = argentinaFormatter.format(mondayDate);

        // Calculate Sunday of this week
        const sundayDate = new Date(mondayDate);
        sundayDate.setDate(sundayDate.getDate() + 6);
        const sunday = argentinaFormatter.format(sundayDate);

        console.log(
            `[WeeklyStats] Week range: ${monday} to ${sunday} (Today: ${todayArgentina})`,
        );

        // 4. Query Workouts Breakdown
        let gymCount = 0;
        let tennisCount = 0;
        try {
            const { data: workoutData, error: workoutError } = await supabase
                .from('workouts')
                .select('type, name')
                .eq('user_id', userId)
                .gte('date', monday)
                .lte('date', sunday);

            if (workoutError) throw workoutError;

            if (workoutData) {
                workoutData.forEach((w: any) => {
                    const type = (w.type as string)?.toLowerCase() || '';
                    const name = (w.name as string)?.toLowerCase() || '';
                    // Check for Tennis (mapped as 'sport' or explicitly named)
                    if (
                        type === 'sport' ||
                        type === 'tennis' ||
                        name.includes('tenis') ||
                        name.includes('tennis')
                    ) {
                        tennisCount++;
                    } else {
                        gymCount++;
                    }
                });
            }
        } catch (err) {
            console.error('[WeeklyStats] Error fetching workouts:', err);
            // Continue with 0
        }

        // 5. Calculate Nutrition Stats (Deficit & Protein Streak)
        let nutritionStats = {
            avgDeficit: 0,
            consistencyStreak: 0,
            daysTracked: 0,
            proteinAvg: 0,
        };

        try {
            // Get user's profile targets
            const { data: profileData } = await supabase
                .from('profiles')
                .select('target_calories, target_protein, current_weight')
                .eq('user_id', userId)
                .single();

            const targetCalories = profileData?.target_calories || 2000;
            const targetProtein = profileData?.target_protein || 170;

            // Get food logs grouped by date
            const { data: foodLogs } = await supabase
                .from('food_log')
                .select('date, calories, protein')
                .eq('user_id', userId)
                .gte('date', monday)
                .lte('date', sunday);

            if (foodLogs && foodLogs.length > 0) {
                // Group by date
                const dailyLogs: Record<
                    string,
                    { calories: number; protein: number }
                > = {};
                for (const log of foodLogs) {
                    if (!dailyLogs[log.date]) {
                        dailyLogs[log.date] = { calories: 0, protein: 0 };
                    }
                    dailyLogs[log.date].calories += log.calories || 0;

                    // Safe type validation before parsing
                    const proteinValue = typeof log.protein === 'number'
                        ? log.protein
                        : parseFloat(String(log.protein)) || 0;
                    dailyLogs[log.date].protein += proteinValue;
                }

                const days = Object.keys(dailyLogs);
                nutritionStats.daysTracked = days.length;

                if (days.length > 0) {
                    // 1. Protein Avg
                    const totalProtein = days.reduce(
                        (sum, day) => sum + dailyLogs[day].protein,
                        0,
                    );
                    nutritionStats.proteinAvg = Math.round(
                        totalProtein / days.length,
                    );

                    // 2. Consistency Streak (Protein Adherence Days)
                    // Count days where protein >= 90% of target
                    nutritionStats.consistencyStreak = days.filter(
                        (day) => dailyLogs[day].protein >= targetProtein * 0.9,
                    ).length;

                    // 3. Average Caloric Deficit
                    // Includes ALL days with any tracking. Deficit = Target - Consumed.
                    // If Consumed > Target, deficit is negative (surplus).
                    let totalDeficit = 0;
                    days.forEach((day) => {
                        const consumed = dailyLogs[day].calories;
                        totalDeficit += targetCalories - consumed;
                    });
                    // Calculate average across all tracked days
                    nutritionStats.avgDeficit =
                        days.length > 0 ? Math.round(totalDeficit / days.length) : 0;
                }
            }
        } catch (err) {
            console.error('[WeeklyStats] Error calculating nutrition stats:', err);
        }

        // 6. Calculate Weight Delta (Weekly) & Total Progress
        let weightStats: {
            weeklyDelta: number | null;
            totalLost: number | null;
            percentToGoal: number | null;
            startWeight: number | null;
            currentWeight: number | null;
        } = {
            weeklyDelta: null,
            totalLost: null,
            percentToGoal: null,
            startWeight: null,
            currentWeight: null,
        };

        try {
            // Get Monday's weight (or closest to Monday)
            const { data: mondayWeight } = await supabase
                .from('weight_history')
                .select('weight, date')
                .eq('user_id', userId)
                .lte('date', monday)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            // Get latest weight
            const { data: latestWeight } = await supabase
                .from('weight_history')
                .select('weight, date')
                .eq('user_id', userId)
                .lte('date', todayArgentina)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            if (latestWeight) {
                weightStats.currentWeight = latestWeight.weight;

                // Weekly Delta
                if (mondayWeight) {
                    weightStats.weeklyDelta = parseFloat(
                        (
                            (latestWeight.weight as number) -
                            (mondayWeight.weight as number)
                        ).toFixed(1),
                    );
                }

                // Total Progress
                // Try to get start_weight from profile, or find oldest weight entry
                let startWeight = null;

                // Fetch profile again if needed
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('start_weight, target_weight')
                    .eq('user_id', userId)
                    .single();

                if (profile?.start_weight) {
                    startWeight = profile.start_weight;
                } else {
                    // Find oldest weight
                    const { data: oldest } = await supabase
                        .from('weight_history')
                        .select('weight')
                        .eq('user_id', userId)
                        .order('date', { ascending: true })
                        .limit(1)
                        .single();
                    if (oldest) startWeight = oldest.weight;
                }

                weightStats.startWeight = startWeight;

                if (startWeight && (profile as any)?.target_weight) {
                    const totalToLose = startWeight - (profile as any).target_weight;
                    const currentLost =
                        startWeight - (latestWeight.weight as number);
                    weightStats.totalLost = parseFloat(currentLost.toFixed(1));

                    if (totalToLose > 0) {
                        weightStats.percentToGoal = Math.round(
                            (currentLost / totalToLose) * 100,
                        );
                    }
                }
            }
        } catch (err) {
            console.error('[WeeklyStats] Error calculating weight stats:', err);
        }

        // 7. Format Week Range in Spanish
        const monthsES = [
            'Ene',
            'Feb',
            'Mar',
            'Abr',
            'May',
            'Jun',
            'Jul',
            'Ago',
            'Sep',
            'Oct',
            'Nov',
            'Dic',
        ];
        const mondayParts = monday.split('-');
        const sundayParts = sunday.split('-');
        const weekRange = `${parseInt(mondayParts[2])} ${monthsES[parseInt(mondayParts[1]) - 1]} - ${parseInt(sundayParts[2])} ${monthsES[parseInt(sundayParts[1]) - 1]}`;

        // 8. Build Response
        const response = {
            // Activity
            workouts: gymCount + tennisCount,
            gymCount,
            tennisCount,

            // Nutrition
            proteinAvg: nutritionStats.proteinAvg,
            avgDeficit: nutritionStats.avgDeficit,
            consistencyStreak: nutritionStats.consistencyStreak,
            daysTracked: nutritionStats.daysTracked,

            // Weight
            weightDelta: weightStats.weeklyDelta,
            totalLost: weightStats.totalLost,
            percentToGoal: weightStats.percentToGoal,
            currentWeight: weightStats.currentWeight,

            // Meta
            weekRange,
        };

        return res.status(200).json(response);
    } catch (error: any) {
        // Log the detail server-side only; don't leak internals to the client.
        console.error('[WeeklyStats] Internal Error:', error?.message || error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
