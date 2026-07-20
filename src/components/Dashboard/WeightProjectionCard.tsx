import React from 'react';
import { useTranslation } from 'react-i18next';

export interface WeightProjection {
    realistTrend: number | null;
    adjustedTrend: number | null;
    remainingWeight: number;
    adherencePercent: number;
    adherenceDetails: any;
    projectedGoalDate: string | null;
    formattedGoalDate: string | null;
    weeksToGoal: string | number | null;
    daysToGoal: number | null;
    projectionStatus: 'goal_reached' | 'not_losing' | 'on_track' | undefined;
    actualPath: any[];
    projectedPath: any[];
    targetWeight: number;
    coachMessage: { emoji: string; text: string } | null;
    dataPoints: number;
    daysCovered: number;
}

interface WeightProjectionCardProps {
    projection: WeightProjection | null;
}

/**
 * WeightProjectionCard - Displays weight loss projection and recommendations
 */
export const WeightProjectionCard: React.FC<WeightProjectionCardProps> = ({
    projection,
}) => {
    const { t } = useTranslation();
    if (!projection) return null;

    return (
        <div className="bg-surface p-8 rounded-card shadow-card border border-border h-full group transition-all duration-300">
            <h3 className="text-text-primary font-bold text-xl tracking-tight mb-6">
                {t('dashboard.projection.title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Adjusted Trend */}
                <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center p-3 bg-background rounded-control">
                    <div className="text-sm sm:text-xs text-text-tertiary font-medium">
                        {t('dashboard.projection.currentRate')}
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-text-primary">
                            {typeof projection.adjustedTrend === 'number' &&
                            Number.isFinite(projection.adjustedTrend) ? (
                                <>
                                    {projection.adjustedTrend > 0 ? '+' : ''}
                                    {projection.adjustedTrend.toFixed(1)}
                                </>
                            ) : (
                                '—'
                            )}
                        </span>
                        <span className="text-xs text-text-tertiary">
                            {t('dashboard.predictive.units.kgPerWeek')}
                        </span>
                    </div>
                </div>

                {/* Weeks to Goal */}
                <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center p-3 bg-background rounded-control">
                    <div className="text-sm sm:text-xs text-text-tertiary font-medium">
                        {t('dashboard.projection.toGoal')}
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-primary">
                            {projection.weeksToGoal || '-'}
                        </span>
                        <span className="text-xs text-primary/70">
                            {t('units.weeks', { defaultValue: 'sem' })}
                        </span>
                    </div>
                </div>
            </div>

            {projection.formattedGoalDate && (
                <div className="mb-4 text-center">
                    <span className="text-xs text-text-tertiary">
                        {t('dashboard.projection.estimatedDate')}:{' '}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">
                        {projection.formattedGoalDate}
                    </span>
                </div>
            )}

            <p className="text-[10px] text-text-tertiary mt-3 text-center">
                {t('dashboard.projection.basedOn', {
                    count: projection.dataPoints,
                    days: projection.daysCovered,
                })}
            </p>
        </div>
    );
};
