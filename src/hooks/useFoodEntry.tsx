import { useState } from 'react';
import { FoodEntry } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';

interface FoodEntryParams {
    foodLog: FoodEntry[];
    saveFoodLog: (log: FoodEntry[]) => void;
    saveFoodEntry: (entry: FoodEntry) => Promise<FoodEntry | null>;
    setSaveStatus: (status: string) => void;
}

export interface FoodFormState {
    date: string;
    time: string;
    meal: FoodEntry['meal'];
    name: string;
    description: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
}

export interface UseFoodEntryReturn {
    showFoodForm: boolean;
    setShowFoodForm: (show: boolean) => void;
    editingFoodId: string | null;
    setEditingFoodId: (id: string | null) => void;
    newFood: FoodFormState;
    setNewFood: (
        food: FoodFormState | ((prev: FoodFormState) => FoodFormState),
    ) => void;
    addManualFood: () => Promise<void>;
    resetFoodForm: () => void;
}

export const useFoodEntry = ({
    foodLog,
    saveFoodLog,
    saveFoodEntry,
    setSaveStatus,
}: FoodEntryParams): UseFoodEntryReturn => {
    const [showFoodForm, setShowFoodForm] = useState(false);
    const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
    const [newFood, setNewFood] = useState<FoodFormState>({
        date: getArgentinaDateString(),
        time: '12:00',
        meal: 'lunch',
        name: '',
        description: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
    });

    const resetFoodForm = () => {
        setNewFood({
            date: getArgentinaDateString(),
            time: '12:00',
            meal: 'lunch',
            name: '',
            description: '',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            fiber: '',
        });
    };

    const addManualFood = async () => {
        // Validate required fields
        if (!newFood.name?.trim()) {
            setSaveStatus('⚠️ Falta el nombre');
            setTimeout(() => setSaveStatus(''), 2000);
            return;
        }
        if (!newFood.calories || parseInt(newFood.calories) <= 0) {
            setSaveStatus('⚠️ Faltan calorías');
            setTimeout(() => setSaveStatus(''), 2000);
            return;
        }

        const isEditing = !!editingFoodId;

        try {
            // Find existing entry if editing to preserve data lineage
            const existingEntry = isEditing
                ? foodLog.find((f) => f.id === editingFoodId)
                : null;

            const entry: FoodEntry = {
                id: isEditing ? (editingFoodId as string) : crypto.randomUUID(),
                date: newFood.date || getArgentinaDateString(),
                time: newFood.time || '',
                meal: newFood.meal || 'snack',
                name: newFood.name.trim(),
                description: newFood.description?.trim() || '',
                calories: parseInt(newFood.calories) || 0,
                protein: parseInt(newFood.protein) || 0,
                carbs: parseInt(newFood.carbs) || 0,
                fat: parseInt(newFood.fat) || 0,
                fiber: parseInt(newFood.fiber) || 0,
                source: existingEntry?.source || 'manual',
                reviewed: true,
                confidence: 1,
                sourceId:
                    existingEntry?.sourceId ||
                    `manual-${newFood.date}-${Date.now()}`,
            };

            // Close form immediately for better UX
            setShowFoodForm(false);
            setEditingFoodId(null);

            // Save to Supabase (this also handles optimistic update and ID sync)
            try {
                await saveFoodEntry(entry);
                setSaveStatus(
                    isEditing ? '✓ Comida actualizada' : '✓ Comida agregada',
                );
            } catch (saveErr) {
                console.error('Error saving to Supabase:', saveErr);
                setSaveStatus('❌ Error al guardar');
            }

            setTimeout(() => setSaveStatus(''), 2000);

            // Reset form
            resetFoodForm();
        } catch (err) {
            console.error('Error adding food:', err);
            setSaveStatus('❌ Error al guardar');
            setTimeout(() => setSaveStatus(''), 3000);
        }
    };

    return {
        showFoodForm,
        setShowFoodForm,
        editingFoodId,
        setEditingFoodId,
        newFood,
        setNewFood,
        addManualFood,
        resetFoodForm,
    };
};
