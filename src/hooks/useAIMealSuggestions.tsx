import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MealSuggestion,
    suggestMealsWithContext,
} from '../services/ai/mealService';
import {
    AIChefContext,
    AIChefMealTime,
    AIChefPreferences,
    DietaryMode,
    Difficulty,
    FoodEntry,
    Macros,
    PrepTime,
    Workout,
} from '../types/domain';

import {
    DIETARY_PREFS_UPDATED_EVENT,
    REJECTED_MEALS_EXPIRY_DAYS,
    loadDietaryPreferences,
    saveDietaryPreferences,
} from '../utils/dietaryPreferences';

// =====================================================
// CONSTANTS
// =====================================================

type AIChefTab = 'suggestions' | 'ingredients' | 'config';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Infer meal time from current hour (Argentina timezone)
 */
const inferMealTime = (hour: number): AIChefMealTime => {
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 19) return 'snack';
    if (hour >= 19 && hour < 22) return 'dinner';
    return 'late_night'; // 22:00 - 05:00
};

/**
 * Get current hour in Argentina timezone
 */
const getArgentinaHour = (): number => {
    const now = new Date();
    const argentinaTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })
    );
    return argentinaTime.getHours();
};

// =====================================================
// HOOK INTERFACE
// =====================================================

interface UseAIMealSuggestionsParams {
    // These will be passed from TrackerContext
    foodLog?: FoodEntry[];
    workoutLog?: Workout[];
    getTotalsForDate?: (date: string) => Macros;
    getTargetsForDate?: (date: string) => Macros;
    selectedDate?: string;
    weeklyPlan?: any;
}

interface UseAIMealSuggestionsReturn {
    // Suggestions state
    suggestions: MealSuggestion[];
    loading: boolean;
    error: string | null;

    // Modal state
    showSuggestionModal: boolean;
    setShowSuggestionModal: (show: boolean) => void;

    // Tab state (renamed to avoid conflict with TrackerContext's activeTab)
    aiChefTab: AIChefTab;
    setAIChefTab: (tab: AIChefTab) => void;

    // Preferences
    preferences: AIChefPreferences;
    updatePreferences: (partial: Partial<AIChefPreferences>) => void;

    // Ingredient mode
    ingredientInput: string;
    setIngredientInput: (value: string) => void;
    ingredients: string[];
    addIngredient: (ingredient: string) => void;
    removeIngredient: (ingredient: string) => void;
    clearIngredients: () => void;

    // Actions
    getSuggestions: (remaining: Macros) => Promise<void>;
    getContextualSuggestions: (
        remaining: Macros,
        isTrainingDay: boolean,
        workoutIntensity?: 'high' | 'moderate' | 'recovery' | null,
        mealTimeOverride?: AIChefMealTime
    ) => Promise<void>;
    getSuggestionsFromIngredients: (
        remaining: Macros,
        isTrainingDay: boolean,
        workoutIntensity?: 'high' | 'moderate' | 'recovery' | null,
        mealTimeOverride?: AIChefMealTime
    ) => Promise<void>;
    rejectSuggestion: (mealName: string) => void;
    clearSuggestions: () => void;

    // Context info (for display)
    currentMealTime: AIChefMealTime;
    currentHour: number;
}

// =====================================================
// HOOK IMPLEMENTATION
// =====================================================

