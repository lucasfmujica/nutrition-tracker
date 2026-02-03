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
        let statusColor = 'text-green-500';
        if (safetyNetActive) {
            // Safety Net mode: Blue color scheme (trust, calm)
            statusColor = 'text-blue-500';
        } else if (caloriesRemaining < 0) {
            statusColor = 'text-red-500';
        } else if (caloriesRemaining < 200) {
            statusColor = 'text-amber-500';
        }

        return (
            <div
                className="card bg-white p-5 shadow-sm rounded-2xl mb-4 relative overflow-hidden"
                data-tutorial="calorie-ring">
                {/* Background decoration */}
                <div
                    className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none ${
                        safetyNetActive ? 'bg-blue-50' : 'bg-blue-50'
                    }`}></div>

                <div className="relative z-10">
                    {/* Header with Shield badge if active */}
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                            {t('dashboard.summary.caloriesRemaining')}
                        </h2>
                        {safetyNetActive ? (
                            <div className="flex items-center gap-1 bg-blue-100 px-2 py-0.5 rounded-full">
                                <Shield
                                    className="w-3 h-3 text-blue-600"
                                    fill="currentColor"
                                />
                                <span className="text-[10px] font-semibold text-blue-600">
                                    {t('dashboard.summary.shield')}
                                </span>
                            </div>
                        ) : (
                            <>
                                {periodizationState === 'high' && (
                                    <div className="flex items-center gap-1 bg-orange-100 px-2 py-0.5 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-orange-600 tracking-wide">
                                            {t('dashboard.summary.training')}
                                        </span>
                                    </div>
                                )}
                                {periodizationState === 'recovery' && (
                                    <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-[10px] font-bold text-green-600 tracking-wide">
                                            {t('dashboard.summary.recovery')}
                                        </span>
                                    </div>
                                )}
                                {(periodizationState === 'moderate' ||
                                    !periodizationState) && (
                                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                        <span className="text-[10px] font-bold text-slate-500 tracking-wide">
                                            {t('dashboard.summary.standard')}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Status subtitle */}
                    {safetyNetActive && (
                        <p className="text-xs text-blue-600 mb-2">
                            {t('dashboard.summary.maintenance_mode')}
                        </p>
                    )}

                    <div className="flex items-end gap-2 mb-4">
                        <span
                            className={`text-3xl sm:text-4xl font-bold tracking-tight ${statusColor}`}>
                            {caloriesRemaining}
                        </span>
                        <span className="text-gray-400 text-sm mb-1.5 font-medium">
                            kcal
                        </span>
                    </div>

                    {/* Equation */}
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4 px-1">
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">
                                {targets.calories}
                            </span>
                            <span className="text-xs text-gray-400">
                                {safetyNetActive
                                    ? t('dashboard.summary.maintenance')
                                    : t('dashboard.summary.target')}
                            </span>
                        </div>
                        <span className="text-gray-300">-</span>
                        <div className="flex flex-col text-right">
                            <span className="font-semibold text-gray-900">
                                {totals.calories}
                            </span>
                            <span className="text-xs text-gray-400">
                                {t('dashboard.summary.consumed')}
                            </span>
                        </div>
                        <span className="text-gray-300">=</span>
                        <div className="flex flex-col text-right">
                            <span className={`font-bold ${statusColor}`}>
                                {caloriesRemaining}
                            </span>
                            <span className="text-xs text-gray-400">
                                {t('dashboard.summary.remaining')}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                                safetyNetActive
                                    ? 'bg-blue-500'
                                    : caloriesRemaining < 0
                                      ? 'bg-red-500'
                                      : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    },
);
