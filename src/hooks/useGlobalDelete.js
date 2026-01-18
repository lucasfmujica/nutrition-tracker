import { useEffect, useState } from 'react';

export const useGlobalDelete = (nutrition, workouts, biometrics, supabase, useCloud) => {
  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', id: null, name: '' });
  const [undoAction, setUndoAction] = useState(null);

  const confirmDelete = (type, id, name) => {
    setDeleteModal({ show: true, type, id, name });
  };

  const executeDelete = async () => {
    const { type, id } = deleteModal;

    try {
      if (type === 'food') {
        const item = nutrition.foodLog.find(f => f.id === id);
        const newLog = nutrition.foodLog.filter(f => f.id !== id);
        nutrition.saveFoodLog(newLog);

        if (useCloud) {
          try {
            await supabase.deleteFood(id);
          } catch (err) { console.error(err); }
        }

        setUndoAction({
          type: 'food',
          item,
          restore: async () => {
            nutrition.saveFoodLog([...newLog, item]);
            if (useCloud && item) await supabase.saveFood(item);
          }
        });
      } else if (type === 'workout') {
        const item = workouts.workoutLog.find(w => w.id === id);
        const newLog = workouts.workoutLog.filter(w => w.id !== id);
        workouts.saveWorkoutLog(newLog);

        if (useCloud) {
          try {
            await supabase.deleteWorkout(id);
          } catch (err) { console.error(err); }
        }

        setUndoAction({
          type: 'workout',
          item,
          restore: async () => {
            workouts.saveWorkoutLog([...newLog, item]);
            if (useCloud && item) await supabase.saveWorkout(item);
          }
        });
      } else if (type === 'weight') {
        const item = biometrics.weightHistory.find(w => w.id === id || biometrics.weightHistory.indexOf(w) === id);
        const newHistory = biometrics.weightHistory.filter(w => w.id !== id && biometrics.weightHistory.indexOf(w) !== id);
        biometrics.saveWeightHistory(newHistory);

        if (useCloud && item) {
          try {
            await supabase.deleteWeight(item.id);
          } catch (err) { console.error(err); }
        }

        setUndoAction({
          type: 'weight',
          item,
          restore: async () => {
            biometrics.saveWeightHistory([...newHistory, item]);
            if (useCloud && item) await supabase.saveWeight(item);
          }
        });
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
    executeDelete
  };
};
