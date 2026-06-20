/**
 * useFoodAnalysis Hook
 * AI-powered food recognition hook using Gemini Vision API
 * Specialized for Argentine cuisine with automatic macro calculation
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../context/ToastContext';
import { analyzeFoodImage } from '../services/ai/geminiVision';
import { parseLLMJson } from '../services/ai/parseLLMJson';
import { validateImageQuality } from '../utils/imageValidation';
import { retryWithBackoff } from '../utils/retryWithBackoff';
import { useScanHistory } from './useScanHistory';

export interface FoodAnalysisItem {
    id: string;
    name: string;
    amount: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

export interface FoodAnalysisResult {
    meal_detected: boolean;
    meal_name: string;
    description: string;
    items: FoodAnalysisItem[];
    total_macros: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
    };
    confidence: number;
}

interface UseFoodAnalysisReturn {
    analyzeFood: (file: File) => Promise<FoodAnalysisResult | null>;
    isLoading: boolean;
    result: FoodAnalysisResult | null;
    error: string | null;
    resetResult: () => void;
}

/**
 * Custom hook for AI food analysis from images
 * @returns {UseFoodAnalysisReturn} { analyzeFood, isLoading, result, error, resetResult }
 */
export const useFoodAnalysis = (): UseFoodAnalysisReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<FoodAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { i18n } = useTranslation();
    const { saveScanToHistory } = useScanHistory();

    /**
     * Analyze food image using Gemini Vision API
     * @param {File} file - Image file to analyze
     * @returns {Promise<FoodAnalysisResult | null>} Parsed nutrition data
     */
    const analyzeFood = async (file: File): Promise<FoodAnalysisResult | null> => {
        if (!file) {
            setError('No se proporcionó ninguna imagen');
            return null;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Pre-scan validation
            const timestamp = new Date().toISOString();
            console.log(`[FoodAnalysis ${timestamp}] Starting image validation...`);

            const validationResult = await validateImageQuality(file);

            // Show warnings but allow continuation
            if (validationResult.warnings.length > 0) {
                console.warn(`[FoodAnalysis ${timestamp}] Validation warnings:`, validationResult.warnings);
                // Could show warnings to user here via a toast/notification
            }

            // Block if critical errors
            if (!validationResult.isValid) {
                const errorMsg = validationResult.errors.join('. ');
                console.error(`[FoodAnalysis ${timestamp}] ✗ Validation failed:`, errorMsg);
                throw new Error(errorMsg);
            }

            console.log(`[FoodAnalysis ${timestamp}] ✓ Validation passed`);

            // Convert file to base64
            const base64Image = await fileToBase64(file);

            // Remove the data:image/...;base64, prefix and validate.
            const base64Data = (base64Image as string).split(',')[1];
            if (!base64Data) {
                throw new Error('Imagen inválida');
            }

            // Prepare the image part
            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            };

            // Generate content with retry logic (exponential backoff)
            // Routed through the server-side proxy so the Gemini key stays private.
            console.log(`[FoodAnalysis ${timestamp}] Sending request to Gemini API...`);

            const responseText = await retryWithBackoff(async () => {
                return analyzeFoodImage(
                    {
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    {
                                        text: i18n.language.startsWith('en')
                                            ? 'Describe the food in this image and calculate macros.'
                                            : 'Describe la comida en la imagen y calcula sus macros.',
                                    },
                                    imagePart,
                                ],
                            },
                        ],
                    },
                    i18n.language,
                );
            }, 3, 1000);

            console.log(`[FoodAnalysis ${timestamp}] ✓ API response received`);

            // Parse JSON response
            const parsedResult = parseLLMJson<FoodAnalysisResult>(responseText);

            // Handle case where no meal is detected
            if (!parsedResult.meal_detected) {
                throw new Error(
                    i18n.language.startsWith('en')
                        ? 'Could not detect food in the image. Try a clearer photo.'
                        : 'No se pudo detectar comida en la imagen. Intenta con una foto más clara.',
                );
            }

            // Validate response essentials
            if (!Array.isArray(parsedResult.items) || !parsedResult.total_macros) {
                throw new Error(
                    i18n.language.startsWith('en')
                        ? 'AI could not calculate macros correctly. Please try again.'
                        : 'La IA no pudo calcular los macros correctamente. Intenta de nuevo.',
                );
            }

            // Sanitize nutritional values: coerce to safe non-negative numbers.
            parsedResult.items = parsedResult.items.map((item) => ({
                ...item,
                calories: toNumber(item.calories),
                protein: toNumber(item.protein),
                carbs: toNumber(item.carbs),
                fat: toNumber(item.fat),
                fiber: toNumber(item.fiber),
            }));

            parsedResult.total_macros = {
                calories: toNumber(parsedResult.total_macros.calories),
                protein: toNumber(parsedResult.total_macros.protein),
                carbs: toNumber(parsedResult.total_macros.carbs),
                fat: toNumber(parsedResult.total_macros.fat),
                fiber: toNumber(parsedResult.total_macros.fiber),
            };

            // Save successful scan to history
            try {
                await saveScanToHistory(file, {
                    foodName: parsedResult.meal_name,
                    calories: parsedResult.total_macros.calories,
                    protein: parsedResult.total_macros.protein,
                    carbs: parsedResult.total_macros.carbs,
                    fat: parsedResult.total_macros.fat,
                    confidence: parsedResult.confidence,
                    ingredients: parsedResult.items?.map((item) => item.name),
                });
                console.log(`[FoodAnalysis ${timestamp}] ✓ Scan saved to history`);
            } catch (historyErr) {
                // Non-critical error - don't block the main flow
                console.error(`[FoodAnalysis ${timestamp}] ⚠ Failed to save to history:`, historyErr);
            }

            setResult(parsedResult);
            setIsLoading(false);
            return parsedResult;
        } catch (err: any) {
            console.error('[useFoodAnalysis] Error analyzing food:', err);

            let errorMessage = i18n.language.startsWith('en')
                ? 'Error analyzing image. Please try again.'
                : 'Error al analizar la imagen. Por favor, intenta nuevamente.';

            if (err.message?.includes('API key')) {
                errorMessage = i18n.language.startsWith('en')
                    ? 'API configuration error. Check Gemini key.'
                    : 'Error de configuración de API. Verifica la clave de Gemini.';
            } else if (err.message?.includes('JSON')) {
                errorMessage = i18n.language.startsWith('en')
                    ? 'Error processing AI response. Try another image.'
                    : 'Error al procesar la respuesta de IA. Intenta con otra imagen.';
            } else if (
                err.message?.includes('quota') ||
                err.message?.includes('limit')
            ) {
                errorMessage = i18n.language.startsWith('en')
                    ? 'API limit reached. Please try again later.'
                    : 'Límite de API alcanzado. Por favor, intenta más tarde.';
            }

            setError(errorMessage);
            toast.error(errorMessage);
            setIsLoading(false);
            return null;
        }
    };

    /**
     * Reset the analysis result
     */
    const resetResult = () => {
        setResult(null);
        setError(null);
    };

    return {
        analyzeFood,
        isLoading,
        result,
        error,
        resetResult,
    };
};

/**
 * Helper: Coerce an unknown value into a safe non-negative number.
 * Returns 0 for non-finite or negative inputs (mirrors voiceMealService).
 */
const toNumber = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * Helper: Convert File to Base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string | ArrayBuffer | null>} Base64 encoded string
 */
const fileToBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
