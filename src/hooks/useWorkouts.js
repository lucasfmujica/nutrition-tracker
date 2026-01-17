import { useCallback, useState } from 'react';
import { storage } from '../utils/storage';

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
        return result.data;
      } catch (err) {
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
