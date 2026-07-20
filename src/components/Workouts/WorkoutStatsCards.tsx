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
                        <Trophy className="w-5 h-5 text-warning" />
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

                <div className="bg-info-soft rounded-card p-4 border border-info/20 flex flex-col justify-center items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">⏱️</span>
                        <h3 className="text-text-primary font-bold">
                            {t('workouts.time')}
                        </h3>
                    </div>
                    <div className="text-3xl font-black text-info leading-none mb-1 tabular-nums">
                        {workoutAnalysis.totalDuration}'
                    </div>
                    <p className="text-[10px] text-info font-bold uppercase tracking-wider">
                        {t('workouts.totalMinutes')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-warning-soft flex items-center justify-center text-warning">
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
                        <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center text-success">
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
                                    ? 'bg-success-soft text-success'
                                    : 'bg-danger-soft text-danger'
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
                                ? 'text-success'
                                : 'text-danger'
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
                            <div className="w-8 h-8 rounded-full bg-oura-soft flex items-center justify-center text-oura">
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
                            className={`w-2 h-2 rounded-full ${dailyOura.sleepScore && dailyOura.sleepScore >= 85 ? 'bg-success' : dailyOura.sleepScore && dailyOura.sleepScore >= 70 ? 'bg-warning' : 'bg-danger'}`}
                        />
                    </div>

                    <div className="bg-surface dark:bg-surface-dark rounded-xl p-3 border border-border dark:border-border-dark shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center text-primary">
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
                            className={`w-2 h-2 rounded-full ${dailyOura.readinessScore && dailyOura.readinessScore >= 85 ? 'bg-success' : dailyOura.readinessScore && dailyOura.readinessScore >= 70 ? 'bg-warning' : 'bg-danger'}`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
