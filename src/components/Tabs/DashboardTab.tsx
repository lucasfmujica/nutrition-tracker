import { FileImage } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { useCorrelationAnalytics } from '../../hooks/useCorrelationAnalytics';
import { useIdealDayPilot } from '../../hooks/useIdealDayPilot';
import { useMealTimingAnalytics } from '../../hooks/useMealTimingAnalytics';
import { useOuraAutoAdjust } from '../../hooks/useOuraAutoAdjust';
import { usePatternRecognition } from '../../hooks/usePatternRecognition';
import { usePlateauDetector } from '../../hooks/usePlateauDetector';
import { useWeeklyPeriodization } from '../../hooks/useWeeklyPeriodization';
import { useWeeklyPlan } from '../../hooks/useWeeklyPlan';
import { useWeeklyReport } from '../../hooks/useWeeklyReport';
import {
    CustomTargets,
    Macros,
    OuraEntry,
    Profile,
    WaterEntry,
    WeightEntry,
} from '../../types/domain';
import { ActivityCards } from '../Dashboard/ActivityCards';
import { AIChefCard } from '../Dashboard/AIChefCard';
import CoachInsight from '../Dashboard/CoachInsight';
import { CorrelationSection } from '../Dashboard/CorrelationSection';
import { IdealDayCard } from '../Dashboard/IdealDayCard';
import { MacroCards } from '../Dashboard/MacroCards';
import { OuraInsightCard } from '../Dashboard/OuraInsightCard';

import { MealTimingCard } from '../Dashboard/MealTimingCard';
import { PerformanceForecastCard } from '../Dashboard/PerformanceForecastCard';
import { PlateauAlertCard } from '../Dashboard/PlateauAlertCard';
import { PredictiveWeightCard } from '../Dashboard/PredictiveWeightCard';
import { SafetyNetToggle } from '../Dashboard/SafetyNetToggle';
import { SummaryCard } from '../Dashboard/SummaryCard';
import { TrainingWidget } from '../Dashboard/TrainingWidget';
import { WeeklyPlanningCard } from '../Dashboard/WeeklyPlanningCard';
import { WeightChartCard } from '../Dashboard/WeightChartCard';
import { WeightProjectionCard } from '../Dashboard/WeightProjectionCard';
import { FoodCameraInput } from '../Food/FoodCameraInput';
import { WeeklyReportModal } from '../Modals/WeeklyReportModal';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

interface DashboardTabProps {
    // Date state
    dashboardDate: string;
    setDashboardDate: (date: string) => void;
    changeDate: (days: number) => void;
    // Data
    dashboardTotals: Macros;
    dashboardTargets: Macros;
    getStepsForDate: (date: string) => number;
    getWaterForDate: (date: string) => { glasses: number; entries: WaterEntry[] };
    addWaterGlass: (date: string) => void;
    removeWaterGlass: (date: string) => void;
    WATER_GOAL_GLASSES: number;
    hydrationTarget: any;
    workoutAnalysis: {
        gymCount: number;
        tennisCount: number;
        totalDuration: number;
        analysis: string[];
    };
    weightHistory: WeightEntry[];
    getMostRecentWeight: (history: WeightEntry[]) => WeightEntry | null;
    profile: Profile;
    // Pattern Recognition Props
    ouraLog: OuraEntry[];
    getTotalsForDate: (date: string) => Macros;
    getTargetsForDate: (date: string) => CustomTargets;
}

/**
 * DashboardTab - Main dashboard view
 * Displays summary, macros, activity, training, and weight charts
 */
