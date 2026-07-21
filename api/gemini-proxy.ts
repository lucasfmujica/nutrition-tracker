import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit } from './rateLimit.js';

const MAX_REQUEST_BYTES = 12 * 1024 * 1024;

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
    if (!process.env.ALLOWED_ORIGINS) {
        console.error(
            '[GeminiProxy] ALLOWED_ORIGINS is not set — CORS will reject all browser origins.',
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
        const rl = await checkRateLimit(`gemini:${user.id}`, 20, 60);
        if (!rl.allowed) {
            res.setHeader('Retry-After', String(rl.retryAfter));
            return res.status(429).json({ error: 'Too many AI requests' });
        }

        const { model, systemInstruction, generationConfig, request } = req.body || {};
        if (!model || typeof model !== 'string') {
            return res.status(400).json({ error: 'Bad Request: Missing model' });
        }
        // La cadena de fallback del cliente (geminiClient.GEMINI_FALLBACK_MODELS)
        // debe estar SIEMPRE permitida, aunque ALLOWED_GEMINI_MODELS en Vercel
        // haya quedado desactualizada — por eso se une al env en vez de
        // reemplazarse.
        const DEFAULT_MODELS = [
            'gemini-3.5-flash',
            'gemini-3-flash-preview',
            'gemini-2.5-flash',
        ];
        const allowedModels = new Set([
            ...DEFAULT_MODELS,
            ...(process.env.ALLOWED_GEMINI_MODELS || '')
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean),
        ]);
        if (!allowedModels.has(model)) {
            return res.status(400).json({ error: 'Bad Request: Unsupported model' });
        }
        if (request === undefined || request === null) {
            return res.status(400).json({ error: 'Bad Request: Missing request' });
        }
        if (
            systemInstruction !== undefined &&
            typeof systemInstruction !== 'string'
        ) {
            return res
                .status(400)
                .json({ error: 'Bad Request: Invalid system instruction' });
        }

        const requestBytes = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
        if (requestBytes > MAX_REQUEST_BYTES) {
            return res.status(413).json({ error: 'AI request is too large' });
        }

        const safeGenerationConfig =
            generationConfig &&
            typeof generationConfig === 'object' &&
            !Array.isArray(generationConfig)
                ? {
                      ...generationConfig,
                      maxOutputTokens: Math.min(
                          Math.max(
                              Number(generationConfig.maxOutputTokens) || 2048,
                              1,
                          ),
                          4096,
                      ),
                  }
                : { maxOutputTokens: 2048 };

        const genAI = new GoogleGenerativeAI(geminiKey);
        const generativeModel = genAI.getGenerativeModel({
            model,
            ...(systemInstruction ? { systemInstruction } : {}),
            generationConfig: safeGenerationConfig,
        });

        const result = await generativeModel.generateContent(request);
        const text = result.response.text();

        return res.status(200).json({ text });
    } catch (error: any) {
        const message = String(error?.message || error);
        console.error('[GeminiProxy] Error:', message);
        // Preserve upstream overload/rate-limit signals so the client can retry
        // with backoff and show an accurate message; everything else stays 502.
        if (message.includes('[503') || message.includes('high demand')) {
            return res.status(503).json({ error: 'AI service overloaded' });
        }
        if (message.includes('[429')) {
            return res.status(429).json({ error: 'AI rate limit reached' });
        }
        return res.status(502).json({ error: 'AI service error' });
    }
}
