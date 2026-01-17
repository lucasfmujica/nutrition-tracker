import { useCallback, useState } from 'react';
import { storage } from '../utils/storage';
import { addPendingWrite } from '../utils/storageUtils';

export const useWorkouts = (supabase, useCloud) => {
  const [workoutLog, setWorkoutLog] = useState([]);

  const saveWorkoutLog = async (newLog) => {
    setWorkoutLog(newLog);
    try {
      await storage.set('lucas-workout-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving workout log:', err);
    }
  };

  const saveWorkoutEntry = async (entry) => {
    if (useCloud) {
      try {
        const result = await supabase.saveWorkout(entry);

        if (result?.error) {
          console.error('[Workouts] saveWorkoutEntry failed:', {
            function: 'saveWorkoutEntry',
            date: entry.date,
            name: entry.name,
            type: entry.type,
            error: result.error.message
          });
          throw new Error(result.error.message);
        }

        console.log('[Workouts] saveWorkoutEntry successful:', entry.date, entry.name);
        return result.data;
      } catch (err) {
        console.error('[Workouts] saveWorkoutEntry FAILED:', {
          function: 'saveWorkoutEntry',
          date: entry.date,
          name: entry.name,
          type: entry.type,
          error: err.message,
          stack: err.stack
        });

        // Add to The Vault for offline resilience
        await addPendingWrite('workouts', entry, supabase?.user?.id);

        // Return original entry for optimistic UI
        return entry;
      }
    }
    return entry;
  };

  const deleteWorkoutEntry = async (id) => {
    if (useCloud) await supabase.deleteWorkout(id);
  };

  const isTrainingDay = useCallback((date) => {
    return workoutLog.some(w => w.date === date);
  }, [workoutLog]);

  return {
    workoutLog,
    setWorkoutLog,
    saveWorkoutLog,
    saveWorkoutEntry,
    deleteWorkoutEntry,
    isTrainingDay
  };
};
