/**
 * Gemini Client (browser-side)
 *
 * Calls the server-side /api/gemini-proxy instead of talking to Google directly,
 * so the Gemini API key never ships in the public bundle. Attaches the user's
 * Supabase JWT for authentication.
 */
import { supabase } from '../../lib/supabase';

export interface GeminiContentConfig {
    /** Gemini model id, e.g. 'gemini-3.5-flash'. */
    model: string;
    /** Optional system prompt. */
    systemInstruction?: string;
    /** Optional generation config (responseMimeType, temperature, ...). */
    generationConfig?: Record<string, unknown>;
    /**
     * Passed verbatim to model.generateContent() on the server. May be a string,
     * an array of parts, or a full { contents: [...] } request object.
     */
    request: unknown;
}

const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:3000';

/**
 * Generate content via the Gemini proxy and return the raw response text.
 * @throws Error if there is no session or the request fails.
 */
export async function generateGeminiContent(
    config: GeminiContentConfig,
): Promise<string> {
    if (!supabase) {
        throw new Error('Supabase no está configurado.');
    }

    const {
        data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
        throw new Error('No hay sesión activa para usar la IA.');
    }

    const res = await fetch(`${baseUrl}/api/gemini-proxy`, {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
    });

    if (!res.ok) {
        let message = 'Error en el servicio de IA';
        try {
            const body = await res.json();
            if (body?.error) message = body.error;
        } catch {
            // ignore parse errors, use default message
        }
        // Attach the HTTP status so callers (e.g. retryWithBackoff) can decide
        // whether the error is retryable (429/5xx) or not (other 4xx).
        const error = new Error(message) as Error & { status?: number };
        error.status = res.status;
        throw error;
    }

    const { text } = await res.json();
    return text as string;
}
