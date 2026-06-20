/**
 * Transformation Service - AI-powered caption generation for transformation stories
 * Sprint 3: Social Sharing & Transformation Posts
 */

import type { ProgressPhoto } from '../../types/domain';
import { generateGeminiContent } from './geminiClient';
import { parseLLMJson } from './parseLLMJson';

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
    language?: string;
}

const SYSTEM_PROMPT_ES = `Sos un coach motivacional de fitness que crea captions para historias de transformación.

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

const SYSTEM_PROMPT_EN = `You are a motivational fitness coach creating captions for transformation stories.

LANGUAGE: Use casual, motivating English.

STRICT RULES:
- Max 2-3 sentences
- Highlight key achievements (weight loss, measurement changes)
- Motivational but authentic tone
- Include relevant emojis (🔥 💪 🚀 ⚡ 💯)
- Avoid generic clichés
- Focus on consistency and effort

EXAMPLES:
- "🔥 90 days of dedication: -8kg and waist down. Consistency always wins. Let's go! 💪"
- "From 85kg to 77kg in 3 months. Every day counts. Unstoppable! 🚀"
- "12 weeks, -10kg. It wasn't easy, but every sacrifice was worth it. On to the next! ⚡"

OUTPUT FORMAT (JSON):
{
  "caption": "string (2-3 sentences with emojis)",
  "hashtags": ["string", "string", "string"] (3-5 relevant hashtags in English),
  "tone": "motivational" | "factual" | "humorous"
}`;

const getSystemPrompt = (language: string): string => {
    return language.startsWith('en') ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ES;
};

/**
 * Generate AI-powered caption for transformation story
 */
export async function generateTransformationCaption(
    data: TransformationData,
    options: CaptionOptions = {},
): Promise<{ caption: string; hashtags: string[]; tone: string }> {
    const {
        tone = 'motivational',
        includeEmojis = true,
        maxLength = 200,
        language = 'es',
    } = options;

    try {
        // Build prompt with transformation data
        const prompt = buildPrompt(data, tone, includeEmojis, language);

        const text = await generateGeminiContent({
            model: 'gemini-3.5-flash',
            systemInstruction: getSystemPrompt(language),
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.8, // More creative
            },
            request: prompt,
        });

        const parsed = parseLLMJson<{
            caption?: unknown;
            hashtags?: unknown;
            tone?: unknown;
        }>(text);

        // Validate caption is a usable string; fall back if not.
        if (typeof parsed.caption !== 'string' || !parsed.caption.trim()) {
            throw new Error('AI response missing a valid caption');
        }

        let caption = parsed.caption;

        // Truncate caption if needed (emoji-safe: split by code points to avoid
        // breaking surrogate pairs).
        if (caption.length > maxLength) {
            caption = [...caption].slice(0, maxLength - 3).join('') + '...';
        }

        return {
            caption,
            hashtags: Array.isArray(parsed.hashtags)
                ? (parsed.hashtags as string[])
                : [],
            tone: typeof parsed.tone === 'string' ? parsed.tone : tone,
        };
    } catch (error) {
        console.error('Error generating transformation caption:', error);

        // Fallback caption
        const fallbackCaption = generateFallbackCaption(data, language);
        const fallbackHashtags = language.startsWith('en')
            ? ['#transformation', '#fitness', '#progress']
            : ['#transformacion', '#fitness', '#progreso'];

        return {
            caption: fallbackCaption,
            hashtags: fallbackHashtags,
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
    language: string,
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
    const isEn = language.startsWith('en');

    let prompt = isEn
        ? `Generate a caption for this transformation:\n\n`
        : `Generá un caption para esta transformación:\n\n`;

    prompt += isEn ? `DATA:\n` : `DATOS:\n`;
    prompt += isEn
        ? `- Duration: ${daysDuration} days (${weeks} weeks, ~${months} months)\n`
        : `- Duración: ${daysDuration} días (${weeks} semanas, ~${months} meses)\n`;

    prompt += isEn
        ? `- Weight change: ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg\n`
        : `- Cambio de peso: ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg\n`;

    const goalMap = isEn
        ? { cut: 'Weight Loss', bulk: 'Muscle Gain', maintain: 'Maintenance' }
        : {
              cut: 'Pérdida de peso',
              bulk: 'Ganancia muscular',
              maintain: 'Mantenimiento',
          };

    const goalText = goalMap[goal] || goal;
    prompt += isEn ? `- Goal: ${goalText}\n` : `- Objetivo: ${goalText}\n`;

    if (measurements) {
        if (measurements.waistChange) {
            const label = isEn ? 'Waist change' : 'Cambio de cintura';
            prompt += `- ${label}: ${measurements.waistChange > 0 ? '+' : ''}${measurements.waistChange.toFixed(1)}cm\n`;
        }
        if (measurements.bodyFatChange) {
            const label = isEn ? 'Body fat change' : 'Cambio de grasa corporal';
            prompt += `- ${label}: ${measurements.bodyFatChange > 0 ? '+' : ''}${measurements.bodyFatChange.toFixed(1)}%\n`;
        }
    }

    prompt += `\n${isEn ? 'TONE' : 'TONO'}: ${tone}\n`;

    if (isEn) {
        prompt += `EMOJIS: ${includeEmojis ? 'Yes, include relevant emojis' : 'No emojis'}\n`;
        prompt += `\nGenerate a motivational and authentic caption in English.`;
    } else {
        prompt += `EMOJIS: ${includeEmojis ? 'Sí, incluí emojis relevantes' : 'No incluyas emojis'}\n`;
        prompt += `\nGenerá un caption motivacional y auténtico en español argentino.`;
    }

    return prompt;
}

/**
 * Generate fallback caption when AI fails
 */
function generateFallbackCaption(
    data: TransformationData,
    language: string,
): string {
    const { weightChange, daysDuration } = data;
    const weeks = Math.floor(daysDuration / 7);

    const weightText = Math.abs(weightChange).toFixed(1);
    const isEn = language.startsWith('en');

    if (isEn) {
        const direction = weightChange < 0 ? 'lost' : 'gained';
        return `🔥 ${weeks} weeks of effort: ${direction} ${weightText}kg. Consistency always wins. Let's go! 💪`;
    } else {
        const direction = weightChange < 0 ? 'perdí' : 'gané';
        return `🔥 ${weeks} semanas de esfuerzo: ${direction} ${weightText}kg. La constancia siempre gana. ¡Seguimos! 💪`;
    }
}

/**
 * Regenerate caption with different tone
 */
export async function regenerateCaption(
    data: TransformationData,
    previousCaptions: string[] = [],
    language: string = 'es',
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

    return generateTransformationCaption(data, { tone, language });
}
