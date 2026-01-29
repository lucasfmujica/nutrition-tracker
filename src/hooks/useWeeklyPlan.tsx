import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_WEEKLY_PLAN, PlannedWorkout } from '../constants/weeklyPlan';
import { supabase } from '../lib/supabase';

type WeeklyPlan = Record<number, PlannedWorkout | null>;

/**
 * useWeeklyPlan - Manage user's customizable weekly training plan
 *
 * Provides CRUD operations for weekly plan stored in Supabase.
 * Falls back to DEFAULT_WEEKLY_PLAN if user hasn't customized yet.
 *
 * @returns {Object} Plan state and management functions
 */
export const useWeeklyPlan = () => {
    const [plan, setPlan] = useState<WeeklyPlan>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch user's weekly plan from Supabase
     */
    const fetchPlan = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (!supabase) {
                setPlan(DEFAULT_WEEKLY_PLAN);
                setIsLoading(false);
                return;
            }

            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                setPlan(DEFAULT_WEEKLY_PLAN);
                setIsLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('weekly_plan')
                .select('*')
                .eq('user_id', user.id);

            if (fetchError) throw fetchError;

            // Convert array to object keyed by day_of_week
            const planObject: WeeklyPlan = {};
            data?.forEach((entry) => {
                planObject[entry.day_of_week] = {
                    type: entry.workout_type as any,
                    name: entry.workout_name || '',
                    intensity: entry.intensity as any,
                };
            });

            // If no custom plan exists, use default
            if (Object.keys(planObject).length === 0) {
                setPlan(DEFAULT_WEEKLY_PLAN);
            } else {
                setPlan(planObject);
            }
        } catch (err: any) {
            console.error('Error fetching weekly plan:', err);
            setError(err.message || 'Error al obtener el plan semanal');
            // Fallback to default on error
            setPlan(DEFAULT_WEEKLY_PLAN);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Delete a specific day from the plan (set to rest)
     * @param {number} dayIndex - 0-6
     */
    const deleteDayPlan = useCallback(async (dayIndex: number) => {
        try {
            if (!supabase) throw new Error('Supabase no configurado');

            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            const { error: deleteError } = await supabase
                .from('weekly_plan')
                .delete()
                .eq('user_id', user.id)
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
            setError(err.message || 'Error al borrar el día');
            return false;
        }
    }, []);

    /**
     * Update a specific day in the plan
     * @param {number} dayIndex - 0-6 (0=Monday, 6=Sunday)
     * @param {PlannedWorkout|null} workoutData - { type, name, intensity } or null for rest day
     */
    const updateDayPlan = useCallback(
        async (dayIndex: number, workoutData: PlannedWorkout | null) => {
            try {
                if (!supabase) throw new Error('Supabase no configurado');

                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) throw new Error('Usuario no autenticado');

                // If setting to rest, delete the day from the plan
                if (workoutData === null) {
                    const { error: deleteError } = await supabase
                        .from('weekly_plan')
                        .delete()
                        .eq('user_id', user.id)
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
                    .from('weekly_plan')
                    .upsert(
                        {
                            user_id: user.id,
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
                setError(err.message || 'Error al actualizar el día');
                return false;
            }
        },
        [],
    );

    // Fetch on mount
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
