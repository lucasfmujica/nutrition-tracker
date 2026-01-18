import { useCallback, useMemo, useState } from 'react';
import { getArgentinaDateString } from '../utils/dateUtils';
import { storage } from '../utils/storage';
import { addPendingWrite } from '../utils/storageUtils';

export const useNutrition = (
  supabase,
  useCloud,
  customTargets,
  isTrainingDay,
  safetyNetGetTargets = null, // Safety Net: Override targets function
  shouldTagAsSafetyNetDay = null // Safety Net: Day tagging function
) => {
  const [foodLog, setFoodLog] = useState([]);
  const [waterLog, setWaterLog] = useState([]);

  // Calculations
  // Optimization: Daily Data Indexing
  // Computes both totals and partitions items by date in a single pass (O(N))
  // Allows O(1) access for both getTotalsForDate and getFoodsForDate
  const indexedData = useMemo(() => {
    const index = {};

    foodLog.forEach(entry => {
      if (!index[entry.date]) {
        index[entry.date] = {
          totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
          items: []
        };
      }

      // Add items
      index[entry.date].items.push(entry);

      // Sum totals
      const t = index[entry.date].totals;
      t.calories += entry.calories || 0;
      t.protein += entry.protein || 0;
      t.carbs += entry.carbs || 0;
      t.fat += entry.fat || 0;
      t.fiber += entry.fiber || 0;
    });

    return index;
  }, [foodLog]);

  const getTotalsForDate = useCallback((date) => {
    return indexedData[date]?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }, [indexedData]);

  const getFoodsForDate = useCallback((date) => {
    return indexedData[date]?.items || [];
  }, [indexedData]);

  const getTargetsForDate = useCallback((date) => {
    // Priority 1: Check Safety Net mode (overrides everything)
    if (safetyNetGetTargets) {
      const safetyNetTargets = safetyNetGetTargets(date);
      // If safety net returned different targets, use them
      if (safetyNetTargets !== customTargets) {
        return safetyNetTargets;
      }
    }

    // Priority 2: Training day adjustments (normal flow)
    const training = isTrainingDay(date);
    if (training) {
      return {
        ...customTargets,
        calories: customTargets.calories + customTargets.trainingDayCaloriesBonus,
        carbs: customTargets.trainingDayCarbs
      };
    }

    // Priority 3: Base targets
    return customTargets;
  }, [customTargets, isTrainingDay, safetyNetGetTargets]);

  const isDayCompleted = useCallback((date) => {
    const totals = getTotalsForDate(date);
    const targets = getTargetsForDate(date);
    const calRange = 150;
    const calOk = totals.calories >= targets.calories - calRange && totals.calories <= targets.calories + calRange;
    const protOk = totals.protein >= targets.protein * 0.9;
    return calOk && protOk;
  }, [getTotalsForDate, getTargetsForDate]);

  // Actions
  const saveFoodLog = async (newLog) => {
    setFoodLog(newLog);
    try {
      await storage.set('lucas-food-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving food log:', err);
    }
  };

  const saveFoodEntry = async (entry) => {
    // Tag entry if it's a safety net day
    const taggedEntry = {
      ...entry,
      is_safety_net_day: shouldTagAsSafetyNetDay ? shouldTagAsSafetyNetDay(entry.date) : false
    };

    if (useCloud) {
      try {
        const result = await supabase.saveFood(taggedEntry);

        if (result?.error) {
          console.error('[Nutrition] saveFoodEntry failed:', {
            function: 'saveFoodEntry',
            date: taggedEntry.date,
            name: taggedEntry.name,
            error: result.error.message
          });
          throw new Error(result.error.message);
        }

        console.log('[Nutrition] saveFoodEntry successful:', taggedEntry.date, taggedEntry.name);
        return result.data;
      } catch (err) {
        console.error('[Nutrition] saveFoodEntry FAILED:', {
          function: 'saveFoodEntry',
          date: taggedEntry.date,
          name: taggedEntry.name,
          error: err.message,
          stack: err.stack
        });

        // Add to The Vault for offline resilience
        await addPendingWrite('food_log', taggedEntry, supabase?.user?.id);

        // Return original entry for optimistic UI
        return taggedEntry;
      }
    }
    return taggedEntry;
  };

  const deleteFoodEntry = async (id) => {
    if (useCloud) await supabase.deleteFood(id);
  };

  const saveWaterLog = async (newLog) => {
    setWaterLog(newLog);
    try {
      await storage.set('lucas-water-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving water log:', err);
    }
  };

  const saveWaterEntry = async (entry) => {
    if (useCloud) {
      try {
        const result = await supabase.saveWater(entry);

        if (result?.error) {
          console.error('[Nutrition] saveWaterEntry failed:', {
            function: 'saveWaterEntry',
            date: entry.date,
            glasses: entry.glasses,
            error: result.error.message
          });
          throw new Error(result.error.message);
        }

        console.log('[Nutrition] saveWaterEntry successful:', entry.date, entry.glasses);
      } catch (err) {
        console.error('[Nutrition] saveWaterEntry FAILED:', {
          function: 'saveWaterEntry',
          date: entry.date,
          glasses: entry.glasses,
          error: err.message,
          stack: err.stack
        });

        // Add to The Vault for offline resilience
        await addPendingWrite('water_log', entry, supabase?.user?.id);

        // Don't throw - allow optimistic UI to continue
      }
    }
  };

  const getTodayWater = () => {
    const today = getArgentinaDateString();
    return waterLog.find(e => e.date === today) || { date: today, glasses: 0, ml: 0 };
  };

  const addWaterGlass = async () => {
    const today = getArgentinaDateString();
    const existingEntry = waterLog.find(e => e.date === today);
    const newEntry = existingEntry
      ? { ...existingEntry, glasses: existingEntry.glasses + 1, ml: (existingEntry.glasses + 1) * 250 }
      : { date: today, glasses: 1, ml: 250 };
    const newLog = existingEntry
      ? waterLog.map(e => e.date === today ? newEntry : e)
      : [...waterLog, newEntry];
    saveWaterLog(newLog);
    saveWaterEntry(newEntry);
    return '💧 +1 vaso';
  };

  const removeWaterGlass = async () => {
    const today = getArgentinaDateString();
    const existingEntry = waterLog.find(e => e.date === today);
    if (!existingEntry || existingEntry.glasses <= 0) return null;
    const newEntry = { ...existingEntry, glasses: existingEntry.glasses - 1, ml: (existingEntry.glasses - 1) * 250 };
    const newLog = waterLog.map(e => e.date === today ? newEntry : e);
    saveWaterLog(newLog);
    saveWaterEntry(newEntry);
    return '💧 -1 vaso';
  };

  return {
    foodLog, setFoodLog, saveFoodLog, saveFoodEntry, deleteFoodEntry,
    waterLog, setWaterLog, saveWaterLog, saveWaterEntry, getTodayWater, addWaterGlass, removeWaterGlass,
    getTotalsForDate, getTargetsForDate, getFoodsForDate, isDayCompleted
  };
};
