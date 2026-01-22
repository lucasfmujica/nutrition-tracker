import { useMemo } from 'react';
import { Workout } from '../types/domain';
import {
    addDaysToDate,
    getArgentinaDateString,
    getMondayOfWeek,
} from '../utils/dateUtils';

interface WorkoutAnalysis {
    weekStart: string;
    gymCount: number;
    tennisCount: number;
    totalDuration: number;
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
        // Use selectedDate if provided, otherwise use today
        const referenceDate = selectedDate || getArgentinaDateString();
        const monday = getMondayOfWeek(referenceDate);
        const sunday = addDaysToDate(monday, 6);

        const currentWeekWorkouts = workoutLog.filter(
            (w) => w.date >= monday && w.date <= sunday,
        );

        const gymCount = currentWeekWorkouts.filter((w) => w.type === 'gym').length;
        // CRITICAL FIX: Tennis recognition with fallback to name-based detection
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

        const analysis: string[] = [];
        if (gymCount >= 3) analysis.push('¡Excelente constancia en el gimnasio!');
        if (tennisCount >= 2) analysis.push('Buen volumen de tenis esta semana.');
        if (totalDuration > 300) analysis.push('Alta intensidad semanal 🔥');
        if (analysis.length === 0 && currentWeekWorkouts.length > 0)
            analysis.push('¡Sigue sumando movimiento!');
        if (currentWeekWorkouts.length === 0)
            analysis.push('Sin actividad registrada esta semana.');

        const weekStartDate = new Date(monday + 'T12:00:00').toLocaleDateString(
            'es-AR',
            { day: 'numeric', month: 'short' },
        );

        return {
            weekStart: weekStartDate,
            gymCount,
            tennisCount,
            totalDuration,
            analysis,
        };
    }, [workoutLog, selectedDate]);
};
