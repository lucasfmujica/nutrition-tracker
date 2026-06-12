import { useCallback, useEffect, useRef } from 'react';
import { generateWeeklySnapshot } from '../services/weeklySnapshotService';
import { WeightEntry, Workout, FoodEntry } from '../types/domain';

interface UseWeeklySnapshotProps {
    userId: string | undefined;
    weightHistory: WeightEntry[];
    workoutLog: Workout[];
    foodLog: FoodEntry[];
    targetCalories: number;
    useCloud: boolean;
}

/**
 * Hook to automatically generate weekly snapshots
 * Generates on mount and when data changes (debounced)
 */
export function useWeeklySnapshot({
    userId,
    weightHistory,
    workoutLog,
    foodLog,
    targetCalories,
    useCloud,
}: UseWeeklySnapshotProps) {
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const generate = useCallback(async () => {
        if (!userId || !useCloud) return;

        await generateWeeklySnapshot(userId, weightHistory, workoutLog, foodLog, targetCalories);
    }, [userId, weightHistory, workoutLog, foodLog, targetCalories, useCloud]);

    // Generate on mount and when data changes (debounced)
    useEffect(() => {
        if (!userId || !useCloud) return;

        // Debounce to avoid too many updates
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            generate();
        }, 5000); // Wait 5 seconds after last change

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [userId, useCloud, generate]);

    // Force regenerate (for manual refresh)
    const forceGenerate = useCallback(async () => {
        await generate();
    }, [generate]);

    return {
        forceGenerate,
    };
}
