import { useEffect, useState } from 'react';
import { FoodEntry, WeightEntry, Workout } from '../types/domain';
import { useSupabase } from './useSupabase';

type SupabaseClient = ReturnType<typeof useSupabase>;

interface DeleteModalState {
    show: boolean;
    type: string;
    id: string | number | null;
    name: string;
}

interface UndoAction {
    type: 'food' | 'workout' | 'weight';
    item: any;
    restore: () => Promise<void>;
}

interface NutritionActions {
    foodLog: FoodEntry[];
    saveFoodLog: (log: FoodEntry[]) => Promise<void>;
}

interface WorkoutActions {
    workoutLog: Workout[];
    saveWorkoutLog: (log: Workout[]) => Promise<void>;
}

interface BiometricsActions {
    weightHistory: WeightEntry[];
    saveWeightHistory: (history: WeightEntry[]) => Promise<void>;
}

export const useGlobalDelete = (
    nutrition: NutritionActions,
    workouts: WorkoutActions,
    biometrics: BiometricsActions,
    supabase: SupabaseClient,
    useCloud: boolean,
) => {
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
        show: false,
        type: '',
        id: null,
        name: '',
    });
    const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

    const confirmDelete = (type: string, id: string | number, name: string) => {
        setDeleteModal({ show: true, type, id, name });
    };

    const executeDelete = async () => {
        const { type, id } = deleteModal;
        if (id === null) return;

        try {
            if (type === 'food') {
                const item = nutrition.foodLog.find((f: FoodEntry) => f.id === id);
                const newLog = nutrition.foodLog.filter(
                    (f: FoodEntry) => f.id !== id,
                );
                await nutrition.saveFoodLog(newLog);

                if (useCloud) {
                    try {
                        await supabase.deleteFood(id as string);
                    } catch (err) {
                        console.error(err);
                    }
                }

                if (item) {
                    setUndoAction({
                        type: 'food',
                        item,
                        restore: async () => {
                            await nutrition.saveFoodLog([...newLog, item]);
                            if (useCloud) await supabase.saveFood(item);
                        },
                    });
                }
            } else if (type === 'workout') {
                const item = workouts.workoutLog.find((w: Workout) => w.id === id);
                const newLog = workouts.workoutLog.filter(
                    (w: Workout) => w.id !== id,
                );
                await workouts.saveWorkoutLog(newLog);

                if (useCloud) {
                    try {
                        await supabase.deleteWorkout(id as string);
                    } catch (err) {
                        console.error(err);
                    }
                }

                if (item) {
                    setUndoAction({
                        type: 'workout',
                        item,
                        restore: async () => {
                            await workouts.saveWorkoutLog([...newLog, item]);
                            if (useCloud) await supabase.saveWorkout(item);
                        },
                    });
                }
            } else if (type === 'weight') {
                const item = biometrics.weightHistory.find(
                    (w: WeightEntry) =>
                        w.id === id || biometrics.weightHistory.indexOf(w) === id,
                );
                const newHistory = biometrics.weightHistory.filter(
                    (w: WeightEntry) =>
                        w.id !== id && biometrics.weightHistory.indexOf(w) !== id,
                );
                await biometrics.saveWeightHistory(newHistory);

                if (useCloud && item) {
                    try {
                        await supabase.deleteWeight(item.id);
                    } catch (err) {
                        console.error(err);
                    }
                }

                if (item) {
                    setUndoAction({
                        type: 'weight',
                        item,
                        restore: async () => {
                            await biometrics.saveWeightHistory([
                                ...newHistory,
                                item,
                            ]);
                            if (useCloud) await supabase.saveWeight(item);
                        },
                    });
                }
            }
        } catch (e) {
            console.error('Delete execution failed:', e);
        } finally {
            // ALWAYS close the modal
            setDeleteModal({ show: false, type: '', id: null, name: '' });
        }
    };

    // Auto-hide undo
    useEffect(() => {
        if (!undoAction) return;
        const timer = setTimeout(() => setUndoAction(null), 5000);
        return () => clearTimeout(timer);
    }, [undoAction]);

    return {
        deleteModal,
        setDeleteModal,
        undoAction,
        setUndoAction,
        confirmDelete,
        executeDelete,
    };
};
