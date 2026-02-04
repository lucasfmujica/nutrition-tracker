import { Calendar, Clock, Dumbbell, Flame, X } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityItem, Workout } from '../../types/domain';

interface WorkoutDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    activity: ActivityItem | null;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
    isOpen,
    onClose,
    activity,
}) => {
    const { t } = useTranslation();

    if (!isOpen || !activity || activity.activityType !== 'workout_logged')
        return null;

    // Type casting assuming metadata matches Workout structure largely
    // We treat metadata as Partial<Workout> mostly
    const workout = activity.metadata as Partial<Workout>;
    const exercises = workout.exercises || [];

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="w-full sm:w-[500px] h-[85vh] sm:h-auto sm:max-h-[85vh] bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col pointer-events-auto transition-transform duration-300 transform translate-y-0 relative">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <Dumbbell size={16} />
                            </div>
                            <span className="text-xs font-bold text-purple-600 px-2 py-0.5 rounded-full bg-purple-100/50 uppercase tracking-wider">
                                {workout.type || 'Workout'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                            {workout.name || t('common.workout')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Stats Row */}
                <div className="flex divide-x divide-slate-100 border-b border-slate-100 bg-white">
                    <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                        <div className="text-slate-400 mb-1">
                            <Clock size={16} />
                        </div>
                        <span className="text-lg font-bold text-slate-900">
                            {workout.duration || 0}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                            {t('common.min')}
                        </span>
                    </div>
                    <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                        <div className="text-orange-400 mb-1">
                            <Flame size={16} />
                        </div>
                        <span className="text-lg font-bold text-slate-900">
                            {workout.calories || 0}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                            Kcal
                        </span>
                    </div>
                    <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                        <div className="text-blue-400 mb-1">
                            <Calendar size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                            {new Date(activity.createdAt).toLocaleDateString(
                                undefined,
                                {
                                    month: 'short',
                                    day: 'numeric',
                                },
                            )}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                            {t('common.date')}
                        </span>
                    </div>
                </div>

                {/* Exercises List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                    {exercises.length > 0 ? (
                        exercises.map((exercise, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="flex flex-col items-center mt-1">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                        {index + 1}
                                    </div>
                                    {index < exercises.length - 1 && (
                                        <div className="w-0.5 flex-1 bg-slate-100 my-1" />
                                    )}
                                </div>
                                <div className="flex-1 pb-2">
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">
                                        {exercise.name}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            <span className="font-bold text-slate-900 mr-1.5">
                                                {exercise.sets}
                                            </span>
                                            <span className="text-slate-500 text-xs uppercase">
                                                {t('workouts.sets')}
                                            </span>
                                        </div>
                                        <span className="text-slate-300">×</span>
                                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            <span className="font-bold text-slate-900 mr-1.5">
                                                {exercise.reps}
                                            </span>
                                            <span className="text-slate-500 text-xs uppercase">
                                                {t('workouts.reps')}
                                            </span>
                                        </div>
                                        {exercise.weight && (
                                            <>
                                                <span className="text-slate-300">
                                                    @
                                                </span>
                                                <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <span className="font-bold text-slate-900 mr-1.5">
                                                        {exercise.weight}
                                                    </span>
                                                    <span className="text-slate-500 text-xs uppercase">
                                                        kg
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <p>{t('workouts.noExercises')}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors active:scale-95">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
