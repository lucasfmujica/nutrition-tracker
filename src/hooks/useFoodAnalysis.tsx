/**
 * useFoodAnalysis Hook
 * AI-powered food recognition hook using Gemini Vision API
 * Specialized for Argentine cuisine with automatic macro calculation
 */

import { useState } from 'react';
import { getGeminiVisionModel } from '../services/ai/geminiVision';

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
            // Convert file to base64
            const base64Image = await fileToBase64(file);

            // Get model instance
            const model = getGeminiVisionModel();

            // Prepare the image part
            const imagePart = {
                inlineData: {
                    data: (base64Image as string).split(',')[1], // Remove data:image/...;base64, prefix
                    mimeType: file.type,
                },
            };

            // Generate content with image (prompt is now in systemInstruction)
            const response = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: 'Describe la comida en la imagen y calcula sus macros.',
                            },
                            imagePart,
                        ],
                    },
                ],
            });

            // Get response text
            const responseText = response.response.text();

            // Parse JSON response
            const parsedResult = JSON.parse(responseText) as FoodAnalysisResult;

            // Handle case where no meal is detected
            if (!parsedResult.meal_detected) {
                throw new Error(
                    'No se pudo detectar comida en la imagen. Intenta con una foto más clara.',
                );
            }

            // Validate response essentials
            if (!parsedResult.items || !parsedResult.total_macros) {
                throw new Error(
                    'La IA no pudo calcular los macros correctamente. Intenta de nuevo.',
                );
            }

            // Ensure fiber exists (default to 0 if missing)
            if (!parsedResult.total_macros.fiber) {
                parsedResult.total_macros.fiber = 0;
            }

            setResult(parsedResult);
            setIsLoading(false);
            return parsedResult;
        } catch (err: any) {
            console.error('[useFoodAnalysis] Error analyzing food:', err);

            let errorMessage =
                'Error al analizar la imagen. Por favor, intenta nuevamente.';

            if (err.message?.includes('API key')) {
                errorMessage =
                    'Error de configuración de API. Verifica la clave de Gemini.';
            } else if (err.message?.includes('JSON')) {
                errorMessage =
                    'Error al procesar la respuesta de IA. Intenta con otra imagen.';
            } else if (
                err.message?.includes('quota') ||
                err.message?.includes('limit')
            ) {
                errorMessage =
                    'Límite de API alcanzado. Por favor, intenta más tarde.';
            }

            setError(errorMessage);
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
