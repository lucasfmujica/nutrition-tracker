import { useMemo } from 'react';

const BASE_FOODS = [
  // Option A: Quick Fix (Minimal prep)
  { id: 'whey', name: 'Whey Protein', protein: 25, calories: 120, unit: 'scoop', type: 'quick' },
  { id: 'yogurt', name: 'Greek Yogurt', protein: 10, calories: 59, unit: '100g', type: 'quick' }, // ~10g per 100g
  { id: 'tuna', name: 'Canned Tuna', protein: 20, calories: 90, unit: 'can', type: 'quick' },
  { id: 'skyr', name: 'Skyr', protein: 11, calories: 60, unit: '100g', type: 'quick' },

  // Option B: Whole Meal (Cooking required)
  { id: 'chicken', name: 'Chicken Breast', protein: 31, calories: 165, unit: '100g', type: 'meal' },
  { id: 'beef', name: 'Lean Beef (5%)', protein: 26, calories: 130, unit: '100g', type: 'meal' },
  { id: 'whiteweish', name: 'White Fish', protein: 20, calories: 90, unit: '100g', type: 'meal' },
  { id: 'tofu', name: 'Tofu', protein: 8, calories: 76, unit: '100g', type: 'meal' },

  // Option C: Finish Line (Small additions)
  { id: 'egg', name: 'Boiled Egg', protein: 6, calories: 70, unit: 'large egg', type: 'finish' },
  { id: 'almonds', name: 'Almonds', protein: 6, calories: 160, unit: '30g', type: 'finish' }, // High cal, good for cal gap
  { id: 'cheese', name: 'Mozzarella', protein: 18, calories: 280, unit: '100g', type: 'finish' },
];

/**
 * useMacroOptimizer Hook
 * Calculates the 'Gap to Target' and suggests foods to close it.
 *
 * @param {Object} totals - { protein, calories, ... }
 * @param {Object} targets - { protein, calories, ... }
 */
export const useMacroOptimizer = (totals, targets) => {

  const gap = useMemo(() => {
    if (!totals || !targets) return { protein: 0, calories: 0 };
    return {
      protein: Math.max(0, targets.protein - totals.protein),
      calories: Math.max(0, targets.calories - totals.calories),
    };
  }, [totals, targets]);

  const suggestions = useMemo(() => {
    // If goal met, no suggestions
    if (gap.protein <= 0) return [];

    const options = [];

    // Strategies based on gap size
    // 1. Calculate how much of each food we need to hit protein
    // 2. Check if that amount fits in calories (with small buffer)

    const candidates = BASE_FOODS.map(food => {
      // Calculate amount needed to close protein gap
      // If food.unit is '100g', we calculate grams. If 'scoop'/'can'/'egg', we calculate multiplier.

      let amount = 0;
      let displayAmount = '';
      let projectedCalories = 0;

      const ratio = gap.protein / food.protein;

      // Round to reasonable numbers (e.g. 0.5 scoop, 1.5 scoops, 150g)
      if (food.unit === '100g') {
        // Round to nearest 10g
        const preciseGrams = ratio * 100;
        amount = Math.round(preciseGrams / 10) * 10;
        displayAmount = `${amount}g`;
        projectedCalories = (amount / 100) * food.calories;
      } else {
        // Round to nearest 0.5
        amount = Math.round(ratio * 2) / 2;
        if (amount <= 0) amount = 0.5; // Minimum 0.5 unit
        displayAmount = `${amount} ${food.unit}${amount > 1 ? 's' : ''}`;
        projectedCalories = amount * food.calories;
      }

      return {
        ...food,
        displayAmount,
        projectedCalories,
        proteinContribution: gap.protein, // Roughly aiming for this
        diffCalories: (gap.calories - projectedCalories) // Positive means we still have room, Negative means this breaks limit
      };
    });

    // Filter candidates that don't blow up calories too much (allow 10% or 50cal buffer)
    const validCandidates = candidates.filter(c => c.diffCalories >= -50);

    // Pick 1 best from each category
    const pickBest = (type) => {
      const typeCandidates = validCandidates.filter(c => c.type === type);
      // Sort by closest to calorie limit (closest to 0 diffCalories but preferably positive)
      // Actually, we want to minimize 'calorie waste' or 'calorie overage'.
      // Let's sort by: absolute difference to calorie gap (e.g. perfect macro match? unlikely)
      // Simpler: Just pick the one with highest protein density if strict, or random?
      // Let's pick the one that leaves the least calorie gap open without exceeding it too much.

      if (typeCandidates.length === 0) return null;

      // Sort by best fit for calories
      return typeCandidates.sort((a, b) => Math.abs(a.diffCalories) - Math.abs(b.diffCalories))[0];
    };

    const quick = pickBest('quick');
    const meal = pickBest('meal');
    const finish = pickBest('finish');

    if (quick) options.push({ title: 'The Quick Fix', ...quick });
    if (meal && gap.protein > 20) options.push({ title: 'The Whole Meal', ...meal }); // Only suggest meal if gap is substantial
    if (finish && gap.protein <= 15) options.push({ title: 'The Finish Line', ...finish }); // Only suggest finish line if close

    // Fallback: If no generic options fit well, just return top 3 valid candidates sorted by calorie fit
    if (options.length === 0) {
      return validCandidates.sort((a, b) => Math.abs(a.diffCalories) - Math.abs(b.diffCalories))
        .slice(0, 3)
        .map(c => ({ title: 'Suggestion', ...c }));
    }

    return options.slice(0, 3); // Max 3
  }, [gap]);

  // Status helper
  const isClose = gap.protein > 0 && gap.protein < 20;

  return {
    gap,
    suggestions,
    isClose
  };
};
