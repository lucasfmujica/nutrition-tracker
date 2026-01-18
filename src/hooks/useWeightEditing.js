import { useState } from 'react';

/**
 * useWeightEditing - Manages weight entry editing state and logic
 *
 * Encapsulates all weight editing functionality including state management
 * and CRUD operations for weight entries.
 *
 * @param {Object} biometrics - Biometrics hook containing weight history and save methods
 * @returns {Object} Weight editing state and handlers
 */
export const useWeightEditing = (biometrics) => {
  const [editingWeightId, setEditingWeightId] = useState(null);
  const [editingWeightValue, setEditingWeightValue] = useState('');

  const startEditWeight = (id) => {
    const entry = biometrics.weightHistory.find(w => w.id === id);
    if (entry) {
      setEditingWeightId(id);
      setEditingWeightValue(entry.weight);
    }
  };

  const cancelEditWeight = () => {
    setEditingWeightId(null);
    setEditingWeightValue('');
  };

  const saveEditWeight = async () => {
    if (!editingWeightId) return;
    const entry = biometrics.weightHistory.find(w => w.id === editingWeightId);
    if (entry) {
      const updatedEntry = { ...entry, weight: parseFloat(editingWeightValue) };

      // 1. Update local storage and profile
      const newHistory = biometrics.weightHistory.map(w =>
        w.id === editingWeightId ? updatedEntry : w
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
    saveEditWeight
  };
};
