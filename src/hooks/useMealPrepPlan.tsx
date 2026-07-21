import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { Json } from '../types/supabase';
import { getArgentinaDateString, getMondayOfWeek } from '../utils/dateUtils';
import { addDays, format } from 'date-fns';
import { devLog } from '../utils/devLog';

/**
 * Monday of the current week in Argentina TZ, as a noon-anchored Date.
 * Anchoring at noon keeps `format(date, 'yyyy-MM-dd')` stable across browser
 * timezones (avoids the UTC-midnight off-by-one), while still returning a Date
 * for consumers that navigate weeks with date-fns `addDays`.
 */
const getArgentinaWeekStart = (): Date =>
    new Date(getMondayOfWeek(getArgentinaDateString()) + 'T12:00:00');

export interface PlannedMealItem {
    name: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

export interface MealPrepEntry {
    id: string;
    user_id: string;
    date: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    template_id?: string;
    planned_items: PlannedMealItem[];
    notes?: string;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

export type WeekPlan = Record<string, MealPrepEntry[]>; // date -> array of meals

/**
 * useMealPrepPlan - Manage weekly meal prep planning
 *
 * Features:
 * - Load 7-day meal plan
 * - Add/remove meals from specific days
 * - Mark meals as completed
 * - Repeat current week to next week
 * - Generate grocery list from week plan
 *
 * @param userId - User ID (required)
 * @returns Hook with week plan state and CRUD operations
 */
export const useMealPrepPlan = (userId?: string) => {
    const { t } = useTranslation();
    const [weekPlan, setWeekPlan] = useState<WeekPlan>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
        getArgentinaWeekStart // Monday in Argentina TZ
    );

    /**
     * Fetch week plan (7 days starting from currentWeekStart)
     */
    const fetchWeekPlan = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!supabase) throw new Error(t('errors.supabaseNotConfigured'));

            // Generate array of 7 dates (Mon-Sun)
            const dates = Array.from({ length: 7 }, (_, i) =>
                format(addDays(currentWeekStart, i), 'yyyy-MM-dd')
            );

            const { data, error: fetchError } = await supabase
                // @ts-ignore
                .from('meal_prep_plan')
                .select('*')
                .eq('user_id', userId)
                .gte('date', dates[0])
                .lte('date', dates[6])
                .order('date', { ascending: true })
                .order('meal_type', { ascending: true });

            if (fetchError) throw fetchError;

            // Group by date
            const grouped: WeekPlan = {};
            (data || []).forEach((entry: any) => {
                if (!grouped[entry.date]) {
                    grouped[entry.date] = [];
                }
                grouped[entry.date].push(entry as MealPrepEntry);
            });

