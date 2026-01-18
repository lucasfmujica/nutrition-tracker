import { Activity, Calendar, Target, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';
import { WeightProjectionChart } from '../Charts/WeightProjectionChart';

/**
 * PredictiveWeightCard - The Predictive Weight Engine UI
 *
 * Replaces static "Estimated Date" with a dynamic projection that responds
 * to daily adherence. Features:
 * - Hero: Projected goal date
 * - Chart: Actual vs Projected path (150px, mobile-optimized)
 * - Metrics: Trend, adherence%, remaining weight
 * - Coach: Dynamic insight based on today's performance
 *
 * Props come from useWeightProjection hook
 */
export const PredictiveWeightCard = ({
  formattedGoalDate,
  realistTrend,
  adjustedTrend,
  adherencePercent,
  remainingWeight,
  weeksToGoal,
  projectionStatus,
  actualPath,
  projectedPath,
  targetWeight,
  coachMessage
}) => {
  // Loading / insufficient data state
  if (projectionStatus === undefined || (!actualPath?.length && projectionStatus !== 'goal_reached')) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">📊</span>
          <h3 className="text-gray-600 font-semibold">Calculando proyección...</h3>
          <p className="text-gray-400 text-sm mt-1">
            Registra tu peso diariamente para ver la proyección
          </p>
        </div>
      </div>
    );
  }

  // Goal reached celebration
  if (projectionStatus === 'goal_reached') {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100 shadow-sm">
        <div className="text-center py-6">
          <span className="text-5xl mb-3 block">🎉</span>
          <h3 className="text-2xl font-bold text-green-600">¡Meta alcanzada!</h3>
          <p className="text-green-700 text-sm mt-2">
            Has llegado a tu peso objetivo de {targetWeight} kg
          </p>
        </div>
      </div>
    );
  }

  // Trend display logic
  const getTrendDisplay = () => {
    if (adjustedTrend === null || adjustedTrend === undefined) {
      return { icon: Target, text: '—', color: 'text-gray-400', bg: 'bg-gray-50' };
    }
    if (adjustedTrend < 0) {
      return {
        icon: TrendingDown,
        text: `${Math.abs(adjustedTrend).toFixed(1)}`,
        color: 'text-green-600',
        bg: 'bg-green-50'
      };
    }
    return {
      icon: TrendingUp,
      text: `+${adjustedTrend.toFixed(1)}`,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    };
  };

  // Adherence color (traffic light)
  const getAdherenceColor = () => {
    if (adherencePercent >= 70) return 'text-green-600 bg-green-50';
    if (adherencePercent >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-500 bg-red-50';
  };

  const trend = getTrendDisplay();
  const adherenceColor = getAdherenceColor();
  const TrendIcon = trend.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-gray-900 font-bold text-base truncate w-full">Predictive Engine</h3>
          </div>

          {/* Legend */}
          <div className="flex gap-3 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-gray-500">Real</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500 opacity-60" />
              <span className="text-gray-500">Proyección</span>
            </div>
          </div>
        </div>

        {/* Hero: Goal Date */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Meta {targetWeight} kg
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formattedGoalDate || 'Calculando...'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="px-3">
        <WeightProjectionChart
          actualPath={actualPath}
          projectedPath={projectedPath}
          targetWeight={targetWeight}
          height={150}
        />
      </div>

      {/* Metrics Row */}
      <div className="px-5 py-4 grid grid-cols-3 gap-2">
        {/* Trend */}
        <div className={`rounded-xl p-3 ${trend.bg} text-center`}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendIcon className={`w-4 h-4 ${trend.color}`} />
            <span className={`text-lg font-bold ${trend.color}`}>{trend.text}</span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">kg/sem</span>
        </div>

        {/* Adherence */}
        <div className={`rounded-xl p-3 text-center ${adherenceColor}`}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Activity className="w-4 h-4" />
            <span className="text-lg font-bold">{adherencePercent}%</span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">Adherencia</span>
        </div>

        {/* Remaining */}
        <div className="rounded-xl p-3 bg-blue-50 text-center">
          <div className="flex items-center justify-center mb-0.5">
            <span className="text-lg font-bold text-blue-600">
              {remainingWeight?.toFixed(1) || '—'}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">kg restantes</span>
        </div>
      </div>

      {/* Coach Message */}
      {coachMessage && (
        <div className="px-5 pb-4">
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-xl">{coachMessage.emoji}</span>
            <p className="text-sm text-gray-600 font-medium">{coachMessage.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};
