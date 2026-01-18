import { useMemo } from 'react';
import { getArgentinaDateString } from '../utils/dateUtils';

/**
 * Protein Slot Configuration
 * Science-based distribution for optimal muscle protein synthesis
 */
const PROTEIN_SLOTS = [
  { id: 'breakfast', name: 'Desayuno', startHour: 7, endHour: 9, percentage: 0.25 },
  { id: 'lunch', name: 'Almuerzo', startHour: 12, endHour: 14, percentage: 0.30 },
  { id: 'snack', name: 'Merienda', startHour: 16, endHour: 18, percentage: 0.15 },
  { id: 'dinner', name: 'Cena', startHour: 20, endHour: 22, percentage: 0.25 },
  { id: 'workout', name: 'Pre/Post Entreno', startHour: null, endHour: null, percentage: 0.05, optional: true }
];

/**
 * useProteinPacing - Protein distribution optimizer
 *
 * Divides daily protein goal into 4-5 optimal windows
 * and tracks completion status for each slot.
 *
 * @param {Array} foodLog - Food entries with protein and time data
 * @param {number} targetProtein - Daily protein target in grams
 * @param {string} [selectedDate] - Date to analyze (defaults to today)
 * @returns {Object} Slots with targets, consumed amounts, and statuses
 */
export const useProteinPacing = (foodLog, targetProtein, selectedDate) => {
  return useMemo(() => {
    const date = selectedDate || getArgentinaDateString();
    const protein = targetProtein || 170;

    // Get current hour in Argentina TZ for slot status calculation
    const now = new Date();
    const argentinaHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: 'numeric',
        hour12: false
      }).format(now)
    );

    const isToday = date === getArgentinaDateString();

    // Filter food entries for the selected date
    const dayFoods = foodLog?.filter(f => f.date === date) || [];

    // Map meal types to slots
    const mealToSlot = {
      'Desayuno': 'breakfast',
      'Almuerzo': 'lunch',
      'Merienda': 'snack',
      'Cena': 'dinner',
      'Snack': 'snack',
      'Pre-entreno': 'workout',
      'Post-entreno': 'workout'
    };

    // Calculate protein per slot
    const slotProtein = {};
    dayFoods.forEach(food => {
      const slotId = mealToSlot[food.meal] || 'snack';
      slotProtein[slotId] = (slotProtein[slotId] || 0) + (parseFloat(food.protein) || 0);
    });

    // Build slot data
    const slots = PROTEIN_SLOTS.filter(s => !s.optional).map(slot => {
      const targetGrams = Math.round(protein * slot.percentage);
      const consumedGrams = slotProtein[slot.id] || 0;
      const progress = Math.min(consumedGrams / targetGrams, 1);

      // Determine slot status
      let status = 'pending'; // Not yet time for this slot

      if (isToday) {
        const isPast = argentinaHour >= slot.endHour;
        const isActive = argentinaHour >= slot.startHour && argentinaHour < slot.endHour;

        if (progress >= 0.9) {
          status = 'complete';
        } else if (isPast) {
          status = 'missed';
        } else if (isActive) {
          status = 'active';
        } else if (progress > 0) {
          status = 'partial';
        }
      } else {
        // Past dates: just check completion
        status = progress >= 0.9 ? 'complete' : progress > 0 ? 'partial' : 'missed';
      }

      return {
        id: slot.id,
        name: slot.name,
        targetGrams,
        consumedGrams: Math.round(consumedGrams * 10) / 10,
        progress,
        status,
        timeWindow: `${slot.startHour}:00 - ${slot.endHour}:00`
      };
    });

    // Calculate totals
    const totalConsumed = slots.reduce((sum, s) => sum + s.consumedGrams, 0);
    const remainingProtein = Math.max(0, protein - totalConsumed);
    const missedSlots = slots.filter(s => s.status === 'missed').length;

    console.log('[ProteinPacing] Analysis:', {
      date,
      currentHour: argentinaHour,
      slots: slots.map(s => ({ name: s.name, status: s.status, consumed: s.consumedGrams })),
      totalConsumed,
      remainingProtein
    });

    return {
      slots,
      totalConsumed: Math.round(totalConsumed),
      remainingProtein: Math.round(remainingProtein),
      missedSlots,
      targetProtein: protein
    };
  }, [foodLog, targetProtein, selectedDate]);
};
