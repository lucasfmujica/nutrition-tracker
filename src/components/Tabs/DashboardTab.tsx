import React, { useState } from 'react';
import { useAIMeals } from '../../context/AIMealSuggestionsContext';
import { useTracker } from '../../context/TrackerContext';
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
import { CorrelationSection } from '../Dashboard/CorrelationSection';
import { IdealDayCard } from '../Dashboard/IdealDayCard';
import { MacroCards } from '../Dashboard/MacroCards';
import { MealTimingCard } from '../Dashboard/MealTimingCard';
import { OuraInsightCard } from '../Dashboard/OuraInsightCard';
import { PerformanceForecastCard } from '../Dashboard/PerformanceForecastCard';
import { PlateauAlertCard } from '../Dashboard/PlateauAlertCard';
import { PredictiveWeightCard } from '../Dashboard/PredictiveWeightCard';
import { DashboardHeader } from '../Dashboard/DashboardHeader';
import { SummaryCard } from '../Dashboard/SummaryCard';
import { TrainingWidget } from '../Dashboard/TrainingWidget';
import { useDashboardEngines } from '../Dashboard/useDashboardEngines';
import { WeeklyPlanningCard } from '../Dashboard/WeeklyPlanningCard';
import { WeeklyReportCTA } from '../Dashboard/WeeklyReportCTA';
import { WeightChartCard } from '../Dashboard/WeightChartCard';
import { WeightProjectionCard } from '../Dashboard/WeightProjectionCard';
import { FoodCameraInput } from '../Food/FoodCameraInput';
import { WeeklyReportModal } from '../Modals/WeeklyReportModal';

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
        weeklyPlan,
        performanceForecast,
    } = useTracker() as any;
    const { getContextualSuggestions } = useAIMeals();

    const {
        correlationAnalytics,
        plateauData,
        weeklyPeriodization,
        mealTimingInsights,
        idealDayPilot,
        ouraAutoAdjustData,
        periodizedTargets,
        periodizationIntensity,
    } = useDashboardEngines({
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
    });

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

    return (
        <div className="space-y-6 pb-8 lg:pb-8">
            {/* Dashboard Header - Unified Lab Style */}
            <DashboardHeader
                dashboardDate={dashboardDate}
                setDashboardDate={setDashboardDate}
                safetyNetActive={isSafetyNetActive(dashboardDate)}
                onToggleSafetyNet={() => toggleSafetyNet(dashboardDate)}
                statusMessage={getStatusMessage(dashboardDate)}
            />

            {/* Dashboard Content - Premium Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 w-full max-w-full items-stretch">
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

                <div className="md:col-span-2 lg:col-span-4 flex flex-col gap-4 md:gap-6">
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

                <div className="md:col-span-2 lg:col-span-6 flex flex-col gap-4 md:gap-6">
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

                {/* 6. WEEKLY REPORT CTA */}
                <div className="md:col-span-2 lg:col-span-12">
                    <WeeklyReportCTA onClick={handleOpenWeeklyReport} />
                </div>

                {/* 7. HISTORY & TRENDS */}
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
