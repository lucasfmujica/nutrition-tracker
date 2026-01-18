import { useMemo } from 'react';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

/**
 * usePlateauDetector - Weight Plateau Detection Engine
 *
 * Analyzes 14 days of weight data to detect plateaus:
 * - Calculates 7-day moving averages for two consecutive weeks
 * - Triggers Plateau Mode if variance < 0.1% for 2 weeks
 *
 * @param {Array} weightHistory - Weight entries from Supabase
 * @param {Object} customTargets - Current nutrition targets for deficit calculation
 * @returns {Object} Plateau status and suggestions
 */
export const usePlateauDetector = (weightHistory, customTargets) => {
  return useMemo(() => {
    // Default return if insufficient data
    if (!weightHistory || weightHistory.length < 7) {
      return {
        isInPlateau: false,
        plateauWeeks: 0,
        suggestion: null,
        suggestedAction: null,
        weeklyAverages: { week1: null, week2: null },
        variance: null
      };
    }

    const today = getArgentinaDateString();

    // Get entries for last 14 days
    const fourteenDaysAgo = addDaysToDate(today, -14);
    const sevenDaysAgo = addDaysToDate(today, -7);

    // Filter and sort entries
    const recentEntries = weightHistory
      .filter(e => e.date >= fourteenDaysAgo && e.date <= today)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Split into two weeks
    const week1Entries = recentEntries.filter(
      e => e.date >= fourteenDaysAgo && e.date < sevenDaysAgo
    );
    const week2Entries = recentEntries.filter(
      e => e.date >= sevenDaysAgo && e.date <= today
    );

    // Need at least 3 entries per week for meaningful average
    if (week1Entries.length < 3 || week2Entries.length < 3) {
      console.log('[PlateauDetector] Insufficient data points per week');
      return {
        isInPlateau: false,
        plateauWeeks: 0,
        suggestion: null,
        suggestedAction: null,
        weeklyAverages: { week1: null, week2: null },
        variance: null
      };
    }

    // Calculate 7-day moving averages
    const week1Avg = week1Entries.reduce((sum, e) => sum + parseFloat(e.weight), 0) / week1Entries.length;
    const week2Avg = week2Entries.reduce((sum, e) => sum + parseFloat(e.weight), 0) / week2Entries.length;

    // Calculate variance as percentage
    const variance = Math.abs((week2Avg - week1Avg) / week1Avg) * 100;

    console.log('[PlateauDetector] Analysis:', {
      week1Entries: week1Entries.length,
      week2Entries: week2Entries.length,
      week1Avg: week1Avg.toFixed(2),
      week2Avg: week2Avg.toFixed(2),
      variance: variance.toFixed(3) + '%'
    });

    // Plateau Detection: variance < 0.1%
    const isInPlateau = variance < 0.1;

    // Generate suggestions if in plateau
    let suggestion = null;
    let suggestedAction = null;

    if (isInPlateau) {
      const currentCalories = customTargets?.calories || 2100;

      // Two options: Refeed Day OR 10% Deficit
      const refeedCalories = Math.round(currentCalories * 1.25); // +25% for refeed
      const deficitCalories = Math.round(currentCalories * 0.90); // -10% for deficit

      suggestion = {
        type: 'plateau',
        message: `Tu peso se mantiene estable en ~${week2Avg.toFixed(1)} kg. Es hora de romper el plateau.`,
        options: [
          {
            id: 'refeed',
            label: 'Día Refeed',
            description: `Un día a ${refeedCalories} kcal para resetear el metabolismo`,
            action: {
              type: 'refeed',
              calories: refeedCalories,
              duration: 1 // days
            }
          },
          {
            id: 'deficit',
            label: 'Déficit 10%',
            description: `3 días a ${deficitCalories} kcal para acelerar la pérdida`,
            action: {
              type: 'deficit',
              calories: deficitCalories,
              duration: 3 // days
            }
          }
        ]
      };

      // Default action suggestion based on how long they've been in plateau
      suggestedAction = 'refeed'; // Prefer refeed for metabolic reset
    }

    return {
      isInPlateau,
      plateauWeeks: isInPlateau ? 2 : 0,
      suggestion,
      suggestedAction,
      weeklyAverages: {
        week1: week1Avg,
        week2: week2Avg
      },
      variance
    };
  }, [weightHistory, customTargets]);
};
