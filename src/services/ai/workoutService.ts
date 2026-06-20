/**
 * Gemini Workout Service
 * Parses Gravl workout screenshots into structured JSON data
 */

import { generateGeminiContent } from './geminiClient';
import { parseLLMJson } from './parseLLMJson';

const MODEL_NAME = 'gemini-3.5-flash'; // Pro for better extraction reasoning

const SYSTEM_PROMPT_ES = `Act as a Fitness Data Parser specialized in the Gravl app.
I will provide 1 to 3 screenshots of a single gym session.

EXTRACTION & CONSOLIDATION RULES:
1. Multi-Image: Merge all images into one workout. De-duplicate if an exercise is split.
2. Terminology: Use Argentine Spanish (e.g., 'Prensa', 'Vuelo lateral').
3. Volume (PRIORITY): Extract 'Total Volume' or 'Volumen Total' from the Gravl summary. Use that exact number.
4. Data Types (CRITICAL): To match the existing Supabase JSONB schema, 'sets', 'reps', and 'weight' MUST be returned as STRINGS.

STRICT OUTPUT SCHEMA:
Return ONLY this JSON format:
{
  "date": "YYYY-MM-DD",
  "type": "gym",
  "name": "string (Workout Title)",
  "duration": number,
  "calories": number,
  "volume": number,
  "notes": "string",
  "exercises": [
    {
      "name": "string",
      "sets": "string",
      "reps": "string",
      "weight": "string"
    }
  ]
}`;

const SYSTEM_PROMPT_EN = `Act as a Fitness Data Parser specialized in the Gravl app.
I will provide 1 to 3 screenshots of a single gym session.

EXTRACTION & CONSOLIDATION RULES:
1. Multi-Image: Merge all images into one workout. De-duplicate if an exercise is split.
2. Terminology: Use English terminology.
3. Volume (PRIORITY): Extract 'Total Volume' from the Gravl summary. Use that exact number.
4. Data Types (CRITICAL): To match the existing Supabase JSONB schema, 'sets', 'reps', and 'weight' MUST be returned as STRINGS.

STRICT OUTPUT SCHEMA:
Return ONLY this JSON format:
{
  "date": "YYYY-MM-DD",
  "type": "gym",
  "name": "string (Workout Title)",
  "duration": number,
  "calories": number,
  "volume": number,
  "notes": "string",
  "exercises": [
    {
      "name": "string",
      "sets": "string",
      "reps": "string",
      "weight": "string"
    }
  ]
}`;

const getSystemPrompt = (language: string): string => {
    return language.startsWith('en') ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ES;
};

interface ExerciseParsed {
    name: string;
    sets: string;
    reps: string;
    weight: string;
}

export interface WorkoutParsed {
    date: string;
    type: string;
    name: string;
    duration: number;
    calories: number;
    volume: number;
    notes: string;
    exercises: ExerciseParsed[];
}

/**
 * Converts a File object to a GoogleGenerativeAI Part object.
 */
async function fileToGenerativePart(
    file: File,
): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            if (!base64Data) {
                reject(new Error('Imagen inválida'));
                return;
            }
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Analyzes workout screenshots and returns structured JSON
 * @param {File[]} imageFiles - Array of image files
 * @param {string} language - Language code ('es' or 'en')
 * @returns {Promise<Object>} - Parsed workout data
 */
export const analyzeWorkoutImages = async (
    imageFiles: File[],
    language: string = 'es',
): Promise<WorkoutParsed> => {
    try {
        const imageParts = await Promise.all(
            imageFiles.map((file) => fileToGenerativePart(file)),
        );

        const promptTest = language.startsWith('en')
            ? 'Extract workout data from these Gravl screenshots.'
            : 'Extrae los datos de entrenamiento de estas capturas de Gravl.';

        const text = await generateGeminiContent({
            model: MODEL_NAME,
            systemInstruction: getSystemPrompt(language),
            generationConfig: { responseMimeType: 'application/json' },
            request: [promptTest, ...imageParts],
        });

        return parseLLMJson<WorkoutParsed>(text);
    } catch (error) {
        console.error('Error analyzing workout images:', error);
        throw new Error('Failed to analyze workout images. Please try again.');
    }
};