export const DashboardTab: React.FC<DashboardTabProps> = ({
    // Date state
    dashboardDate,
    setDashboardDate,
    // Data
    dashboardTotals,
    dashboardTargets,
    getStepsForDate,
    getWaterForDate,
    addWaterGlass,
    removeWaterGlass,
    WATER_GOAL_GLASSES,
    workoutAnalysis,
    weightHistory,
    getMostRecentWeight,
    profile,
    // Pattern Recognition Props
    ouraLog,
    getTotalsForDate,
    getTargetsForDate,
}) => {
    const { t } = useTranslation();
    const waterData = getWaterForDate(dashboardDate);
    const {
        foodLog,
        workoutLog,
        stepsLog,
        waterLog,
        customTargets,
        weightProjection,
        isSafetyNetActive,
        toggleSafetyNet,
        getStatusMessage,
        mealTemplates,
        weeklyPlan,
        performanceForecast,
        setShowSuggestionModal,
        getContextualSuggestions,
    } = useTracker() as any;

    // Pattern Recognition Engine
    const baseInsight = usePatternRecognition(
        ouraLog,
        getTotalsForDate,
        getTargetsForDate,
    );

    // Coach Insight Logic (Safety Net Override)
    const insight = isSafetyNetActive(dashboardDate)
        ? {
              icon: 'Shield',
              message: 'Modo Escudo activado. Prioriza tu bienestar hoy.',
              description:
                  'Tu meta cambia a Mantenimiento. Enfócate en la proteína y descansa.',
          }
        : baseInsight;

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
    const ouraAutoAdjustData = useOuraAutoAdjust(ouraLog, dashboardDate);

    // Weekly Report Modal State
    const [showWeeklyReport, setShowWeeklyReport] = useState(false);
    const { stats, isLoading, error, fetchStats } = useWeeklyReport();

    // Handler to open weekly report
    const handleOpenWeeklyReport = async () => {
        setShowWeeklyReport(true);
        await fetchStats();
    };

    // Handler to open AI Chef modal
    const handleOpenAIChef = () => {
        const remaining = {
            calories: Math.max(0, dashboardTargets.calories - dashboardTotals.calories),
            protein: Math.max(0, dashboardTargets.protein - dashboardTotals.protein),
            carbs: Math.max(0, dashboardTargets.carbs - dashboardTotals.carbs),
            fat: Math.max(0, dashboardTargets.fat - dashboardTotals.fat),
            fiber: 0,
        };
        const isTraining = workoutLog?.some((w: any) => w.date === dashboardDate) || false;
        getContextualSuggestions?.(remaining, isTraining);
    };

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
    ]);

    return (
        <div className="space-y-6 pb-8 lg:pb-8">
            {/* Dashboard Header - Unified Lab Style */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1 mb-8">
                <div className="space-y-1">
                    <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight uppercase font-satoshi">
                        {t('dashboard.title')}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-[0.2em]">
                            {t('dashboard.subtitle')}
                        </p>
                    </div>
                </div>

                {/* Controls: Safety Net & Date Picker */}
                <div className="flex flex-col-reverse md:flex-row md:items-center gap-3 self-stretch md:self-auto">
                    <div className="flex-1 md:flex-none">
                        <SafetyNetToggle
                            isActive={isSafetyNetActive(dashboardDate)}
                            onToggle={() => toggleSafetyNet(dashboardDate)}
                            statusMessage={getStatusMessage(dashboardDate)}
                        />
                    </div>
                    <div className="flex-1 md:min-w-[220px]">
                        <LukenFitDatePicker
                            selectedDate={dashboardDate}
                            onChange={setDashboardDate}
                            label={t('weight.date')}
                        />
                    </div>
                </div>
            </div>

            {/* Dashboard Content - Premium Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 w-full max-w-full  items-stretch">
                {/* ROW 1: CORE METRICS */}
                <div className="md:col-span-2 lg:col-span-8 min-w-0">
                    <PredictiveWeightCard
                        formattedGoalDate={weightProjection.formattedGoalDate}
                        realistTrend={weightProjection.realistTrend}
                        adjustedTrend={weightProjection.adjustedTrend}
                        adherencePercent={weightProjection.adherencePercent}
                        remainingWeight={weightProjection.remainingWeight}
                        weeksToGoal={weightProjection.weeksToGoal}
                        projectionStatus={weightProjection.projectionStatus}
                        actualPath={weightProjection.actualPath}
                        projectedPath={weightProjection.projectedPath}
                        targetWeight={weightProjection.targetWeight}
                        goal={profile?.goal}
                    />
                </div>

                <div className="md:col-span-2 lg:col-span-4 flex flex-col gap-6">
                    <SummaryCard
                        totals={dashboardTotals}
                        targets={periodizedTargets}
                        safetyNetActive={isSafetyNetActive(dashboardDate)}
                        periodizationState={periodizationIntensity}
                    />
                    <PerformanceForecastCard />
                    {profile?.hasOuraRing && (
                        <OuraInsightCard ouraData={ouraAutoAdjustData} />
                    )}
                    {plateauData && plateauData.isInPlateau && (
                        <PlateauAlertCard plateauData={plateauData} />
                    )}
                </div>

                {/* ROW 2: PERIODIZATION (100% Width) */}
                <div className="md:col-span-2 lg:col-span-12 min-w-0">
                    <WeeklyPlanningCard
                        periodization={weeklyPeriodization}
                        targetWeight={profile?.targetWeight || 75}
                    />
                </div>

                {/* ROW 3: INTELLIGENT GUIDANCE (50/50 Duo) */}
                <div className="md:col-span-1 lg:col-span-6 min-w-0">
                    <IdealDayCard pilot={idealDayPilot} />
                </div>

                <div className="md:col-span-1 lg:col-span-6 min-w-0">
                    <MealTimingCard insights={mealTimingInsights} />
                </div>

                {/* ROW 4: PRIMARY ACTION (100% Width) */}
                <div className="md:col-span-2 lg:col-span-8 min-w-0">
                    <FoodCameraInput />
                </div>

                {/* AI CHEF CARD */}
                <div className="md:col-span-2 lg:col-span-4 min-w-0">
                    <AIChefCard onOpen={handleOpenAIChef} />
                </div>

                {/* ROW 5: PERFORMANCE & TRACKING (50/50 Split) */}
                <div className="md:col-span-2 lg:col-span-6 min-w-0">
                    <TrainingWidget
                        gymCount={workoutAnalysis.gymCount}
                        tennisCount={workoutAnalysis.tennisCount}
                        totalDuration={workoutAnalysis.totalDuration}
                        analysis={workoutAnalysis.analysis}
                    />
                </div>

                <div className="md:col-span-2 lg:col-span-6 flex flex-col gap-6">
                    <MacroCards
                        totals={dashboardTotals}
                        targets={dashboardTargets}
                    />
                    <ActivityCards
                        steps={getStepsForDate(dashboardDate)}
                        stepsTarget={profile?.stepGoal || 8000}
                        water={waterData.glasses}
                        waterTarget={WATER_GOAL_GLASSES}
                        onAddWater={() => addWaterGlass(dashboardDate)}
                        onRemoveWater={() => removeWaterGlass(dashboardDate)}
                    />
                </div>

                {/* 5. DEEP ANALYTICS ENGINE */}
                <div className="md:col-span-2 lg:col-span-12 min-w-0">
                    <CorrelationSection analytics={correlationAnalytics} />
                </div>

                {/* 6. HISTORY & TRENDS */}
                <div className="md:col-span-2 lg:col-span-8 min-w-0">
                    <WeightChartCard
                        data={weightHistory}
                        currentWeight={
                            getMostRecentWeight(weightHistory)?.weight ||
                            profile.currentWeight
                        }
                        targetWeight={profile.targetWeight}
                        weeklyTrend={weightProjection.adjustedTrend}
                    />
                </div>

                <div className="md:col-span-1 lg:col-span-4 min-w-0">
                    <WeightProjectionCard projection={weightProjection} />
                </div>

                {/* 7. BOTTOM ACTION */}
                <div className="md:col-span-2 lg:col-span-12">
                    <button
                        onClick={handleOpenWeeklyReport}
                        className="w-full py-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-[2.5rem] font-bold shadow-2xl hover:shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group border border-slate-700/50">
                        <div className="w-10 h-10 rounded-2xl bg-surface/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileImage className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xl tracking-tight uppercase font-satoshi">
                            {t('dashboard.generateWeeklyReport')}
                        </span>
                    </button>
                </div>
            </div>

            <WeeklyReportModal
                isOpen={showWeeklyReport}
                onClose={() => setShowWeeklyReport(false)}
                stats={stats}
                isLoading={isLoading}
                error={error}
            />
        </div>
    );
};
