import { Flame, TrendingUp } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface AdaptiveCaloriesBadgeProps {
    isActive: boolean;
    reason?: string;
    boost?: {
        calories: number;
        carbs: number;
    };
}

/**
 * AdaptiveCaloriesBadge - Visual indicator for active calorie boosts
 */
export const AdaptiveCaloriesBadge: React.FC<AdaptiveCaloriesBadgeProps> = ({
    isActive,
    reason,
    boost,
}) => {
    const { t } = useTranslation();
    if (!isActive) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 rounded-full shadow-sm">
            <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-orange-700">
                    {reason || t('dashboard.coach.reason')}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-orange-600">
                    <span className="flex items-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5" />+{boost?.calories || 0}{' '}
                        {t('units.kcal')}
                    </span>
                    <span>•</span>
                    <span>
                        +{boost?.carbs || 0}
                        {t('units.grams')} {t('dashboard.macros.carbs')}
                    </span>
                </div>
            </div>
        </div>
    );
};
