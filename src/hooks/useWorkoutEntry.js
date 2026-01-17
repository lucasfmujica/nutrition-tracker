import { useState } from 'react';
import { getArgentinaDateString } from '../utils/dateUtils';

export const useWorkoutEntry = ({ workoutLog, saveWorkoutLog, saveWorkoutEntry }) => {
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    date: getArgentinaDateString(),
    type: 'gym',
    name: '',
    duration: '',
    calories: '',
    volume: '',
    notes: ''
  });

  const addManualWorkout = async () => {
    if (!newWorkout.name) return;
    const sourceId = `manual-${newWorkout.date}-${Date.now()}`;
    const entry = {
      id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: newWorkout.date,
      type: newWorkout.type,
      name: newWorkout.name,
      duration: parseInt(newWorkout.duration) || 0,
      calories: parseInt(newWorkout.calories) || 0,
      volume: parseInt(newWorkout.volume) || 0,
      exercises: [],
      notes: newWorkout.notes || '',
      // IA schema
      source: 'manual',
      reviewed: true,
      confidence: 1,
      sourceId
    };

    // Save to Supabase first to get the real ID
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

    saveWorkoutLog([...workoutLog, finalEntry]);
    setNewWorkout({
      date: getArgentinaDateString(),
      type: 'gym',
      name: '',
      duration: '',
      calories: '',
      volume: '',
      notes: ''
    });
    setShowWorkoutForm(false);
  };

  return {
    showWorkoutForm,
    setShowWorkoutForm,
    newWorkout,
    setNewWorkout,
    addManualWorkout
  };
};
