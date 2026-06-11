import React from 'react';
import { useTranslation } from 'react-i18next';
import { useModalA11y } from '../../hooks/useModalA11y';
import { Workout } from '../../types/domain';
import { ExerciseForm } from '../Workouts/ExerciseForm';

interface WorkoutFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    workout: Partial<Workout>;
    onWorkoutChange: (workout: Partial<Workout>) => void;
    onSubmit: () => void;
    mode?: 'add' | 'edit';
}

/**
 * WorkoutFormModal - Manual workout entry form
 * Modal for adding workout entries with exercise tracking
 */
export const WorkoutFormModal: React.FC<WorkoutFormModalProps> = ({
    isOpen,
    onClose,
    workout,
    onWorkoutChange,
    onSubmit,
    mode = 'add',
}) => {
    const { t } = useTranslation();
    const modalRef = useModalA11y(isOpen, onClose);
    if (!isOpen) return null;

    const isGymWorkout = workout.type === 'gym';
    const headerText =
        mode === 'edit'
            ? `✏️ ${t('modals.workouts.editTitle')}`
            : `🏋️ ${t('modals.workouts.newTitle')}`;

    const handleExercisesChange = (exercises: any[]) => {
        onWorkoutChange({ ...workout, exercises });
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={onClose}>
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="workout-form-modal-title"
                tabIndex={-1}
                className="bg-surface rounded-3xl p-6 lg:p-8 w-full max-w-sm lg:max-w-md border border-border shadow-2xl max-h-[90vh] overflow-y-auto outline-none"
                onClick={(e) => e.stopPropagation()}>
                {/* Header with close button */}
                <div className="flex items-center justify-between mb-6">
                    <h3
                        id="workout-form-modal-title"
                        className="text-xl lg:text-2xl font-bold text-text-primary">
                        {headerText}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label={t('common.close')}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-background hover:bg-surface-lighter text-text-tertiary hover:text-text-secondary transition-colors">
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Row 1: Date */}
                    <div>
                        <label htmlFor="workout-date" className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                            {t('modals.workouts.date')}
                        </label>
                        <input
                            id="workout-date"
                            type="date"
                            value={workout.date || ''}
                            onChange={(e) =>
                                onWorkoutChange({ ...workout, date: e.target.value })
                            }
                            className="block w-full min-w-0 max-w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary text-sm lg:text-base focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all appearance-none"
                        />
                    </div>

                    {/* Row 2: Type */}
                    <div>
                        <label htmlFor="workout-type" className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                            {t('modals.workouts.type')}
                        </label>
                        <select
                            id="workout-type"
                            value={workout.type || 'gym'}
                            onChange={(e) =>
                                onWorkoutChange({
                                    ...workout,
                                    type: e.target.value as Workout['type'],
                                })
                            }
                            className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary text-sm lg:text-base focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer">
                            <option value="gym">Gym</option>
                            <option value="tennis">Tenis</option>
                            <option value="cardio">Cardio</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    {/* Row 3: Name */}
                    <div>
                        <label htmlFor="workout-name" className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                            {t('modals.workouts.name')} *
                        </label>
                        <input
                            id="workout-name"
                            type="text"
                            value={workout.name || ''}
                            onChange={(e) =>
                                onWorkoutChange({ ...workout, name: e.target.value })
                            }
                            placeholder={t('modals.workouts.namePlaceholder')}
                            className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary text-sm lg:text-base focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        />
                    </div>

                    {/* Row 4: Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label htmlFor="workout-duration" className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">
                                Min
                            </label>
                            <input
                            id="workout-duration"
                                type="number"
                                value={workout.duration || ''}
                                onChange={(e) =>
                                    onWorkoutChange({
                                        ...workout,
                                        duration: parseInt(e.target.value) || 0,
                                    })
                                }
                                placeholder="60"
                                className="w-full bg-background border border-border rounded-2xl px-2 py-3 text-text-primary text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="workout-calories" className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">
                                Kcal
                            </label>
                            <input
                            id="workout-calories"
                                type="number"
                                value={workout.calories || ''}
                                onChange={(e) =>
                                    onWorkoutChange({
                                        ...workout,
                                        calories: parseInt(e.target.value) || 0,
                                    })
                                }
                                placeholder="300"
                                className="w-full bg-background border border-border rounded-2xl px-2 py-3 text-text-primary text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="workout-volume" className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">
                                Vol (kg)
                            </label>
                            <input
                            id="workout-volume"
                                type="number"
                                value={workout.volume || ''}
                                onChange={(e) =>
                                    onWorkoutChange({
                                        ...workout,
                                        volume: parseInt(e.target.value) || 0,
                                    })
                                }
                                placeholder="2500"
                                className="w-full bg-background border border-border rounded-2xl px-2 py-3 text-text-primary text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Row 5: Notes */}
                    <div>
                        <label htmlFor="workout-notes" className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                            {t('modals.workouts.notes')}
                        </label>
                        <input
                            id="workout-notes"
                            type="text"
                            value={workout.notes || ''}
                            onChange={(e) =>
                                onWorkoutChange({
                                    ...workout,
                                    notes: e.target.value,
                                })
                            }
                            placeholder={t('modals.workouts.notesPlaceholder')}
                            className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary text-sm lg:text-base focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        />
                    </div>

                    {/* Row 6: Exercises (Gym only) */}
                    {isGymWorkout && (
                        <div className="pt-4 border-t border-border">
                            <ExerciseForm
                                exercises={workout.exercises || []}
                                onChange={handleExercisesChange}
                                disabled={false}
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-4 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-surface-lighter hover:bg-surface-lighter py-4 rounded-2xl text-text-secondary text-sm lg:text-base font-bold transition-all active:scale-95">
                        {t('modals.workouts.cancel')}
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!workout.name}
                        className="flex-1 bg-gradient-to-br from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 py-4 rounded-2xl text-white text-sm lg:text-base font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        {mode === 'edit'
                            ? t('modals.workouts.update')
                            : t('modals.workouts.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};
