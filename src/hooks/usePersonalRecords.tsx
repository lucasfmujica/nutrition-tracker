import { useMemo } from 'react';
import { Workout } from '../types/domain';

export interface PersonalRecord {
    exerciseName: string;
    newWeight: number;
    previousBest: number;
}

/**
 * usePersonalRecords - Detects personal records by comparing today's exercise weights
 * against all-time best weights (before today)
 * @param {Workout[]} workoutLog - All workout entries
 * @param {string} selectedDate - The date to check for PRs (YYYY-MM-DD)
 * @returns {PersonalRecord[]} Array of new personal records
 */
export const usePersonalRecords = (
    workoutLog: Workout[],
    selectedDate: string,
): PersonalRecord[] => {
    return useMemo(() => {
        const todaysWorkouts = workoutLog.filter((w) => w.date === selectedDate);
        const historicalWorkouts = workoutLog.filter((w) => w.date < selectedDate);

        if (todaysWorkouts.length === 0 || historicalWorkouts.length === 0) {
            return [];
        }

        // Build all-time best weights per exercise (before today)
        const bestWeights = new Map<string, number>();
        for (const workout of historicalWorkouts) {
            if (!workout.exercises) continue;
            for (const exercise of workout.exercises) {
                const name = exercise.name?.toLowerCase().trim();
                if (!name || !exercise.weight) continue;
                const weight = Number(exercise.weight);
                if (isNaN(weight) || weight <= 0) continue;
                const current = bestWeights.get(name) || 0;
                if (weight > current) {
                    bestWeights.set(name, weight);
                }
            }
        }

        // Check today's exercises for new PRs
        const prs: PersonalRecord[] = [];
        const seenExercises = new Set<string>();

        for (const workout of todaysWorkouts) {
            if (!workout.exercises) continue;
            for (const exercise of workout.exercises) {
                const name = exercise.name?.toLowerCase().trim();
                if (!name || !exercise.weight || seenExercises.has(name)) continue;
                seenExercises.add(name);

                const weight = Number(exercise.weight);
                if (isNaN(weight) || weight <= 0) continue;

                const previousBest = bestWeights.get(name);
                if (previousBest !== undefined && weight > previousBest) {
                    prs.push({
                        exerciseName: exercise.name,
                        newWeight: weight,
                        previousBest,
                    });
                }
            }
        }

        return prs;
    }, [workoutLog, selectedDate]);
};
