import {
    Activity,
    Camera,
    Dumbbell,
    Moon,
    Pencil,
    RefreshCw,
    Target,
    Trophy,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_WEEKLY_PLAN } from '../../constants/weeklyPlan';
import { useTracker } from '../../context/TrackerContext';
import { useEffortAnalytics } from '../../hooks/useEffortAnalytics';
import { useWorkoutAnalysis } from '../../hooks/useWorkoutAnalysis';
import { OuraEntry, Profile, WeightAnalytics, Workout } from '../../types/domain';
import {
    addDaysToDate,
    getArgentinaDateString,
    getMondayOfWeek,
} from '../../utils/dateUtils';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';
import { SwipeableItem } from '../UI/SwipeableItem';
import { EffortAnalytics, EffortRadar } from '../Workouts/EffortRadar';
import { WorkoutScanner } from '../Workouts/WorkoutScanner';

interface WorkoutsTabProps {
    // Date management
    selectedWorkoutDate: string;
    setSelectedWorkoutDate: (date: string) => void;
    changeDate: (days: number) => void;
    // Data
    workoutLog: Workout[];
    weightAnalytics: WeightAnalytics;
    ouraLog: OuraEntry[];
    currentWeight: number;
    getWorkoutsForDate: (date: string) => Workout[];
    // Actions
    confirmDelete: (type: string, id: string, name: string) => void;
}

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
    } = useTracker();

    return (
        <div className="space-y-3 pb-24 lg:pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        {t('workouts.title')}
                    </h1>
                    <p className="text-sm text-text-tertiary">{t('workouts.subtitle')}</p>
                </div>
                <div className="flex flex-col-reverse md:flex-row gap-3 w-full md:w-auto">
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

            <div className="space-y-3">
                <div className="w-full">
                    <EffortRadar
                        analytics={effortAnalytics as EffortAnalytics}
                        selectedDate={selectedWorkoutDate}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex flex-col justify-center items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <h3 className="text-text-primary font-bold">
                                {t('workouts.total')}
                            </h3>
                        </div>
                        <div className="text-3xl font-black text-text-primary leading-none mb-1">
                            {(workoutAnalysis as any).gymCount +
                                (workoutAnalysis as any).tennisCount}
                        </div>
                        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                            {t('workouts.workoutsLabel')}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4 border border-cyan-100 flex flex-col justify-center items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">⏱️</span>
                            <h3 className="text-cyan-900 font-bold">
                                {t('workouts.time')}
                            </h3>
                        </div>
                        <div className="text-3xl font-black text-cyan-700 leading-none mb-1">
                            {(workoutAnalysis as any).totalDuration}'
                        </div>
                        <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">
                            {t('workouts.totalMinutes')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-surface rounded-xl border border-border shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                <Dumbbell className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-bold text-text-primary leading-none">
                                    {(workoutAnalysis as any).gymCount}
                                </div>
                                <div className="text-[10px] text-text-tertiary font-bold uppercase">
                                    {t('workouts.gym')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-surface rounded-xl border border-border shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                <Target className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-bold text-text-primary leading-none">
                                    {(workoutAnalysis as any).tennisCount}
                                </div>
                                <div className="text-[10px] text-text-tertiary font-bold uppercase">
                                    {t('workouts.tennis')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {dailyOura && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface rounded-xl p-3 border border-border shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
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

                    <div className="bg-surface rounded-xl p-3 border border-border shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
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

            {workoutsForSelectedDate.length > 0 && (
                <p className="text-xs text-text-tertiary text-center uppercase tracking-widest font-bold">
                    ← {t('common.swipeToDelete', 'Desliza para eliminar')}
                </p>
            )}

            {workoutsForSelectedDate.length === 0 ? (
                <div className="bg-surface rounded-2xl p-12 text-center border border-border shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        💪
                    </div>
                    <h3 className="text-text-primary font-bold text-lg mb-1">
                        {t('workouts.noWorkouts')}
                    </h3>
                    <p className="text-text-tertiary text-sm">
                        {t('workouts.logActivityPrompt')}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {workoutsForSelectedDate.map((workout) => {
                        return (
                            <SwipeableItem
                                key={workout.id}
                                onDelete={() =>
                                    confirmDelete(
                                        'workout',
                                        workout.id,
                                        workout.name,
                                    )
                                }>
                                <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm relative overflow-hidden">
                                    <div
                                        className={`absolute top-0 left-0 bottom-0 w-1.5 ${workout.type === 'gym' ? 'bg-amber-500' : 'bg-green-500'}`}
                                    />

                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${workout.type === 'gym' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                                    {workout.type}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-text-primary text-lg leading-tight truncate">
                                                {workout.name}
                                            </h3>
                                        </div>
                                        <div className="flex gap-2 items-center flex-shrink-0">
                                            <button
                                                onClick={() =>
                                                    handleEditWorkout(workout)
                                                }
                                                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors active:scale-90"
                                                title="Editar entreno">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-text-tertiary mb-3 pl-2">
                                        {workout.duration && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <span className="text-blue-500">
                                                    ⏱️
                                                </span>{' '}
                                                {workout.duration} min
                                            </span>
                                        )}
                                        {workout.volume && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <span className="text-amber-500">
                                                    📊
                                                </span>{' '}
                                                {workout.volume.toLocaleString()} kg
                                            </span>
                                        )}
                                        {workout.calories && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <span className="text-red-500">
                                                    🔥
                                                </span>{' '}
                                                {workout.calories} kcal
                                            </span>
                                        )}
                                    </div>

                                    {workout.exercises &&
                                        workout.exercises.length > 0 && (
                                            <div className="space-y-2 border-t border-border pt-3 pl-2">
                                                {workout.exercises.map((ex, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-sm flex justify-between items-center group">
                                                        <span className="text-text-secondary font-medium truncate flex-1">
                                                            {ex.name}
                                                        </span>
                                                        <span className="text-text-tertiary font-mono text-xs tabular-nums ml-4 bg-background px-2 py-0.5 rounded-lg border border-border">
                                                            {ex.sets}x{ex.reps} ·{' '}
                                                            {ex.weight}kg
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                    {workout.notes && (
                                        <div className="mt-3 pl-2 pt-2 border-t border-border">
                                            <p className="text-sm text-blue-600 bg-blue-50/50 p-2 rounded-xl italic">
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

            <EditableWeeklyPlan
                selectedWorkoutDate={selectedWorkoutDate}
                setSelectedWorkoutDate={setSelectedWorkoutDate}
            />

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

interface EditableWeeklyPlanProps {
    selectedWorkoutDate: string;
    setSelectedWorkoutDate: (date: string) => void;
}

const EditableWeeklyPlan: React.FC<EditableWeeklyPlanProps> = ({
    setSelectedWorkoutDate,
}) => {
    const { t } = useTranslation();
    const { weeklyPlan, updateDayPlan, isLoading } = useTracker();
    const plan = weeklyPlan; // Alias to match existing code or just use weeklyPlan directly

    const [isEditing, setIsEditing] = useState(false);

    // updateDayPlan is now imported from useTracker

    const [editingDay, setEditingDay] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleDayClick = (dayDate: string, dayIndex: number) => {
        if (isEditing) {
            setEditingDay(dayIndex);
        } else {
            setSelectedWorkoutDate(dayDate);
        }
    };

    const handleTypeChange = async (dayIndex: number, newType: string) => {
        setIsSaving(true);

        const intensityMap: Record<string, string> = {
            gym: 'moderate',
            sport: 'high',
            cardio: 'moderate',
            rest: 'recovery',
        };

        const nameMap: Record<string, string | null> = {
            gym: 'Gym',
            sport: 'Tenis',
            cardio: 'Cardio',
            rest: null,
        };

        if (newType === 'rest') {
            await updateDayPlan(dayIndex, null);
        } else {
            // Valid types for PlannedWorkout
            const validTypes = ['gym', 'sport', 'cardio', 'other'] as const;
            if (!validTypes.includes(newType as any)) return; // Should not happen

            await updateDayPlan(dayIndex, {
                type: newType as 'gym' | 'sport' | 'cardio' | 'other',
                name: nameMap[newType] || '', // Ensure name is a string, fallback to empty
                intensity: intensityMap[newType] as any, // Cast to Intensity
            });
        }

        setEditingDay(null);
        setIsSaving(false);
    };

    return (
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                    {t('workouts.weeklyPlan')}
                </h3>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isSaving}
                    className={`group relative flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 ${
                        isEditing
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-200/70 active:scale-95'
                            : 'bg-surface-lighter text-text-secondary hover:bg-surface-lighter active:scale-95'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <span className="text-base">{isEditing ? '✓' : '✏️'}</span>
                    <span>
                        {isEditing ? t('workouts.done') : t('workouts.edit')}
                    </span>
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => {
                    const mondayOfWeek = getMondayOfWeek(getArgentinaDateString());
                    const dayDate = addDaysToDate(mondayOfWeek, i);

                    const plannedWorkout = (plan as any).hasOwnProperty(i)
                        ? (plan as any)[i]
                        : DEFAULT_WEEKLY_PLAN[i as keyof typeof DEFAULT_WEEKLY_PLAN];

                    const isGym = plannedWorkout?.type === 'gym';
                    const isTennis = plannedWorkout?.type === 'sport';
                    const isCardio = plannedWorkout?.type === 'cardio';

                    if (isEditing && editingDay === i) {
                        return (
                            <div key={day} className="relative">
                                <select
                                    value={
                                        !plannedWorkout ||
                                        plannedWorkout.type === 'rest' ||
                                        plannedWorkout.type === 'other'
                                            ? 'rest'
                                            : plannedWorkout.type
                                    }
                                    onChange={(e) => {
                                        handleTypeChange(i, e.target.value);
                                    }}
                                    className="w-full p-2 rounded-xl border-2 border-blue-400 bg-surface text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-lg transition-all cursor-pointer appearance-none text-center"
                                    autoFocus
                                    style={{
                                        backgroundImage:
                                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234B5563' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundSize: '12px',
                                    }}>
                                    <option value="rest">OFF</option>
                                    <option value="gym">GYM</option>
                                    <option value="sport">TEN</option>
                                    <option value="cardio">CARDIO</option>
                                </select>
                            </div>
                        );
                    }

                    return (
                        <button
                            key={day}
                            onClick={() => handleDayClick(dayDate, i)}
                            disabled={isSaving}
                            className={`p-2 rounded-xl border transition-all duration-200 ${
                                isEditing
                                    ? 'hover:scale-105 hover:ring-2 hover:ring-blue-400 hover:shadow-lg active:scale-100'
                                    : 'hover:scale-105 active:scale-95'
                            } cursor-pointer ${
                                isSaving ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                                isGym
                                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                    : isTennis
                                      ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                      : isCardio
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                        : 'bg-background border-border text-text-tertiary hover:bg-surface-lighter'
                            }`}>
                            <div className="font-bold text-xs">{day}</div>
                            <div className="text-[10px] font-bold mt-1 tracking-tighter">
                                {isGym
                                    ? 'GYM'
                                    : isTennis
                                      ? 'TEN'
                                      : isCardio
                                        ? 'CARDIO'
                                        : 'OFF'}
                            </div>
                            {isEditing && (
                                <div className="mt-1 text-[8px] text-text-tertiary font-normal">
                                    tap
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {isEditing && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs text-blue-700 text-center font-medium">
                        👆 Toca un día para cambiar el tipo de entrenamiento
                    </p>
                </div>
            )}

            {isSaving && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-text-tertiary">
                    <div className="w-3 h-3 border-2 border-border border-t-blue-500 rounded-full animate-spin"></div>
                    {t('common.saving', 'Guardando...')}
                </div>
            )}
        </div>
    );
};
