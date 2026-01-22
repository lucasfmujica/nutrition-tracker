/**
 * Gemini Workout Service
 * Parses Gravl workout screenshots into structured JSON data
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const MODEL_NAME = 'gemini-1.5-flash'; // Flash is balanced for OCR tasks like this

const SYSTEM_PROMPT = `Act as a Fitness Data Parser specialized in the Gravl app.
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
 * @returns {Promise<Object>} - Parsed workout data
 */
export const analyzeWorkoutImages = async (
    imageFiles: File[],
): Promise<WorkoutParsed> => {
    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
                responseMimeType: 'application/json',
            },
        });

        const imageParts = await Promise.all(
            imageFiles.map((file) => fileToGenerativePart(file)),
        );

        const result = await model.generateContent([
            'Extrae los datos de entrenamiento de estas capturas de Gravl.',
            ...imageParts,
        ]);

        const response = await result.response;
        const text = response.text();

        return JSON.parse(text);
    } catch (error) {
        console.error('Error analyzing workout images:', error);
        throw new Error('Failed to analyze workout images. Please try again.');
    }
};
