import { useMemo } from 'react';

/**
 * useSmartMealCompass - Intelligence Engine for Meal Suggestions
 *
 * Analyzes the user's food history to suggest meals that fit
 * the current day's remaining caloric and macronutrient budget.
 */
export const useSmartMealCompass = (foodLog, remainingMacros) => {
  return useMemo(() => {
    if (!remainingMacros || remainingMacros.calories <= 0) return [];

    // 1. Extract unique meals from history
    const uniqueMealsMap = new Map();

    foodLog.forEach(entry => {
      // Normalize name for deduplication
      const key = entry.name.toLowerCase().trim();

      // Store the version with the most metadata or most recent
      // For now, simpler: if not exists, add it.
      // Ideally we might average stats, but taking the last instance is practical.
      if (!uniqueMealsMap.has(key)) {
        uniqueMealsMap.set(key, entry);
      }
    });

    const uniqueMeals = Array.from(uniqueMealsMap.values());

    // 2. Filter candidates
    const candidates = uniqueMeals.filter(meal => {
      // Must fit within remaining calories (with 10% buffering tolerance if very close? No, strict for now)
      const fitsCalories = meal.calories <= remainingMacros.calories;

      // Optional: Filter out very small entries (water, supplements, tiny snacks < 50kcal)
      // unless we only have tiny space left
      const isSubstantial = meal.calories > 50 || remainingMacros.calories < 100;

      return fitsCalories && isSubstantial;
    });

    // 3. Score/Rank candidates
    // Strategy: Prioritize Protein Density if protein is needed
    // Otherwise prioritize "Filling the gap" (closest calorie match)
    const suggestions = candidates.sort((a, b) => {
      // Score A
      const scoreA = calculateScore(a, remainingMacros);
      const scoreB = calculateScore(b, remainingMacros);
      return scoreB - scoreA; // Descending score
    });

    // Return top 5 suggestions
    return suggestions.slice(0, 5);
  }, [foodLog, remainingMacros]);
};

// Helper: Calculate "Fit Score"
const calculateScore = (meal, limit) => {
  let score = 0;

  // Factor 1: Calorie Fill (How well does it close the gap?)
  // We want meals that are close to the limit, but not over.
  // The ratio meal.cal / limit.cal maxes at 1.0
  score += (meal.calories / limit.calories) * 50;

  // Factor 2: Protein Contribution
  // Does this meal help hit the protein target?
  if (limit.protein > 0) {
    const proteinDensity = meal.protein / (meal.calories || 1); // g per kcal
    score += proteinDensity * 1000; // Heavily weight protein
  }

  return score;
};
