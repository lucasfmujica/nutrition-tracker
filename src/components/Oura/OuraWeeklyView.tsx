import React from 'react';
import { useTranslation } from 'react-i18next';
import { OuraEntry, StepsEntry } from '../../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../../utils/dateUtils';

interface OuraWeeklyViewProps {
    ouraLog: OuraEntry[];
    stepsLog: StepsEntry[];
}

/**
 * OuraWeeklyView - Weekly summary table of Oura Ring data
 * Shows last 7 days of readiness, sleep, activity, HRV, RHR, and steps
 * Responsive for mobile with horizontal scroll
 */
export const OuraWeeklyView: React.FC<OuraWeeklyViewProps> = ({
    ouraLog,
    stepsLog,
}) => {
    const { t } = useTranslation();

    // Generate last 7 days including today
    const generateLast7Days = (): string[] => {
        const today = getArgentinaDateString();
        const days: string[] = [];
        for (let i = 6; i >= 0; i--) {
            days.push(addDaysToDate(today, -i));
        }
        return days;
    };

    const last7Days = generateLast7Days();

    // Helper to get Oura data for a specific date
    const getOuraForDate = (date: string): OuraEntry | null => {
        return ouraLog.find((entry) => entry.date === date) || null;
    };

    // Helper to get steps for a specific date
    const getStepsForDate = (date: string): number | null => {
        const entry = stepsLog.find((s) => s.date === date);
        return entry ? entry.steps : null;
    };

    // Format date for display (e.g., "Mon 03")
    const formatDateShort = (dateStr: string): string => {
        const date = new Date(dateStr + 'T00:00:00');
        const dayName = date.toLocaleDateString(t('common.locale') === 'es' ? 'es-AR' : 'en-US', {
            weekday: 'short',
        });
        const day = date.getDate();
        return `${dayName} ${day}`;
    };

    // Score color helper
    const getScoreColor = (score: number | null): string => {
        if (!score) return 'text-text-tertiary';
        if (score >= 85) return 'text-success';
        if (score >= 70) return 'text-warning';
        return 'text-danger';
    };

    // Metric color helper
    const getMetricColor = (value: number | null, type: 'hrv' | 'rhr'): string => {
        if (!value) return 'text-text-tertiary';
        if (type === 'hrv') {
            // Higher HRV is better
            if (value >= 60) return 'text-success';
            if (value >= 40) return 'text-warning';
            return 'text-danger';
        } else {
            // Lower RHR is better
            if (value <= 60) return 'text-success';
            if (value <= 75) return 'text-warning';
            return 'text-danger';
        }
    };

    return (
        <div className="bg-surface rounded-2xl p-4 md:p-6 border border-border shadow-sm">
            <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-control bg-oura-soft text-oura flex items-center justify-center text-xs">
                    📊
                </span>
                {t('oura.weeklyView.title')}
            </h2>

            {/* Desktop/Tablet View - Horizontal Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 font-bold text-text-tertiary uppercase tracking-wider">
                                {t('oura.weeklyView.date')}
                            </th>
                            <th className="text-center py-2 px-2 font-bold text-oura uppercase tracking-wider">
                                {t('oura.metrics.readiness')}
                            </th>
                            <th className="text-center py-2 px-2 font-bold text-primary uppercase tracking-wider">
                                {t('oura.metrics.sleep')}
                            </th>
                            <th className="text-center py-2 px-2 font-bold text-success uppercase tracking-wider">
                                {t('oura.metrics.activity')}
                            </th>
                            <th className="text-center py-2 px-2 font-bold text-fat uppercase tracking-wider">
                                {t('oura.metrics.hrv')}
                            </th>
                            <th className="text-center py-2 px-2 font-bold text-danger uppercase tracking-wider">
                                {t('oura.metrics.restingHR')}
                            </th>
                            <th className="text-center py-2 px-2 font-bold text-info uppercase tracking-wider">
                                {t('oura.metrics.steps')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {last7Days.map((date) => {
                            const oura = getOuraForDate(date);
                            const steps = getStepsForDate(date);
                            const isToday = date === getArgentinaDateString();

                            return (
                                <tr
                                    key={date}
                                    className={`border-b border-border last:border-0 hover:bg-background transition-colors ${
                                        isToday ? 'bg-oura-soft' : ''
                                    }`}>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-text-secondary">
                                                {formatDateShort(date)}
                                            </span>
                                            {isToday && (
                                                <span className="px-1.5 py-0.5 rounded bg-oura-soft text-oura text-[9px] font-bold">
                                                    {t('common.today')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td
                                        className={`text-center py-3 px-2 font-black text-base ${getScoreColor(oura?.readinessScore || null)}`}>
                                        {oura?.readinessScore || '-'}
                                    </td>
                                    <td
                                        className={`text-center py-3 px-2 font-black text-base ${getScoreColor(oura?.sleepScore || null)}`}>
                                        {oura?.sleepScore || '-'}
                                    </td>
                                    <td
                                        className={`text-center py-3 px-2 font-black text-base ${getScoreColor(oura?.activityScore || null)}`}>
                                        {oura?.activityScore || '-'}
                                    </td>
                                    <td
                                        className={`text-center py-3 px-2 font-bold ${getMetricColor(oura?.hrv || null, 'hrv')}`}>
                                        {oura?.hrv || '-'}
                                    </td>
                                    <td
                                        className={`text-center py-3 px-2 font-bold ${getMetricColor(oura?.restingHr || null, 'rhr')}`}>
                                        {oura?.restingHr || '-'}
                                    </td>
                                    <td className="text-center py-3 px-2 font-bold text-info">
                                        {steps ? steps.toLocaleString() : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile View - Card-based Layout */}
            <div className="md:hidden space-y-3">
                {last7Days.map((date) => {
                    const oura = getOuraForDate(date);
                    const steps = getStepsForDate(date);
                    const isToday = date === getArgentinaDateString();

                    return (
                        <div
                            key={date}
                            className={`p-4 rounded-xl border ${
                                isToday
                                    ? 'bg-oura-soft border-oura/30'
                                    : 'bg-background border-border'
                            }`}>
                            {/* Date Header */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-text-secondary">
                                    {formatDateShort(date)}
                                </span>
                                {isToday && (
                                    <span className="px-2 py-0.5 rounded bg-oura text-white text-[10px] font-bold">
                                        {t('common.today')}
                                    </span>
                                )}
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-3 gap-2">
                                {/* Readiness */}
                                <div className="text-center">
                                    <div className="text-[10px] text-oura font-bold uppercase mb-1">
                                        {t('oura.metrics.readiness')}
                                    </div>
                                    <div
                                        className={`text-lg font-black ${getScoreColor(oura?.readinessScore || null)}`}>
                                        {oura?.readinessScore || '-'}
                                    </div>
                                </div>

                                {/* Sleep */}
                                <div className="text-center">
                                    <div className="text-[10px] text-primary font-bold uppercase mb-1">
                                        {t('oura.metrics.sleep')}
                                    </div>
                                    <div
                                        className={`text-lg font-black ${getScoreColor(oura?.sleepScore || null)}`}>
                                        {oura?.sleepScore || '-'}
                                    </div>
                                </div>

                                {/* Activity */}
                                <div className="text-center">
                                    <div className="text-[10px] text-success font-bold uppercase mb-1">
                                        {t('oura.metrics.activity')}
                                    </div>
                                    <div
                                        className={`text-lg font-black ${getScoreColor(oura?.activityScore || null)}`}>
                                        {oura?.activityScore || '-'}
                                    </div>
                                </div>

                                {/* HRV */}
                                <div className="text-center">
                                    <div className="text-[10px] text-fat font-bold uppercase mb-1">
                                        {t('oura.metrics.hrv')}
                                    </div>
                                    <div
                                        className={`text-sm font-bold ${getMetricColor(oura?.hrv || null, 'hrv')}`}>
                                        {oura?.hrv || '-'}
                                    </div>
                                </div>

                                {/* RHR */}
                                <div className="text-center">
                                    <div className="text-[10px] text-danger font-bold uppercase mb-1">
                                        {t('oura.metrics.restingHR')}
                                    </div>
                                    <div
                                        className={`text-sm font-bold ${getMetricColor(oura?.restingHr || null, 'rhr')}`}>
                                        {oura?.restingHr || '-'}
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="text-center">
                                    <div className="text-[10px] text-info font-bold uppercase mb-1">
                                        {t('oura.metrics.steps')}
                                    </div>
                                    <div className="text-sm font-bold text-info">
                                        {steps ? steps.toLocaleString() : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {ouraLog.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-sm text-text-tertiary mb-2">
                        {t('oura.weeklyView.noData')}
                    </p>
                    <p className="text-xs text-text-tertiary">
                        {t('oura.weeklyView.syncPrompt')}
                    </p>
                </div>
            )}
        </div>
    );
};
