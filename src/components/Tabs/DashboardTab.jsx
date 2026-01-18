import { FileImage } from 'lucide-react';
import { useState } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { useCorrelationAnalytics } from '../../hooks/useCorrelationAnalytics';
import { usePatternRecognition } from '../../hooks/usePatternRecognition';
import { useWeeklyReport } from '../../hooks/useWeeklyReport';
import { formatDateDisplay, getArgentinaDateString } from '../../utils/dateUtils';
import { ActivityCards } from '../Dashboard/ActivityCards';
import CoachInsight from '../Dashboard/CoachInsight';
import { CorrelationSection } from '../Dashboard/CorrelationSection';
import { GoalInsightsCard } from '../Dashboard/GoalInsightsCard';
import { MacroCards } from '../Dashboard/MacroCards';
import { MacroCloserCard } from '../Dashboard/MacroCloserCard';
import { PerformanceForecastCard } from '../Dashboard/PerformanceForecastCard';
import { SummaryCard } from '../Dashboard/SummaryCard';
import { TrainingWidget } from '../Dashboard/TrainingWidget';
import { WeightChartCard } from '../Dashboard/WeightChartCard';
import { WeightProjectionCard } from '../Dashboard/WeightProjectionCard';
import { WeeklyReportModal } from '../Modals/WeeklyReportModal';

/**
 * DashboardTab - Main dashboard view
 * Displays summary, macros, activity, training, and weight charts
 */
export const DashboardTab = ({
  // Date state
  dashboardDate,
  setDashboardDate,
  changeDate,
  // Data
  dashboardTotals,
  dashboardTargets,
  getStepsForDate,
  getTodayWater,
  addWaterGlass,
  WATER_GOAL_GLASSES,
  workoutAnalysis,
  weightHistory,
  getMostRecentWeight,
  profile,
  weightProjection,
  // Pattern Recognition Props
  ouraLog,
  getTotalsForDate,
  getTargetsForDate
}) => {
  const waterData = getTodayWater();
  const { foodLog, workoutLog } = useTracker(); // Access full logs for analytics

  // Pattern Recognition Engine
  const insight = usePatternRecognition(ouraLog, getTotalsForDate, getTargetsForDate);

  // Correlation Engine (Feature 3)
  const correlationAnalytics = useCorrelationAnalytics(foodLog, workoutLog, ouraLog);

  // Weekly Report Modal State
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const { stats, isLoading, error, fetchStats } = useWeeklyReport();

  // Handler to open weekly report
  const handleOpenWeeklyReport = async () => {
    setShowWeeklyReport(true);
    await fetchStats();
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Date Navigator - Clean Desktop Design */}
      <div className="flex items-center lg:items-start lg:w-full lg:mb-8 justify-center lg:justify-between px-1">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen diario</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          <button
              onClick={() => setDashboardDate(changeDate(dashboardDate, -1))}
              className="w-10 h-10 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors flex items-center justify-center"
          >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
          </button>
          <div className="text-center min-w-[120px]">
            <span className="block text-sm font-bold text-gray-900">{formatDateDisplay(dashboardDate)}</span>
          </div>
          <button
              onClick={() => setDashboardDate(changeDate(dashboardDate, 1))}
              disabled={dashboardDate >= getArgentinaDateString()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dashboardDate >= getArgentinaDateString() ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-400 hover:text-blue-500'}`}
          >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
          </button>
        </div>
      </div>

      {/* Dashboard Content - Flex Desktop Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Column - Main Tracking (67%) */}
        <div className="w-full lg:w-8/12 space-y-4 lg:space-y-6">
          {/* Coach Insight (Pattern Recognition) */}
          <CoachInsight insight={insight} />

          {/* Strategic Insights - Long-term Progress */}
          <GoalInsightsCard />

          {/* Feature 3: Correlation Engine (Luken Labs) */}
          <CorrelationSection analytics={correlationAnalytics} />

          {/* Tactical Summary - Daily Calories */}
         <SummaryCard totals={dashboardTotals} targets={dashboardTargets} />

        {/* Macro Cards */}
        <MacroCards totals={dashboardTotals} targets={dashboardTargets} />

        {/* The Macro Closer (Feature) */}
        <MacroCloserCard totals={dashboardTotals} targets={dashboardTargets} />

          <ActivityCards
            steps={getStepsForDate(dashboardDate)}
            stepsTarget={profile?.stepGoal || 8000}
            water={waterData.glasses}
            waterTarget={WATER_GOAL_GLASSES}
            onAddWater={addWaterGlass}
          />

          {/* Training Widget */}
          <TrainingWidget
            gymCount={workoutAnalysis.gymCount}
            tennisCount={workoutAnalysis.tennisCount}
            totalDuration={workoutAnalysis.totalDuration}
            analysis={workoutAnalysis.analysis}
          />

          {/* Weekly Report Button */}
          <button
            onClick={handleOpenWeeklyReport}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-200/50 hover:shadow-xl hover:shadow-purple-200/70 transition-all active:scale-[0.99] flex items-center justify-center gap-3"
          >
            <FileImage className="w-5 h-5" />
            Generar Reporte Semanal
          </button>
        </div>

      {/* Right Column - Analytics & Weight (33%) */}
      <div className="lg:w-4/12 space-y-4 lg:space-y-6">
        {/* Performance Forecast (New) */}
        <PerformanceForecastCard />

        {/* Weight Chart */}
        <WeightChartCard
          data={weightHistory}
          currentWeight={getMostRecentWeight(weightHistory)?.weight || profile.currentWeight}
          targetWeight={profile.targetWeight}
        />

        {/* Weight Projection */}
        <WeightProjectionCard projection={weightProjection} />
      </div>
    </div>

    {/* Weekly Report Modal */}
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
