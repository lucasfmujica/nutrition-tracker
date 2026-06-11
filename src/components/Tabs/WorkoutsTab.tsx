import {
    Dumbbell,
    Pencil,
    Camera,
    Plus,
    Trophy,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { useEffortAnalytics } from '../../hooks/useEffortAnalytics';
import { usePersonalRecords } from '../../hooks/usePersonalRecords';
import { useWorkoutAnalysis } from '../../hooks/useWorkoutAnalysis';
import { OuraEntry, WeightAnalytics, Workout } from '../../types/domain';
import { EmptyState } from '../UI/EmptyState';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';
import { SwipeableItem } from '../UI/SwipeableItem';
import { EffortAnalytics, EffortRadar } from '../Workouts/EffortRadar';
import { EditableWeeklyPlan } from '../Workouts/EditableWeeklyPlan';
import { WorkoutStatsCards } from '../Workouts/WorkoutStatsCards';
import { WorkoutScanner } from '../Workouts/WorkoutScanner';

interface WorkoutsTabProps {
    selectedWorkoutDate: string;
    setSelectedWorkoutDate: (date: string) => void;
    changeDate: (days: number) => void;
    workoutLog: Workout[];
    weightAnalytics: WeightAnalytics;
    ouraLog: OuraEntry[];
    currentWeight: number;
    getWorkoutsForDate: (date: string) => Workout[];
    confirmDelete: (type: string, id: string, name: string) => void;
}

/** Color bar + badge styles per workout type */
const typeStyles: Record<string, { bar: string; badge: string }> = {
    gym: { bar: 'bg-amber-500', badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300' },
    sport: { bar: 'bg-green-500', badge: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300' },
    tennis: { bar: 'bg-green-500', badge: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300' },
    cardio: { bar: 'bg-blue-500', badge: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' },
    other: { bar: 'bg-gray-400', badge: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300' },
};

const getTypeStyle = (type: string) => typeStyles[type] || typeStyles.other;

const getTypeBadgeKey = (type: string): string => {
    const map: Record<string, string> = {
        gym: 'workouts.types.gym',
        sport: 'workouts.types.sport',
        tennis: 'workouts.types.sport',
        cardio: 'workouts.types.cardio',
        other: 'workouts.types.other',
    };
    return map[type] || 'workouts.types.other';
};

/**
 * WorkoutsTab - Workout tracking and history
 */
export const WorkoutsTab: React.FC<WorkoutsTabProps> = ({
    selectedWorkoutDate,
    setSelectedWorkoutDate,
    workoutLog,
    weightAnalytics,
    ouraLog,
    getWorkoutsForDate,
    confirmDelete,
}) => {
    const { t } = useTranslation();
    const workoutsForSelectedDate = getWorkoutsForDate(selectedWorkoutDate);
    const dailyOura = ouraLog.find((e) => e.date === selectedWorkoutDate);

    const workoutAnalysis = useWorkoutAnalysis(workoutLog, selectedWorkoutDate);
    const personalRecords = usePersonalRecords(workoutLog, selectedWorkoutDate);
    const effortAnalytics = useEffortAnalytics(
        workoutLog,
        ouraLog,
        weightAnalytics,
        selectedWorkoutDate,
    );

    const {
        handleEditWorkout,
        setShowImportWorkoutModal,
        showImportWorkoutModal,
        saveWorkoutEntry,
        setShowWorkoutForm,
        isLoading,
    } = useTracker();

    return (
        <div className="space-y-3 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        {t('workouts.title')}
                    </h1>
                    <p className="text-sm text-text-tertiary">{t('workouts.subtitle')}</p>
                </div>
                <div className="flex flex-col-reverse md:flex-row gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowWorkoutForm && setShowWorkoutForm(true)}
                        className="group relative flex items-center justify-center gap-2 px-5 py-3 md:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all w-full md:w-auto overflow-hidden">
                        <Plus size={18} />
                        <span>{t('workouts.addQuickWorkout')}</span>
                    </button>
                    <button
                        onClick={() => setShowImportWorkoutModal(true)}
                        className="group relative flex items-center justify-center gap-2 px-5 py-3 md:py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all w-full md:w-auto overflow-hidden">
                        <div className="absolute inset-0 bg-surface/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <Camera size={18} className="text-amber-400" />
                        <span>{t('workouts.importGravl')}</span>
                    </button>
                    <div className="w-full md:w-auto md:min-w-[200px]">
                        <LukenFitDatePicker
                            selectedDate={selectedWorkoutDate}
                            onChange={setSelectedWorkoutDate}
                            label={t('weight.date')}
                        />
                    </div>
                </div>
            </div>

            {/* Effort Radar */}
            <div className="w-full">
                <EffortRadar
                    analytics={effortAnalytics as EffortAnalytics}
                    selectedDate={selectedWorkoutDate}
                />
            </div>

            {/* Stats Cards */}
            <WorkoutStatsCards
                workoutAnalysis={workoutAnalysis}
                dailyOura={dailyOura}
            />

            {/* Personal Records Banner */}
            {personalRecords.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h3 className="text-amber-900 dark:text-amber-200 font-bold text-sm">
                            {t('workouts.personalRecords')}
                        </h3>
                    </div>
                    <div className="space-y-1">
                        {personalRecords.map((pr) => (
                            <div key={pr.exerciseName} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                    {pr.exerciseName}
                                </span>
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/50 px-2 py-0.5 rounded-full">
                                    {t('workouts.newPR')} · {t('workouts.prProgression', { previous: pr.previousBest, current: pr.newWeight })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Swipe hint */}
            {workoutsForSelectedDate.length > 0 && (
                <p className="text-xs text-text-tertiary text-center uppercase tracking-widest font-bold">
                    ← {t('common.swipeToDelete')}
                </p>
            )}

            {/* Workout list or empty state */}
            {workoutsForSelectedDate.length === 0 ? (
                !isLoading && (
                    <div className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-sm">
                        <EmptyState
                            icon={Dumbbell}
                            title={t('workouts.noWorkouts')}
                            description={t('workouts.logActivityPrompt')}
                            actionLabel={t('workouts.noWorkoutsCTA')}
                            onAction={() =>
                                setShowWorkoutForm && setShowWorkoutForm(true)
                            }
                        />
                    </div>
                )
            ) : (
                <div className="space-y-2">
                    {workoutsForSelectedDate.map((workout) => {
                        const style = getTypeStyle(workout.type);
                        return (
                            <SwipeableItem
                                key={workout.id}
                                onDelete={() =>
                                    confirmDelete('workout', workout.id, workout.name)
                                }>
                                <div className="bg-surface dark:bg-surface-dark rounded-2xl p-4 border border-border dark:border-border-dark shadow-sm relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${style.bar}`} />

                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                                                    {t(getTypeBadgeKey(workout.type))}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-text-primary text-lg leading-tight truncate">
                                                {workout.name}
                                            </h3>
                                        </div>
                                        <div className="flex gap-2 items-center flex-shrink-0">
                                            <button
                                                onClick={() => handleEditWorkout(workout)}
                                                className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors active:scale-90"
                                                title={t('workouts.edit')}
                                                aria-label={t('workouts.edit')}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-text-tertiary mb-3 pl-2">
                                        {workout.duration && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <span className="text-blue-500">⏱️</span>{' '}
                                                {workout.duration} min
                                            </span>
                                        )}
                                        {workout.volume && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <span className="text-amber-500">📊</span>{' '}
                                                {workout.volume.toLocaleString()} kg
                                            </span>
                                        )}
                                        {workout.calories && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <span className="text-red-500">🔥</span>{' '}
                                                {workout.calories} kcal
                                            </span>
                                        )}
                                    </div>

                                    {workout.exercises && workout.exercises.length > 0 && (
                                        <div className="space-y-2 border-t border-border dark:border-border-dark pt-3 pl-2">
                                            {workout.exercises.map((ex, idx) => (
                                                <div
                                                    key={idx}
                                                    className="text-sm flex justify-between items-center group">
                                                    <span className="text-text-secondary font-medium truncate flex-1">
                                                        {ex.name}
                                                    </span>
                                                    <span className="text-text-tertiary font-mono text-xs tabular-nums ml-4 bg-background dark:bg-background-dark px-2 py-0.5 rounded-lg border border-border dark:border-border-dark">
                                                        {ex.sets}x{ex.reps} · {ex.weight}kg
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {workout.notes && (
                                        <div className="mt-3 pl-2 pt-2 border-t border-border dark:border-border-dark">
                                            <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded-xl italic">
                                                "{workout.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </SwipeableItem>
                        );
                    })}
                </div>
            )}

            {/* Weekly Plan */}
            <EditableWeeklyPlan
                selectedWorkoutDate={selectedWorkoutDate}
                setSelectedWorkoutDate={setSelectedWorkoutDate}
            />

            {/* Import Scanner Modal */}
            {showImportWorkoutModal && (
                <WorkoutScanner
                    onSave={(data) => {
                        saveWorkoutEntry(data);
                        setShowImportWorkoutModal(false);
                    }}
                    onCancel={() => setShowImportWorkoutModal(false)}
                />
            )}
        </div>
    );
};
