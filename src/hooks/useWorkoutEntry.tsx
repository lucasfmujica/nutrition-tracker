import { useState } from 'react';
import { Exercise, Workout } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';

interface UseWorkoutEntryParams {
    workoutLog: Workout[];
    saveWorkoutLog: (log: Workout[]) => void;
    saveWorkoutEntry: (entry: Workout) => Promise<Workout | null>;
}

export const useWorkoutEntry = ({
    workoutLog,
    saveWorkoutLog,
    saveWorkoutEntry,
}: UseWorkoutEntryParams) => {
    const [showWorkoutForm, setShowWorkoutForm] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null); // For edit mode
    const [newWorkout, setNewWorkout] = useState({
        date: getArgentinaDateString(),
        type: 'gym' as Workout['type'],
        name: '',
        duration: '',
        calories: '',
        volume: '',
        exercises: [] as Exercise[],
        notes: '',
    });

    const handleEditWorkout = (workout: Workout) => {
        setEditingWorkout(workout);
        setNewWorkout({
            date: workout.date,
            type: workout.type,
            name: workout.name,
            duration: workout.duration.toString(),
            calories: workout.calories.toString(),
            volume: workout.volume ? workout.volume.toString() : '',
            exercises: workout.exercises || [],
            notes: workout.notes || '',
        });
        setShowWorkoutForm(true);
    };

    const saveWorkout = async () => {
        if (!newWorkout.name) return;

        const entry: Workout = {
            id:
                editingWorkout?.id ||
                `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: newWorkout.date,
            type: newWorkout.type,
            name: newWorkout.name,
            duration: parseInt(newWorkout.duration) || 0,
            calories: parseInt(newWorkout.calories) || 0,
            volume: parseInt(newWorkout.volume) || 0,
            exercises: newWorkout.exercises || [],
            notes: newWorkout.notes || '',
        };

        // Save to Supabase (upsert)
        let finalEntry = entry;
        try {
            const savedEntry = await saveWorkoutEntry(entry);
            if (savedEntry?.id) {
                finalEntry = savedEntry;
            }
        } catch (saveErr) {
            console.error('Error saving workout to Supabase:', saveErr);
            // Continue with local entry
        }

        // Update local state
        if (editingWorkout) {
            // Update existing
            const updated = workoutLog.map((w) =>
                w.id === editingWorkout.id ? finalEntry : w,
            );
            saveWorkoutLog(updated);
        } else {
            // Add new
            saveWorkoutLog([...workoutLog, finalEntry]);
        }

        // Reset form
        setNewWorkout({
            date: getArgentinaDateString(),
            type: 'gym',
            name: '',
            duration: '',
            calories: '',
            volume: '',
            exercises: [],
            notes: '',
        });
        setEditingWorkout(null);
        setShowWorkoutForm(false);
    };

    // Legacy function name for backward compatibility
    const addManualWorkout = saveWorkout;

    return {
        showWorkoutForm,
        setShowWorkoutForm,
        newWorkout,
        setNewWorkout,
        addManualWorkout,
        saveWorkout,
        editingWorkout,
        handleEditWorkout,
    };
};
