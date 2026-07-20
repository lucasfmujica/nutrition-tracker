import { useMemo } from 'react';
import { useCorrelationAnalytics } from '../../hooks/useCorrelationAnalytics';
import { useIdealDayPilot } from '../../hooks/useIdealDayPilot';
import { useMealTimingAnalytics } from '../../hooks/useMealTimingAnalytics';
import { useOuraAutoAdjust } from '../../hooks/useOuraAutoAdjust';
import { usePatternRecognition } from '../../hooks/usePatternRecognition';
import { usePlateauDetector } from '../../hooks/usePlateauDetector';
import { useWeeklyPeriodization } from '../../hooks/useWeeklyPeriodization';
import {
    CustomTargets,
    Macros,
    OuraEntry,
    Profile,
    WeightEntry,
} from '../../types/domain';

interface DashboardEnginesInput {
    dashboardDate: string;
    dashboardTargets: Macros;
    ouraLog: OuraEntry[];
    weightHistory: WeightEntry[];
    profile: Profile;
    getTotalsForDate: (date: string) => Macros;
    getTargetsForDate: (date: string) => CustomTargets;
    getStepsForDate: (date: string) => number;
    getMostRecentWeight: (history: WeightEntry[]) => WeightEntry | null;
    // From TrackerContext
    foodLog: any;
    workoutLog: any;
    stepsLog: any;
    waterLog: any;
    customTargets: any;
    weeklyPlan: any;
    performanceForecast: any;
    isSafetyNetActive: (date: string) => boolean;
}

/**
 * Composición de los motores de analytics del Dashboard (patrones,
 * correlaciones, mesetas, periodización, meal timing, día ideal y ajuste
 * Oura) + cálculo de targets periodizados para la fecha activa.
 * Extraído de DashboardTab para respetar el límite de 300 líneas.
 */
export const useDashboardEngines = ({
    dashboardDate,
    dashboardTargets,
    ouraLog,
    weightHistory,
    profile,
    getTotalsForDate,
    getTargetsForDate,
    getStepsForDate,
    getMostRecentWeight,
    foodLog,
    workoutLog,
    stepsLog,
    waterLog,
    customTargets,
    weeklyPlan,
    performanceForecast,
    isSafetyNetActive,
}: DashboardEnginesInput) => {
    // Pattern Recognition Engine
    const baseInsight = usePatternRecognition(
        ouraLog,
        getTotalsForDate,
        getTargetsForDate,
    );

    // Correlation Engine
    const correlationAnalytics = useCorrelationAnalytics(
        foodLog,
        workoutLog,
        ouraLog,
        weightHistory,
        stepsLog,
        waterLog,
    );

    // Plateau Detection Engine
    const plateauData = usePlateauDetector(weightHistory, customTargets);

    // Weekly Periodization Engine
    const weeklyPeriodization = useWeeklyPeriodization(
        workoutLog,
        profile,
        customTargets,
        getMostRecentWeight(weightHistory)?.weight || profile?.currentWeight,
        profile?.targetWeight || 75,
        foodLog,
        weeklyPlan,
    );

    // Meal Timing Analytics Engine
    const mealTimingInsights = useMealTimingAnalytics(
        foodLog,
        ouraLog,
        workoutLog,
        dashboardDate,
    );

    // Ideal Day Pilot Engine
    const idealDayPilot = useIdealDayPilot(
        ouraLog,
        mealTimingInsights,
        performanceForecast,
        profile,
        workoutLog,
    );

    // Oura Auto-Adjust Engine
    const ouraAutoAdjustData = useOuraAutoAdjust(
        ouraLog,
        dashboardDate,
        getStepsForDate(dashboardDate),
    );

    // Memoized periodization and targets for the current date
    const { periodizedTargets, periodizationIntensity } = useMemo(() => {
        const periodizedDay = weeklyPeriodization?.weekDays?.find(
            (d: any) => d.date === dashboardDate,
        );

        const intensity = periodizedDay?.intensity;

        let calculatedTargets = dashboardTargets;
        if (isSafetyNetActive(dashboardDate)) {
            calculatedTargets = {
                ...dashboardTargets,
                calories: profile?.tdee || dashboardTargets.calories + 500,
            };
        } else if (periodizedDay) {
            calculatedTargets = {
                ...dashboardTargets,
                calories: periodizedDay.calories,
            };
        }
        calculatedTargets = {
            ...calculatedTargets,
            calories: Math.max(
                1200,
                calculatedTargets.calories + ouraAutoAdjustData.ouraCalorieBoost,
            ),
        };

        return {
            periodizedTargets: calculatedTargets,
            periodizationIntensity: intensity,
        };
    }, [
        dashboardDate,
        weeklyPeriodization,
        dashboardTargets,
        isSafetyNetActive,
        profile?.tdee,
        ouraAutoAdjustData.ouraCalorieBoost,
    ]);

    return {
        baseInsight,
        correlationAnalytics,
        plateauData,
        weeklyPeriodization,
        mealTimingInsights,
        idealDayPilot,
        ouraAutoAdjustData,
        periodizedTargets,
        periodizationIntensity,
    };
};
