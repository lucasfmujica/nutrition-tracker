/**
 * Vercel Serverless Function: Oura OAuth2 Token Exchange
 *
 * Purpose: Exchanges an OAuth2 authorization code for access/refresh tokens,
 * and refreshes expired access tokens. The client secret never reaches the
 * browser — this function is the only place that talks to Oura's token endpoint.
 *
 * Usage:
 *   POST /api/oura-oauth
 *   Body (authorization code exchange):
 *     { "grant_type": "authorization_code", "code": "<code>", "redirect_uri": "https://your-app.vercel.app/" }
 *   Body (token refresh):
 *     { "grant_type": "refresh_token", "refresh_token": "<refresh_token>" }
 *
 *   Response: { access_token, refresh_token, expires_in, token_type }
 *
 * Environment Variables Required (set in Vercel Project Settings):
 *   - OURA_CLIENT_ID:     Client ID of your Oura OAuth2 application
 *   - OURA_CLIENT_SECRET: Client Secret of your Oura OAuth2 application
 *
 * Oura Cloud configuration (https://cloud.ouraring.com/oauth/applications):
 *   - Create an OAuth2 application and register the Redirect URI as the ROOT
 *     of the deployed app, e.g.:
 *       https://<your-app>.vercel.app/
 *     (and optionally http://localhost:5173/ for local development).
 *     The redirect_uri sent by the frontend must match exactly.
 *   - Authorize endpoint: https://cloud.ouraring.com/oauth/authorize
 *   - Token endpoint:     https://api.ouraring.com/oauth/token
 */

import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit } from './rateLimit.js';

const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientId = process.env.OURA_CLIENT_ID;
    const clientSecret = process.env.OURA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error(
            '[Oura OAuth] Missing OURA_CLIENT_ID / OURA_CLIENT_SECRET env vars',
        );
        return res.status(500).json({
            error: 'Oura OAuth is not configured on the server (missing OURA_CLIENT_ID / OURA_CLIENT_SECRET).',
        });
    }

    // SECURITY: this endpoint uses the server's secret Oura OAuth credentials,
    // so it must not be an open proxy. Require a valid Supabase JWT before
    // exchanging/refreshing any token (same pattern as gemini-proxy).
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[Oura OAuth] Missing Supabase env');
        return res.status(500).json({ error: 'Server Misconfiguration' });
    }
    const authHeader = (req.headers.authorization as string) || '';
    const accessToken = authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : '';
    if (!accessToken) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Rate limit per authenticated user; fall back to the caller IP if for some
    // reason no userId is available at this point.
    const rateLimitKey = user.id
        ? `oura-oauth:${user.id}`
        : `oura-oauth:ip:${(req.headers['x-forwarded-for'] as string) || 'unknown'}`;
    const rl = await checkRateLimit(rateLimitKey, 15, 60);
    if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfter));
        return res.status(429).json({ error: 'Too Many Requests' });
    }

    const { grant_type, code, redirect_uri, refresh_token } = req.body ?? {};

    const params = new URLSearchParams();
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);

    if (grant_type === 'authorization_code') {
        if (!code || !redirect_uri) {
            return res.status(400).json({
                error: 'Missing required parameters: code, redirect_uri',
            });
        }
        params.set('grant_type', 'authorization_code');
        params.set('code', code);
        params.set('redirect_uri', redirect_uri);
    } else if (grant_type === 'refresh_token') {
        if (!refresh_token) {
            return res.status(400).json({
                error: 'Missing required parameter: refresh_token',
            });
        }
        params.set('grant_type', 'refresh_token');
        params.set('refresh_token', refresh_token);
    } else {
        return res.status(400).json({
            error: 'Invalid grant_type. Allowed: authorization_code, refresh_token',
        });
    }

    try {
        const response = await fetch(OURA_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            // Log provider details server-side only; don't leak them to the client.
            console.error(
                `[Oura OAuth] Token endpoint error (${grant_type}): ${response.status}`,
                data,
            );
            return res.status(response.status).json({
                error: `Oura token endpoint error: ${response.status}`,
            });
        }

        // Pass through only the fields the frontend needs
        return res.status(200).json({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            token_type: data.token_type,
        });
    } catch (error: any) {
        // Log the underlying error server-side; return a generic message.
        console.error('[Oura OAuth] Fetch error:', error?.message || error);
        return res.status(500).json({
            error: 'Failed to reach Oura token endpoint',
        });
    }
}
