import {
    Dumbbell,
    Moon,
    Target,
    Trophy,
    TrendingDown,
    TrendingUp,
    Zap,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { WorkoutAnalysis } from '../../hooks/useWorkoutAnalysis';
import { OuraEntry } from '../../types/domain';

interface WorkoutStatsCardsProps {
    workoutAnalysis: WorkoutAnalysis;
    dailyOura?: OuraEntry;
}

export const WorkoutStatsCards: React.FC<WorkoutStatsCardsProps> = ({
    workoutAnalysis,
    dailyOura,
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                {t('workouts.thisWeek')}
            </h3>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface dark:bg-surface-dark rounded-2xl p-4 border border-border dark:border-border-dark shadow-sm flex flex-col justify-center items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h3 className="text-text-primary font-bold">
                            {t('workouts.total')}
                        </h3>
                    </div>
                    <div className="text-3xl font-black text-text-primary leading-none mb-1">
                        {workoutAnalysis.gymCount + workoutAnalysis.tennisCount}
                    </div>
                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                        {t('workouts.workoutsLabel')}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-2xl p-4 border border-cyan-100 dark:border-cyan-800 flex flex-col justify-center items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">⏱️</span>
                        <h3 className="text-cyan-900 dark:text-cyan-200 font-bold">
                            {t('workouts.time')}
                        </h3>
                    </div>
                    <div className="text-3xl font-black text-cyan-700 dark:text-cyan-300 leading-none mb-1">
                        {workoutAnalysis.totalDuration}'
                    </div>
                    <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
                        {t('workouts.totalMinutes')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Dumbbell className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-bold text-text-primary leading-none">
                                {workoutAnalysis.gymCount}
                            </div>
                            <div className="text-[10px] text-text-tertiary font-bold uppercase">
                                {t('workouts.gym')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <Target className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-bold text-text-primary leading-none">
                                {workoutAnalysis.tennisCount}
                            </div>
                            <div className="text-[10px] text-text-tertiary font-bold uppercase">
                                {t('workouts.tennis')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Volume comparison card */}
            {workoutAnalysis.volumeChange !== null && (
                <div className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                workoutAnalysis.volumeChange >= 0
                                    ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}>
                                {workoutAnalysis.volumeChange >= 0
                                    ? <TrendingUp className="w-4 h-4" />
                                    : <TrendingDown className="w-4 h-4" />
                                }
                            </div>
                            <div className="text-left">
                                <div className="text-[10px] text-text-tertiary font-bold uppercase">
                                    {t('workouts.volumeVsLastWeek')}
                                </div>
                                <div className="text-sm text-text-secondary">
                                    {workoutAnalysis.totalVolume.toLocaleString()} kg
                                </div>
                            </div>
                        </div>
                        <div className={`text-lg font-bold ${
                            workoutAnalysis.volumeChange >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                        }`}>
                            {workoutAnalysis.volumeChange > 0 ? '+' : ''}{workoutAnalysis.volumeChange}%
                        </div>
                    </div>
                </div>
            )}

            {dailyOura && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface dark:bg-surface-dark rounded-xl p-3 border border-border dark:border-border-dark shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <Moon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                                    {t('workouts.sleep')}
                                </p>
                                <p className="text-xl font-bold text-text-primary">
                                    {dailyOura.sleepScore}
                                </p>
                            </div>
                        </div>
                        <div
                            className={`w-2 h-2 rounded-full ${dailyOura.sleepScore && dailyOura.sleepScore >= 85 ? 'bg-green-500' : dailyOura.sleepScore && dailyOura.sleepScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                        />
                    </div>

                    <div className="bg-surface dark:bg-surface-dark rounded-xl p-3 border border-border dark:border-border-dark shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                                    {t('workouts.readiness')}
                                </p>
                                <p className="text-xl font-bold text-text-primary">
                                    {dailyOura.readinessScore}
                                </p>
                            </div>
                        </div>
                        <div
                            className={`w-2 h-2 rounded-full ${dailyOura.readinessScore && dailyOura.readinessScore >= 85 ? 'bg-green-500' : dailyOura.readinessScore && dailyOura.readinessScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
