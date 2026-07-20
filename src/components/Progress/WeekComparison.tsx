/**
 * WeekComparison Component
 * Shows current week vs previous week comparison with deltas
 * Color-coded: green if better, red if worse
 */

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface WeekComparisonProps {
    comparison: {
        current: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            steps: number;
            score: number;
            daysTracked: number;
        };
        previous: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            steps: number;
            score: number;
            daysTracked: number;
        };
        delta: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            steps: number;
        };
        change: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            steps: number;
        };
    };
}

/**
 * Renders a metric row with comparison
 */
const MetricRow: React.FC<{
    label: string;
    current: number;
    previous: number;
    delta: number;
    change: number;
    unit: string;
    higherIsBetter?: boolean;
}> = ({ label, current, previous, delta, change, unit, higherIsBetter = true }) => {
    const isPositive = delta > 0;
    const isNeutral = delta === 0;

    // Determine if change is good or bad
    const isGood = isNeutral
        ? null
        : higherIsBetter
        ? isPositive
        : !isPositive;

    const changeColor = isNeutral
        ? 'text-text-tertiary'
        : isGood
        ? 'text-success'
        : 'text-danger';

    const changeIcon = isNeutral ? (
        <Minus className="w-4 h-4" />
    ) : isPositive ? (
        <ArrowUp className="w-4 h-4" />
    ) : (
        <ArrowDown className="w-4 h-4" />
    );

    return (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
                <p className="text-sm font-semibold text-text-secondary">{label}</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                    {previous.toLocaleString()} → {current.toLocaleString()} {unit}
                </p>
            </div>
            <div className={`flex items-center gap-1 font-bold text-sm ${changeColor}`}>
                {changeIcon}
                <span>
                    {isNeutral ? '0' : Math.abs(change)}%
                </span>
            </div>
        </div>
    );
};

export const WeekComparison: React.FC<WeekComparisonProps> = ({ comparison }) => {
    const { t } = useTranslation();

    const { current, previous, delta, change } = comparison;

    // Handle no data cases
    if (current.daysTracked === 0 && previous.daysTracked === 0) {
        return (
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-lg font-black text-text-primary mb-2">
                    {t('progress.analytics.weekComparison.title')}
                </h3>
                <p className="text-sm text-text-tertiary">
                    {t('progress.analytics.weekComparison.noData')}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-lg font-black text-text-primary mb-1">
                    {t('progress.analytics.weekComparison.title')}
                </h3>
                <p className="text-sm text-text-tertiary">
                    {t('progress.analytics.weekComparison.subtitle')}
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-1">
                <MetricRow
                    label={t('progress.analytics.weekComparison.calories')}
                    current={current.calories}
                    previous={previous.calories}
                    delta={delta.calories}
                    change={change.calories}
                    unit="kcal"
                    higherIsBetter={false} // Lower calories might be better for cut
                />

                <MetricRow
                    label={t('progress.analytics.weekComparison.protein')}
                    current={current.protein}
                    previous={previous.protein}
                    delta={delta.protein}
                    change={change.protein}
                    unit="g"
                    higherIsBetter={true} // Higher protein is better
                />

                <MetricRow
                    label={t('progress.analytics.weekComparison.carbs')}
                    current={current.carbs}
                    previous={previous.carbs}
                    delta={delta.carbs}
                    change={change.carbs}
                    unit="g"
                    higherIsBetter={false}
                />

                <MetricRow
                    label={t('progress.analytics.weekComparison.fat')}
                    current={current.fat}
                    previous={previous.fat}
                    delta={delta.fat}
                    change={change.fat}
                    unit="g"
                    higherIsBetter={false}
                />

                <MetricRow
                    label={t('progress.analytics.weekComparison.steps')}
                    current={current.steps}
                    previous={previous.steps}
                    delta={delta.steps}
                    change={change.steps}
                    unit={t('progress.analytics.weekComparison.stepsUnit')}
                    higherIsBetter={true} // Higher steps is better
                />
            </div>

            {/* Summary Footer */}
            <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                        {t('progress.analytics.weekComparison.adherenceScore')}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary">
                            {previous.score.toFixed(1)} → {current.score.toFixed(1)}
                        </span>
                        {delta.calories !== 0 && (
                            <span
                                className={`text-sm font-bold ${
                                    current.score > previous.score
                                        ? 'text-success'
                                        : current.score < previous.score
                                        ? 'text-danger'
                                        : 'text-text-tertiary'
                                }`}>
                                {current.score > previous.score ? '↑' : current.score < previous.score ? '↓' : '→'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