            setWeekPlan(grouped);
        } catch (err: any) {
            console.error(`[useMealPrepPlan ${new Date().toISOString()}] Error fetching week plan:`, err);
            setError(err.message || t('errors.fetchWeeklyPlan'));
        } finally {
            setIsLoading(false);
        }
    }, [userId, currentWeekStart, t]);

    /**
     * Add a meal to a specific date and meal type
     */
    const addMealToPlan = useCallback(
        async (
            date: string,
            mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
            plannedItems: PlannedMealItem[],
            notes?: string,
            templateId?: string
        ) => {
            try {
                if (!supabase) throw new Error(t('errors.supabaseNotConfigured'));
                if (!userId) throw new Error(t('errors.userNotAuthenticated'));

                const newEntry = {
                    user_id: userId,
                    date,
                    meal_type: mealType,
                    planned_items: plannedItems as unknown as Json,
                    notes: notes || null,
                    template_id: templateId || null,
                    is_completed: false,
                };

                const { data, error: insertError } = await supabase
                    // @ts-ignore
                    .from('meal_prep_plan')
                    .upsert(newEntry, { onConflict: 'user_id,date,meal_type' })
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Update local state optimistically
                setWeekPlan((prev) => ({
                    ...prev,
                    [date]: [
                        ...(prev[date] || []),
                        data as unknown as MealPrepEntry,
                    ],
                }));

                return data as unknown as MealPrepEntry;
            } catch (err: any) {
                console.error(`[useMealPrepPlan ${new Date().toISOString()}] Error adding meal:`, err);
                setError(err.message || t('errors.updateWeeklyPlanDay'));
                throw err;
            }
        },
        [userId, t]
    );

    /**
     * Remove a meal from the plan
     */
    const removeMealFromPlan = useCallback(
        async (mealId: string) => {
            try {
                if (!supabase) throw new Error(t('errors.supabaseNotConfigured'));
                if (!userId) throw new Error(t('errors.userNotAuthenticated'));

                const { error: deleteError } = await supabase
                    // @ts-ignore
                    .from('meal_prep_plan')
                    .delete()
                    .eq('id', mealId)
                    .eq('user_id', userId);

                if (deleteError) throw deleteError;

                // Update local state
                setWeekPlan((prev) => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach((date) => {
                        updated[date] = updated[date].filter((m) => m.id !== mealId);
                        if (updated[date].length === 0) {
                            delete updated[date];
                        }
                    });
                    return updated;
                });

                return true;
            } catch (err: any) {
                console.error(`[useMealPrepPlan ${new Date().toISOString()}] Error removing meal:`, err);
                setError(err.message || t('errors.deleteWeeklyPlanDay'));
                return false;
            }
        },
        [userId, t]
    );

    /**
     * Toggle meal completion status
     */
    const toggleCompleted = useCallback(
        async (mealId: string, currentStatus: boolean) => {
            try {
                if (!supabase) throw new Error(t('errors.supabaseNotConfigured'));
                if (!userId) throw new Error(t('errors.userNotAuthenticated'));

                const { data, error: updateError } = await supabase
                    // @ts-ignore
                    .from('meal_prep_plan')
                    .update({ is_completed: !currentStatus })
                    .eq('id', mealId)
                    .eq('user_id', userId)
                    .select()
                    .single();

                if (updateError) throw updateError;

                // Update local state
                setWeekPlan((prev) => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach((date) => {
                        updated[date] = updated[date].map((m) =>
                            m.id === mealId ? (data as unknown as MealPrepEntry) : m
                        );
                    });
                    return updated;
                });

                return true;
            } catch (err: any) {
                console.error(`[useMealPrepPlan ${new Date().toISOString()}] Error toggling completed:`, err);
                setError(err.message || t('errors.updateWeeklyPlanDay'));
                return false;
            }
        },
        [userId, t]
    );

    /**
     * Repeat current week plan to next week
     * Copies all meals from current week to next week (7 days ahead)
     */
    const repeatCurrentWeek = useCallback(async () => {
        try {
            if (!supabase) throw new Error(t('errors.supabaseNotConfigured'));
            if (!userId) throw new Error(t('errors.userNotAuthenticated'));

            const allMeals = Object.values(weekPlan).flat();

            if (allMeals.length === 0) {
                throw new Error('No meals to repeat. Plan your current week first.');
            }

            // Create copies for next week (add 7 days to each date)
            const nextWeekMeals = allMeals.map((meal) => {
                const nextWeekDate = format(addDays(new Date(meal.date), 7), 'yyyy-MM-dd');
                return {
                    user_id: userId,
                    date: nextWeekDate,
                    meal_type: meal.meal_type,
                    planned_items: meal.planned_items as unknown as Json,
                    notes: meal.notes,
                    template_id: meal.template_id,
                    is_completed: false, // Reset completion status
                };
            });

            const { error: insertError } = await supabase
                // @ts-ignore
                .from('meal_prep_plan')
                .upsert(nextWeekMeals, { onConflict: 'user_id,date,meal_type' });

            if (insertError) throw insertError;

            devLog(`[useMealPrepPlan ${new Date().toISOString()}] ✓ Repeated ${allMeals.length} meals to next week`);
            return true;
        } catch (err: any) {
            console.error(`[useMealPrepPlan ${new Date().toISOString()}] Error repeating week:`, err);
            setError(err.message || 'Error al repetir semana');
            return false;
        }
    }, [userId, weekPlan, t]);

    /**
     * Navigate to previous week
     */
    const goToPreviousWeek = useCallback(() => {
        setCurrentWeekStart((prev) => addDays(prev, -7));
    }, []);

    /**
     * Navigate to next week
     */
    const goToNextWeek = useCallback(() => {
        setCurrentWeekStart((prev) => addDays(prev, 7));
    }, []);

    /**
     * Go back to current week
     */
    const goToCurrentWeek = useCallback(() => {
        setCurrentWeekStart(getArgentinaWeekStart());
    }, []);

    // Fetch plan when user or week changes
    useEffect(() => {
        fetchWeekPlan();
    }, [fetchWeekPlan]);

    return {
        weekPlan,
        isLoading,
        error,
        currentWeekStart,
        fetchWeekPlan,
        addMealToPlan,
        removeMealFromPlan,
        toggleCompleted,
        repeatCurrentWeek,
        goToPreviousWeek,
        goToNextWeek,
        goToCurrentWeek,
    };
};
