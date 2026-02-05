import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_WEEKLY_PLAN, PlannedWorkout } from '../constants/weeklyPlan';
import { supabase } from '../lib/supabase';

type WeeklyPlan = Record<number, PlannedWorkout | null>;

/**
 * useWeeklyPlan - Manage user's customizable weekly training plan
 *
 * Provides CRUD operations for weekly plan stored in Supabase.
 * Falls back to DEFAULT_WEEKLY_PLAN if user hasn't customized yet.
 *
 * @param userId - Optional user ID to fetch plan for (prevents fetching/defaulting when not auth)
 * @returns {Object} Plan state and management functions
 */
export const useWeeklyPlan = (userId?: string) => {
    const { t } = useTranslation();
    const [plan, setPlan] = useState<WeeklyPlan>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch user's weekly plan from Supabase
     */
    const fetchPlan = useCallback(async () => {
        // If no user yet, don't do anything (keep loading or previous state)
        if (!userId) {
            setIsLoading(true);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                // @ts-ignore
                .from('weekly_plan')
                .select('*')
                .eq('user_id', userId);

            if (fetchError) throw fetchError;

            // Convert array to object keyed by day_of_week
            // Initialize with nulls (Rest) for all 7 days effectively
            // This prevents "sparse" plans from falling back to defaults for missing days
            const planObject: WeeklyPlan = {};

            // If we have ANY data, we trust it. Unspecified days are Rest (null).
            // Only if we have NO data at all (empty array), we consider it a new user -> Default Plan.
            if (!data || data.length === 0) {
                setPlan(DEFAULT_WEEKLY_PLAN);
            } else {
                // Populate with database rows
                data.forEach((entry: any) => {
                    planObject[entry.day_of_week] = {
                        type: entry.workout_type as any,
                        name: entry.workout_name || '',
                        intensity: entry.intensity as any,
                    };
                });
                // Ensure all days are at least keys in the object (even if undefined/null)
                // actually, our WeeklyPlan type allows missing keys, but the UI might expect them.
                // explicitly setting the state with what we have is fine,
                // BUT we need to make sure the consuming component treats "undefined" as "Rest" if we have *some* plan,
                // OR we fill the gaps here.
                // Let's fill gaps to be safe and explicit.
                for (let i = 0; i < 7; i++) {
                    if (!planObject[i]) {
                        planObject[i] = null;
                    }
                }
                setPlan(planObject);
            }
        } catch (err: any) {
            console.error('Error fetching weekly plan:', err);
            setError(err.message || t('errors.fetchWeeklyPlan'));
            // Do NOT overwrite with default on error, might be temporary network issue
            // Keep previous state or empty
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    /**
     * Delete a specific day from the plan (set to rest)
     * @param {number} dayIndex - 0-6
     */
    const deleteDayPlan = useCallback(
        async (dayIndex: number) => {
            try {
                if (!supabase) throw new Error(t('errors.supabaseNotConfigured'));
                if (!userId) throw new Error(t('errors.userNotAuthenticated'));

                const { error: deleteError } = await supabase
                    // @ts-ignore
                    .from('weekly_plan')
                    .delete()
                    .eq('user_id', userId)
                    .eq('day_of_week', dayIndex);

                if (deleteError) throw deleteError;

                // Update local state - set to null explicitly so it shows as rest
                setPlan((prev) => ({
                    ...prev,
                    [dayIndex]: null,
                }));

                return true;
            } catch (err: any) {
                console.error('Error deleting day from weekly plan:', err);
                setError(err.message || t('errors.deleteWeeklyPlanDay'));
                return false;
            }
        },
        [userId],
    );

    /**
     * Update a specific day in the plan
     * @param {number} dayIndex - 0-6 (0=Monday, 6=Sunday)
     * @param {PlannedWorkout|null} workoutData - { type, name, intensity } or null for rest day
     */
    const updateDayPlan = useCallback(
        async (dayIndex: number, workoutData: PlannedWorkout | null) => {
            try {
                if (!supabase) throw new Error(t('errors.supabaseNotConfigured'));
                if (!userId) throw new Error(t('errors.userNotAuthenticated'));

                // If setting to rest, delete the day from the plan
                if (workoutData === null) {
                    const { error: deleteError } = await supabase
                        // @ts-ignore
                        .from('weekly_plan')
                        .delete()
                        .eq('user_id', userId)
                        .eq('day_of_week', dayIndex);

                    if (deleteError) throw deleteError;

                    // Update local state - set to null for rest day
                    setPlan((prev) => ({
                        ...prev,
                        [dayIndex]: null,
                    }));

                    return true;
                }

                const dataToSave = workoutData;

                // Upsert (insert or update)
                const { error: upsertError } = await supabase
                    // @ts-ignore
                    .from('weekly_plan')
                    .upsert(
                        {
                            user_id: userId,
                            day_of_week: dayIndex,
                            workout_type: dataToSave.type,
                            workout_name: dataToSave.name,
                            intensity: dataToSave.intensity,
                        },
                        {
                            onConflict: 'user_id,day_of_week',
                        },
                    );

                if (upsertError) throw upsertError;

                // Update local state
                setPlan((prev) => ({
                    ...prev,
                    [dayIndex]: dataToSave,
                }));

                return true;
            } catch (err: any) {
                console.error('Error updating weekly plan:', err);
                setError(err.message || t('errors.updateWeeklyPlanDay'));
                return false;
            }
        },
        [userId],
    );

    // Fetch on mount or when userId changes
    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    return {
        plan,
        isLoading,
        isEditing,
        setIsEditing,
        error,
        updateDayPlan,
        deleteDayPlan,
        refreshPlan: fetchPlan,
    };
};
