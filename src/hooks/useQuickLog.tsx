import { useCallback, useMemo } from 'react';
import { FoodEntry } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';

/**
 * useQuickLog
 *
 * Logic core for Fast-Log Library.
 * Analyzes food history to find frequent items and combos.
 * Provides 1-tap logging functionality.
 *
 * @param {FoodEntry[]} foodLog - Full food history
 * @param {Function} saveFoodEntry - Function to save a single entry (from useNutrition)
 */
export const useQuickLog = (
    foodLog: FoodEntry[],
    saveFoodEntry: (entry: FoodEntry) => Promise<FoodEntry | null>,
) => {
    // 1. Frequency Analysis (Memoized)
    const { frequentFoods, frequentCombos } = useMemo(() => {
        if (!foodLog || foodLog.length === 0)
            return { frequentFoods: [], frequentCombos: [] };

        // Limit analysis to last 30 days for relevance
        // (Simplification: Just take last 500 entries to avoid expensive date diffs on every item)
        const recentLogs = foodLog.slice(-500);

        // A. Individual Frequency
        const foodFrequency: Record<string, number> = {};
        const foodData: Record<string, any> = {}; // Store latest macro data for each food name

        // B. Combo Analysis Prep
        const sessionGroups: Record<string, string[]> = {}; // Key: "Date-Hour", Value: [foodItems]

        recentLogs.forEach((entry) => {
            // Skip incomplete entries
            if (!entry.name) return;

            const normalizedName = entry.name.trim(); // Case sensitive preservation? Or lowercase?
            // Let's use Original Casing for display, but normalize for counting?
            // For now, simple trim.

            // Track Frequency
            foodFrequency[normalizedName] = (foodFrequency[normalizedName] || 0) + 1;

            // Store latest data (overwrite to keep most recent)
            foodData[normalizedName] = {
                name: normalizedName,
                calories: entry.calories,
                protein: entry.protein,
                carbs: entry.carbs,
                fat: entry.fat,
                fiber: entry.fiber,
                meal: entry.meal, // Default meal type
            };

            // Combo Grouping
            // Key = "YYYY-MM-DD-HH"
            // We need hour from entry.time ("12:30") or timestamp?
            // Assuming entry.time exists in HH:mm format
            if (entry.date && entry.time) {
                const hour = entry.time.split(':')[0];
                const key = `${entry.date}-${hour}`;

                if (!sessionGroups[key]) sessionGroups[key] = [];
                sessionGroups[key].push(normalizedName);
            }
        });

        // Extract Top 5 Foods
        const sortedFoods = Object.entries(foodFrequency)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5)
            .map(([name]) => foodData[name]);

        // Extract Top 3 Combos
        const comboSignatures: Record<string, number> = {};

        Object.values(sessionGroups).forEach((items) => {
            // Must have at least 2 items to be a combo
            if (items.length < 2) return;

            // Sort names to create a signature (A+B is same as B+A)
            // Filter duplicates in same session (e.g. 2 eggs logged separately)
            const uniqueItems = [...new Set(items)].sort();

            // We only care about exact combos for now, or subsets?
            // Exact match of unique items for simplicity.
            if (uniqueItems.length < 2) return;

            const signature = uniqueItems.join('|');
            comboSignatures[signature] = (comboSignatures[signature] || 0) + 1;
        });

        const topCombos = Object.entries(comboSignatures)
            .filter(([, count]) => count >= 3) // Min threshold: witnessed 3 times
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 3)
            .map(([signature]) => {
                const names = signature.split('|');
                return {
                    id: `combo-${signature}`,
                    name: names.join(' + '), // Display name
                    items: names.map((name) => foodData[name]), // Hydrate with data
                    totalCalories: names.reduce(
                        (sum, name) => sum + (foodData[name]?.calories || 0),
                        0,
                    ),
                };
            });

        return { frequentFoods: sortedFoods, frequentCombos: topCombos };
    }, [foodLog]);

    // 2. Quick Log Action
    const quickLog = useCallback(
        async (itemOrCombo: any): Promise<string | null> => {
            const today = getArgentinaDateString();

            // Get current time in Argentina
            // Hack: Create date object, convert to Argentina string, extract time
            const now = new Date();
            const timeString = now.toLocaleTimeString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });

            // Helper: Smart Meal Guessing for Argentina Time
            const getSmartMealType = (timeStr: string) => {
                const hour = parseInt(timeStr.split(':')[0], 10);

                if (hour >= 5 && hour < 12) return 'Desayuno';
                if (hour >= 12 && hour < 16) return 'Almuerzo';
                if (hour >= 16 && hour < 20) return 'Merienda';
                return 'Cena'; // 20:00 - 05:00
            };

            const itemsToLog = itemOrCombo.items ? itemOrCombo.items : [itemOrCombo];
            let successCount = 0;

            for (const item of itemsToLog) {
                // Smart Guess: Use current time to contextually place the meal
                // If the historical item has a meal type, we could respect it,
                // BUT for "Fast Log" current context usually overrides historical context.
                // (e.g. Eating Leftover Pizza at 9am is Breakfast, not Dinner)
                const smartMeal = getSmartMealType(timeString);

                const entry: FoodEntry = {
                    id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    date: today,
                    time: timeString,
                    meal: smartMeal, // Use Smart Guess
                    name: item.name,
                    description: '⚡ Fast-Log',
                    calories: item.calories || 0,
                    protein: item.protein || 0,
                    carbs: item.carbs || 0,
                    fat: item.fat || 0,
                    fiber: item.fiber || 0,
                    source: 'manual',
                    reviewed: true,
                    confidence: 1.0,
                    sourceId: `quick-${Date.now()}`,
                };

                try {
                    await saveFoodEntry(entry);
                    successCount++;
                } catch (err) {
                    console.error('Quick log failed for item:', item.name, err);
                }
            }

            if (successCount > 0) {
                return `Agregado${itemsToLog.length > 1 ? 's' : ''}: ${itemsToLog.length > 1 ? 'Combo' : itemOrCombo.name}`;
            }
            return null;
        },
        [saveFoodEntry],
    );

    return {
        frequentFoods,
        frequentCombos,
        quickLog,
    };
};
