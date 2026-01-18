
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client with Service Role Key for Admin Access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { apiKey, userId, data } = req.body;

    // 1. Security Check
    if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
      console.warn('[SyncHealth] Unauthorized access attempt.');
      return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    // 2. Data Validation
    if (!userId || !data || !data.weight || !data.date) {
      console.warn('[SyncHealth] Missing required fields:', { userId, data });
      return res.status(400).json({ error: 'Bad Request: Missing userId, weight, or date' });
    }

    console.log(`[SyncHealth] Processing sync for User: ${userId}, Date: ${data.date}, Weight: ${data.weight}`);

    // 3. Date Formatting (Argentina Timezone)
    // Incoming date is ISO string (e.g., 2024-01-18T08:00:00Z)
    // We need YYYY-MM-DD in Argentina (UTC-3)
    const argentinaDate = new Date(data.date).toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-'); // Convert DD/MM/YYYY to YYYY-MM-DD

    // 4. Construct Payload
    const payload = {
      user_id: userId,
      date: argentinaDate,
      weight: parseFloat(data.weight),
      // Note: bodyFat is received but `weight_history` schema lacks a body_fat column currently.
      // We process it to logs for now to ensure we don't break the request.
      // body_fat: data.bodyFat ? parseFloat(data.bodyFat) : null
    };

    if (data.bodyFat) {
      console.log(`[SyncHealth] Received bodyFat (${data.bodyFat}%) but column missing in schema. Skipping save.`);
    }

    // 5. Upsert to Supabase
    const { data: inserted, error } = await supabase
      .from('weight_history')
      .upsert(payload, { onConflict: 'user_id, date' })
      .select();

    if (error) {
      console.error('[SyncHealth] Supabase Error:', error);
      throw error;
    }

    console.log('[SyncHealth] Success:', inserted);
    return res.status(200).json({ success: true, message: 'Data synced successfully', data: inserted });

  } catch (error) {
    console.error('[SyncHealth] Internal Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
