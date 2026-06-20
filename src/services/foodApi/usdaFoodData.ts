/**
 * USDA FoodData Central API Service
 * Free government database with 400k+ foods
 * Includes raw ingredients, restaurant items, branded foods
 *
 * @see https://fdc.nal.usda.gov/api-guide.html
 */

import type {
    FoodSearchResult,
    USDAFood,
    USDASearchResponse,
} from './types';

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// USDA nutrient IDs for macros
const NUTRIENT_IDS = {
    ENERGY_KCAL: 1008, // Energy (kcal)
    PROTEIN: 1003,     // Protein
    CARBS: 1005,       // Carbohydrate, by difference
    FAT: 1004,         // Total lipid (fat)
    FIBER: 1079,       // Fiber, total dietary
} as const;

/**
 * Get USDA API key from environment
 */
const getApiKey = (): string | null => {
    const key = import.meta.env.VITE_USDA_API_KEY;
    if (!key) {
        console.warn('[USDA] API key not configured. Set VITE_USDA_API_KEY in .env.local');
        return null;
    }
    return key;
};

/**
 * Extract nutrient value by ID from USDA food nutrients array
 */
const getNutrientValue = (
    nutrients: USDAFood['foodNutrients'],
    nutrientId: number
): number => {
    const nutrient = nutrients.find(n => n.nutrientId === nutrientId);
    return nutrient?.value ?? 0;
};

/**
 * Parse serving size text to grams
 * Examples: "1 cup", "1 serving (28g)", "100 g"
 */
const parseUSDAServingSize = (food: USDAFood): {
    servingSize: string | undefined;
    servingSizeGrams: number | undefined;
} => {
    // If explicit serving size in grams
    if (food.servingSize && food.servingSizeUnit?.toLowerCase() === 'g') {
        return {
            servingSize: `${food.servingSize}g`,
            servingSizeGrams: food.servingSize,
        };
    }

    // Use household serving text if available
    if (food.householdServingFullText) {
        // Try to extract grams from text like "1 cup (240g)"
        const gramMatch = food.householdServingFullText.match(/(\d+(?:\.\d+)?)\s*g/i);
        return {
            servingSize: food.householdServingFullText,
            servingSizeGrams: gramMatch ? parseFloat(gramMatch[1]) : undefined,
        };
    }

    return {
        servingSize: undefined,
        servingSizeGrams: undefined,
    };
};

/**
 * Normalize USDA food to unified FoodSearchResult
 */
const normalizeUSDAFood = (food: USDAFood): FoodSearchResult | null => {
    if (!food.foodNutrients || food.foodNutrients.length === 0) {
        return null;
    }

    const calories = getNutrientValue(food.foodNutrients, NUTRIENT_IDS.ENERGY_KCAL);

    // Skip foods without calorie data
    if (calories === 0) {
        return null;
    }

    const { servingSize, servingSizeGrams } = parseUSDAServingSize(food);

    // Branded foods report nutrients PER SERVING (food.servingSize), whereas
    // Foundation/SR Legacy/Survey report PER 100g. Normalize Branded to per-100g
    // so all sources share the same basis (FoodSearchResult is per-100g).
    const isBrandedPerServing =
        food.dataType === 'Branded' &&
        typeof food.servingSize === 'number' &&
        food.servingSize > 0 &&
        food.servingSizeUnit?.toLowerCase() === 'g';
    const factor = isBrandedPerServing ? 100 / (food.servingSize as number) : 1;

    return {
        id: `usda_${food.fdcId}`,
        source: 'usda',
        name: food.description,
        brand: food.brandName || food.brandOwner,
        calories: Math.round(calories * factor),
        protein: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_IDS.PROTEIN) * factor * 10) / 10,
        carbs: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_IDS.CARBS) * factor * 10) / 10,
        fat: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_IDS.FAT) * factor * 10) / 10,
        fiber: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_IDS.FIBER) * factor * 10) / 10,
        servingSize,
        servingSizeGrams,
    };
};

/**
 * Search USDA FoodData Central by text query
 * @param query Search term (food name, brand, etc.)
 * @param pageNumber Page number (1-indexed)
 * @param pageSize Results per page (max 200)
 */
export const searchUSDAFoods = async (
    query: string,
    pageNumber: number = 1,
    pageSize: number = 15
): Promise<FoodSearchResult[]> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        return [];
    }

    if (!query || query.trim().length < 2) {
        return [];
    }

    try {
        const response = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${apiKey}`, {
            method: 'POST',
            signal: AbortSignal.timeout(8000),
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query.trim(),
                pageNumber,
                pageSize,
                // Data types to search
                dataType: [
                    'Foundation',      // Raw ingredients
                    'SR Legacy',       // Standard Reference
                    'Branded',         // Branded products
                    'Survey (FNDDS)', // Survey foods
                ],
                // Sort by relevance
                sortBy: 'dataType.keyword',
                sortOrder: 'asc',
                // Only include fields we need
                requireAllWords: false,
            }),
        });

        if (!response.ok) {
            console.error('[USDA] Search failed:', response.status, response.statusText);
            return [];
        }

        const data: USDASearchResponse = await response.json();

        // Normalize and filter valid foods
        const results = data.foods
            .map(normalizeUSDAFood)
            .filter((f): f is FoodSearchResult => f !== null);

        return results;
    } catch (error) {
        console.error('[USDA] Search error:', error);
        return [];
    }
};

/**
 * Get specific food by USDA fdcId
 * @param fdcId USDA FoodData Central ID
 */
export const getUSDAFoodById = async (
    fdcId: number | string
): Promise<FoodSearchResult | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        return null;
    }

    try {
        const response = await fetch(
            `${USDA_BASE_URL}/food/${fdcId}?api_key=${apiKey}`,
            {
                signal: AbortSignal.timeout(8000),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('[USDA] Food lookup failed:', response.status);
            return null;
        }

        const food: USDAFood = await response.json();
        return normalizeUSDAFood(food);
    } catch (error) {
        console.error('[USDA] Food lookup error:', error);
        return null;
    }
};
