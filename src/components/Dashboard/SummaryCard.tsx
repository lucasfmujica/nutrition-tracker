import { Shield } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Macros } from '../../types/domain';

interface SummaryCardProps {
    totals: Macros | null;
    targets: Macros | null;
    safetyNetActive?: boolean;
    periodizationState?: 'high' | 'recovery' | 'moderate' | string; // Matches patterns in useWeeklyPeriodization
}

export const SummaryCard: React.FC<SummaryCardProps> = React.memo(
    ({ totals, targets, safetyNetActive = false, periodizationState }) => {
        const { t } = useTranslation();
        if (!targets || !totals) return null; // Safety check

        const caloriesRemaining = targets.calories - totals.calories;
        const progress = Math.min((totals.calories / targets.calories) * 100, 100);

        // Color based on remaining calories
        let statusColor = 'text-success';
        if (safetyNetActive) {
            // Safety Net mode: primary color scheme (trust, calm)
            statusColor = 'text-primary';
        } else if (caloriesRemaining < 0) {
            statusColor = 'text-danger';
        } else if (caloriesRemaining < 200) {
            statusColor = 'text-warning';
        }

        return (
            <div
                className="bg-surface p-8 shadow-card rounded-card border border-border relative overflow-hidden group transition-all duration-300 hover:border-primary/30"
                data-tutorial="calorie-ring">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 opacity-40 pointer-events-none bg-primary-soft"></div>

                <div className="relative z-10">
                    {/* Header with Shield badge if active */}
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-overline uppercase text-text-tertiary tracking-wide font-medium">
                            {t('dashboard.summary.caloriesRemaining')}
                        </h2>
                        {safetyNetActive ? (
                            <div className="flex items-center gap-1 bg-primary-soft px-2 py-0.5 rounded-full">
                                <Shield
                                    className="w-3 h-3 text-primary"
                                    fill="currentColor"
                                />
                                <span className="text-[10px] font-semibold text-primary">
                                    {t('dashboard.summary.shield')}
                                </span>
                            </div>
                        ) : (
                            <>
                                {periodizationState === 'high' && (
                                    <div className="flex items-center gap-1 bg-fat-soft px-2 py-0.5 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-fat animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-fat tracking-wide">
                                            {t('dashboard.summary.training')}
                                        </span>
                                    </div>
                                )}
                                {periodizationState === 'recovery' && (
                                    <div className="flex items-center gap-1 bg-success-soft px-2 py-0.5 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-success"></div>
                                        <span className="text-[10px] font-bold text-success tracking-wide">
                                            {t('dashboard.summary.recovery')}
                                        </span>
                                    </div>
                                )}
                                {(periodizationState === 'moderate' ||
                                    !periodizationState) && (
                                    <div className="flex items-center gap-1 bg-surface-lighter px-2 py-0.5 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-text-tertiary"></div>
                                        <span className="text-[10px] font-bold text-text-tertiary tracking-wide">
                                            {t('dashboard.summary.standard')}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Status subtitle */}
                    {safetyNetActive && (
                        <p className="text-xs text-primary mb-2">
                            {t('dashboard.summary.maintenance_mode')}
                        </p>
                    )}

                    <div className="flex items-end gap-2 mb-4">
                        <span
                            className={`text-4xl sm:text-5xl font-black tracking-tighter tabular-nums ${statusColor}`}>
                            {caloriesRemaining}
                        </span>
                        <span className="text-text-tertiary text-sm mb-1.5 font-medium">
                            kcal
                        </span>
                    </div>

                    {/* Equation */}
                    <div className="flex justify-between items-center text-sm text-text-secondary mb-4 px-1">
                        <div className="flex flex-col">
                            <span className="font-semibold text-text-primary tabular-nums">
                                {targets.calories}
                            </span>
                            <span className="text-xs text-text-tertiary">
                                {safetyNetActive
                                    ? t('dashboard.summary.maintenance')
                                    : t('dashboard.summary.target')}
                            </span>
                        </div>
                        <span className="text-text-tertiary">-</span>
                        <div className="flex flex-col text-right">
                            <span className="font-semibold text-text-primary tabular-nums">
                                {totals.calories}
                            </span>
                            <span className="text-xs text-text-tertiary">
                                {t('dashboard.summary.consumed')}
                            </span>
                        </div>
                        <span className="text-text-tertiary">=</span>
                        <div className="flex flex-col text-right">
                            <span
                                className={`font-bold tabular-nums ${statusColor}`}>
                                {caloriesRemaining}
                            </span>
                            <span className="text-xs text-text-tertiary">
                                {t('dashboard.summary.remaining')}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-progress-track rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                                safetyNetActive
                                    ? 'bg-primary'
                                    : caloriesRemaining < 0
                                      ? 'bg-danger'
                                      : 'bg-primary'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    },
);
