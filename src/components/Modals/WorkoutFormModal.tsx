import React from 'react';
import { useTranslation } from 'react-i18next';
import { Workout } from '../../types/domain';
import { Button } from '../UI/Button';
import { Input, Select } from '../UI/FormField';
import { ModalShell } from '../UI/ModalShell';
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

    const isGymWorkout = workout.type === 'gym';
    const headerText =
        mode === 'edit'
            ? `✏️ ${t('modals.workouts.editTitle')}`
            : `🏋️ ${t('modals.workouts.newTitle')}`;

    const handleExercisesChange = (exercises: any[]) => {
        onWorkoutChange({ ...workout, exercises });
    };

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            title={headerText}
            footer={
                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={onClose}>
                        {t('modals.workouts.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={onSubmit}
                        disabled={!workout.name}>
                        {mode === 'edit'
                            ? t('modals.workouts.update')
                            : t('modals.workouts.save')}
                    </Button>
                </div>
            }>
            <div className="space-y-4">
                {/* Row 1: Date */}
                <Input
                    id="workout-date"
                    type="date"
                    label={t('modals.workouts.date')}
                    value={workout.date || ''}
                    onChange={(e) =>
                        onWorkoutChange({ ...workout, date: e.target.value })
                    }
                />

                {/* Row 2: Type */}
                <Select
                    id="workout-type"
                    label={t('modals.workouts.type')}
                    value={workout.type || 'gym'}
                    onChange={(e) =>
                        onWorkoutChange({
                            ...workout,
                            type: e.target.value as Workout['type'],
                        })
                    }>
                    <option value="gym">Gym</option>
                    <option value="tennis">Tenis</option>
                    <option value="cardio">Cardio</option>
                    <option value="other">Otro</option>
                </Select>

                {/* Row 3: Name */}
                <Input
                    id="workout-name"
                    type="text"
                    label={`${t('modals.workouts.name')} *`}
                    value={workout.name || ''}
                    onChange={(e) =>
                        onWorkoutChange({ ...workout, name: e.target.value })
                    }
                    placeholder={t('modals.workouts.namePlaceholder')}
                />

                {/* Row 4: Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Input
                        id="workout-duration"
                        type="number"
                        label="Min"
                        value={workout.duration || ''}
                        onChange={(e) =>
                            onWorkoutChange({
                                ...workout,
                                duration: parseInt(e.target.value) || 0,
                            })
                        }
                        placeholder="60"
                        className="text-center font-bold px-2"
                    />
                    <Input
                        id="workout-calories"
                        type="number"
                        label="Kcal"
                        value={workout.calories || ''}
                        onChange={(e) =>
                            onWorkoutChange({
                                ...workout,
                                calories: parseInt(e.target.value) || 0,
                            })
                        }
                        placeholder="300"
                        className="text-center font-bold px-2"
                    />
                    <Input
                        id="workout-volume"
                        type="number"
                        label="Vol (kg)"
                        value={workout.volume || ''}
                        onChange={(e) =>
                            onWorkoutChange({
                                ...workout,
                                volume: parseInt(e.target.value) || 0,
                            })
                        }
                        placeholder="2500"
                        className="text-center font-bold px-2"
                    />
                </div>

                {/* Row 5: Notes */}
                <Input
                    id="workout-notes"
                    type="text"
                    label={t('modals.workouts.notes')}
                    value={workout.notes || ''}
                    onChange={(e) =>
                        onWorkoutChange({
                            ...workout,
                            notes: e.target.value,
                        })
                    }
                    placeholder={t('modals.workouts.notesPlaceholder')}
                />

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
        </ModalShell>
    );
};
