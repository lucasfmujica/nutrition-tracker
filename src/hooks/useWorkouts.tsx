import { useCallback, useState } from 'react';
import { triggerWorkoutActivity } from '../services/activityTriggerService';
import { Workout } from '../types/domain';
import { storage } from '../utils/storage';
import { addPendingWrite, getCacheKeys } from '../utils/storageUtils';
import { useSupabase } from './useSupabase';

type SupabaseClient = ReturnType<typeof useSupabase>;

export const useWorkouts = (supabase: SupabaseClient, useCloud: boolean) => {
    const [workoutLog, setWorkoutLog] = useState<Workout[]>([]);

    const saveWorkoutLog = async (newLog: Workout[]) => {
        setWorkoutLog(newLog);
        try {
            const userId = supabase.user?.id;
            const keys = userId ? getCacheKeys(userId) : null;
            if (keys) {
                await storage.set(keys.WORKOUT, JSON.stringify(newLog));
            } else {
                await storage.set('lucas-workout-log-v5', JSON.stringify(newLog));
            }
        } catch (err) {
            console.error('Error saving workout log:', err);
        }
    };

    const saveWorkoutEntry = async (entry: Workout): Promise<Workout | null> => {
        // Optimistic update
        setWorkoutLog((prevLog) => {
            const newLog = [...prevLog];
            const index = newLog.findIndex((e) => e.id === entry.id);
            if (index >= 0) {
                newLog[index] = entry;
            } else {
                newLog.push(entry);
            }
            return newLog;
        });

        if (useCloud) {
            try {
                const result = await supabase.saveWorkout(entry);

                if (result?.error) {
                    console.error('[Workouts] saveWorkoutEntry failed:', {
                        function: 'saveWorkoutEntry',
                        date: entry.date,
                        name: entry.name,
                        type: entry.type,
                        error: result.error.message,
                    });
                    throw new Error(result.error.message);
                }

                console.log(
                    '[Workouts] saveWorkoutEntry successful:',
                    entry.date,
                    entry.name,
                );

                // Google Analytics: Track workout logged
                if (typeof window !== 'undefined' && typeof (window as any).gtag !== 'undefined') {
                    (window as any).gtag('event', 'workout_logged', {
                        event_category: 'fitness',
                        event_label: entry.type || 'other',
                        value: entry.duration || 0
                    });
                }

                // Post activity to social feed (fire and forget)
                if (supabase.user?.id) {
                    triggerWorkoutActivity(supabase.user.id, entry).catch(() => {});
                }

                return result.data;
            } catch (err: any) {
                console.error('[Workouts] saveWorkoutEntry FAILED:', {
                    function: 'saveWorkoutEntry',
                    date: entry.date,
                    name: entry.name,
                    type: entry.type,
                    error: err.message,
                    stack: err.stack,
                });

                // Add to The Vault for offline resilience
                await addPendingWrite('workouts', entry, supabase?.user?.id || '');

                // Return original entry for optimistic UI
                return entry;
            }
        }
        return entry;
    };

    const deleteWorkoutEntry = async (id: string) => {
        if (useCloud) await supabase.deleteWorkout(id);
    };

    const isTrainingDay = useCallback(
        (date: string) => {
            // Exact string match for "YYYY-MM-DD"
            return workoutLog.some((w) => w.date && w.date.trim() === date.trim());
        },
        [workoutLog],
    );

    return {
        workoutLog,
        setWorkoutLog,
        saveWorkoutLog,
        saveWorkoutEntry,
        deleteWorkoutEntry,
        isTrainingDay,
    };
};
