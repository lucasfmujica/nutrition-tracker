import { useState } from 'react';
import { getArgentinaDateString } from '../utils/dateUtils';

export const useFoodEntry = ({ foodLog, saveFoodLog, saveFoodEntry, setSaveStatus }) => {
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [newFood, setNewFood] = useState({
    date: getArgentinaDateString(),
    time: '12:00',
    meal: 'Almuerzo',
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: ''
  });

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
      const sourceId = `manual-${newFood.date}-${Date.now()}`;
      const entry = {
        id: isEditing ? editingFoodId : `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: newFood.date || getArgentinaDateString(),
        time: newFood.time || '',
        meal: newFood.meal || 'Snack',
        name: newFood.name.trim(),
        description: newFood.description?.trim() || '',
        calories: parseInt(newFood.calories) || 0,
        protein: parseInt(newFood.protein) || 0,
        carbs: parseInt(newFood.carbs) || 0,
        fat: parseInt(newFood.fat) || 0,
        fiber: parseInt(newFood.fiber) || 0,
        source: 'manual',
        reviewed: true,
        confidence: 1,
        sourceId
      };

      // Close form immediately for better UX
      setShowFoodForm(false);
      setEditingFoodId(null);

      // Save to Supabase
      let finalEntry = entry;
      try {
        const savedEntry = await saveFoodEntry(entry);
        if (savedEntry?.id) {
          finalEntry = savedEntry;
        }
      } catch (saveErr) {
        console.error('Error saving to Supabase:', saveErr);
        // Continue with local entry
      }

      // Update or add to local state
      if (isEditing) {
        saveFoodLog(foodLog.map(f => f.id === editingFoodId ? finalEntry : f));
        setSaveStatus('✓ Comida actualizada');
      } else {
        saveFoodLog([...foodLog, finalEntry]);
        setSaveStatus('✓ Comida agregada');
      }
      setTimeout(() => setSaveStatus(''), 2000);

      // Reset form
      setNewFood({
        date: getArgentinaDateString(),
        time: '12:00',
        meal: 'Almuerzo',
        name: '',
        description: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        fiber: ''
      });
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
    addManualFood
  };
};
