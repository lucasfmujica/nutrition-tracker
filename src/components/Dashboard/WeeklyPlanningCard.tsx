import { Calendar, Flame, Leaf, LucideIcon, TrendingDown, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface WeekDay {
    date: string;
    dayOfWeek: string;
    intensity: 'high' | 'moderate' | 'recovery';
    calories: number;
    workouts: string[];
    isPast: boolean;
    isToday: boolean;
    isSafetyNet: boolean;
}

export interface DayDistribution {
    high: number;
    moderate: number;
    recovery: number;
}

export interface Periodization {
    weekDays: WeekDay[];
    weeklyAverage: number;
    totalCalories: number;
    isOnTrack: boolean;
    dayDistribution: DayDistribution;
    weekStart: string;
    targetAverage: number;
}

interface WeeklyPlanningCardProps {
    periodization: Periodization | null;
    targetWeight: number;
}

/**
 * WeeklyPlanningCard - Weekly periodization view
 */
export const WeeklyPlanningCard: React.FC<WeeklyPlanningCardProps> = ({
    periodization,
    targetWeight,
}) => {
    const { t, i18n } = useTranslation();
    if (!periodization?.weekDays) return null;

    const { weekDays, weeklyAverage, isOnTrack, dayDistribution } = periodization;

    const getIntensityStyles = (intensity: string) => {
        switch (intensity) {
            case 'high':
                return {
                    bg: 'bg-orange-100',
                    text: 'text-orange-700',
                    border: 'border-orange-200',
                    icon: Zap,
                    label: t('dashboard.weeklyPlan.intensity.high'),
                };
            case 'moderate':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-700',
                    border: 'border-blue-200',
                    icon: Flame,
                    label: t('dashboard.weeklyPlan.intensity.moderate'),
                };
            case 'recovery':
            default:
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-700',
                    border: 'border-green-200',
                    icon: Leaf,
                    label: t('dashboard.weeklyPlan.intensity.recovery'),
                };
        }
    };

    const isImperial = i18n.language.startsWith('en');
    const weightMultiplier = isImperial ? 2.20462 : 1;
    const unitLabel = isImperial ? 'lbs' : 'kg';
    const displayTarget = (targetWeight * weightMultiplier).toFixed(1);

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl h-full group transition-all duration-300 hover:border-indigo-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-indigo-50 rounded-lg flex-shrink-0">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                            {t('dashboard.weeklyPlan.title')}
                        </h3>
                        <p className="text-[10px] text-gray-500 hidden sm:block">
                            {t('dashboard.weeklyPlan.subtitle')}
                        </p>
                    </div>
                </div>

                {/* Weekly Average Badge */}
                <div
                    className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex-shrink-0 ${
                        isOnTrack ? 'bg-green-50' : 'bg-amber-50'
                    }`}>
                    <TrendingDown
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                            isOnTrack ? 'text-green-600' : 'text-amber-600'
                        }`}
                    />
                    <span
                        className={`text-[10px] sm:text-xs font-bold ${
                            isOnTrack ? 'text-green-700' : 'text-amber-700'
                        }`}>
                        Ø {weeklyAverage}
                    </span>
                </div>
            </div>

            {/* Week Grid - 7 Column Grid on Mobile (No Scroll) */}
            <div className="pb-2">
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {weekDays.map((day) => {
                        const styles = getIntensityStyles(day.intensity);
                        const IconComponent = styles.icon as LucideIcon;

                        return (
                            <div
                                key={day.date}
                                className={`flex flex-col items-center p-1 sm:p-2 rounded-xl transition-all w-full ${
                                    day.isToday
                                        ? `${styles.bg} ring-1 sm:ring-2 ring-offset-1 ${styles.border.replace('border', 'ring')}`
                                        : day.isPast
                                          ? 'bg-gray-50'
                                          : styles.bg
                                }`}>
                                {/* Day Label */}
                                <span
                                    className={`text-[10px] sm:text-xs font-bold ${
                                        day.isToday
                                            ? styles.text
                                            : day.isPast
                                              ? 'text-gray-400'
                                              : styles.text
                                    }`}>
                                    {day.dayOfWeek}
                                </span>

                                {/* Icon */}
                                <div
                                    className={`my-1 p-1 sm:p-1.5 rounded-full ${
                                        day.isPast && !day.isToday
                                            ? 'bg-gray-100'
                                            : 'bg-white/70'
                                    }`}>
                                    <IconComponent
                                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                                            day.isPast && !day.isToday
                                                ? 'text-gray-400'
                                                : styles.text
                                        }`}
                                    />
                                </div>

                                {/* Calories */}
                                <span
                                    className={`text-[8px] sm:text-[9px] font-semibold leading-none ${
                                        day.isPast && !day.isToday
                                            ? 'text-gray-400'
                                            : styles.text
                                    }`}>
                                    {day.calories}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend - Stacked on mobile, inline on larger screens */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    <span className="text-[10px] text-gray-500">
                        {t('dashboard.weeklyPlan.intensity.high')} (
                        {dayDistribution.high})
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="text-[10px] text-gray-500">
                        {t('dashboard.weeklyPlan.intensity.moderate')} (
                        {dayDistribution.moderate})
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-gray-500">
                        {t('dashboard.weeklyPlan.intensity.recovery')} (
                        {dayDistribution.recovery})
                    </span>
                </div>
            </div>

            {/* Track Status */}
            <div
                className={`mt-4 p-3 rounded-2xl text-center ${
                    isOnTrack ? 'bg-emerald-50' : 'bg-amber-50'
                }`}>
                <span
                    className={`text-xs font-bold ${
                        isOnTrack ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                    {isOnTrack
                        ? t('dashboard.weeklyPlan.status.onTrack', {
                              target: displayTarget,
                              unit: unitLabel,
                          })
                        : t('dashboard.weeklyPlan.status.adjust')}
                </span>
            </div>
        </div>
    );
};
