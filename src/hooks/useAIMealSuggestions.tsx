import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MealSuggestion, suggestMeals } from '../services/ai/mealService';

export const useAIMealSuggestions = () => {
    const { i18n } = useTranslation();
    const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);

    const getSuggestions = async (remaining: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    }) => {
        setLoading(true);
        setError(null);
        setShowSuggestionModal(true); // Open modal immediately to show loading state
        try {
            const result = await suggestMeals({
                remainingCalories: remaining.calories,
                remainingProtein: remaining.protein,
                remainingCarbs: remaining.carbs,
                remainingFat: remaining.fat,
                language: i18n.language,
            });
            setSuggestions(result);
        } catch (err) {
            setError(
                i18n.language === 'es'
                    ? 'Error al generar sugerencias'
                    : 'Failed to generate suggestions',
            );
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return {
        suggestions,
        loading,
        error,
        getSuggestions,
        clearSuggestions: () => setSuggestions([]),
        showSuggestionModal,
        setShowSuggestionModal,
    };
};
