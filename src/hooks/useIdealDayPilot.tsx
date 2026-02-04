import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { OuraEntry, Profile, Workout } from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

interface IdealDaySuggestion {
    id: string;
    type: 'sleep' | 'nutrition' | 'training' | 'habit';
    title: string;
    suggestion: string;
    time?: string;
    icon: string;
    priority: 'high' | 'medium' | 'low';
}

export interface IdealDayPilot {
    suggestions: IdealDaySuggestion[];
    optimalWindow: {
        bedtime: string;
        wakeTime: string;
        eatingWindow: {
            start: string;
            end: string;
        };
    };
    hasData: boolean;
}

/**
 * useIdealDayPilot - Synthesizes all bio-analytics to derive an "Ideal Routine".
 */
export const useIdealDayPilot = (
    ouraLog: OuraEntry[],
    mealTimingInsights: any, // From useMealTimingAnalytics
    performanceForecast: any, // From usePerformanceForecast
    profile: Profile,
    workouts: Workout[],
): IdealDayPilot => {
    const { t } = useTranslation();

    return useMemo(() => {
        if (!ouraLog || ouraLog.length < 5) {
            return {
                suggestions: [],
                optimalWindow: {
                    bedtime: '--:--',
                    wakeTime: '--:--',
                    eatingWindow: { start: '--:--', end: '--:--' },
                },
                hasData: false,
            };
        }

        // 1. DERIVE OPTIMAL SLEEP WINDOW
        // Find top 7 days with best readiness/sleep scores
        const bestDays = [...ouraLog]
            .filter((o) => o.bedtime && o.wakeTime && (o.readinessScore || 0) > 0)
            .sort((a, b) => (b.readinessScore || 0) - (a.readinessScore || 0))
            .slice(0, 7);

        const avgBedtime = calculateAvgTimeS(bestDays.map((d) => d.bedtime!));
        const avgWakeTime = calculateAvgTimeS(bestDays.map((d) => d.wakeTime!));

        // 2. DERIVE OPTIMAL EATING WINDOW
        // We use the mealTimingInsights gap or default to 3 hours
        const sleepGap = Math.max(
            mealTimingInsights.sleepImpact?.avgMealBedtimeGap || 3,
            2.5,
        );

        // Calculate last meal time: Bedtime - Gap
        const lastMealTime = subtractHours(avgBedtime, sleepGap);
        const breakfastTime =
            mealTimingInsights.avgFirstMealTime !== '--:--'
                ? mealTimingInsights.avgFirstMealTime
                : '08:00';

        // 3. GENERATE SUGGESTIONS
        const suggestions: IdealDaySuggestion[] = [];

        // SLEEP SUGGESTION
        suggestions.push({
            id: 'sleep-routine',
            type: 'sleep',
            title: t('dashboard.idealDay.sleep.title'),
            suggestion: t('dashboard.idealDay.sleep.copy', { time: avgBedtime }),
            time: avgBedtime,
            icon: 'Moon',
            priority: 'high',
        });

        // NUTRITION SUGGESTION
        suggestions.push({
            id: 'nutrition-last-meal',
            type: 'nutrition',
            title: t('dashboard.idealDay.nutrition.title'),
            suggestion: t('dashboard.idealDay.nutrition.copy', {
                time: lastMealTime,
            }),
            time: lastMealTime,
            icon: 'Utensils',
            priority: 'medium',
        });

        // TRAINING SUGGESTION based on Forecast
        const forecastCode = performanceForecast?.forecastCode;
        let trainingMsg = '';
        let trainingIcon = 'Zap';

        if (forecastCode === 'peak') {
            trainingMsg = t('dashboard.idealDay.training.peak');
        } else if (forecastCode === 'recovery' || forecastCode === 'rest_volume') {
            trainingMsg = t('dashboard.idealDay.training.recovery');
            trainingIcon = 'BatteryCharging';
        } else {
            trainingMsg = t('dashboard.idealDay.training.steady');
        }

        suggestions.push({
            id: 'training-intensity',
            type: 'training',
            title: t('dashboard.idealDay.training.title'),
            suggestion: trainingMsg,
            icon: trainingIcon,
            priority: 'medium',
        });

        // HYDRATION HABIT (Static but useful context)
        suggestions.push({
            id: 'hydration-habit',
            type: 'habit',
            title: t('dashboard.idealDay.habit.hydrationTitle'),
            suggestion: t('dashboard.idealDay.habit.hydrationCopy'),
            icon: 'Droplet',
            priority: 'low',
        });

        return {
            suggestions,
            optimalWindow: {
                bedtime: avgBedtime,
                wakeTime: avgWakeTime,
                eatingWindow: {
                    start: breakfastTime,
                    end: lastMealTime,
                },
            },
            hasData: true,
        };
    }, [ouraLog, mealTimingInsights, performanceForecast, profile, workouts, t]);
};

// ========== HELPERS ==========

function calculateAvgTimeS(times: string[]): string {
    if (times.length === 0) return '--:--';
    let sumMinutes = 0;
    times.forEach((t) => {
        const [h, m] = t.split(':').map(Number);
        let mins = h * 60 + m;
        // Handle bedtime crossing midnight (e.g. 23:00 vs 00:30)
        // If it's before 04:00, assume it's late night and add 24h
        if (h < 4) mins += 24 * 60;
        sumMinutes += mins;
    });

    let avgMinutes = sumMinutes / times.length;
    let hours = Math.floor(avgMinutes / 60) % 24;
    let mins = Math.round(avgMinutes % 60);

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function subtractHours(time: string, hoursToSub: number): string {
    const [h, m] = time.split(':').map(Number);
    let totalMins = h * 60 + m;
    totalMins -= hoursToSub * 60;

    if (totalMins < 0) totalMins += 24 * 60;

    const newH = Math.floor(totalMins / 60);
    const newM = Math.round(totalMins % 60);

    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}
