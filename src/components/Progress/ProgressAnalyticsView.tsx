/**
 * ProgressAnalyticsView - Main analytics orchestrator
 * Combines extended analytics (comparison, streaks, best day) with body measurement analytics.
 */

import { BarChart3, Download, Loader2, TrendingUp } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAnalyticsExtended } from '../../hooks/useAnalyticsExtended';
import { useBodyMeasurements } from '../../hooks/useBodyMeasurements';
import { useProgressPhotos } from '../../hooks/useProgressPhotos';
import { exportChartAsPNG } from '../../utils/chartExport';
import { BodyMeasurementAnalytics } from './BodyMeasurementAnalytics';
import { StreaksVisualizer } from './StreaksVisualizer';
import { WeekComparison } from './WeekComparison';

interface ProgressAnalyticsViewProps {
    userId: string | null;
    currentWeight?: number;
    targetWeight?: number;
}

export const ProgressAnalyticsView: React.FC<ProgressAnalyticsViewProps> = ({
    userId,
    currentWeight,
    targetWeight,
}) => {
    const { t } = useTranslation();
    const { photos, isLoading: photosLoading } = useProgressPhotos({ userId });
    const { measurements, isLoading: measurementsLoading } = useBodyMeasurements({ userId });

    const {
        foodLog, workoutLog, stepsLog, weightHistory,
        customTargets, getTotalsForDate, getTargetsForDate, profile,
    } = useTracker() as any;

    const { getWeeklyAdherence } = useAnalytics({
        weightHistory: weightHistory || [],
        foodLog: foodLog || [],
        workoutLog: workoutLog || [],
        stepsLog: stepsLog || [],
        customTargets: customTargets || {},
        stepGoal: profile?.stepGoal || 8000,
        getTotalsForDate,
        getTargetsForDate,
    });

    const { getWeeklyComparison, getStreakData, getBestDayOfWeek } = useAnalyticsExtended({
        stepsLog: stepsLog || [],
        stepGoal: profile?.stepGoal || 8000,
        getTotalsForDate,
        getTargetsForDate,
        getWeeklyAdherence,
    });

    const weekComparison = useMemo(() => getWeeklyComparison(), [getWeeklyComparison]);
    const streakData = useMemo(() => getStreakData(), [getStreakData]);
    const bestDay = useMemo(() => getBestDayOfWeek(), [getBestDayOfWeek]);

    const weekComparisonRef = useRef<HTMLDivElement>(null);
    const streaksRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const isLoading = photosLoading || measurementsLoading;

    const weightData = useMemo(() => {
        return photos
            .filter((p) => p.weight !== undefined)
            .map((p) => ({ date: p.date, weight: p.weight! }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [photos]);

    const handleExportWeekComparison = async () => {
        if (!weekComparisonRef.current) return;
        setIsExporting(true);
        try {
            await exportChartAsPNG(weekComparisonRef.current, `week-comparison-${new Date().toISOString().split('T')[0]}`);
        } catch (err) {
            console.error('[ProgressAnalytics] Export error:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportStreaks = async () => {
        if (!streaksRef.current) return;
        setIsExporting(true);
        try {
            await exportChartAsPNG(streaksRef.current, `protein-streak-${new Date().toISOString().split('T')[0]}`);
        } catch (err) {
            console.error('[ProgressAnalytics] Export error:', err);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-purple-500" />
            </div>
        );
    }

    if (measurements.length === 0 || weightData.length === 0) {
        return (
            <div className="bg-surface rounded-2xl p-8 text-center border border-border">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 size={28} className="text-purple-400" />
                </div>
                <h3 className="font-bold text-text-primary mb-1">
                    {t('progress.analytics.noDataTitle')}
                </h3>
                <p className="text-sm text-text-tertiary mb-4">
                    {t('progress.analytics.noDataDesc')}
                </p>
                <div className="text-xs text-text-tertiary space-y-1">
                    <p>• {t('progress.photos.addPhoto')}</p>
                    <p>• {t('progress.measurements.noMeasurementsDesc')}</p>
                    <p>• {t('progress.analytics.insufficientDataDesc')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-50 dark:from-purple-900/30 to-blue-50 dark:to-blue-900/30 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-surface rounded-lg shadow-sm">
                        <TrendingUp size={24} className="text-purple-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-text-primary mb-1">
                            {t('progress.analytics.headerTitle')}
                        </h2>
                        <p className="text-sm text-text-secondary">
                            {t('progress.analytics.headerSubtitle', { count: weightData.length })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Weekly Comparison Section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-text-primary">
                        {t('progress.analytics.weekComparison.title')}
                    </h3>
                    <button
                        onClick={handleExportWeekComparison}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-text-secondary hover:text-accent bg-background hover:bg-surface-lighter rounded-lg transition-colors disabled:opacity-50">
                        <Download className="w-4 h-4" />
                        {isExporting ? t('progress.analytics.export.exporting') : t('progress.analytics.export.button')}
                    </button>
                </div>
                <div ref={weekComparisonRef}>
                    <WeekComparison comparison={weekComparison} />
                </div>
            </div>

            {/* Protein Streaks Section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-text-primary">
                        {t('progress.analytics.streaks.title')}
                    </h3>
                    <button
                        onClick={handleExportStreaks}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-text-secondary hover:text-accent bg-background hover:bg-surface-lighter rounded-lg transition-colors disabled:opacity-50">
                        <Download className="w-4 h-4" />
                        {isExporting ? t('progress.analytics.export.exporting') : t('progress.analytics.export.button')}
                    </button>
                </div>
                <div ref={streaksRef}>
                    <StreaksVisualizer streakData={streakData} />
                </div>
            </div>

            {/* Best Day Section */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-lg font-black text-text-primary mb-1">
                    {t('progress.analytics.bestDay.title')}
                </h3>
                <p className="text-sm text-text-tertiary mb-4">
                    {t('progress.analytics.bestDay.subtitle')}
                </p>

                {bestDay.averageScore > 0 ? (
                    <>
                        <div className="flex items-center justify-center gap-4 py-6">
                            <div className="text-center">
                                <p className="text-5xl font-black text-accent mb-2">
                                    {bestDay.dayName}
                                </p>
                                <p className="text-sm text-text-tertiary font-semibold">
                                    {t('progress.analytics.bestDay.score')}: {bestDay.averageScore}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-text-secondary text-center italic mt-4">
                            {t('progress.analytics.bestDay.insight', { day: bestDay.dayName })}
                        </p>

                        <div className="mt-6 grid grid-cols-7 gap-2">
                            {bestDay.allDayScores.map((day: any) => (
                                <div
                                    key={day.dayIndex}
                                    className={`text-center p-2 rounded-lg ${
                                        day.dayIndex === bestDay.dayIndex
                                            ? 'bg-accent/10 border-2 border-accent'
                                            : 'bg-background'
                                    }`}>
                                    <p className="text-xs font-bold text-text-secondary mb-1">
                                        {day.dayName.substring(0, 3)}
                                    </p>
                                    <p className="text-lg font-black text-text-primary">
                                        {day.averageScore.toFixed(1)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-text-tertiary text-center py-6">
                        {t('progress.analytics.bestDay.noData')}
                    </p>
                )}
            </div>

            {/* Body Measurement Analytics (Predictions + Correlations) */}
            <BodyMeasurementAnalytics
                weightData={weightData}
                measurements={measurements}
                currentWeight={currentWeight}
                targetWeight={targetWeight}
            />
        </div>
    );
};
