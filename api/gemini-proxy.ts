import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Gemini Proxy
 *
 * Keeps the Gemini API key server-side. The client never sees it.
 * SECURITY: requires a valid Supabase JWT so the endpoint can't be abused by
 * third parties to burn the project's Gemini quota.
 *
 * Body: { model, systemInstruction?, generationConfig?, request }
 * where `request` is passed verbatim to model.generateContent() — it may be a
 * string, an array of parts, or a full { contents: [...] } request object.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS — restrict to the app's own origin(s).
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
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type',
    );

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const geminiKey =
            process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!geminiKey) {
            console.error('[GeminiProxy] Missing GEMINI_API_KEY');
            return res.status(500).json({ error: 'Server Misconfiguration' });
        }
        if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[GeminiProxy] Missing Supabase env');
            return res.status(500).json({ error: 'Server Misconfiguration' });
        }

        // Authenticate the caller via their Supabase JWT.
        const authHeader = (req.headers.authorization as string) || '';
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length).trim()
            : '';
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Missing token' });
        }

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
        );
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);
        if (authError || !user?.id) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        const { model, systemInstruction, generationConfig, request } = req.body || {};
        if (!model || typeof model !== 'string') {
            return res.status(400).json({ error: 'Bad Request: Missing model' });
        }
        if (request === undefined || request === null) {
            return res.status(400).json({ error: 'Bad Request: Missing request' });
        }

        const genAI = new GoogleGenerativeAI(geminiKey);
        const generativeModel = genAI.getGenerativeModel({
            model,
            ...(systemInstruction ? { systemInstruction } : {}),
            ...(generationConfig ? { generationConfig } : {}),
        });

        const result = await generativeModel.generateContent(request);
        const text = result.response.text();

        return res.status(200).json({ text });
    } catch (error: any) {
        console.error('[GeminiProxy] Error:', error?.message || error);
        // Don't leak provider internals to the client.
        return res.status(502).json({ error: 'AI service error' });
    }
}
