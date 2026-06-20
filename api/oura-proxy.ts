/**
 * Vercel Serverless Function: Oura API CORS Proxy
 *
 * Purpose: Proxy requests to Oura Ring API to bypass CORS restrictions
 *
 * Usage:
 * GET /api/oura-proxy?endpoint=daily_sleep&start_date=2026-01-10&end_date=2026-01-17
 *
 * Auth: the client passes its per-user Oura access token in the Authorization
 * header (Bearer <oura_token>). That header carries the Oura PAT, NOT a Supabase
 * JWT — so this proxy cannot additionally verify a Supabase session without a
 * second header / breaking the existing client flow (src/hooks/useOuraSync.tsx).
 * The endpoint is therefore guarded by: a valid Oura token requirement, an
 * endpoint allowlist, date validation, and CORS restricted to ALLOWED_ORIGINS.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

const OURA_API_BASE = 'https://api.ouraring.com/v2/usercollection';

/** Strict YYYY-MM-DD date format expected by the Oura API. */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Allowed Oura endpoints for security
const ALLOWED_ENDPOINTS = [
    'daily_readiness',
    'daily_sleep',
    'daily_activity',
    'sleep',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS — restrict to the app's own origin(s); no wildcard.
    if (!process.env.ALLOWED_ORIGINS) {
        console.error(
            '[Oura Proxy] ALLOWED_ORIGINS is not set — CORS will reject all browser origins.',
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
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { endpoint, start_date, end_date } = req.query;

    // Validate required parameters
    if (!endpoint || !start_date || !end_date) {
        return res.status(400).json({
            error: 'Missing required parameters: endpoint, start_date, end_date',
        });
    }

    // Validate endpoint is allowed
    if (!ALLOWED_ENDPOINTS.includes(endpoint as string)) {
        return res.status(400).json({
            error: `Invalid endpoint. Allowed: ${ALLOWED_ENDPOINTS.join(', ')}`,
        });
    }

    // Validate date format before interpolating into the upstream URL.
    if (
        !DATE_REGEX.test(start_date as string) ||
        !DATE_REGEX.test(end_date as string)
    ) {
        return res.status(400).json({
            error: 'Invalid date format. Use YYYY-MM-DD for start_date and end_date.',
        });
    }

    // Get Oura API token: ONLY allow Authorization header from client
    const authHeader = req.headers.authorization;
    let token =
        authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

    if (!token) {
        console.error(
            '[Oura Proxy] No Oura token provided in header or environment',
        );
        return res.status(401).json({
            error: 'Authentication error: Oura API token not provided. Please configure it in Settings.',
        });
    }

    // Construct Oura API URL
    const ouraUrl = `${OURA_API_BASE}/${endpoint}?start_date=${start_date}&end_date=${end_date}`;

    try {
        console.log(
            `[Oura Proxy] Fetching: ${endpoint} (${start_date} to ${end_date})`,
        );

        // Forward request to Oura API
        const response = await fetch(ouraUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        // Check if Oura API response is OK
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `[Oura Proxy] API Error: ${response.status} ${response.statusText}`,
                errorText,
            );

            return res.status(response.status).json({
                error: `Oura API error: ${response.status} ${response.statusText}`,
            });
        }

        // Parse response from Oura
        const data = await response.json();

        // CORS headers were already set at the top of the handler (origin-scoped).
        // Return the Oura API response
        return res.status(200).json(data);
    } catch (error: any) {
        console.error('[Oura Proxy] Fetch Error:', error?.message || error);

        return res.status(500).json({
            error: 'Failed to fetch data from Oura API',
        });
    }
}
