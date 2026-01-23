import { FileImage } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { useCorrelationAnalytics } from '../../hooks/useCorrelationAnalytics';
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
import CoachInsight from '../Dashboard/CoachInsight';
import { CorrelationSection } from '../Dashboard/CorrelationSection';
import { MacroCards } from '../Dashboard/MacroCards';
import { MacroCloserCard } from '../Dashboard/MacroCloserCard';
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
    const waterData = getWaterForDate(dashboardDate);
    const {
        foodLog,
        workoutLog,
        customTargets,
        weightProjection,
        safetyNetActive,
        toggleSafetyNet,
        getStatusMessage,
        mealTemplates,
        weeklyPlan,
    } = useTracker() as any;

    // Pattern Recognition Engine
    const baseInsight = usePatternRecognition(
        ouraLog,
        getTotalsForDate,
        getTargetsForDate,
    );

    // Coach Insight Logic (Safety Net Override)
    const insight = safetyNetActive
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

    // Weekly Report Modal State
    const [showWeeklyReport, setShowWeeklyReport] = useState(false);
    const { stats, isLoading, error, fetchStats } = useWeeklyReport();

    // Handler to open weekly report
    const handleOpenWeeklyReport = async () => {
        setShowWeeklyReport(true);
        await fetchStats();
    };

    // Memoized periodization and targets for the current date
    const { periodizedTargets, periodizationIntensity } = useMemo(() => {
        const periodizedDay = weeklyPeriodization?.weekDays?.find(
            (d: any) => d.date === dashboardDate,
        );

        const intensity = periodizedDay?.intensity;

        let calculatedTargets = dashboardTargets;
        if (safetyNetActive) {
            calculatedTargets = {
                ...dashboardTargets,
                calories: profile?.tdee || 2500,
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
        safetyNetActive,
        profile?.tdee,
    ]);

    return (
        <div className="space-y-6 pb-8 lg:pb-8">
            {/* Date Navigator - Clean Desktop Design */}
            <div className="flex items-center lg:items-start lg:w-full lg:mb-8 justify-center lg:justify-between px-1">
                <div className="hidden lg:block">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500">Resumen diario</p>
                </div>

                {/* Date Navigation + Safety Net Toggle */}
                <div className="flex flex-col-reverse lg:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="w-full lg:w-auto">
                        <SafetyNetToggle
                            isActive={safetyNetActive}
                            onToggle={toggleSafetyNet}
                            statusMessage={getStatusMessage()}
                        />
                    </div>

                    <div className="w-full lg:min-w-[200px] lg:w-auto">
                        <LukenFitDatePicker
                            selectedDate={dashboardDate}
                            onChange={setDashboardDate}
                            label="Fecha"
                        />
                    </div>
                </div>
            </div>

            {/* Dashboard Content - Flex Desktop Layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left Column - Main Tracking (67%) */}
                <div className="w-full lg:w-8/12 space-y-4 lg:space-y-6">
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
                    />

                    <SummaryCard
                        totals={dashboardTotals}
                        targets={periodizedTargets}
                        safetyNetActive={safetyNetActive}
                        periodizationState={periodizationIntensity}
                    />

                    <FoodCameraInput />

                    <MacroCards
                        totals={dashboardTotals}
                        targets={dashboardTargets}
                    />

                    <MacroCloserCard
                        totals={dashboardTotals}
                        targets={dashboardTargets}
                        foodLog={foodLog}
                        mealTemplates={mealTemplates}
                    />

                    <ActivityCards
                        steps={getStepsForDate(dashboardDate)}
                        stepsTarget={profile?.stepGoal || 8000}
                        water={waterData.glasses}
                        waterTarget={WATER_GOAL_GLASSES}
                        onAddWater={() => addWaterGlass(dashboardDate)}
                        onRemoveWater={() => removeWaterGlass(dashboardDate)}
                    />

                    <CorrelationSection analytics={correlationAnalytics} />

                    <TrainingWidget
                        gymCount={workoutAnalysis.gymCount}
                        tennisCount={workoutAnalysis.tennisCount}
                        totalDuration={workoutAnalysis.totalDuration}
                        analysis={workoutAnalysis.analysis}
                    />

                    <button
                        onClick={handleOpenWeeklyReport}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-200/50 hover:shadow-xl hover:shadow-purple-200/70 transition-all active:scale-[0.99] flex items-center justify-center gap-3">
                        <FileImage className="w-5 h-5" />
                        Generar Reporte Semanal
                    </button>
                </div>

                {/* Right Column - Analytics & Weight (33%) */}
                <div className="lg:w-4/12 space-y-4 lg:space-y-6">
                    <PlateauAlertCard plateauData={plateauData} />

                    <WeeklyPlanningCard periodization={weeklyPeriodization} />

                    <PerformanceForecastCard />

                    <WeightChartCard
                        data={weightHistory}
                        currentWeight={
                            getMostRecentWeight(weightHistory)?.weight ||
                            profile.currentWeight
                        }
                        targetWeight={profile.targetWeight}
                        weeklyTrend={weightProjection.adjustedTrend}
                    />

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
