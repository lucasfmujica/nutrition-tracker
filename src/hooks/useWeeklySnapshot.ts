import { useCallback, useEffect, useRef } from 'react';
import { generateWeeklySnapshot, getWeekStart } from '../services/weeklySnapshotService';
import { WeightEntry, Workout } from '../types/domain';

interface UseWeeklySnapshotProps {
    userId: string | undefined;
    weightHistory: WeightEntry[];
    workoutLog: Workout[];
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
    useCloud,
}: UseWeeklySnapshotProps) {
    const lastGeneratedWeek = useRef<string | null>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const generate = useCallback(async () => {
        if (!userId || !useCloud) return;

        const currentWeek = getWeekStart();

        // Skip if already generated for this week in this session
        if (lastGeneratedWeek.current === currentWeek) return;

        await generateWeeklySnapshot(userId, weightHistory, workoutLog);
        lastGeneratedWeek.current = currentWeek;
    }, [userId, weightHistory, workoutLog, useCloud]);

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
    }, [userId, weightHistory.length, workoutLog.length, useCloud, generate]);

    // Force regenerate (for manual refresh)
    const forceGenerate = useCallback(async () => {
        lastGeneratedWeek.current = null;
        await generate();
    }, [generate]);

    return {
        forceGenerate,
    };
}
