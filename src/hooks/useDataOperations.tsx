import { useState } from 'react';
import { toast } from '../context/ToastContext';
import i18n from '../i18n/config';
import { FoodEntry, Workout } from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

interface DataOperationsParams {
    foodLog: FoodEntry[];
    saveFoodLog: (log: FoodEntry[]) => void;
    workoutLog: Workout[];
    saveWorkoutLog: (log: Workout[]) => void;
    saveFoodEntry: (entry: FoodEntry) => Promise<FoodEntry | null>;
    saveWorkoutEntry: (entry: Workout) => Promise<Workout | null>;
    supabase: any;
    useCloud: boolean;
    showImportFoodModal: boolean;
    setShowImportFoodModal: (show: boolean) => void;
    showImportWorkoutModal: boolean;
    setShowImportWorkoutModal: (show: boolean) => void;
    dashboardDate: string;
}

export interface DataOperations {
    upsertFood: (entry: Partial<FoodEntry>) => Promise<void>;
    upsertWorkout: (entry: Partial<Workout>) => Promise<void>;
    confirmFood: (id: string) => void;
    confirmWorkout: (id: string) => void;
    copyMealsFromYesterday: () => void;
    handleImportFood: (text: string) => void;
    handleImportWorkout: (text: string) => void;
    importText: string;
    setImportText: (text: string) => void;
    importError: string;
    setImportError: (error: string) => void;
}

