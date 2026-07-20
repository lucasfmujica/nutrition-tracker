import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MealInconsistency } from '../../utils/mealTimeValidation';

interface MealInconsistencyCardProps {
    inconsistencies: MealInconsistency[];
}

const MEAL_ICONS: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    snack: '🍵',
    dinner: '🌙',
};

/**
 * MealInconsistencyCard - Shows meal time inconsistencies for the selected day
 * Only renders if there are inconsistencies (hidden otherwise)
 * Informational tone, amber color scheme
 */
export const MealInconsistencyCard: React.FC<MealInconsistencyCardProps> = ({
    inconsistencies,
}) => {
    const { t } = useTranslation();

    if (inconsistencies.length === 0) return null;

    return (
        <div className="bg-warning-soft rounded-card border border-warning/30 p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-warning" />
                <span className="text-xs font-bold text-warning">
                    {t('diary.inconsistency.title')}
                </span>
            </div>

            {/* Inconsistency list */}
            <div className="space-y-2">
                {inconsistencies.map((item) => (
                    <div
                        key={item.foodId}
                        className="flex items-center gap-2 min-h-[44px] bg-warning/10 rounded-control px-3 py-2"
                    >
                        <span className="text-base flex-shrink-0">
                            {MEAL_ICONS[item.meal] || '🍽️'}
                        </span>
                        <p className="text-xs text-text-secondary flex-1">
                            {t('diary.inconsistency.label', {
                                meal: t(`mealTypes.${item.meal}`),
                                food: item.foodName,
                                time: item.time,
                                window: item.expectedWindow,
                            })}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
