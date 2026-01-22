import { useMemo } from 'react';
import {
    CustomTargets,
    FoodEntry,
    Profile,
    StepsEntry,
    WeightEntry,
    WeightProjection,
} from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

/**
 * useWeightProjection - Predictive Weight Engine for LukenFit
 *
 * Implements the "Realist Trend" algorithm that responds to daily adherence:
 * - R_realist: 14-day actual weight trend (kg/week)
 * - Adherence Modifier: Adjusts projection based on last 7 days compliance
 * - Dynamic Goal Date: Moves closer when adherent, further when not
 *
 * @param {WeightEntry[]} weightHistory - Sorted weight entries from useBiometrics
 * @param {FoodEntry[]} foodLog - Food entries for calorie/protein tracking
 * @param {StepsEntry[]} stepsLog - Daily step entries for activity compliance
 * @param {CustomTargets} customTargets - Nutrition targets { calories, protein }
 * @param {Profile} profile - User profile { currentWeight, targetWeight, stepGoal }
 * @returns {WeightProjection} Projection data for visualization
 *
 * CRITICAL: All dates use Argentina timezone (America/Argentina/Buenos_Aires)
 */
export const useWeightProjection = (
    weightHistory: WeightEntry[],
    foodLog: FoodEntry[],
    stepsLog: StepsEntry[],
    customTargets: CustomTargets,
    profile: Profile,
    getTargetsForDate: (date: string) => CustomTargets,
): WeightProjection => {
    const TARGET_WEIGHT = profile?.targetWeight || 75;
    const STEP_GOAL = profile?.stepGoal || 10000;
    // Use profile weight as fallback, but prefer today's log for specific calculations
    const profileWeight = profile?.currentWeight;

    // Derive the most accurate current weight:
    // 1. Check if there is a weight entry for TODAY in history
    // 2. Fallback to profile.currentWeight
    const currentWeight = useMemo(() => {
        const today = getArgentinaDateString();
        const todayEntry = weightHistory?.find((entry) => entry.date === today);
        return todayEntry
            ? Number(String(todayEntry.weight).replace(',', '.'))
            : profileWeight;
    }, [weightHistory, profileWeight]);

    /**
     * Calculate 14-day Realist Trend (R)
     * Formula: R = (W_today - W_14d_ago) / days_span * 7 (kg/week)
     */
    const realistTrend = useMemo(() => {
        if (!weightHistory || weightHistory.length < 2) {
            return null;
        }

        const today = getArgentinaDateString();
        const fourteenDaysAgo = addDaysToDate(today, -14);

        // Filter entries within last 14 days
        const recentEntries = weightHistory.filter(
            (entry) => entry.date >= fourteenDaysAgo && entry.date <= today,
        );

        if (recentEntries.length < 2) {
            return null;
        }

        // Sort by date ascending
        const sorted = [...recentEntries].sort((a, b) =>
            a.date.localeCompare(b.date),
        );
        const oldest = sorted[0];
        const newest = sorted[sorted.length - 1];

        // Calculate days between
        const oldestDate = new Date(oldest.date + 'T12:00:00');
        const newestDate = new Date(newest.date + 'T12:00:00');

        if (isNaN(oldestDate.getTime()) || isNaN(newestDate.getTime())) {
            console.warn('Invalid dates in weight history for trend calculation');
            return null;
        }

        const daysDiff = Math.abs(
            (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysDiff === 0) return 0;

        const w1 = Number(String(newest.weight).replace(',', '.'));
        const w2 = Number(String(oldest.weight).replace(',', '.'));

        if (isNaN(w1) || isNaN(w2)) {
            console.warn('Invalid weight values for trend calculation', { w1, w2 });
            return null;
        }

        const weightDiff = w1 - w2;
        const ratePerWeek = (weightDiff / daysDiff) * 7;

        // Final guard against infinity or NaN
        if (!isFinite(ratePerWeek) || isNaN(ratePerWeek)) {
            return 0;
        }

        return ratePerWeek;
    }, [weightHistory]);

    /**
     * Calculate 7-day Adherence Score (A)
     * A = (days_calories_ok + days_protein_ok + days_steps_ok) / (7 * 3)
     * Range: 0.0 to 1.0
     *
     * SAFETY NET: Excludes days tagged with is_safety_net_day from calculations
     */
    const adherenceData = useMemo(() => {
        const today = getArgentinaDateString();
        const startFrom = addDaysToDate(today, -1); // Exclude today to avoid partial data noise

        let caloriesOkCount = 0;
        let proteinOkCount = 0;
        let stepsOkCount = 0;

        for (let i = 0; i < 7; i++) {
            const date = addDaysToDate(startFrom, -i);

            // 1. Get targets for this specific date (periodization aware)
            const dayTarget = getTargetsForDate(date);
            const calorieTarget =
                dayTarget?.calories || customTargets?.calories || 2200;
            const proteinTarget =
                dayTarget?.protein || customTargets?.protein || 160;

            // 2. Nutrition check
            // CRITICAL: Filter out safety net days
            const dayFoods =
                foodLog?.filter(
                    (f) =>
                        f.date === date &&
                        !(f as any).is_safety_net_day &&
                        f.sourceId !== 'safety-net',
                ) || [];

            if (dayFoods.length > 0) {
                const totals = dayFoods.reduce(
                    (acc, f) => ({
                        calories: acc.calories + (Number(f.calories) || 0),
                        protein: acc.protein + (Number(f.protein) || 0),
                    }),
                    { calories: 0, protein: 0 },
                );

                const calDiffPercent =
                    (totals.calories - calorieTarget) / calorieTarget;

                // Calorie Adherence: Goal-aware logic
                let isCalOk = false;
                if (profile?.goal === 'cut') {
                    // For cutting: staying under is the goal. Allow up to 10% over.
                    // Lower bound of -40% to avoid extreme starvation being "adherent"
                    isCalOk = calDiffPercent <= 0.1 && calDiffPercent >= -0.4;
                } else if (profile?.goal === 'bulk') {
                    // For bulking: staying over is the goal. Allow up to 10% under.
                    isCalOk = calDiffPercent >= -0.1 && calDiffPercent <= 0.5;
                } else {
                    // Maintenance: Standard ±15% range
                    isCalOk = Math.abs(calDiffPercent) <= 0.15;
                }

                if (isCalOk) {
                    caloriesOkCount++;
                }

                // Protein Adherence: >= 85% of target is always good
                if (totals.protein >= proteinTarget * 0.85) {
                    proteinOkCount++;
                }
            }

            // 3. Steps check (always counts if logged)
            const daySteps = stepsLog?.find((s) => s.date === date)?.steps || 0;
            if (daySteps >= STEP_GOAL * 0.8) {
                // 80% of goal counts as adherent
                stepsOkCount++;
            }
        }

        // Denominator is always 21 (7 days * 3 metrics) to reflect consistency
        const totalPossible = 7 * 3;
        const adherenceScore =
            (caloriesOkCount + proteinOkCount + stepsOkCount) / totalPossible;

        return {
            adherenceScore,
            adherencePercent: Math.round(adherenceScore * 100),
            caloriesOkCount,
            proteinOkCount,
            stepsOkCount,
            totalChecks: totalPossible,
        };
    }, [
        foodLog,
        stepsLog,
        customTargets,
        STEP_GOAL,
        profile?.goal,
        getTargetsForDate,
    ]);

    /**
     * Calculate Adjusted Rate and Projected Goal Date
     * R_adjusted = R_realist * (0.6 + 0.4 * A)
     */
    const projection = useMemo(() => {
        if (!currentWeight || currentWeight <= TARGET_WEIGHT) {
            return {
                projectedGoalDate: 'Meta alcanzada! 🎉',
                adjustedTrend: 0,
                weeksToGoal: '0',
                daysToGoal: 0,
                remainingWeight: 0,
                status: 'goal_reached' as const,
            };
        }

        if (realistTrend === null || realistTrend >= 0) {
            // Not losing weight
            return {
                projectedGoalDate: null,
                adjustedTrend: realistTrend,
                weeksToGoal: null,
                daysToGoal: null,
                remainingWeight: currentWeight - TARGET_WEIGHT,
                status: 'not_losing' as const,
            };
        }

        // Apply adherence modifier: (0.6 + 0.4 * A)
        const adherenceModifier = 0.6 + 0.4 * adherenceData.adherenceScore;
        const adjustedTrend = realistTrend * adherenceModifier;

        const remainingWeight = currentWeight - TARGET_WEIGHT;
        const weeksToGoal = remainingWeight / Math.abs(adjustedTrend);
        const daysToGoal = Math.round(weeksToGoal * 7);

        const today = getArgentinaDateString();
        const projectedGoalDate = addDaysToDate(today, daysToGoal);

        return {
            projectedGoalDate,
            adjustedTrend,
            weeksToGoal: weeksToGoal.toFixed(1),
            daysToGoal,
            remainingWeight,
            status: 'on_track' as const,
        };
    }, [currentWeight, realistTrend, adherenceData.adherenceScore, TARGET_WEIGHT]);

    /**
     * Generate projected path for chart visualization
     * Returns array of { date, projectedWeight } from today to goal
     */
    const projectedPath = useMemo(() => {
        if (projection.status !== 'on_track' || !projection.daysToGoal) {
            return [];
        }

        const today = getArgentinaDateString();
        const path: Array<{ date: string; projectedWeight: number }> = [];
        const dailyLoss = Math.abs(projection.adjustedTrend || 0) / 7;

        // Generate weekly points to goal (max 52 weeks)
        const maxPoints = Math.min(Math.ceil(projection.daysToGoal / 7), 52);
        for (let week = 0; week <= maxPoints; week++) {
            const date = addDaysToDate(today, week * 7);
            const projected = (currentWeight || 0) - dailyLoss * week * 7;
            path.push({
                date,
                projectedWeight: Math.max(projected, TARGET_WEIGHT),
            });
        }

        return path;
    }, [projection, currentWeight, TARGET_WEIGHT]);

    /**
     * Generate actual weight data for last 90 days for chart (increased from 14 to show more context)
     */
    const actualPath = useMemo(() => {
        if (!weightHistory || weightHistory.length === 0) return [];

        const today = getArgentinaDateString();
        const historyStartDate = addDaysToDate(today, -90); // Expanded history window

        return weightHistory
            .filter((entry) => entry.date >= historyStartDate && entry.date <= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((entry) => ({
                date: entry.date,
                actualWeight: Number(String(entry.weight).replace(',', '.')), // Normalize weight
            }));
    }, [weightHistory]);

    /**
     * Generate coach message based on adherence and trend
     */
    const coachMessage = useMemo(() => {
        const { adherencePercent } = adherenceData;

        if (projection.status === 'goal_reached') {
            return {
                emoji: '🎉',
                text: '¡Llegaste a tu meta! Es hora de mantener.',
            };
        }

        if (projection.status === 'not_losing') {
            if (realistTrend && realistTrend > 0) {
                return {
                    emoji: '⚠️',
                    text: 'Tendencia al alza. Revisa tu déficit calórico.',
                };
            }
            return {
                emoji: '📊',
                text: 'Registra más datos para generar tu proyección.',
            };
        }

        if (adherencePercent >= 80) {
            return { emoji: '🔥', text: 'Excelente adherencia. ¡Sigue así!' };
        } else if (adherencePercent >= 60) {
            return {
                emoji: '👍',
                text: 'Buen progreso. Suma más días consistentes.',
            };
        } else if (adherencePercent >= 40) {
            return { emoji: '💪', text: 'Cada día cuenta. Enfócate hoy.' };
        } else {
            return { emoji: '🎯', text: 'Retoma el ritmo. Tu meta te espera.' };
        }
    }, [adherenceData, projection.status, realistTrend]);

    /**
     * Format goal date in Argentine locale
     */
    const formattedGoalDate = useMemo(() => {
        if (
            !projection.projectedGoalDate ||
            projection.projectedGoalDate.includes('🎉')
        ) {
            return projection.projectedGoalDate;
        }

        try {
            const date = new Date(projection.projectedGoalDate + 'T12:00:00');
            return new Intl.DateTimeFormat('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'America/Argentina/Buenos_Aires',
            }).format(date);
        } catch {
            return 'Calculando...';
        }
    }, [projection.projectedGoalDate]);

    return {
        // Core metrics
        realistTrend, // kg/week from actual 14-day data
        adjustedTrend: projection.adjustedTrend, // kg/week after adherence modifier
        remainingWeight: projection.remainingWeight,

        // Adherence
        adherencePercent: adherenceData.adherencePercent,
        adherenceDetails: adherenceData,

        // Projection
        projectedGoalDate: projection.projectedGoalDate,
        formattedGoalDate,
        weeksToGoal: projection.weeksToGoal as any,
        daysToGoal: projection.daysToGoal,
        projectionStatus: projection.status,

        // Chart data
        actualPath,
        projectedPath,
        targetWeight: TARGET_WEIGHT,

        // Coach feedback
        coachMessage,

        // Metadata for UI
        dataPoints: actualPath.length,
        daysCovered: 90, // Window for actualPath
    };
};
