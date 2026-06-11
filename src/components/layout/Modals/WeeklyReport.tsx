import React, { useEffect, useRef, useState } from 'react';
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 overflow-y-auto">
            <div className="w-full max-w-2xl my-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-xl font-bold text-white">
                        📊 {t('dashboard.weeklyReport.title')}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportAsImage}
                            disabled={isExporting}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all">
                            {isExporting ? '⏳' : '📷'}{' '}
                            {isExporting
                                ? t('modals.weeklyReport.downloading')
                                : t('modals.weeklyReport.downloadButton')}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface/10 hover:bg-surface/20 text-white text-2xl transition-all">
                            ×
                        </button>
                    </div>
                </div>

                <div className="flex justify-center gap-2 mb-4">
                    <button
                        onClick={() => setSelectedWeek((s) => s - 1)}
                        className="px-3 py-1.5 bg-surface/10 hover:bg-surface/20 text-white rounded-lg text-sm transition-all">
                        ← {t('common.prev')}
                    </button>
                    <span className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium shadow-lg">
                        {currentWeek.label}
                    </span>
                    <button
                        onClick={() => setSelectedWeek((s) => Math.min(s + 1, 0))}
                        disabled={selectedWeek >= 0}
                        className="px-3 py-1.5 bg-surface/10 hover:bg-surface/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-all">
                        {t('common.next')} →
                    </button>
                </div>

                <div
                    ref={reportRef}
                    className="bg-surface rounded-2xl p-5 border border-border shadow-2xl space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
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
                            <div className="text-2xl font-bold text-blue-500">
                                {thisWeekStats.summary.calOkDays}/7
                            </div>
                            <p className="text-xs text-text-tertiary">
                                {t('dashboard.weeklyReport.daysOnTrack')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                            <div className="text-2xl font-bold text-blue-600">
                                {thisWeekStats.summary.avgCalories}
                            </div>
                            <div className="text-xs text-text-secondary">kcal/día</div>
                            <div
                                className={`text-xs mt-1 font-medium ${parseFloat(calChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {parseFloat(calChange) > 0
                                    ? '↑'
                                    : parseFloat(calChange) < 0
                                      ? '↓'
                                      : '='}{' '}
                                {Math.abs(parseFloat(calChange))}%
                            </div>
                        </div>
                        <div className="bg-cyan-50 rounded-xl p-3 text-center border border-cyan-100">
                            <div className="text-2xl font-bold text-cyan-600">
                                {thisWeekStats.summary.avgProtein}g
                            </div>
                            <div className="text-xs text-text-secondary">proteína/día</div>
                            <div
                                className={`text-xs mt-1 font-medium ${parseFloat(protChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {parseFloat(protChange) > 0
                                    ? '↑'
                                    : parseFloat(protChange) < 0
                                      ? '↓'
                                      : '='}{' '}
                                {Math.abs(parseFloat(protChange))}%
                            </div>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                            <div className="text-2xl font-bold text-amber-600">
                                {thisWeekStats.summary.totalWorkouts}
                            </div>
                            <div className="text-xs text-text-secondary">
                                {t('navigation.workouts').toLowerCase()}
                            </div>
                            <div className="text-xs mt-1 text-text-tertiary font-medium">
                                {thisWeekStats.summary.totalWorkoutMins} min
                            </div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
                            <div className="text-2xl font-bold text-purple-600">
                                {Math.round(thisWeekStats.summary.avgSteps / 1000)}k
                            </div>
                            <div className="text-xs text-text-secondary">pasos/día</div>
                            <div className="text-xs mt-1 text-text-tertiary font-medium">
                                prom.
                            </div>
                        </div>
                    </div>

                    <div className="bg-background rounded-xl p-4 border border-border">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-text-primary">
                                {t('dashboard.adherence.calOk')}
                            </h4>
                            <span className="text-xs text-text-tertiary">
                                {t('dashboard.summary.target')}: {targets.calories}
                            </span>
                        </div>
                        <div className="flex items-end justify-between gap-1 h-24">
                            {thisWeekStats.dailyStats.map((day, i) => {
                                const height = getBarHeight(
                                    day.calories,
                                    targets.calories * 1.3,
                                );
                                const isOk =
                                    day.calories >= targets.calories * 0.9 &&
                                    day.calories <= targets.calories * 1.1;
                                const isOver = day.calories > targets.calories * 1.1;
                                return (
                                    <div
                                        key={day.date}
                                        className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className="w-full relative"
                                            style={{ height: '80px' }}>
                                            <div
                                                className={`absolute bottom-0 w-full rounded-t transition-all ${
                                                    isOk
                                                        ? 'bg-green-500'
                                                        : isOver
                                                          ? 'bg-red-500'
                                                          : day.calories > 0
                                                            ? 'bg-blue-500'
                                                            : 'bg-muted'
                                                }`}
                                                style={{ height: `${height}%` }}
                                            />
                                            <div
                                                className="absolute w-full border-t border-dashed border-muted"
                                                style={{
                                                    bottom: `${getBarHeight(targets.calories, targets.calories * 1.3)}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs text-text-secondary font-medium">
                                            {dayNames[i]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-background rounded-xl p-4 border border-border">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-text-primary">
                                {t('dashboard.macros.protein')}
                            </h4>
                            <span className="text-xs text-text-tertiary">
                                {t('dashboard.summary.target')}: {targets.protein}g
                            </span>
                        </div>
                        <div className="flex items-end justify-between gap-1 h-24">
                            {thisWeekStats.dailyStats.map((day, i) => {
                                const height = getBarHeight(
                                    day.protein,
                                    targets.protein * 1.3,
                                );
                                const isOk = day.protein >= targets.protein * 0.9;
                                return (
                                    <div
                                        key={day.date}
                                        className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className="w-full relative"
                                            style={{ height: '80px' }}>
                                            <div
                                                className={`absolute bottom-0 w-full rounded-t transition-all ${
                                                    isOk
                                                        ? 'bg-cyan-500'
                                                        : day.protein > 0
                                                          ? 'bg-cyan-300'
                                                          : 'bg-muted'
                                                }`}
                                                style={{ height: `${height}%` }}
                                            />
                                            <div
                                                className="absolute w-full border-t border-dashed border-muted"
                                                style={{
                                                    bottom: `${getBarHeight(targets.protein, targets.protein * 1.3)}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs text-text-secondary font-medium">
                                            {dayNames[i]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">✅</span>
                                <span className="text-sm font-medium text-text-primary">
                                    Adherencia Calorías
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-green-600">
                                    {thisWeekStats.summary.calOkDays}
                                </span>
                                <span className="text-text-secondary">/7 días</span>
                            </div>
                            <div className="mt-2 h-2 bg-surface-lighter rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{
                                        width: `${(thisWeekStats.summary.calOkDays / 7) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">💪</span>
                                <span className="text-sm font-medium text-text-primary">
                                    Adherencia Proteína
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-cyan-600">
                                    {thisWeekStats.summary.protOkDays}
                                </span>
                                <span className="text-text-secondary">/7 días</span>
                            </div>
                            <div className="mt-2 h-2 bg-surface-lighter rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan-500 rounded-full transition-all"
                                    style={{
                                        width: `${(thisWeekStats.summary.protOkDays / 7) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {thisWeekStats.summary.bestDay &&
                        thisWeekStats.summary.bestDay.calories > 0 && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">🏆</span>
                                    <span className="text-sm font-medium text-amber-700">
                                        Mejor día de la semana
                                    </span>
                                </div>
                                <p className="text-text-primary text-sm">
                                    <span className="font-bold">
                                        {new Date(
                                            thisWeekStats.summary.bestDay.date +
                                                'T12:00:00',
                                        ).toLocaleDateString(
                                            i18n.language === 'es'
                                                ? 'es-AR'
                                                : 'en-US',
                                            {
                                                weekday: 'long',
                                                day: 'numeric',
                                            },
                                        )}
                                    </span>
                                    {' - '}
                                    {
                                        thisWeekStats.summary.bestDay.calories
                                    } kcal, {thisWeekStats.summary.bestDay.protein}g
                                    {t('dashboard.macros.protein').toLowerCase()}
                                </p>
                            </div>
                        )}

                    <div className="text-center pt-2 border-t border-border">
                        <p className="text-xs text-text-tertiary">
                            {t('dashboard.weeklyReport.footer')} •{' '}
                            {new Date().toLocaleDateString(
                                i18n.language === 'es' ? 'es-AR' : 'en-US',
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