export const useAIMealSuggestions = (
    params?: UseAIMealSuggestionsParams
): UseAIMealSuggestionsReturn => {
    const { i18n } = useTranslation();

    // Core state
    const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);

    // Tab state (renamed to avoid conflict with TrackerContext's activeTab)
    const [aiChefTab, setAIChefTab] = useState<AIChefTab>('suggestions');

    // Preferences state
    const [preferences, setPreferences] = useState<AIChefPreferences>(loadDietaryPreferences);

    // Ingredient mode state
    const [ingredientInput, setIngredientInput] = useState('');
    const [ingredients, setIngredients] = useState<string[]>([]);

    // Time context
    const [currentHour, setCurrentHour] = useState(getArgentinaHour);
    const [currentMealTime, setCurrentMealTime] = useState<AIChefMealTime>(() =>
        inferMealTime(getArgentinaHour())
    );

    // Update time context every minute
    useEffect(() => {
        const interval = setInterval(() => {
            const hour = getArgentinaHour();
            setCurrentHour(hour);
            setCurrentMealTime(inferMealTime(hour));
        }, 60000); // Every minute

        return () => clearInterval(interval);
    }, []);

    // Persist preferences when they change
    useEffect(() => {
        saveDietaryPreferences(preferences);
    }, [preferences]);

    // Reload preferences when updated elsewhere (e.g. ConfigTab dietary settings)
    useEffect(() => {
        const handleUpdate = () => {
            const fresh = loadDietaryPreferences();
            setPreferences((prev) =>
                JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh
            );
        };
        window.addEventListener(DIETARY_PREFS_UPDATED_EVENT, handleUpdate);
        return () =>
            window.removeEventListener(DIETARY_PREFS_UPDATED_EVENT, handleUpdate);
    }, []);

    // =====================================================
    // PREFERENCES ACTIONS
    // =====================================================

    const updatePreferences = useCallback((partial: Partial<AIChefPreferences>) => {
        setPreferences((prev) => ({ ...prev, ...partial }));
    }, []);

    const rejectSuggestion = useCallback((mealName: string) => {
        setPreferences((prev) => {
            // Don't add duplicates
            if (prev.rejectedMeals.includes(mealName)) return prev;

            // Set expiry if not already set
            const expiry =
                prev.rejectedMealsExpiry ||
                Date.now() + REJECTED_MEALS_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

            return {
                ...prev,
                rejectedMeals: [...prev.rejectedMeals, mealName],
                rejectedMealsExpiry: expiry,
            };
        });

        // Remove from current suggestions
        setSuggestions((prev) => prev.filter((s) => s.name !== mealName));
    }, []);

    // =====================================================
    // INGREDIENT MODE ACTIONS
    // =====================================================

    const addIngredient = useCallback((ingredient: string) => {
        const trimmed = ingredient.trim().toLowerCase();
        if (!trimmed) return;

        setIngredients((prev) => {
            if (prev.includes(trimmed)) return prev;
            return [...prev, trimmed];
        });
        setIngredientInput('');
    }, []);

    const removeIngredient = useCallback((ingredient: string) => {
        setIngredients((prev) => prev.filter((i) => i !== ingredient));
    }, []);

    const clearIngredients = useCallback(() => {
        setIngredients([]);
        setIngredientInput('');
    }, []);

    // =====================================================
    // BUILD CONTEXT
    // =====================================================

    const buildContext = useCallback(
        (
            remaining: Macros,
            isTrainingDay: boolean,
            workoutIntensity?: 'high' | 'moderate' | 'recovery' | null,
            availableIngredients?: string[]
        ): AIChefContext => {
            const hour = getArgentinaHour();

            return {
                mealTime: inferMealTime(hour),
                currentHour: hour,
                remainingCalories: remaining.calories,
                remainingProtein: remaining.protein,
                remainingCarbs: remaining.carbs,
                remainingFat: remaining.fat,
                isTrainingDay,
                workoutIntensity: workoutIntensity || null,
                preferences,
                availableIngredients,
                language: i18n.language,
            };
        },
        [preferences, i18n.language]
    );

    // =====================================================
    // SUGGESTION ACTIONS
    // =====================================================

    /**
     * Legacy getSuggestions (for backward compatibility)
     */
    const getSuggestions = useCallback(
        async (remaining: Macros) => {
            setLoading(true);
            setError(null);
            setShowSuggestionModal(true);

            try {
                const context = buildContext(remaining, false);
                const result = await suggestMealsWithContext(context);
                setSuggestions(result);
            } catch (err) {
                const errorMessage =
                    i18n.language === 'es'
                        ? 'Error al generar sugerencias'
                        : 'Failed to generate suggestions';
                setError(errorMessage);
                console.error('[useAIMealSuggestions] getSuggestions error:', err);
            } finally {
                setLoading(false);
            }
        },
        [buildContext, i18n.language]
    );

    /**
     * Context-aware suggestions with workout integration
     */
    const getContextualSuggestions = useCallback(
        async (
            remaining: Macros,
            isTrainingDay: boolean,
            workoutIntensity?: 'high' | 'moderate' | 'recovery' | null,
            mealTimeOverride?: AIChefMealTime
        ) => {
            setLoading(true);
            setError(null);
            setShowSuggestionModal(true);
            setAIChefTab('suggestions');

            try {
                const context = buildContext(remaining, isTrainingDay, workoutIntensity);
                // Apply meal time override if provided
                if (mealTimeOverride) {
                    context.mealTime = mealTimeOverride;
                }
                const result = await suggestMealsWithContext(context);
                setSuggestions(result);
            } catch (err) {
                const errorMessage =
                    i18n.language === 'es'
                        ? 'Error al generar sugerencias'
                        : 'Failed to generate suggestions';
                setError(errorMessage);
                console.error('[useAIMealSuggestions] getContextualSuggestions error:', err);
            } finally {
                setLoading(false);
            }
        },
        [buildContext, i18n.language]
    );

    /**
     * Suggestions from available ingredients
     */
    const getSuggestionsFromIngredients = useCallback(
        async (
            remaining: Macros,
            isTrainingDay: boolean,
            workoutIntensity?: 'high' | 'moderate' | 'recovery' | null,
            mealTimeOverride?: AIChefMealTime
        ) => {
            if (ingredients.length === 0) {
                setError(
                    i18n.language === 'es'
                        ? 'Agregá al menos un ingrediente'
                        : 'Add at least one ingredient'
                );
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const context = buildContext(
                    remaining,
                    isTrainingDay,
                    workoutIntensity,
                    ingredients
                );
                // Apply meal time override if provided
                if (mealTimeOverride) {
                    context.mealTime = mealTimeOverride;
                }
                const result = await suggestMealsWithContext(context);
                setSuggestions(result);
                setAIChefTab('suggestions'); // Switch to suggestions tab to show results
            } catch (err) {
                const errorMessage =
                    i18n.language === 'es'
                        ? 'Error al generar sugerencias'
                        : 'Failed to generate suggestions';
                setError(errorMessage);
                console.error('[useAIMealSuggestions] getSuggestionsFromIngredients error:', err);
            } finally {
                setLoading(false);
            }
        },
        [buildContext, i18n.language, ingredients]
    );

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
        setError(null);
    }, []);

    // =====================================================
    // RETURN
    // =====================================================

    return {
        // Suggestions state
        suggestions,
        loading,
        error,

        // Modal state
        showSuggestionModal,
        setShowSuggestionModal,

        // Tab state (renamed to avoid conflict with TrackerContext's activeTab)
        aiChefTab,
        setAIChefTab,

        // Preferences
        preferences,
        updatePreferences,

        // Ingredient mode
        ingredientInput,
        setIngredientInput,
        ingredients,
        addIngredient,
        removeIngredient,
        clearIngredients,

        // Actions
        getSuggestions,
        getContextualSuggestions,
        getSuggestionsFromIngredients,
        rejectSuggestion,
        clearSuggestions,

        // Context info
        currentMealTime,
        currentHour,
    };
};
