/**
 * Vercel Serverless Function: Oura API CORS Proxy
 *
 * Purpose: Proxy requests to Oura Ring API to bypass CORS restrictions
 *
 * Usage:
 * GET /api/oura-proxy?endpoint=daily_sleep&start_date=2026-01-10&end_date=2026-01-17
 *
 * Environment Variables Required:
 * - VITE_OURA_TOKEN: Your Oura API personal access token
 */

const OURA_API_BASE = 'https://api.ouraring.com/v2/usercollection';

// Allowed Oura endpoints for security
const ALLOWED_ENDPOINTS = [
  'daily_readiness',
  'daily_sleep',
  'daily_activity',
  'sleep'
];

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, start_date, end_date } = req.query;

  // Validate required parameters
  if (!endpoint || !start_date || !end_date) {
    return res.status(400).json({
      error: 'Missing required parameters: endpoint, start_date, end_date'
    });
  }

  // Validate endpoint is allowed
  if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
    return res.status(400).json({
      error: `Invalid endpoint. Allowed: ${ALLOWED_ENDPOINTS.join(', ')}`
    });
  }

  // Get Oura API token from environment
  const token = process.env.VITE_OURA_TOKEN;
  if (!token) {
    console.error('[Oura Proxy] VITE_OURA_TOKEN not configured');
    return res.status(500).json({
      error: 'Server configuration error: API token not set'
    });
  }

  // Construct Oura API URL
  const ouraUrl = `${OURA_API_BASE}/${endpoint}?start_date=${start_date}&end_date=${end_date}`;

  try {
    console.log(`[Oura Proxy] Fetching: ${endpoint} (${start_date} to ${end_date})`);

    // Forward request to Oura API
    const response = await fetch(ouraUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if Oura API response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Oura Proxy] API Error: ${response.status} ${response.statusText}`, errorText);

      return res.status(response.status).json({
        error: `Oura API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    // Parse response from Oura
    const data = await response.json();

    // Set CORS headers to allow frontend access
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or restrict to your domain
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return the Oura API response
    return res.status(200).json(data);

  } catch (error) {
    console.error('[Oura Proxy] Fetch Error:', error);

    return res.status(500).json({
      error: 'Failed to fetch data from Oura API',
      message: error.message
    });
  }
}
