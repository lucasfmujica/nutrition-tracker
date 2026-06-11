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

import { VercelRequest, VercelResponse } from '@vercel/node';

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
            console.error(
                `[Oura OAuth] Token endpoint error (${grant_type}): ${response.status}`,
                data,
            );
            return res.status(response.status).json({
                error: `Oura token endpoint error: ${response.status}`,
                details: data,
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
        console.error('[Oura OAuth] Fetch error:', error);
        return res.status(500).json({
            error: 'Failed to reach Oura token endpoint',
            message: error.message,
        });
    }
}
