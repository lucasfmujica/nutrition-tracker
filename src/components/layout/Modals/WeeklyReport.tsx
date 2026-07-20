import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CustomTargets,
    FoodEntry,
    StepsEntry,
    WeightEntry,
    Workout,
} from '../../../types/domain';
import {
    addDaysToDate,
    getArgentinaDateString,
    getMondayOfWeek,
} from '../../../utils/dateUtils';
import { importWithRetry } from '../../../utils/lazyUtils';
import { ModalShell } from '../../UI/ModalShell';
import { WeeklyReportSections } from './WeeklyReportSections';

interface WeeklyReportProps {
    foodLog: FoodEntry[];
    workoutLog: Workout[];
    weightHistory: WeightEntry[];
    stepsLog: StepsEntry[];
    targets: CustomTargets;
    onClose: () => void;
}

/**
 * Weekly Report Component
 * Shows comprehensive weekly stats with charts and export functionality
 */
export const WeeklyReport: React.FC<WeeklyReportProps> = ({
    foodLog,
    workoutLog,
    weightHistory,
    stepsLog,
    targets,
    onClose,
}) => {
    const { t, i18n } = useTranslation();
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState(0); // 0 = this week, -1 = last week, etc.

    const getWeekDates = (weeksAgo = 0) => {
        // Argentina TZ throughout: toISOString() (UTC) would shift the week by a
        // day for any log made between 21:00 and midnight ART.
        const todayStr = getArgentinaDateString();
        const monday = addDaysToDate(getMondayOfWeek(todayStr), -weeksAgo * 7);
        const sunday = addDaysToDate(monday, 6);

        const dates = [];
        for (let i = 0; i < 7; i++) {
            dates.push(addDaysToDate(monday, i));
        }

        return {
            monday,
            sunday,
            dates,
            label:
                weeksAgo === 0
                    ? t('dashboard.weeklyReport.thisWeek')
                    : weeksAgo === 1
                      ? t('diary.requests.yesterday') // Using "Yesterday" for last week is weird, but I'll use a better one if found
                      : t('diary.requests.daysAgo', { count: Math.abs(weeksAgo) }),
        };
    };

    const currentWeek = getWeekDates(selectedWeek);
    const previousWeek = getWeekDates(selectedWeek - 1);

    const getWeekStats = (dates: string[]) => {
        const weekFood = foodLog.filter((f) => dates.includes(f.date));
        const weekWorkouts = workoutLog.filter((w) => dates.includes(w.date));
        const weekSteps = stepsLog.filter((s) => dates.includes(s.date));
        const weekWeight = weightHistory.filter((w) => dates.includes(w.date));

        const dailyStats = dates.map((date) => {
            const dayFood = weekFood.filter((f) => f.date === date);
            const dayWorkouts = weekWorkouts.filter((w) => w.date === date);
            const daySteps = weekSteps.find((s) => s.date === date);
            const dayWeight = weekWeight.find((w) => w.date === date);

            return {
                date,
                calories: dayFood.reduce((sum, f) => sum + f.calories, 0),
                protein: dayFood.reduce((sum, f) => sum + f.protein, 0),
                carbs: dayFood.reduce((sum, f) => sum + f.carbs, 0),
                fat: dayFood.reduce((sum, f) => sum + f.fat, 0),
                workouts: dayWorkouts.length,
                workoutMinutes: dayWorkouts.reduce(
                    (sum, w) => sum + (w.duration || 0),
                    0,
                ),
                steps: daySteps?.steps || 0,
                weight: dayWeight?.weight || null,
            };
        });

        const daysWithFood = dailyStats.filter((d) => d.calories > 0).length;
        const totalCalories = dailyStats.reduce((sum, d) => sum + d.calories, 0);
        const totalProtein = dailyStats.reduce((sum, d) => sum + d.protein, 0);
        const totalWorkouts = weekWorkouts.length;
        const totalWorkoutMins = dailyStats.reduce(
            (sum, d) => sum + d.workoutMinutes,
            0,
        );
        const totalSteps = dailyStats.reduce((sum, d) => sum + d.steps, 0);

        const avgCalories =
            daysWithFood > 0 ? Math.round(totalCalories / daysWithFood) : 0;
        const avgProtein =
            daysWithFood > 0 ? Math.round(totalProtein / daysWithFood) : 0;
        const avgSteps = Math.round(totalSteps / 7);

        const bestCalorieDay = dailyStats.reduce((best, d) => {
            const diff = Math.abs(d.calories - targets.calories);
            const bestDiff = Math.abs(best.calories - targets.calories);
            return diff < bestDiff && d.calories > 0 ? d : best;
        }, dailyStats[0]);

        const calOkDays = dailyStats.filter(
            (d) =>
                d.calories >= targets.calories * 0.9 &&
                d.calories <= targets.calories * 1.1,
        ).length;
        const protOkDays = dailyStats.filter(
            (d) => d.protein >= targets.protein * 0.9,
        ).length;

        return {
            dailyStats,
            summary: {
                avgCalories,
                avgProtein,
                avgSteps,
                totalWorkouts,
                totalWorkoutMins,
                daysWithFood,
                calOkDays,
                protOkDays,
                bestDay: bestCalorieDay,
            },
        };
    };

    const thisWeekStats = getWeekStats(currentWeek.dates);
    const lastWeekStats = getWeekStats(previousWeek.dates);

    const calChange =
        lastWeekStats.summary.avgCalories > 0
            ? (
                  ((thisWeekStats.summary.avgCalories -
                      lastWeekStats.summary.avgCalories) /
                      lastWeekStats.summary.avgCalories) *
                  100
              ).toFixed(1)
            : '0';
    const protChange =
        lastWeekStats.summary.avgProtein > 0
            ? (
                  ((thisWeekStats.summary.avgProtein -
                      lastWeekStats.summary.avgProtein) /
                      lastWeekStats.summary.avgProtein) *
                  100
              ).toFixed(1)
            : '0';

    const exportAsImage = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);

        try {
            const html2canvas = (await importWithRetry(() => import('html2canvas')))
                .default;
            const canvas = await html2canvas(reportRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
            });

            const link = document.createElement('a');
            link.download = `lukenfit-report-${currentWeek.monday}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Error exporting:', err);
            alert(t('common.error'));
        } finally {
            setIsExporting(false);
        }
    };

    const dayNames =
        i18n.language === 'es'
            ? ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
            : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const getBarHeight = (value: number, max: number) =>
        Math.min((value / max) * 100, 100);

    return (
        <ModalShell
            open
            onClose={onClose}
            size="full"
            title={`📊 ${t('dashboard.weeklyReport.title')}`}
            footer={
                <button
                    onClick={exportAsImage}
                    disabled={isExporting}
                    className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-control font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow transition-all">
                    {isExporting ? '⏳' : '📷'}{' '}
                    {isExporting
                        ? t('modals.weeklyReport.downloading')
                        : t('modals.weeklyReport.downloadButton')}
                </button>
            }>
            <div className="flex justify-center gap-2 mb-4">
                <button
                    onClick={() => setSelectedWeek((s) => s - 1)}
                    className="px-3 py-1.5 bg-surface-lighter hover:bg-progress-track text-text-primary rounded-control text-sm transition-all">
                    ← {t('common.prev')}
                </button>
                <span className="px-4 py-1.5 bg-primary text-white rounded-control text-sm font-medium shadow-glow">
                    {currentWeek.label}
                </span>
                <button
                    onClick={() => setSelectedWeek((s) => Math.min(s + 1, 0))}
                    disabled={selectedWeek >= 0}
                    className="px-3 py-1.5 bg-surface-lighter hover:bg-progress-track disabled:opacity-30 disabled:cursor-not-allowed text-text-primary rounded-control text-sm transition-all">
                    {t('common.next')} →
                </button>
            </div>

            <div
                ref={reportRef}
                className="bg-surface rounded-card p-5 border border-border shadow-card space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-control bg-gradient-to-br from-primary to-primary flex items-center justify-center shadow-card">
                            <span className="text-2xl">💪</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-primary">
                                LukenFit
                            </h3>
                            <p className="text-sm text-text-tertiary">
                                {currentWeek.monday} → {currentWeek.sunday}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary tabular-nums">
                            {thisWeekStats.summary.calOkDays}/7
                        </div>
                        <p className="text-xs text-text-tertiary">
                            {t('dashboard.weeklyReport.daysOnTrack')}
                        </p>
                    </div>
                </div>

                <WeeklyReportSections
                    dailyStats={thisWeekStats.dailyStats}
                    summary={thisWeekStats.summary}
                    targets={targets}
                    calChange={calChange}
                    protChange={protChange}
                    dayNames={dayNames}
                    getBarHeight={getBarHeight}
                />
            </div>
        </ModalShell>
    );
};
