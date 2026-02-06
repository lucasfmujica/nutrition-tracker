import { useMemo } from 'react';
import { Workout } from '../types/domain';
import {
    addDaysToDate,
    getArgentinaDateString,
    getMondayOfWeek,
} from '../utils/dateUtils';

export interface WorkoutAnalysis {
    weekStart: string;
    gymCount: number;
    tennisCount: number;
    totalDuration: number;
    totalVolume: number;
    prevWeekVolume: number;
    volumeChange: number | null;
    prevWeekWorkouts: number;
    analysis: string[];
}

/**
 * useWorkoutAnalysis - Analyzes workout data for a specific week
 * @param {Workout[]} workoutLog - All workout entries
 * @param {string | null} selectedDate - Optional date to analyze (YYYY-MM-DD). If not provided, uses today.
 * @returns {WorkoutAnalysis} Workout statistics for the selected week
 */
export const useWorkoutAnalysis = (
    workoutLog: Workout[],
    selectedDate: string | null = null,
): WorkoutAnalysis => {
    return useMemo(() => {
        const referenceDate = selectedDate || getArgentinaDateString();
        const monday = getMondayOfWeek(referenceDate);
        const sunday = addDaysToDate(monday, 6);

        const currentWeekWorkouts = workoutLog.filter(
            (w) => w.date >= monday && w.date <= sunday,
        );

        // Previous week range
        const prevMonday = addDaysToDate(monday, -7);
        const prevSunday = addDaysToDate(prevMonday, 6);
        const prevWeekWorkouts = workoutLog.filter(
            (w) => w.date >= prevMonday && w.date <= prevSunday,
        );

        const gymCount = currentWeekWorkouts.filter((w) => w.type === 'gym').length;
        const tennisCount = currentWeekWorkouts.filter((w) => {
            const nameLower = w.name?.toLowerCase() || '';
            return (
                w.type === 'tennis' ||
                w.type === 'sport' ||
                nameLower.includes('tenis') ||
                nameLower.includes('tennis')
            );
        }).length;
        const totalDuration = currentWeekWorkouts.reduce(
            (sum, w) => sum + (Number(w.duration) || 0),
            0,
        );

        // Volume calculations
        const totalVolume = currentWeekWorkouts.reduce(
            (sum, w) => sum + (Number(w.volume) || 0),
            0,
        );
        const prevWeekVolume = prevWeekWorkouts.reduce(
            (sum, w) => sum + (Number(w.volume) || 0),
            0,
        );
        const volumeChange =
            prevWeekVolume > 0
                ? Math.round(((totalVolume - prevWeekVolume) / prevWeekVolume) * 100)
                : null;

        // Analysis keys (not hardcoded strings - consumers should use t() with these)
        const analysis: string[] = [];
        if (gymCount >= 3) analysis.push('greatGymConsistency');
        if (tennisCount >= 2) analysis.push('goodTennisVolume');
        if (totalDuration > 300) analysis.push('highWeeklyIntensity');
        if (analysis.length === 0 && currentWeekWorkouts.length > 0)
            analysis.push('keepMoving');
        if (currentWeekWorkouts.length === 0) analysis.push('noActivity');

        const weekStartDate = new Date(monday + 'T12:00:00').toLocaleDateString(
            'es-AR',
            { day: 'numeric', month: 'short' },
        );

        return {
            weekStart: weekStartDate,
            gymCount,
            tennisCount,
            totalDuration,
            totalVolume,
            prevWeekVolume,
            volumeChange,
            prevWeekWorkouts: prevWeekWorkouts.length,
            analysis,
        };
    }, [workoutLog, selectedDate]);
};