export const useDataOperations = ({
    foodLog,
    saveFoodLog,
    workoutLog,
    saveWorkoutLog,
    saveFoodEntry,
    saveWorkoutEntry,
    useCloud,
    setShowImportFoodModal,
    setShowImportWorkoutModal,
    dashboardDate,
}: DataOperationsParams): DataOperations => {
    // Local state for import logic
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState('');

    // Add or update food entry (for AI imports with deduplication)
    const upsertFood = async (entry: Partial<FoodEntry>) => {
        const finalEntry = {
            ...entry,
            id: entry.id || `f-${Date.now()}`,
        } as FoodEntry;

        if (!entry.sourceId) {
            // No sourceId, just add
            saveFoodLog([...foodLog, finalEntry]);
            // Sync to Supabase
            if (useCloud) {
                try {
                    await saveFoodEntry(finalEntry);
                    console.log('[Sync] Food synced to Supabase:', finalEntry.id);
                } catch (err) {
                    console.error('[Sync] Failed to sync food:', err);
                    toast.info(i18n.t('toast.queuedOffline'));
                }
            }
            return;
        }

        // Check for existing entry with same sourceId
        const existingIndex = foodLog.findIndex(
            (f) => f.sourceId === entry.sourceId,
        );
        if (existingIndex >= 0) {
            // Update existing
            const newLog = [...foodLog];
            newLog[existingIndex] = {
                ...newLog[existingIndex],
                ...entry,
            } as FoodEntry;
            saveFoodLog(newLog);
            // Sync update to Supabase
            if (useCloud) {
                try {
                    await saveFoodEntry(newLog[existingIndex]);
                } catch (err) {
                    console.error('[Sync] Failed to sync food update:', err);
                    toast.info(i18n.t('toast.queuedOffline'));
                }
            }
        } else {
            // Add new
            saveFoodLog([...foodLog, finalEntry]);
            // Sync new entry to Supabase
            if (useCloud) {
                try {
                    await saveFoodEntry(finalEntry);
                    console.log('[Sync] Food synced to Supabase:', finalEntry.id);
                } catch (err) {
                    console.error('[Sync] Failed to sync food:', err);
                    toast.info(i18n.t('toast.queuedOffline'));
                }
            }
        }
    };

    // Add or update workout entry (for AI imports with deduplication)
    const upsertWorkout = async (entry: Partial<Workout>) => {
        const finalEntry = {
            ...entry,
            id: entry.id || `w-${Date.now()}`,
        } as Workout;

        if (!entry.sourceId) {
            saveWorkoutLog([...workoutLog, finalEntry]);
            // Sync to Supabase
            if (useCloud) {
                try {
                    await saveWorkoutEntry(finalEntry);
                    console.log('[Sync] Workout synced to Supabase:', finalEntry.id);
                } catch (err) {
                    console.error('[Sync] Failed to sync workout:', err);
                    toast.info(i18n.t('toast.queuedOffline'));
                }
            }
            return;
        }

        const existingIndex = workoutLog.findIndex(
            (w) => w.sourceId === entry.sourceId,
        );
        if (existingIndex >= 0) {
            const newLog = [...workoutLog];
            newLog[existingIndex] = {
                ...newLog[existingIndex],
                ...entry,
            } as Workout;
            saveWorkoutLog(newLog);
            // Sync update to Supabase
            if (useCloud) {
                try {
                    await saveWorkoutEntry(newLog[existingIndex]);
                } catch (err) {
                    console.error('[Sync] Failed to sync workout update:', err);
                    toast.info(i18n.t('toast.queuedOffline'));
                }
            }
        } else {
            saveWorkoutLog([...workoutLog, finalEntry]);
            // Sync new entry to Supabase
            if (useCloud) {
                try {
                    await saveWorkoutEntry(finalEntry);
                    console.log('[Sync] Workout synced to Supabase:', finalEntry.id);
                } catch (err) {
                    console.error('[Sync] Failed to sync workout:', err);
                    toast.info(i18n.t('toast.queuedOffline'));
                }
            }
        }
    };

    // Confirm/review an entry
    const confirmFood = (id: string) => {
        const updated = foodLog.find((f) => f.id === id);
        const newLog = foodLog.map((f) =>
            f.id === id ? { ...f, reviewed: true } : f,
        );
        saveFoodLog(newLog);
        // Persist the reviewed flag to Supabase (was only updated locally before)
        if (updated) {
            saveFoodEntry({ ...updated, reviewed: true }).catch((err) => {
                console.error('[Sync] Failed to persist confirmFood:', err);
                toast.info(i18n.t('toast.queuedOffline'));
            });
        }
    };

    const confirmWorkout = (id: string) => {
        const updated = workoutLog.find((w) => w.id === id);
        const newLog = workoutLog.map((w) =>
            w.id === id ? { ...w, reviewed: true } : w,
        );
        saveWorkoutLog(newLog);
        // Persist the reviewed flag to Supabase (was only updated locally before)
        if (updated) {
            saveWorkoutEntry({ ...updated, reviewed: true }).catch((err) => {
                console.error('[Sync] Failed to persist confirmWorkout:', err);
                toast.info(i18n.t('toast.queuedOffline'));
            });
        }
    };

    // Copy meals from yesterday
    const copyMealsFromYesterday = () => {
        // Helper to calculate yesterday from a date string (YYYY-MM-DD)
        const yesterday = addDaysToDate(dashboardDate, -1);
        const yesterdayMeals = foodLog.filter((f) => f.date === yesterday);
        if (yesterdayMeals.length === 0) {
            alert('No hay comidas de ayer para copiar');
            return;
        }
        const newMeals = yesterdayMeals.map((meal) => ({
            ...meal,
            id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: dashboardDate,
        }));
        saveFoodLog([...foodLog, ...newMeals]);
    };

    // Import food from JSON text
    const handleImportFood = (text: string) => {
        try {
            const data = JSON.parse(text);
            const entries = Array.isArray(data) ? data : [data];

            entries.forEach((entry) => {
                const foodEntry: FoodEntry = {
                    id:
                        entry.id ||
                        `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    date: entry.date || getArgentinaDateString(),
                    time: entry.time || '',
                    meal: entry.meal || 'lunch',
                    name: entry.name || 'Comida importada',
                    description: entry.description || '',
                    calories: parseInt(entry.calories) || 0,
                    protein: parseInt(entry.protein) || 0,
                    carbs: parseInt(entry.carbs) || 0,
                    fat: parseInt(entry.fat) || 0,
                    fiber: parseInt(entry.fiber) || 0,
                    source: entry.source || 'ai-text',
                    reviewed: false,
                    confidence: entry.confidence || 0.8,
                    sourceId: entry.sourceId || `import-${Date.now()}`,
                };
                upsertFood(foodEntry);
            });

            setShowImportFoodModal(false);
        } catch (e) {
            console.error('Import error:', e);
            setImportError('Error al procesar el JSON de comidas');
        }
    };

    // Import workout from JSON text
    const handleImportWorkout = (text: string) => {
        try {
            const data = JSON.parse(text);
            const entries = Array.isArray(data) ? data : [data];

            entries.forEach((entry) => {
                const workoutEntry: Workout = {
                    id:
                        entry.id ||
                        `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    date: entry.date || getArgentinaDateString(),
                    type: entry.type || 'gym',
                    name: entry.name || 'Entreno importado',
                    duration: parseInt(entry.duration) || 0,
                    calories: parseInt(entry.calories) || 0,
                    volume: parseInt(entry.volume) || 0,
                    exercises: entry.exercises || [],
                    notes: entry.notes || '',
                    source: entry.source || 'ai-text',
                    reviewed: false,
                    confidence: entry.confidence || 0.8,
                    sourceId: entry.sourceId || `import-${Date.now()}`,
                } as Workout;
                upsertWorkout(workoutEntry);
            });

            setShowImportWorkoutModal(false);
        } catch (e) {
            console.error('Import error:', e);
            setImportError('Error al procesar el JSON de entrenamientos');
        }
    };

    return {
        upsertFood,
        upsertWorkout,
        confirmFood,
        confirmWorkout,
        copyMealsFromYesterday,
        handleImportFood,
        handleImportWorkout,
        importText,
        setImportText,
        importError,
        setImportError,
    };
};
