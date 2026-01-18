/**
 * useFoodAnalysis Hook
 * AI-powered food recognition hook using Gemini Vision API
 * Specialized for Argentine cuisine with automatic macro calculation
 */

import { useState } from 'react';
import { getGeminiVisionModel, SYSTEM_PROMPT } from '../services/ai/geminiVision';

/**
 * Custom hook for AI food analysis from images
 * @returns {object} { analyzeFood, isLoading, result, error, resetResult }
 */
export const useFoodAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Analyze food image using Gemini Vision API
   * @param {File} file - Image file to analyze
   * @returns {Promise<object>} Parsed nutrition data
   */
  const analyzeFood = async (file) => {
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
          data: base64Image.split(',')[1], // Remove data:image/...;base64, prefix
          mimeType: file.type
        }
      };

      // Generate content with system instruction and image
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: SYSTEM_PROMPT },
              imagePart
            ]
          }
        ]
      });

      // Get response text
      const responseText = response.response.text();

      // Strip markdown code fences if present (```json ... ```)
      const cleanedText = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      // Parse JSON response
      const parsedResult = JSON.parse(cleanedText);

      // Validate response structure
      if (!parsedResult.meal_detected || !parsedResult.items || !parsedResult.total_macros) {
        throw new Error('Respuesta de IA incompleta. Por favor, intenta con otra imagen.');
      }

      // Ensure fiber exists (default to 0 if missing)
      if (!parsedResult.total_macros.fiber) {
        parsedResult.total_macros.fiber = 0;
      }

      setResult(parsedResult);
      setIsLoading(false);
      return parsedResult;

    } catch (err) {
      console.error('[useFoodAnalysis] Error analyzing food:', err);

      let errorMessage = 'Error al analizar la imagen. Por favor, intenta nuevamente.';

      if (err.message?.includes('API key')) {
        errorMessage = 'Error de configuración de API. Verifica la clave de Gemini.';
      } else if (err.message?.includes('JSON')) {
        errorMessage = 'Error al procesar la respuesta de IA. Intenta con otra imagen.';
      } else if (err.message?.includes('quota') || err.message?.includes('limit')) {
        errorMessage = 'Límite de API alcanzado. Por favor, intenta más tarde.';
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
    resetResult
  };
};

/**
 * Helper: Convert File to Base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 encoded string
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
