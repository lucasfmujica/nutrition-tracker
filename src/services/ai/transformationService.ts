/**
 * Transformation Service - AI-powered caption generation for transformation stories
 * Sprint 3: Social Sharing & Transformation Posts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProgressPhoto } from '../../types/domain';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface TransformationData {
    beforePhoto: ProgressPhoto;
    afterPhoto: ProgressPhoto;
    weightChange: number;
    daysDuration: number;
    goal: 'cut' | 'maintain' | 'bulk';
    measurements?: {
        waistChange?: number;
        bodyFatChange?: number;
        chestChange?: number;
    };
}

interface CaptionOptions {
    tone?: 'motivational' | 'factual' | 'humorous';
    includeEmojis?: boolean;
    maxLength?: number;
}

const SYSTEM_PROMPT = `Sos un coach motivacional de fitness que crea captions para historias de transformación.

IDIOMA: Usá español argentino con conjugación "vos" (ej: "lograste", "seguís", "podés").

REGLAS ESTRICTAS:
- Máximo 2-3 oraciones
- Destacá logros clave (pérdida de peso, cambios en medidas)
- Tono motivacional pero auténtico
- Incluí emojis relevantes (🔥 💪 🚀 ⚡ 💯)
- Evitá clichés genéricos
- Enfocate en la constancia y el esfuerzo

EJEMPLOS:
- "🔥 90 días de dedicación: -8kg y -6cm de cintura. La constancia siempre gana. ¡Seguimos! 💪"
- "De 85kg a 77kg en 3 meses. Cada día cuenta, cada esfuerzo suma. ¡Imparable! 🚀"
- "12 semanas, -10kg. No fue fácil, pero valió cada sacrificio. ¡A por más! ⚡"

FORMATO DE SALIDA (JSON):
{
  "caption": "string (2-3 oraciones con emojis)",
  "hashtags": ["string", "string", "string"] (3-5 hashtags relevantes en español),
  "tone": "motivational" | "factual" | "humorous"
}`;

/**
 * Generate AI-powered caption for transformation story
 */
export async function generateTransformationCaption(
    data: TransformationData,
    options: CaptionOptions = {},
): Promise<{ caption: string; hashtags: string[]; tone: string }> {
    const { tone = 'motivational', includeEmojis = true, maxLength = 200 } = options;

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.8, // More creative
            },
        });

        // Build prompt with transformation data
        const prompt = buildPrompt(data, tone, includeEmojis);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const parsed = JSON.parse(text);

        // Truncate caption if needed
        if (parsed.caption.length > maxLength) {
            parsed.caption = parsed.caption.substring(0, maxLength - 3) + '...';
        }

        return {
            caption: parsed.caption,
            hashtags: parsed.hashtags || [],
            tone: parsed.tone || tone,
        };
    } catch (error) {
        console.error('Error generating transformation caption:', error);

        // Fallback caption
        const fallbackCaption = generateFallbackCaption(data);
        return {
            caption: fallbackCaption,
            hashtags: ['#transformacion', '#fitness', '#progreso'],
            tone: 'motivational',
        };
    }
}

/**
 * Build prompt for Gemini with transformation data
 */
function buildPrompt(
    data: TransformationData,
    tone: string,
    includeEmojis: boolean,
): string {
    const {
        beforePhoto,
        afterPhoto,
        weightChange,
        daysDuration,
        goal,
        measurements,
    } = data;

    const weeks = Math.floor(daysDuration / 7);
    const months = Math.floor(daysDuration / 30);

    let prompt = `Generá un caption para esta transformación:\n\n`;
    prompt += `DATOS:\n`;
    prompt += `- Duración: ${daysDuration} días (${weeks} semanas, ~${months} meses)\n`;
    prompt += `- Cambio de peso: ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg\n`;
    prompt += `- Objetivo: ${goal === 'cut' ? 'Pérdida de peso' : goal === 'bulk' ? 'Ganancia muscular' : 'Mantenimiento'}\n`;

    if (measurements) {
        if (measurements.waistChange) {
            prompt += `- Cambio de cintura: ${measurements.waistChange > 0 ? '+' : ''}${measurements.waistChange.toFixed(1)}cm\n`;
        }
        if (measurements.bodyFatChange) {
            prompt += `- Cambio de grasa corporal: ${measurements.bodyFatChange > 0 ? '+' : ''}${measurements.bodyFatChange.toFixed(1)}%\n`;
        }
    }

    prompt += `\nTONO: ${tone}\n`;
    prompt += `EMOJIS: ${includeEmojis ? 'Sí, incluí emojis relevantes' : 'No incluyas emojis'}\n`;
    prompt += `\nGenerá un caption motivacional y auténtico en español argentino.`;

    return prompt;
}

/**
 * Generate fallback caption when AI fails
 */
function generateFallbackCaption(data: TransformationData): string {
    const { weightChange, daysDuration } = data;
    const weeks = Math.floor(daysDuration / 7);

    const weightText = Math.abs(weightChange).toFixed(1);
    const direction = weightChange < 0 ? 'perdí' : 'gané';

    return `🔥 ${weeks} semanas de esfuerzo: ${direction} ${weightText}kg. La constancia siempre gana. ¡Seguimos! 💪`;
}

/**
 * Regenerate caption with different tone
 */
export async function regenerateCaption(
    data: TransformationData,
    previousCaptions: string[] = [],
): Promise<{ caption: string; hashtags: string[]; tone: string }> {
    // Try different tones
    const tones: Array<'motivational' | 'factual' | 'humorous'> = [
        'motivational',
        'factual',
        'humorous',
    ];

    // Pick a tone we haven't used yet
    const usedTones = previousCaptions.length % tones.length;
    const tone = tones[usedTones];

    return generateTransformationCaption(data, { tone });
}
