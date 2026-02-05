import { useCallback } from 'react';
import { CustomTargets, StepsEntry } from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

interface UseAnalyticsExtendedParams {
    stepsLog: StepsEntry[];
    stepGoal: number;
    getTotalsForDate: (date: string) => any;
    getTargetsForDate: (date: string) => CustomTargets;
    getWeeklyAdherence: (weeksAgo?: number) => any;
}

/**
 * useAnalyticsExtended - Extended analytics: weekly comparison, streaks, best day
 *
 * Extracted from useAnalytics to keep files under 300 lines.
 * Depends on getWeeklyAdherence from useAnalytics.
 */
export const useAnalyticsExtended = ({
    stepsLog,
    stepGoal = 8000,
    getTotalsForDate,
    getTargetsForDate,
    getWeeklyAdherence,
}: UseAnalyticsExtendedParams) => {
    /**
     * Get weekly comparison: current week vs previous week
     * Returns delta and percentage change for macros
     */
    const getWeeklyComparison = useCallback(() => {
        const currentWeek = getWeeklyAdherence(0);
        const previousWeek = getWeeklyAdherence(1);

        const calsDelta = currentWeek.avgCals - previousWeek.avgCals;
        const protDelta = currentWeek.avgProt - previousWeek.avgProt;
        const stepsDelta = currentWeek.avgSteps - previousWeek.avgSteps;

        const calsChange = previousWeek.avgCals > 0
            ? Math.round((calsDelta / previousWeek.avgCals) * 100)
            : 0;
        const protChange = previousWeek.avgProt > 0
            ? Math.round((protDelta / previousWeek.avgProt) * 100)
            : 0;
        const stepsChange = previousWeek.avgSteps > 0
            ? Math.round((stepsDelta / previousWeek.avgSteps) * 100)
            : 0;

        let currentCarbs = 0, currentFat = 0;
        let previousCarbs = 0, previousFat = 0;

        const currentWeekDates = [];
        for (let i = 0; i < 7; i++) {
            currentWeekDates.push(addDaysToDate(currentWeek.monday, i));
        }
        currentWeekDates.forEach(date => {
            const totals = getTotalsForDate(date);
            if (totals.calories > 0) {
                currentCarbs += totals.carbs || 0;
                currentFat += totals.fat || 0;
            }
        });

        const previousWeekDates = [];
        for (let i = 0; i < 7; i++) {
            previousWeekDates.push(addDaysToDate(previousWeek.monday, i));
        }
        previousWeekDates.forEach(date => {
            const totals = getTotalsForDate(date);
            if (totals.calories > 0) {
                previousCarbs += totals.carbs || 0;
                previousFat += totals.fat || 0;
            }
        });

        const avgCurrentCarbs = currentWeek.daysTracked > 0
            ? Math.round(currentCarbs / currentWeek.daysTracked) : 0;
        const avgCurrentFat = currentWeek.daysTracked > 0
            ? Math.round(currentFat / currentWeek.daysTracked) : 0;
        const avgPreviousCarbs = previousWeek.daysTracked > 0
            ? Math.round(previousCarbs / previousWeek.daysTracked) : 0;
        const avgPreviousFat = previousWeek.daysTracked > 0
            ? Math.round(previousFat / previousWeek.daysTracked) : 0;

        const carbsDelta = avgCurrentCarbs - avgPreviousCarbs;
        const fatDelta = avgCurrentFat - avgPreviousFat;
        const carbsChange = avgPreviousCarbs > 0
            ? Math.round((carbsDelta / avgPreviousCarbs) * 100) : 0;
        const fatChange = avgPreviousFat > 0
            ? Math.round((fatDelta / avgPreviousFat) * 100) : 0;

        return {
            current: {
                calories: currentWeek.avgCals,
                protein: currentWeek.avgProt,
                carbs: avgCurrentCarbs,
                fat: avgCurrentFat,
                steps: currentWeek.avgSteps,
                score: currentWeek.score,
                daysTracked: currentWeek.daysTracked,
            },
            previous: {
                calories: previousWeek.avgCals,
                protein: previousWeek.avgProt,
                carbs: avgPreviousCarbs,
                fat: avgPreviousFat,
                steps: previousWeek.avgSteps,
                score: previousWeek.score,
                daysTracked: previousWeek.daysTracked,
            },
            delta: {
                calories: calsDelta,
                protein: protDelta,
                carbs: carbsDelta,
                fat: fatDelta,
                steps: stepsDelta,
            },
            change: {
                calories: calsChange,
                protein: protChange,
                carbs: carbsChange,
                fat: fatChange,
                steps: stepsChange,
            },
        };
    }, [getWeeklyAdherence, getTotalsForDate]);

    /**
     * Get streak data: consecutive days meeting protein target (>= 90%)
     */
    const getStreakData = useCallback(() => {
        const today = getArgentinaDateString();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        const streakDates: string[] = [];

        const sortedDates: string[] = [];
        for (let i = 89; i >= 0; i--) {
            sortedDates.push(addDaysToDate(today, -i));
        }

        sortedDates.forEach((date) => {
            const totals = getTotalsForDate(date);
            const targets = getTargetsForDate(date);
            const proteinMet = totals.protein >= targets.protein * 0.9;

            if (proteinMet && totals.calories > 0) {
                tempStreak++;
                if (date === today || sortedDates.indexOf(date) === sortedDates.length - 1) {
                    currentStreak = tempStreak;
                }
                streakDates.push(date);
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
            } else if (totals.calories > 0) {
                tempStreak = 0;
            }
        });

        const lastDayTotals = getTotalsForDate(today);
        if (lastDayTotals.calories === 0) {
            currentStreak = 0;
        }

        return {
            currentStreak,
            longestStreak,
            streakDates: streakDates.slice(-currentStreak),
        };
    }, [getTotalsForDate, getTargetsForDate]);

    /**
     * Get best day of week based on adherence score
     * Returns day index (0=Monday, 6=Sunday)
     */
    const getBestDayOfWeek = useCallback(() => {
        const dayScores: { [key: number]: { total: number; count: number } } = {
            0: { total: 0, count: 0 },
            1: { total: 0, count: 0 },
            2: { total: 0, count: 0 },
            3: { total: 0, count: 0 },
            4: { total: 0, count: 0 },
            5: { total: 0, count: 0 },
            6: { total: 0, count: 0 },
        };

        const today = getArgentinaDateString();

        for (let i = 0; i < 84; i++) {
            const date = addDaysToDate(today, -i);
            const totals = getTotalsForDate(date);
            const targets = getTargetsForDate(date);

            if (totals.calories === 0) continue;

            const dateObj = new Date(date + 'T12:00:00');
            const jsDay = dateObj.getDay();
            const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

            let score = 0;
            if (Math.abs(totals.calories - targets.calories) <= 150) score += 2;
            if (totals.protein >= targets.protein * 0.9) score += 3;

            const stepsEntry = stepsLog.find((s) => s.date === date);
            const steps = stepsEntry ? stepsEntry.steps : 0;
            if (steps >= stepGoal) score += 1;

            dayScores[dayIndex].total += score;
            dayScores[dayIndex].count += 1;
        }

        let bestDay = 0;
        let bestAvg = 0;

        Object.keys(dayScores).forEach((dayStr) => {
            const dayIdx = parseInt(dayStr);
            const { total, count } = dayScores[dayIdx];
            const avg = count > 0 ? total / count : 0;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestDay = dayIdx;
            }
        });

        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const dayNamesEN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        return {
            dayIndex: bestDay,
            dayName: dayNames[bestDay],
            dayNameEN: dayNamesEN[bestDay],
            averageScore: Math.round(bestAvg * 10) / 10,
            allDayScores: Object.keys(dayScores).map((dayStr) => {
                const dayIdx = parseInt(dayStr);
                const { total, count } = dayScores[dayIdx];
                return {
                    dayIndex: dayIdx,
                    dayName: dayNames[dayIdx],
                    dayNameEN: dayNamesEN[dayIdx],
                    averageScore: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
                    count,
                };
            }),
        };
    }, [getTotalsForDate, getTargetsForDate, stepsLog, stepGoal]);

    return {
        getWeeklyComparison,
        getStreakData,
        getBestDayOfWeek,
    };
};
