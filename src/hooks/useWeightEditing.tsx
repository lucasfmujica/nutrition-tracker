import { useState } from 'react';
import { Profile, WeightEntry } from '../types/domain';
import { convertWeightForDisplay, parseWeightToKg } from '../utils/unitUtils';

interface BiometricsActions {
    profile: Profile;
    weightHistory: WeightEntry[];
    saveWeightHistory: (history: WeightEntry[]) => Promise<void>;
    saveWeightEntry: (entry: WeightEntry) => Promise<any>;
}

/**
 * useWeightEditing - Manages weight entry editing state and logic
 *
 * Encapsulates all weight editing functionality including state management
 * and CRUD operations for weight entries.
 *
 * @param {BiometricsActions} biometrics - Biometrics hook containing weight history and save methods
 * @returns {Object} Weight editing state and handlers
 */
export const useWeightEditing = (biometrics: BiometricsActions) => {
    const [editingWeightId, setEditingWeightId] = useState<string | null>(null);
    const [editingWeightValue, setEditingWeightValue] = useState<string>('');

    const startEditWeight = (id: string) => {
        const entry = biometrics.weightHistory.find((w) => w.id === id);
        if (entry) {
            setEditingWeightId(id);
            const unitSystem = biometrics.profile.unitSystem || 'metric';
            const displayWeight = convertWeightForDisplay(entry.weight, unitSystem);
            // setEditingWeightValue(entry.weight.toString());
            setEditingWeightValue(displayWeight.toFixed(1));
        }
    };

    const cancelEditWeight = () => {
        setEditingWeightId(null);
        setEditingWeightValue('');
    };

    const saveEditWeight = async () => {
        if (!editingWeightId) return;
        const entry = biometrics.weightHistory.find((w) => w.id === editingWeightId);
        if (entry) {
            const unitSystem = biometrics.profile.unitSystem || 'metric';
            const weightKg = parseWeightToKg(editingWeightValue, unitSystem);

            const updatedEntry: WeightEntry = {
                ...entry,
                // weight: parseFloat(editingWeightValue),
                weight: weightKg,
            };

            // 1. Update local storage and profile
            const newHistory = biometrics.weightHistory.map((w) =>
                w.id === editingWeightId ? updatedEntry : w,
            );
            await biometrics.saveWeightHistory(newHistory);

            // 2. Sync to cloud
            await biometrics.saveWeightEntry(updatedEntry);
        }
        setEditingWeightId(null);
        setEditingWeightValue('');
    };

    return {
        editingWeightId,
        setEditingWeightId,
        editingWeightValue,
        setEditingWeightValue,
        startEditWeight,
        cancelEditWeight,
        saveEditWeight,
    };
};
