import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { generateWeeklyMealPlan } from '../services/ai/mealService';
import type {
    WeeklyMealPlanRequest,
    WeeklyMealPlanResponse,
    Profile,
} from '../types/domain';
import { useMealPrepPlan } from './useMealPrepPlan';
import { format, addDays } from 'date-fns';
import {
    getMealsToAvoid,
    loadDietaryPreferences,
} from '../utils/dietaryPreferences';

export interface GenerateWeeklyPlanOptions {
    regenerateDays?: number[]; // [0-6] for specific days (0=Monday, 6=Sunday)
    keepExisting?: boolean; // Maintain already planned meals
}

/**
 * useGenerateWeeklyMealPlan - AI-powered weekly meal plan generation
 *
 * Features:
 * - Extracts user profile and targets
 * - Analyzes food log for top 10 favorite foods
 * - Constructs context for AI (workouts, preferences, restrictions)
 * - Calls Gemini AI to generate 7 days x 4 meals = 28 meals
 * - Saves meals to meal_prep_plan table
 *
 * @param userId - User ID
 * @param weekStartDate - Monday of the week (YYYY-MM-DD)
 * @returns Hook with generation state and methods
 */
export const useGenerateWeeklyMealPlan = (userId: string, weekStartDate: string) => {
    const { t, i18n } = useTranslation();
    const { addMealToPlan } = useMealPrepPlan(userId);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<WeeklyMealPlanResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string>('');

    /**
     * Extract top 10 favorite foods from food_log (last 30 days)
     */
    const extractFavoriteFoods = useCallback(async (): Promise<string[]> => {
        try {
            if (!supabase) return [];

            const thirtyDaysAgo = format(addDays(new Date(), -30), 'yyyy-MM-dd');

            const { data, error: fetchError } = await supabase
                .from('food_log')
                .select('name')
                .eq('user_id', userId)
                .gte('date', thirtyDaysAgo);

            if (fetchError) throw fetchError;

            // Count frequency
            const frequencyMap: Record<string, number> = {};
            (data || []).forEach((entry: any) => {
                const name = entry.name?.trim();
                if (name) {
                    frequencyMap[name] = (frequencyMap[name] || 0) + 1;
                }
            });

            // Sort by frequency and get top 10
            const sorted = Object.entries(frequencyMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name]) => name);

            console.log(`[useGenerateWeeklyMealPlan ${new Date().toISOString()}] Found ${sorted.length} favorite foods`);
            return sorted;
        } catch (err: any) {
            console.error(`[useGenerateWeeklyMealPlan ${new Date().toISOString()}] Error extracting favorites:`, err);
            return [];
        }
    }, [userId]);

    /**
     * Main generation function
     */
    const generateWeeklyPlan = useCallback(
        async (options?: GenerateWeeklyPlanOptions): Promise<WeeklyMealPlanResponse | null> => {
            setIsGenerating(true);
            setError(null);
            setProgress(t('mealPrep.generating') || 'Generating plan...');

            try {
                if (!supabase) throw new Error(t('errors.supabaseNotConfigured'));

                // 1. Fetch user profile
                setProgress(t('mealPrep.progress.loadingProfile'));
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (profileError) throw profileError;
                if (!profileData) throw new Error('Profile not found');

                const profile = profileData as any;

                // 2. Extract favorite foods
                setProgress(t('mealPrep.progress.analyzingFavorites'));
                const favoriteFoods = await extractFavoriteFoods();

                // 3. Get weekly workouts
                setProgress(t('mealPrep.progress.loadingWorkouts'));
                const weekEndDate = format(addDays(new Date(weekStartDate), 6), 'yyyy-MM-dd');

                const { data: workoutsData } = await supabase
                    .from('workouts')
                    .select('date, type, name')
                    .eq('user_id', userId)
                    .gte('date', weekStartDate)
                    .lte('date', weekEndDate);

                // Map workouts to days (0=Monday, 6=Sunday)
                const weeklyWorkouts = (workoutsData || []).map((w: any) => {
                    const workoutDate = new Date(w.date);
                    const startDate = new Date(weekStartDate);
                    const dayOfWeek = Math.floor(
                        (workoutDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                    ) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

                    // Determine intensity based on type/name
                    let intensity: 'high' | 'moderate' | 'recovery' = 'moderate';
                    const name = (w.name || '').toLowerCase();
                    const type = (w.type || '').toLowerCase();

                    if (name.includes('intenso') || type === 'gym') {
                        intensity = 'high';
                    } else if (name.includes('recuperación') || type === 'recovery') {
                        intensity = 'recovery';
                    }

                    return {
                        day: dayOfWeek,
                        type: w.type || 'workout',
                        intensity,
                    };
                });

                // 4. Load dietary preferences (localStorage-backed, shared with AI Chef)
                const dietaryPrefs = loadDietaryPreferences();

                // 5. Build request
                const request: WeeklyMealPlanRequest = {
                    userId,
                    weekStartDate,
                    dailyTargets: {
                        calories: profile.target_calories || 2000,
                        protein: profile.target_protein || 150,
                        carbs: profile.target_carbs || 200,
                        fat: profile.target_fat || 60,
                    },
                    goal: profile.goal || 'maintain',
                    activityLevel: profile.activity_level || 'moderate',
                    weeklyWorkouts,
                    preferences: {
                        dietaryMode: dietaryPrefs.dietaryMode,
                        prepTime: dietaryPrefs.prepTime,
                        difficulty: dietaryPrefs.difficulty,
                        rejectedMeals: getMealsToAvoid(dietaryPrefs),
                        exclusions: dietaryPrefs.allergies || [],
                    },
                    favoriteFoods,
                    language: i18n.language,
                };

                // 5. Call AI to generate plan
                setProgress(t('mealPrep.progress.generatingWithAI'));
                const plan = await generateWeeklyMealPlan(request, i18n.language);

                // 6. Save meals to database
                setProgress(t('mealPrep.progress.savingMeals'));
                const dates = Object.keys(plan.weekPlan);
                let savedCount = 0;

                for (const date of dates) {
                    const dayMeals = plan.weekPlan[date];

                    // Save breakfast
                    if (dayMeals.breakfast && dayMeals.breakfast.length > 0) {
                        const meal = dayMeals.breakfast[0];
                        await addMealToPlan(
                            date,
                            'breakfast',
                            meal.items.map((item) => ({
                                name: item.name,
                                calories: item.calories,
                            })),
                            meal.notes
                        );
                        savedCount++;
                    }

                    // Save lunch
                    if (dayMeals.lunch && dayMeals.lunch.length > 0) {
                        const meal = dayMeals.lunch[0];
                        await addMealToPlan(
                            date,
                            'lunch',
                            meal.items.map((item) => ({
                                name: item.name,
                                calories: item.calories,
                            })),
                            meal.notes
                        );
                        savedCount++;
                    }

                    // Save snack
                    if (dayMeals.snack && dayMeals.snack.length > 0) {
                        const meal = dayMeals.snack[0];
                        await addMealToPlan(
                            date,
                            'snack',
                            meal.items.map((item) => ({
                                name: item.name,
                                calories: item.calories,
                            })),
                            meal.notes
                        );
                        savedCount++;
                    }

                    // Save dinner
                    if (dayMeals.dinner && dayMeals.dinner.length > 0) {
                        const meal = dayMeals.dinner[0];
                        await addMealToPlan(
                            date,
                            'dinner',
                            meal.items.map((item) => ({
                                name: item.name,
                                calories: item.calories,
                            })),
                            meal.notes
                        );
                        savedCount++;
                    }
                }

                console.log(`[useGenerateWeeklyMealPlan ${new Date().toISOString()}] ✓ Saved ${savedCount} meals`);

                setGeneratedPlan(plan);
                setProgress('');
                return plan;
            } catch (err: any) {
                const timestamp = new Date().toISOString();
                console.error(`[useGenerateWeeklyMealPlan ${timestamp}] Error:`, err);
                setError(err.message || 'Error al generar plan');
                setProgress('');
                return null;
            } finally {
                setIsGenerating(false);
            }
        },
        [userId, weekStartDate, t, i18n.language, extractFavoriteFoods, addMealToPlan]
    );

    return {
        isGenerating,
        generatedPlan,
        error,
        progress,
        generateWeeklyPlan,
    };
};
