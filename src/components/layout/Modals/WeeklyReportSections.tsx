import React from 'react';
import { useTranslation } from 'react-i18next';
import { CustomTargets } from '../../../types/domain';

export interface WeeklyDayStat {
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    workouts: number;
    workoutMinutes: number;
    steps: number;
    weight: number | null;
}

export interface WeeklySummary {
    avgCalories: number;
    avgProtein: number;
    avgSteps: number;
    totalWorkouts: number;
    totalWorkoutMins: number;
    daysWithFood: number;
    calOkDays: number;
    protOkDays: number;
    bestDay: WeeklyDayStat;
}

interface WeeklyReportSectionsProps {
    dailyStats: WeeklyDayStat[];
    summary: WeeklySummary;
    targets: CustomTargets;
    calChange: string;
    protChange: string;
    dayNames: string[];
    getBarHeight: (value: number, max: number) => number;
}

/**
 * WeeklyReportSections - Body sections of the weekly report card:
 * stat tiles, calories/protein bar charts, adherence cards, best day
 * and footer. Rendered inside the exportable reportRef container.
 */
export const WeeklyReportSections: React.FC<WeeklyReportSectionsProps> = ({
    dailyStats,
    summary,
    targets,
    calChange,
    protChange,
    dayNames,
    getBarHeight,
}) => {
    const { t, i18n } = useTranslation();

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-primary-soft rounded-control p-3 text-center border border-primary/20">
                    <div className="text-2xl font-bold text-primary tabular-nums">
                        {summary.avgCalories}
                    </div>
                    <div className="text-xs text-text-secondary">kcal/día</div>
                    <div
                        className={`text-xs mt-1 font-medium ${parseFloat(calChange) >= 0 ? 'text-success' : 'text-danger'}`}>
                        {parseFloat(calChange) > 0
                            ? '↑'
                            : parseFloat(calChange) < 0
                              ? '↓'
                              : '='}{' '}
                        {Math.abs(parseFloat(calChange))}%
                    </div>
                </div>
                <div className="bg-info-soft rounded-control p-3 text-center border border-info/20">
                    <div className="text-2xl font-bold text-info tabular-nums">
                        {summary.avgProtein}g
                    </div>
                    <div className="text-xs text-text-secondary">proteína/día</div>
                    <div
                        className={`text-xs mt-1 font-medium ${parseFloat(protChange) >= 0 ? 'text-success' : 'text-danger'}`}>
                        {parseFloat(protChange) > 0
                            ? '↑'
                            : parseFloat(protChange) < 0
                              ? '↓'
                              : '='}{' '}
                        {Math.abs(parseFloat(protChange))}%
                    </div>
                </div>
                <div className="bg-warning-soft rounded-control p-3 text-center border border-warning/20">
                    <div className="text-2xl font-bold text-warning tabular-nums">
                        {summary.totalWorkouts}
                    </div>
                    <div className="text-xs text-text-secondary">
                        {t('navigation.workouts').toLowerCase()}
                    </div>
                    <div className="text-xs mt-1 text-text-tertiary font-medium">
                        {summary.totalWorkoutMins} min
                    </div>
                </div>
                <div className="bg-oura-soft rounded-control p-3 text-center border border-oura/20">
                    <div className="text-2xl font-bold text-oura tabular-nums">
                        {Math.round(summary.avgSteps / 1000)}k
                    </div>
                    <div className="text-xs text-text-secondary">pasos/día</div>
                    <div className="text-xs mt-1 text-text-tertiary font-medium">
                        prom.
                    </div>
                </div>
            </div>

            <div className="bg-background rounded-control p-4 border border-border">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-text-primary">
                        {t('dashboard.adherence.calOk')}
                    </h4>
                    <span className="text-xs text-text-tertiary">
                        {t('dashboard.summary.target')}: {targets.calories}
                    </span>
                </div>
                <div className="flex items-end justify-between gap-1 h-24">
                    {dailyStats.map((day, i) => {
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
                                                ? 'bg-success'
                                                : isOver
                                                  ? 'bg-danger'
                                                  : day.calories > 0
                                                    ? 'bg-primary'
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

            <div className="bg-background rounded-control p-4 border border-border">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-text-primary">
                        {t('dashboard.macros.protein')}
                    </h4>
                    <span className="text-xs text-text-tertiary">
                        {t('dashboard.summary.target')}: {targets.protein}g
                    </span>
                </div>
                <div className="flex items-end justify-between gap-1 h-24">
                    {dailyStats.map((day, i) => {
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
                                                ? 'bg-info'
                                                : day.protein > 0
                                                  ? 'bg-accent-blue'
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
                <div className="bg-success-soft border border-success/20 rounded-control p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">✅</span>
                        <span className="text-sm font-medium text-text-primary">
                            Adherencia Calorías
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-success tabular-nums">
                            {summary.calOkDays}
                        </span>
                        <span className="text-text-secondary">/7 días</span>
                    </div>
                    <div className="mt-2 h-2 bg-surface-lighter rounded-full overflow-hidden">
                        <div
                            className="h-full bg-success rounded-full transition-all"
                            style={{
                                width: `${(summary.calOkDays / 7) * 100}%`,
                            }}
                        />
                    </div>
                </div>
                <div className="bg-info-soft border border-info/20 rounded-control p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💪</span>
                        <span className="text-sm font-medium text-text-primary">
                            Adherencia Proteína
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-info tabular-nums">
                            {summary.protOkDays}
                        </span>
                        <span className="text-text-secondary">/7 días</span>
                    </div>
                    <div className="mt-2 h-2 bg-surface-lighter rounded-full overflow-hidden">
                        <div
                            className="h-full bg-info rounded-full transition-all"
                            style={{
                                width: `${(summary.protOkDays / 7) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            </div>

            {summary.bestDay && summary.bestDay.calories > 0 && (
                <div className="bg-warning-soft border border-warning/20 rounded-control p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🏆</span>
                        <span className="text-sm font-medium text-warning">
                            Mejor día de la semana
                        </span>
                    </div>
                    <p className="text-text-primary text-sm">
                        <span className="font-bold">
                            {new Date(
                                summary.bestDay.date + 'T12:00:00',
                            ).toLocaleDateString(
                                i18n.language === 'es' ? 'es-AR' : 'en-US',
                                {
                                    weekday: 'long',
                                    day: 'numeric',
                                },
                            )}
                        </span>
                        {' - '}
                        {summary.bestDay.calories} kcal,{' '}
                        {summary.bestDay.protein}g
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
        </>
    );
};
