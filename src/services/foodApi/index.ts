/**
 * Food API Service - Unified Search
 * Combines OpenFoodFacts and USDA FoodData Central APIs
 * Provides normalized results for food search and barcode scanning
 */

import { showToast } from '../../context/ToastContext';
import i18n from '../../i18n/config';
import { searchOpenFoodFacts, getProductByBarcode } from './openFoodFacts';
import { searchUSDAFoods } from './usdaFoodData';
import type { FoodSearchResult, SelectedFood, CalculatedMacros } from './types';

// Re-export types
export type { FoodSearchResult, SelectedFood, CalculatedMacros } from './types';

// Re-export individual API functions
export { searchOpenFoodFacts, getProductByBarcode } from './openFoodFacts';
export { searchUSDAFoods, getUSDAFoodById } from './usdaFoodData';

/**
 * Search foods from all available APIs
 * Combines and deduplicates results from OpenFoodFacts and USDA
 *
 * @param query Search term (food name, brand, etc.)
 * @returns Merged, deduplicated results sorted by relevance
 */
export const searchFoods = async (query: string): Promise<FoodSearchResult[]> => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    // Search both APIs in parallel
    const [offResults, usdaResults] = await Promise.allSettled([
        searchOpenFoodFacts(query),
        searchUSDAFoods(query),
    ]);

    const offFoods = offResults.status === 'fulfilled' ? offResults.value : [];
    const usdaFoods = usdaResults.status === 'fulfilled' ? usdaResults.value : [];

    // Log any API failures
    if (offResults.status === 'rejected') {
        console.error('[FoodAPI] OpenFoodFacts search failed:', offResults.reason);
    }
    if (usdaResults.status === 'rejected') {
        console.error('[FoodAPI] USDA search failed:', usdaResults.reason);
    }

    // Both providers failed → the user would get zero results with no
    // explanation. Surface explicit feedback instead of failing silently.
    if (offResults.status === 'rejected' && usdaResults.status === 'rejected') {
        showToast(i18n.t('toast.foodSearchError'), 'error');
    }

    // Merge results with deduplication
    return mergeAndDedupeResults(offFoods, usdaFoods, query);
};

/**
 * Merge and deduplicate results from multiple sources
 * Prioritizes OpenFoodFacts for branded products, USDA for raw ingredients
 */
const mergeAndDedupeResults = (
    offFoods: FoodSearchResult[],
    usdaFoods: FoodSearchResult[],
    query: string
): FoodSearchResult[] => {
    const seenNames = new Set<string>();
    const results: FoodSearchResult[] = [];
    const queryLower = query.toLowerCase();

    // Helper to check if name is duplicate (fuzzy match)
    const isDuplicate = (name: string): boolean => {
        const nameLower = name.toLowerCase().trim();
        // Check exact match
        if (seenNames.has(nameLower)) return true;
        // Check if similar name exists (contains 80% of words)
        const nameWords = nameLower.split(/\s+/);
        for (const seen of seenNames) {
            const seenWords = seen.split(/\s+/);
            const matchingWords = nameWords.filter(w => seenWords.includes(w));
            if (matchingWords.length >= Math.min(nameWords.length, seenWords.length) * 0.8) {
                return true;
            }
        }
        return false;
    };

    // Score result by relevance to query
    const scoreResult = (food: FoodSearchResult): number => {
        const nameLower = food.name.toLowerCase();
        let score = 0;

        // Exact match in name
        if (nameLower.includes(queryLower)) score += 100;

        // Match at start of name
        if (nameLower.startsWith(queryLower)) score += 50;

        // Has brand (branded products often more useful)
        if (food.brand) score += 20;

        // Has image
        if (food.imageUrl) score += 10;

        // Has serving size info
        if (food.servingSizeGrams) score += 10;

        // Penalize very long names (usually less useful)
        if (food.name.length > 100) score -= 20;

        return score;
    };

    // Add all OFF results first (usually more relevant for branded)
    for (const food of offFoods) {
        if (!isDuplicate(food.name)) {
            seenNames.add(food.name.toLowerCase().trim());
            results.push(food);
        }
    }

    // Add USDA results (great for raw ingredients)
    for (const food of usdaFoods) {
        if (!isDuplicate(food.name)) {
            seenNames.add(food.name.toLowerCase().trim());
            results.push(food);
        }
    }

    // Sort by relevance score
    results.sort((a, b) => scoreResult(b) - scoreResult(a));

    // Limit to reasonable number
    return results.slice(0, 30);
};

/**
 * Calculate macros based on food and amount
 *
 * @param food Selected food with base macros (per 100g)
 * @param amount User-specified amount
 * @param unit Unit of measurement ('g' or 'serving')
 * @returns Calculated macros for the specified amount
 */
export const calculateMacros = (
    food: FoodSearchResult,
    amount: number,
    unit: 'g' | 'serving'
): CalculatedMacros => {
    let multiplier: number;

    if (unit === 'g') {
        // Direct gram conversion (base is per 100g)
        multiplier = amount / 100;
    } else {
        // Serving-based calculation
        const servingGrams = food.servingSizeGrams || 100; // Default to 100g if unknown
        multiplier = (amount * servingGrams) / 100;
    }

    return {
        calories: Math.round(food.calories * multiplier),
        protein: Math.round(food.protein * multiplier * 10) / 10,
        carbs: Math.round(food.carbs * multiplier * 10) / 10,
        fat: Math.round(food.fat * multiplier * 10) / 10,
        fiber: Math.round(food.fiber * multiplier * 10) / 10,
    };
};

/**
 * Parse a serving size string to extract grams
 * Handles various formats: "30g", "1 cup (240g)", "1 porción (50g)"
 *
 * @param servingSize Serving size string
 * @returns Grams if parseable, undefined otherwise
 */
export const parseServingSize = (servingSize?: string): number | undefined => {
    if (!servingSize) return undefined;

    // Match patterns like "30g", "30 g", "(30g)", "30 gr", "30 grams"
    const gramMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|grams?)/i);
    if (gramMatch) {
        return parseFloat(gramMatch[1]);
    }

    // For ml, assume 1:1 ratio with grams for liquids
    const mlMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*ml/i);
    if (mlMatch) {
        return parseFloat(mlMatch[1]);
    }

    return undefined;
};

/**
 * Format macros for display
 *
 * @param macros Calculated macros
 * @returns Formatted string for display
 */
export const formatMacrosDisplay = (macros: CalculatedMacros): string => {
    return `${macros.calories} kcal · P: ${macros.protein}g · C: ${macros.carbs}g · G: ${macros.fat}g`;
};

/**
 * Get display name for food source
 */
export const getSourceDisplayName = (source: FoodSearchResult['source']): string => {
    switch (source) {
        case 'openfoodfacts':
            return 'OpenFoodFacts';
        case 'usda':
            return 'USDA';
        default:
            return source;
    }
};
