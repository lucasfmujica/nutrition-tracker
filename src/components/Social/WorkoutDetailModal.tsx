import { Calendar, Clock, Dumbbell, Flame } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityItem, Workout } from '../../types/domain';
import { Button } from '../UI/Button';
import { ModalShell } from '../UI/ModalShell';

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
        <ModalShell
            open={isOpen}
            onClose={onClose}
            size="md"
            icon={<Dumbbell size={20} />}
            title={workout.name || t('common.workout')}
            subtitle={
                <span className="inline-block text-xs font-bold text-oura px-2 py-0.5 rounded-full bg-oura-soft uppercase tracking-wider">
                    {workout.type || 'Workout'}
                </span>
            }
            footer={
                <Button variant="secondary" fullWidth onClick={onClose}>
                    {t('common.close')}
                </Button>
            }>
            {/* Stats Row */}
            <div className="flex divide-x divide-border border border-border rounded-control overflow-hidden mb-5">
                <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-text-tertiary mb-1">
                        <Clock size={16} />
                    </div>
                    <span className="text-lg font-bold text-text-primary tabular-nums">
                        {workout.duration || 0}
                    </span>
                    <span className="text-[10px] text-text-tertiary uppercase font-black tracking-wider">
                        {t('common.min')}
                    </span>
                </div>
                <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-fat mb-1">
                        <Flame size={16} />
                    </div>
                    <span className="text-lg font-bold text-text-primary tabular-nums">
                        {workout.calories || 0}
                    </span>
                    <span className="text-[10px] text-text-tertiary uppercase font-black tracking-wider">
                        Kcal
                    </span>
                </div>
                <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-primary mb-1">
                        <Calendar size={16} />
                    </div>
                    <span className="text-sm font-bold text-text-primary">
                        {new Date(activity.createdAt).toLocaleDateString(
                            undefined,
                            {
                                month: 'short',
                                day: 'numeric',
                            },
                        )}
                    </span>
                    <span className="text-[10px] text-text-tertiary uppercase font-black tracking-wider">
                        {t('common.date')}
                    </span>
                </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-6">
                {exercises.length > 0 ? (
                    exercises.map((exercise, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center mt-1">
                                <div className="w-6 h-6 rounded-full bg-surface-lighter flex items-center justify-center text-xs font-bold text-text-tertiary">
                                    {index + 1}
                                </div>
                                {index < exercises.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-surface-lighter my-1" />
                                )}
                            </div>
                            <div className="flex-1 pb-2">
                                <h3 className="font-bold text-text-primary text-lg mb-1">
                                    {exercise.name}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-text-secondary">
                                    <div className="bg-background px-3 py-1.5 rounded-control border border-border">
                                        <span className="font-bold text-text-primary mr-1.5">
                                            {exercise.sets}
                                        </span>
                                        <span className="text-text-tertiary text-xs uppercase">
                                            {t('workouts.sets')}
                                        </span>
                                    </div>
                                    <span className="text-text-tertiary">×</span>
                                    <div className="bg-background px-3 py-1.5 rounded-control border border-border">
                                        <span className="font-bold text-text-primary mr-1.5">
                                            {exercise.reps}
                                        </span>
                                        <span className="text-text-tertiary text-xs uppercase">
                                            {t('workouts.reps')}
                                        </span>
                                    </div>
                                    {exercise.weight && (
                                        <>
                                            <span className="text-text-tertiary">
                                                @
                                            </span>
                                            <div className="bg-background px-3 py-1.5 rounded-control border border-border">
                                                <span className="font-bold text-text-primary mr-1.5">
                                                    {exercise.weight}
                                                </span>
                                                <span className="text-text-tertiary text-xs uppercase">
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
                    <div className="text-center py-12 text-text-tertiary">
                        <p>{t('workouts.noExercises')}</p>
                    </div>
                )}
            </div>
        </ModalShell>
    );
};
