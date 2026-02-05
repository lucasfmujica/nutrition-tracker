import {
    Activity,
    CalendarDays,
    Dumbbell,
    Flame,
    Scale,
    Trophy,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface WeeklyReportCardProps {
    // Activity
    workouts?: number;
    gymCount?: number;
    tennisCount?: number;

    // Nutrition
    proteinAvg?: number;
    avgDeficit?: number;
    consistencyStreak?: number;
    daysTracked?: number;

    // Weight
    weightDelta?: number | null;
    totalLost?: number | null;
    percentToGoal?: number | null;
    currentWeight?: number | null;

    // Meta
    weekRange?: string;
}

/**
 * WeeklyReportCard - Premium shareable card for Social Accountability Reports
 */
export const WeeklyReportCard = React.forwardRef<
    HTMLDivElement,
    WeeklyReportCardProps
>(
    (
        {
            // Activity
            gymCount = 0,
            tennisCount = 0,

            // Nutrition
            proteinAvg = 0,
            avgDeficit = 0,
            consistencyStreak = 0,
            daysTracked = 0,

            // Weight
            weightDelta = null,
            totalLost = null,
            percentToGoal = null,
            currentWeight = null,

            // Meta
            workouts = 0,
            weekRange = '',
        },
        ref,
    ) => {
        const { t } = useTranslation();
        // 1. Helper: Generate Insight Logic
        const generateWeeklyFeedback = () => {
            // Placeholder values for the new logic, as the exact mapping from existing props
            // to these new variables (bodyWeightTrend, daysOnTrack, proteinAdherence, gymSessions)
            // was not provided in the instruction.
            // For a functional implementation, these would need to be derived from the component's props.
            const bodyWeightTrend =
                weightDelta !== null && weightDelta < 0 ? 'down' : 'stable'; // Example derivation
            const daysOnTrack = consistencyStreak; // Example derivation
            const proteinAdherence = proteinAvg >= 150 ? 100 : 0; // Example derivation
            const gymSessions = gymCount; // Example derivation

            if (bodyWeightTrend === 'down') {
                return t('dashboard.weeklyReport.feedback.greatWeek');
            }
            if (daysOnTrack > 4) {
                return t('dashboard.weeklyReport.feedback.discipline');
            }
            if (proteinAdherence > 90) {
                return t('dashboard.weeklyReport.feedback.protein');
            }
            if (gymSessions > 2) {
                return t('dashboard.weeklyReport.feedback.mvp');
            }
            return t('dashboard.weeklyReport.feedback.consistencyKey');
        };

        const insight = generateWeeklyFeedback();

        return (
            <div
                ref={ref}
                className="relative overflow-hidden flex flex-col bg-gradient-to-b from-surface to-background dark:from-surface-lighter dark:to-surface shadow-2xl"
                style={{
                    width: '24rem',
                    minHeight: '36rem',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    borderRadius: '2rem',
                }}>
                {/* Decorative Background */}
                <div
                    className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                        background:
                            'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
                        transform: 'translate(30%, -30%)',
                    }}
                />
                <div
                    className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                        background:
                            'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
                        transform: 'translate(-30%, 30%)',
                    }}
                />

                {/* Main Container */}
                <div className="relative z-10 flex-1 flex flex-col p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-1">
                                {t('dashboard.weeklyReport.title')}
                            </p>
                            <h1 className="text-xl font-black text-text-primary">
                                {weekRange || t('dashboard.weeklyReport.thisWeek')}
                            </h1>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                            <Trophy
                                className="w-5 h-5 text-yellow-500"
                                strokeWidth={1.5}
                            />
                        </div>
                    </div>

                    {/* 1. Hero Section: Weight */}
                    <div className="mb-8 text-center relative py-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-3xl -z-10" />

                        <div className="inline-flex items-center gap-2 mb-2">
                            <Scale className="w-4 h-4 text-text-tertiary" />
                            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                                {t('dashboard.weeklyReport.bodyWeight')}
                            </span>
                        </div>

                        <div className="flex items-baseline justify-center gap-1 mb-2">
                            <span className="text-6xl font-black text-text-primary tracking-tighter">
                                {currentWeight ? currentWeight.toFixed(1) : '--'}
                            </span>
                            <span className="text-xl font-medium text-text-tertiary">
                                kg
                            </span>
                        </div>

                        {/* Cumulative Progress Pill */}
                        {totalLost !== null && totalLost > 0 && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full shadow-sm border border-border">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div className="text-[11px] font-medium text-text-secondary">
                                    {t('dashboard.weeklyReport.totalLost')}:{' '}
                                    <span className="font-bold text-text-primary">
                                        {totalLost}{' '}
                                        {t('units.kg', { defaultValue: 'kg' })}
                                    </span>
                                    {percentToGoal !== null && percentToGoal !== undefined && (
                                        <span className="text-text-tertiary mx-1">
                                            /
                                        </span>
                                    )}
                                    {percentToGoal !== null && percentToGoal !== undefined && (
                                        <span>{percentToGoal}% meta</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Fallback if no total loss/gain data yet */}
                        {(totalLost === null || totalLost <= 0) &&
                            weightDelta !== null && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full shadow-sm border border-border">
                                    <span
                                        className={`w-2 h-2 rounded-full ${weightDelta <= 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    />
                                    <p className="text-[11px] font-medium text-text-secondary">
                                        {t('dashboard.weeklyReport.variation')}:{' '}
                                        <span className="font-bold text-text-primary">
                                            {weightDelta > 0 ? '+' : ''}
                                            {weightDelta}{' '}
                                            {t('units.kg', { defaultValue: 'kg' })}
                                        </span>
                                    </p>
                                </div>
                            )}
                    </div>

                    {/* 2. Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* Average Deficit */}
                        <div className="p-4 bg-background dark:bg-surface rounded-2xl border border-border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col items-center">
                            <div className="mb-2 p-2 bg-rose-50 dark:bg-rose-900/30 rounded-xl">
                                <Flame
                                    className="w-5 h-5 text-rose-500 dark:text-rose-400"
                                    strokeWidth={2}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                                {t('dashboard.weeklyReport.avgDeficit')}
                            </p>
                            <p className="text-2xl font-bold text-text-primary">
                                {avgDeficit > 0 ? avgDeficit : '-'}
                            </p>
                            <p className="text-[10px] text-text-tertiary font-medium">
                                kcal/dia
                            </p>
                        </div>

                        {/* Consistency Streak */}
                        <div className="p-4 bg-background dark:bg-surface rounded-2xl border border-border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col items-center">
                            <div className="mb-2 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                                <CalendarDays
                                    className="w-5 h-5 text-emerald-500 dark:text-emerald-400"
                                    strokeWidth={2}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                                {t('dashboard.weeklyReport.consistency')}
                            </p>
                            <p className="text-2xl font-bold text-text-primary">
                                {consistencyStreak}
                                <span className="text-lg text-text-tertiary">
                                    /{daysTracked || 7}
                                </span>
                            </p>
                            <p className="text-[10px] text-text-tertiary font-medium">
                                {t('dashboard.weeklyReport.daysOnTrack')}
                            </p>
                        </div>
                    </div>

                    {/* 3. Activity Breakdown */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <Activity className="w-4 h-4 text-text-tertiary" />
                            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                                {t('dashboard.weeklyReport.totalActivity')}
                            </h3>
                        </div>

                        <div className="bg-background dark:bg-surface rounded-2xl border border-border p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] dark:shadow-none">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <Dumbbell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-text-secondary">
                                        {t('dashboard.weeklyReport.strength')}
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-text-primary">
                                    {gymCount}{' '}
                                    <span className="text-xs font-normal text-text-tertiary">
                                        {t('dashboard.weeklyReport.sessions')}
                                    </span>
                                </span>
                            </div>

                            <div className="w-full h-px bg-background mb-4" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                                        <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-text-secondary">
                                        {t('dashboard.weeklyReport.tennis')}
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-text-primary">
                                    {tennisCount}{' '}
                                    <span className="text-xs font-normal text-text-tertiary">
                                        {t('dashboard.weeklyReport.matches')}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 4. LukenFit Insights */}
                    <div className="mt-auto bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 dark:bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

                        <p className="text-[10px] font-bold text-gray-300 dark:text-gray-400 uppercase tracking-widest mb-2">
                            {t('dashboard.weeklyReport.insightsTitle')}
                        </p>
                        <p className="text-sm font-medium leading-relaxed opacity-90">
                            "{insight}"
                        </p>
                    </div>
                </div>

                {/* Footer Branding */}
                <div className="bg-surface py-3 border-t border-border flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-text-primary" />
                    <span className="text-[10px] font-bold text-text-primary tracking-[0.2em]">
                        {t('dashboard.weeklyReport.footer')}
                    </span>
                </div>
            </div>
        );
    },
);

WeeklyReportCard.displayName = 'WeeklyReportCard';
