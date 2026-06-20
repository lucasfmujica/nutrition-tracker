import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CustomTargets,
    FoodEntry,
    Profile,
    StepsEntry,
    WeightEntry,
    WeightProjection,
} from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';
import { calculateLinearRegression, DataPoint } from '../utils/analyticsUtils';

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
    const { t, i18n } = useTranslation();
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
     * Calculate 30-day Realist Trend (R) via least-squares linear regression.
     *
     * Instead of using only the first and last point (which is highly
     * sensitive to outliers / measurement noise), we fit a regression line
     * over ALL weight entries in the trailing 30-day window. The slope is in
     * kg/day, which we convert to kg/week (× 7).
     *
     * Formula: R = slope(kg/day) * 7 (kg/week)
     */
    const realistTrend = useMemo(() => {
        if (!weightHistory || weightHistory.length < 2) {
            return null;
        }

        const today = getArgentinaDateString();
        const thirtyDaysAgo = addDaysToDate(today, -30);

        // Filter entries within last 30 days
        const recentEntries = weightHistory.filter(
            (entry) => entry.date >= thirtyDaysAgo && entry.date <= today,
        );

        if (recentEntries.length < 2) {
            return null;
        }

        // Sort by date ascending
        const sorted = [...recentEntries].sort((a, b) =>
            a.date.localeCompare(b.date),
        );

        // Anchor x at the oldest entry so x = days elapsed since the window start.
        const oldestDate = new Date(sorted[0].date + 'T12:00:00');
        if (isNaN(oldestDate.getTime())) {
            console.warn('Invalid dates in weight history for trend calculation');
            return null;
        }

        // Build regression points (x = days since oldest, y = weight in kg).
        const dataPoints: DataPoint[] = [];
        for (const entry of sorted) {
            const entryDate = new Date(entry.date + 'T12:00:00');
            const weight = Number(String(entry.weight).replace(',', '.'));

            if (isNaN(entryDate.getTime()) || isNaN(weight)) {
                console.warn('Invalid weight entry for trend calculation', entry);
                continue;
            }

            const daysSinceStart =
                (entryDate.getTime() - oldestDate.getTime()) /
                (1000 * 60 * 60 * 24);

            dataPoints.push({ x: daysSinceStart, y: weight, date: entry.date });
        }

        if (dataPoints.length < 2) {
            return null;
        }

        // Guard: if all points fall on the same day, span is zero -> no trend.
        const daysDiff =
            dataPoints[dataPoints.length - 1].x - dataPoints[0].x;
        if (daysDiff === 0) return 0;

        const regression = calculateLinearRegression(dataPoints);
        if (!regression) {
            // Returns null when all x are identical (handled above) — be safe.
            return 0;
        }

        // slope is kg/day -> convert to kg/week.
        const ratePerWeek = regression.slope * 7;

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
        const safetyNetDays = profile?.safety_net_days || [];

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
            // CRITICAL: Filter out safety net days (SSOT: profile.safety_net_days)
            const dayFoods = safetyNetDays.includes(date)
                ? []
                : foodLog?.filter(
                      (f) =>
                          f.date === date && f.sourceId !== 'safety-net',
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
        profile?.safety_net_days,
        getTargetsForDate,
    ]);

    /**
     * Calculate Adjusted Rate and Projected Goal Date
     * R_adjusted = R_realist * (0.6 + 0.4 * A)
     *
     * GOAL-AWARE LOGIC:
     * - Cut: remainingWeight = currentWeight - TARGET (positive means still losing)
     * - Bulk: remainingWeight = TARGET - currentWeight (positive means still gaining)
     * - Maintain: No projection needed
     */
    const projection = useMemo(() => {
        const isGainingGoal = profile?.goal === 'bulk';
        const isMaintainGoal = profile?.goal === 'maintain';

        // For maintain mode, no weight projection needed
        if (isMaintainGoal) {
            return {
                projectedGoalDate: null,
                adjustedTrend: realistTrend,
                weeksToGoal: null,
                daysToGoal: null,
                remainingWeight: currentWeight
                    ? Math.abs(currentWeight - TARGET_WEIGHT)
                    : 0,
                status: 'not_losing' as const, // We use 'not_losing' to indicate no projection
            };
        }

        // Calculate remaining weight based on goal direction
        const remainingWeight = isGainingGoal
            ? TARGET_WEIGHT - (currentWeight || 0)
            : (currentWeight || 0) - TARGET_WEIGHT;

        // Check if goal is reached
        if (!currentWeight || remainingWeight <= 0) {
            return {
                projectedGoalDate: t('dashboard.predictive.goalReached.title'),
                adjustedTrend: 0,
                weeksToGoal: '0',
                daysToGoal: 0,
                remainingWeight: 0,
                status: 'goal_reached' as const,
            };
        }

        // Check if trend is moving in the correct direction
        const trendIsCorrect = isGainingGoal
            ? realistTrend !== null && realistTrend > 0 // Bulk: positive trend is good
            : realistTrend !== null && realistTrend < 0; // Cut: negative trend is good

        if (realistTrend === null || !trendIsCorrect) {
            return {
                projectedGoalDate: null,
                adjustedTrend: realistTrend,
                weeksToGoal: null,
                daysToGoal: null,
                remainingWeight,
                status: 'not_losing' as const,
            };
        }

        // Apply adherence modifier: (0.6 + 0.4 * A)
        const adherenceModifier = 0.6 + 0.4 * adherenceData.adherenceScore;
        const adjustedTrend = realistTrend * adherenceModifier;

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
    }, [
        currentWeight,
        realistTrend,
        adherenceData.adherenceScore,
        TARGET_WEIGHT,
        profile?.goal,
        t,
    ]);

    /**
     * Generate projected path for chart visualization
     * Returns array of { date, projectedWeight } from today to goal
     * GOAL-AWARE: Handles both cut (losing) and bulk (gaining) directions
     */
    const projectedPath = useMemo(() => {
        if (projection.status !== 'on_track' || !projection.daysToGoal) {
            return [];
        }

        const isGainingGoal = profile?.goal === 'bulk';
        const today = getArgentinaDateString();
        const path: Array<{ date: string; projectedWeight: number }> = [];
        const dailyChange = Math.abs(projection.adjustedTrend || 0) / 7;

        // Generate weekly points to goal (max 52 weeks)
        const maxPoints = Math.min(Math.ceil(projection.daysToGoal / 7), 52);
        for (let week = 0; week <= maxPoints; week++) {
            const date = addDaysToDate(today, week * 7);
            let projected: number;

            if (isGainingGoal) {
                // Bulk: weight increases over time
                projected = (currentWeight || 0) + dailyChange * week * 7;
                path.push({
                    date,
                    projectedWeight: Math.min(projected, TARGET_WEIGHT),
                });
            } else {
                // Cut: weight decreases over time
                projected = (currentWeight || 0) - dailyChange * week * 7;
                path.push({
                    date,
                    projectedWeight: Math.max(projected, TARGET_WEIGHT),
                });
            }
        }

        return path;
    }, [projection, currentWeight, TARGET_WEIGHT, profile?.goal]);

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
     * Generate coach message based on adherence, trend, and goal type
     */
    const coachMessage = useMemo(() => {
        const { adherencePercent } = adherenceData;
        const isGainingGoal = profile?.goal === 'bulk';
        const isMaintainGoal = profile?.goal === 'maintain';

        if (projection.status === 'goal_reached') {
            return {
                emoji: '🎉',
                text: t('dashboard.predictive.goalReached.message'),
            };
        }

        if (isMaintainGoal) {
            // Maintain mode messaging
            if (realistTrend === null) {
                return {
                    emoji: '📊',
                    text: t('dashboard.predictive.coach.moreData'),
                };
            }
            const absWeeklyChange = Math.abs(realistTrend || 0);
            if (absWeeklyChange <= 0.2) {
                return { emoji: '✅', text: t('dashboard.predictive.coach.stable') };
            } else if (realistTrend && realistTrend > 0) {
                return {
                    emoji: '📈',
                    text: t('dashboard.predictive.coach.upwardsTrend'),
                };
            } else {
                return {
                    emoji: '📉',
                    text: t('dashboard.predictive.coach.downwardsTrend'),
                };
            }
        }

        if (projection.status === 'not_losing') {
            if (isGainingGoal) {
                // Bulk mode: not gaining is the issue
                if (realistTrend && realistTrend < 0) {
                    return {
                        emoji: '⚠️',
                        text: t('dashboard.predictive.coach.downwardsTrendBulk'),
                    };
                }
                return {
                    emoji: '📊',
                    text: t('dashboard.predictive.coach.moreData'),
                };
            } else {
                // Cut mode: not losing is the issue
                if (realistTrend && realistTrend > 0) {
                    return {
                        emoji: '⚠️',
                        text: t('dashboard.predictive.coach.upwardsTrendCut'),
                    };
                }
                return {
                    emoji: '📊',
                    text: t('dashboard.predictive.coach.moreData'),
                };
            }
        }

        if (adherencePercent >= 80) {
            return {
                emoji: '🔥',
                text: t('dashboard.predictive.coach.highAdherence'),
            };
        } else if (adherencePercent >= 60) {
            return {
                emoji: '👍',
                text: t('dashboard.predictive.coach.goodProgress'),
            };
        } else if (adherencePercent >= 40) {
            return { emoji: '💪', text: t('dashboard.predictive.coach.keepGoing') };
        } else {
            return { emoji: '🎯', text: t('dashboard.predictive.coach.rebound') };
        }
    }, [adherenceData, projection.status, realistTrend, profile?.goal, t]);

    /**
     * Format goal date in user locale
     */
    const formattedGoalDate = useMemo(() => {
        if (
            !projection.projectedGoalDate ||
            projection.projectedGoalDate.match(/Meta alcanzada|Goal reached/)
        ) {
            return projection.projectedGoalDate;
        }

        try {
            const date = new Date(projection.projectedGoalDate + 'T12:00:00');
            const locale = i18n.language === 'es' ? 'es-AR' : 'en-US';
            return new Intl.DateTimeFormat(locale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'America/Argentina/Buenos_Aires',
            }).format(date);
        } catch {
            return t('dashboard.predictive.labels.calculating');
        }
    }, [projection.projectedGoalDate, i18n.language, t]);

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
