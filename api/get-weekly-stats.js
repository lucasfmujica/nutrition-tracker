import { createClient } from '@supabase/supabase-js';

/**
 * Weekly Stats API - Social Accountability Reports
 *
 * Calculates weekly progress metrics for shareable report cards.
 * Strictly uses Argentina Timezone (-03:00) for all date operations.
 *
 * @returns {Object} { workouts, proteinAdherence, weightDelta, weekRange }
 */
export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Extract userId (from query for GET, body for POST)
    const userId = req.method === 'GET' ? req.query.userId : req.body?.userId;

    if (!userId) {
      console.warn('[WeeklyStats] Missing userId');
      return res.status(400).json({ error: 'Bad Request: Missing userId' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.warn('[WeeklyStats] Invalid userId format:', userId);
      return res.status(400).json({ error: 'Bad Request: Invalid userId format' });
    }

    console.log(`[WeeklyStats] Processing request for user: ${userId}`);

    // 3. Calculate Week Boundaries (Monday-Sunday in Argentina TZ)
    const now = new Date();
    const argentinaFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // Get today's date in Argentina
    const todayArgentina = argentinaFormatter.format(now);

    // Get day of week in Argentina (0 = Sunday, 1 = Monday, ...)
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'short'
    });
    const dayName = dayFormatter.format(now);
    const daysMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
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

    console.log(`[WeeklyStats] Week range: ${monday} to ${sunday} (Today: ${todayArgentina})`);

    // 4. Query Workouts Count
    let workouts = 0;
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('date', monday)
        .lte('date', todayArgentina);

      if (workoutError) throw workoutError;
      workouts = workoutData?.length || 0;
    } catch (err) {
      console.error('[WeeklyStats] Error fetching workouts:', err);
      // Continue with 0
    }

    // 5. Calculate Protein Adherence
    let proteinAdherence = 0;
    try {
      // Get user's protein target
      const { data: profileData } = await supabase
        .from('profiles')
        .select('target_protein')
        .eq('user_id', userId)
        .single();

      const targetProtein = profileData?.target_protein || 170;

      // Get food logs grouped by date
      const { data: foodLogs } = await supabase
        .from('food_log')
        .select('date, protein')
        .eq('user_id', userId)
        .gte('date', monday)
        .lte('date', todayArgentina);

      if (foodLogs && foodLogs.length > 0) {
        // Group by date and sum protein
        const dailyProtein = {};
        for (const log of foodLogs) {
          if (!dailyProtein[log.date]) {
            dailyProtein[log.date] = 0;
          }
          dailyProtein[log.date] += parseFloat(log.protein) || 0;
        }

        // Calculate average adherence across days with data
        const days = Object.keys(dailyProtein);
        if (days.length > 0) {
          const totalAdherence = days.reduce((sum, day) => {
            const adherence = Math.min((dailyProtein[day] / targetProtein) * 100, 100);
            return sum + adherence;
          }, 0);
          proteinAdherence = Math.round(totalAdherence / days.length);
        }
      }
    } catch (err) {
      console.error('[WeeklyStats] Error calculating protein adherence:', err);
      // Continue with 0
    }

    // 6. Calculate Weight Delta
    let weightDelta = null;
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

      if (mondayWeight && latestWeight && mondayWeight.date !== latestWeight.date) {
        weightDelta = parseFloat((latestWeight.weight - mondayWeight.weight).toFixed(1));
      }
    } catch (err) {
      console.error('[WeeklyStats] Error calculating weight delta:', err);
      // Continue with null
    }

    // 7. Format Week Range in Spanish
    const monthsES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mondayParts = monday.split('-');
    const sundayParts = sunday.split('-');
    const weekRange = `${parseInt(mondayParts[2])} ${monthsES[parseInt(mondayParts[1]) - 1]} - ${parseInt(sundayParts[2])} ${monthsES[parseInt(sundayParts[1]) - 1]}`;

    // 8. Build Response
    const response = {
      workouts,
      proteinAdherence,
      weightDelta,
      weekRange
    };

    console.log('[WeeklyStats] Response:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('[WeeklyStats] Internal Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
