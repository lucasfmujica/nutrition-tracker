import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getArgentinaDateString } from '../../utils/dateUtils';

export interface EffortAnalytics {
    status: string;
    insight: string;
    score: number;
    metrics: {
        readiness: number;
        sleepScore: number;
        volumeRatio: string;
        trend: number | null;
        ouraDate?: string;
    };
}

interface EffortRadarProps {
    analytics: EffortAnalytics;
    selectedDate: string;
}

/**
 * EffortRadar - Visualizes the Adaptive Effort Score
 */
export const EffortRadar: React.FC<EffortRadarProps> = ({
    analytics,
    selectedDate,
}) => {
    const { t } = useTranslation();
    const { status, insight, score, metrics } = analytics;
    const [showMetrics, setShowMetrics] = useState(false);

    // Determine color based on status
    let statusColor = 'text-green-600';
    let barColor = 'bg-green-500';

    // Using new lowercase keys from hook
    switch (status) {
        case 'overreaching':
        case 'Deload Needed':
            statusColor = 'text-orange-600';
            barColor = 'bg-orange-500';
            break;
        case 'recovering':
            statusColor = 'text-blue-600';
            barColor = 'bg-blue-500';
            break;
        case 'prime':
            statusColor = 'text-purple-600';
            barColor = 'bg-purple-500';
            break;
        case 'done':
            statusColor = 'text-green-700';
            barColor = 'bg-green-600';
            break;
        case 'caution':
            statusColor = 'text-orange-700';
            barColor = 'bg-orange-600';
            break;
        default:
            statusColor = 'text-green-600';
            barColor = 'bg-green-500';
    }

    // Calculate pointer position (clamped 0-100%)
    const position = Math.max(5, Math.min(95, score));

    // Check if we're looking at a future date
    const today = getArgentinaDateString();
    const isFutureDate = status === 'Unknown';

    // Check if Oura data is stale
    const targetDate = selectedDate || today;
    const isOuraStale = metrics?.ouraDate && metrics.ouraDate !== targetDate;

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                    {t('workouts.effort.title')}
                    <button
                        onClick={() => setShowMetrics(!showMetrics)}
                        className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title={t('workouts.effort.viewMetrics')}>
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </button>
                </h3>
                <span
                    className={`text-xs font-bold px-2 py-1 rounded-full bg-gray-50 uppercase tracking-wider ${statusColor}`}>
                    {t(`workouts.effort.status.${status}`, { defaultValue: status })}
                </span>
            </div>

            {isFutureDate && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-2 items-start">
                    <span className="text-lg">⚠️</span>
                    <p className="text-xs text-yellow-800 leading-snug">
                        {t('workouts.effort.warnings.future')}
                    </p>
                </div>
            )}

            {isOuraStale && !isFutureDate && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex gap-2 items-start">
                    <span className="text-lg">💍</span>
                    <p className="text-xs text-orange-800 leading-snug">
                        <strong className="font-bold">
                            {t('workouts.effort.warnings.stale', {
                                date: metrics.ouraDate,
                            })}
                        </strong>
                    </p>
                </div>
            )}

            {showMetrics && metrics && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-blue-900 mb-2">
                        📊 {t('workouts.effort.factors')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs">💍</span>
                            <span className="text-xs text-blue-800">
                                <strong>{t('workouts.effort.readiness')}</strong>{' '}
                                {metrics.readiness}%
                                {isOuraStale && (
                                    <span className="text-orange-600">
                                        {' '}
                                        ({metrics.ouraDate})
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs">😴</span>
                            <span className="text-xs text-blue-800">
                                <strong>{t('workouts.effort.sleep')}</strong>{' '}
                                {metrics.sleepScore}%
                                {isOuraStale && (
                                    <span className="text-orange-600">
                                        {' '}
                                        ({metrics.ouraDate})
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs">🏋️</span>
                            <span className="text-xs text-blue-800">
                                <strong>{t('workouts.effort.volumeRatio')}</strong>{' '}
                                {metrics.volumeRatio}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs">⚖️</span>
                            <span className="text-xs text-blue-800">
                                <strong>{t('workouts.effort.trend')}</strong>{' '}
                                {metrics.trend
                                    ? `${metrics.trend.toFixed(2)} kg/${t('weight.perWeek', 'sem')}`
                                    : 'N/A'}
                            </span>
                        </div>
                    </div>
                    <p className="text-[10px] text-blue-700 mt-2 italic">
                        {t('workouts.effort.insight.highReadiness')}{' '}
                        {t('workouts.effort.insight.lowReadiness')}
                    </p>
                </div>
            )}

            <div className="relative h-4 bg-gray-100 rounded-full mb-4 w-full overflow-hidden">
                <div className="absolute inset-0 flex opacity-20">
                    <div className="w-1/3 bg-blue-500" />
                    <div className="w-1/3 bg-green-500" />
                    <div className="w-1/3 bg-orange-500" />
                </div>

                <div
                    className={`absolute top-0 bottom-0 w-2 ${barColor} shadow-lg transition-all duration-500 ease-out rounded-full border border-white transform -translate-x-1/2`}
                    style={{ left: `${position}%` }}
                />
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-4">
                <span>{t('workouts.effort.capacity.high')}</span>
                <span>{t('workouts.effort.capacity.normal')}</span>
                <span>{t('workouts.effort.capacity.recovery')}</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex gap-3 items-start">
                <span className="text-xl">💡</span>
                <p className="text-sm text-gray-600 leading-snug">{insight}</p>
            </div>
        </div>
    );
};
