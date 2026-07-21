/**
 * Gemini Client (browser-side)
 *
 * Calls the server-side /api/gemini-proxy instead of talking to Google directly,
 * so the Gemini API key never ships in the public bundle. Attaches the user's
 * Supabase JWT for authentication.
 */
import { devLog } from '../../utils/devLog';
import { supabase } from '../../lib/supabase';

/**
 * Cadena de fallback ante saturación del modelo principal (503 "high demand",
 * timeouts): se prueba cada modelo en orden. Un modelo retirado falla rápido y
 * se pasa al siguiente. Debe coincidir con el allowlist del proxy.
 */
export const GEMINI_FALLBACK_MODELS = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
];

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
    /**
     * Client-side timeout PER ATTEMPT for the proxy fetch. Keep below the
     * proxy's maxDuration in vercel.json (60s).
     */
    timeoutMs?: number;
    /**
     * Modelos alternativos a probar (en orden) si el principal falla con un
     * error transitorio del proveedor (502/503/504).
     */
    fallbackModels?: string[];
}

const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:3000';

/** Errores del proveedor/infra donde vale la pena probar otro modelo. */
const isModelFallbackEligible = (status?: number): boolean =>
    status === 502 || status === 503 || status === 504;

async function callProxy(
    token: string,
    body: Record<string, unknown>,
    timeoutMs: number,
): Promise<string> {
    let res: Response;
    try {
        res = await fetch(`${baseUrl}/api/gemini-proxy`, {
            method: 'POST',
            signal: AbortSignal.timeout(timeoutMs),
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
    } catch (err: any) {
        // AbortSignal.timeout lanza TimeoutError/AbortError: convertirlo en un
        // error retryable (status 504) con mensaje claro para el usuario.
        if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
            const timeoutError = new Error(
                'La IA tardó demasiado en responder. Probá de nuevo.',
            ) as Error & { status?: number };
            timeoutError.status = 504;
            throw timeoutError;
        }
        throw err;
    }

    if (!res.ok) {
        let message = 'Error en el servicio de IA';
        try {
            const resBody = await res.json();
            if (resBody?.error) message = resBody.error;
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

/**
 * Generate content via the Gemini proxy and return the raw response text.
 * Prueba el modelo principal y, ante errores transitorios del proveedor,
 * cada modelo de `fallbackModels` en orden.
 * @throws Error if there is no session or every model fails.
 */
export async function generateGeminiContent(
    config: GeminiContentConfig,
): Promise<string> {
    if (!supabase) {
        throw new Error('Supabase no está configurado.');
    }

    // getSession puede quedar bloqueado en el navigator lock de auth (p.ej. si
    // otro tab/refresh lo retiene); con un tope de 8s el caller muestra error
    // en vez de un spinner infinito.
    const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
            setTimeout(
                () => reject(new Error('Timeout obteniendo la sesión para la IA.')),
                8000,
            ),
        ),
    ]);
    const token = sessionResult.data.session?.access_token;
    if (!token) {
        throw new Error('No hay sesión activa para usar la IA.');
    }

    const { timeoutMs = 25000, fallbackModels = [], model, ...rest } = config;
    const modelChain = [model, ...fallbackModels];

    let lastError: unknown;
    for (const candidate of modelChain) {
        try {
            return await callProxy(token, { ...rest, model: candidate }, timeoutMs);
        } catch (err) {
            lastError = err;
            const status = (err as { status?: number })?.status;
            const isLast = candidate === modelChain[modelChain.length - 1];
            if (isLast || !isModelFallbackEligible(status)) {
                throw err;
            }
            console.warn(
                `[geminiClient] Model ${candidate} failed (status ${status}), trying fallback...`,
            );
            devLog('[geminiClient] Fallback cause:', err);
        }
    }
    // Unreachable (the loop always returns or throws), but keeps TS honest.
    throw lastError;
}
