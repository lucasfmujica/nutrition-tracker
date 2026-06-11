import { AIChefPreferences } from '../types/domain';

/**
 * Shared dietary preferences storage (localStorage).
 *
 * NOTE: The `profiles` table has no dietary columns yet, so these
 * preferences persist in localStorage (same key the AI Chef already used).
 * If a DB column is added later, this module is the single point to migrate.
 */
export const DIETARY_PREFS_STORAGE_KEY = 'lukenfit_ai_chef_preferences';
export const DIETARY_PREFS_UPDATED_EVENT = 'lukenfit:dietary-prefs-updated';
export const REJECTED_MEALS_EXPIRY_DAYS = 30;

export const DEFAULT_DIETARY_PREFERENCES: AIChefPreferences = {
    dietaryMode: 'standard',
    prepTime: 'medium',
    difficulty: 'easy',
    rejectedMeals: [],
    rejectedMealsExpiry: 0,
    allergies: [],
    dislikedMeals: [],
};

/**
 * Load dietary preferences from localStorage (clears expired rejected meals)
 */
export const loadDietaryPreferences = (): AIChefPreferences => {
    try {
        const stored = localStorage.getItem(DIETARY_PREFS_STORAGE_KEY);
        if (!stored) return DEFAULT_DIETARY_PREFERENCES;

        const parsed = JSON.parse(stored) as AIChefPreferences;

        // Clear rejected meals if expired
        if (parsed.rejectedMealsExpiry && Date.now() > parsed.rejectedMealsExpiry) {
            parsed.rejectedMeals = [];
            parsed.rejectedMealsExpiry = 0;
        }

        return { ...DEFAULT_DIETARY_PREFERENCES, ...parsed };
    } catch (error) {
        console.error('[dietaryPreferences] Error loading preferences:', error);
        return DEFAULT_DIETARY_PREFERENCES;
    }
};

/**
 * Save dietary preferences to localStorage and notify listeners
 */
export const saveDietaryPreferences = (prefs: AIChefPreferences): void => {
    try {
        localStorage.setItem(DIETARY_PREFS_STORAGE_KEY, JSON.stringify(prefs));
        window.dispatchEvent(new CustomEvent(DIETARY_PREFS_UPDATED_EVENT));
    } catch (error) {
        console.error('[dietaryPreferences] Error saving preferences:', error);
    }
};

/**
 * Add a meal name to the rejected list (persisted, with 30-day expiry)
 */
export const addRejectedMeal = (mealName: string): AIChefPreferences => {
    const prefs = loadDietaryPreferences();
    const trimmed = mealName.trim();
    if (!trimmed || prefs.rejectedMeals.includes(trimmed)) return prefs;

    const updated: AIChefPreferences = {
        ...prefs,
        rejectedMeals: [...prefs.rejectedMeals, trimmed],
        rejectedMealsExpiry:
            prefs.rejectedMealsExpiry ||
            Date.now() + REJECTED_MEALS_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };
    saveDietaryPreferences(updated);
    return updated;
};

/**
 * All meals the AI should avoid: explicit rejections + disliked meals
 */
export const getMealsToAvoid = (prefs: AIChefPreferences): string[] => {
    return Array.from(
        new Set([...(prefs.rejectedMeals || []), ...(prefs.dislikedMeals || [])])
    );
};
