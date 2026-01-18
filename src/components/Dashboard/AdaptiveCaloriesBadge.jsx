import { Flame, TrendingUp } from 'lucide-react';

/**
 * AdaptiveCaloriesBadge - Visual indicator for active calorie boosts
 *
 * Shows when training day mode is active with boost amounts.
 * Premium Minimalist styling with subtle gradient.
 *
 * @param {boolean} isActive - Whether boost is active
 * @param {string} reason - Reason for the boost
 * @param {Object} boost - { calories, carbs } boost amounts
 */
export const AdaptiveCaloriesBadge = ({ isActive, reason, boost }) => {
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 rounded-full shadow-sm">
      <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full">
        <Flame className="w-3.5 h-3.5 text-orange-500" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-orange-700">
          {reason || 'Día de Entreno'}
        </span>
        <div className="flex items-center gap-2 text-[10px] text-orange-600">
          <span className="flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" />
            +{boost?.calories || 0} kcal
          </span>
          <span>•</span>
          <span>+{boost?.carbs || 0}g carbs</span>
        </div>
      </div>
    </div>
  );
};
