/**
 * Food API Types
 * Shared interfaces for food search and barcode scanner features
 */

export type FoodSource = 'openfoodfacts' | 'usda';

/**
 * Unified food search result from any API source
 * All macro values are per 100g unless otherwise specified
 */
export interface FoodSearchResult {
    id: string;
    source: FoodSource;
    name: string;
    brand?: string;
    calories: number;      // per 100g
    protein: number;       // per 100g
    carbs: number;         // per 100g
    fat: number;           // per 100g
    fiber: number;         // per 100g
    servingSize?: string;  // e.g., "30g", "1 cup", "1 porción (50g)"
    servingSizeGrams?: number; // Parsed serving size in grams
    imageUrl?: string;
    barcode?: string;
}

/**
 * Selected food with user-specified amount
 */
export interface SelectedFood extends FoodSearchResult {
    amount: number;
    unit: 'g' | 'serving';
}

/**
 * Calculated macros based on amount
 */
export interface CalculatedMacros {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

// =====================================================
// OpenFoodFacts API Types
// =====================================================

export interface OFFNutriments {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    'proteins_100g'?: number;
    'proteins_serving'?: number;
    'carbohydrates_100g'?: number;
    'carbohydrates_serving'?: number;
    'fat_100g'?: number;
    'fat_serving'?: number;
    'fiber_100g'?: number;
    'fiber_serving'?: number;
    // Fallback for energy in kJ
    'energy_100g'?: number;
    'energy_serving'?: number;
}

export interface OFFProduct {
    code: string;
    product_name?: string;
    product_name_es?: string;
    brands?: string;
    nutriments?: OFFNutriments;
    serving_size?: string;
    serving_quantity?: number;
    image_url?: string;
    image_front_url?: string;
    image_front_small_url?: string;
}

export interface OFFSearchResponse {
    count: number;
    page: number;
    page_count: number;
    page_size: number;
    products: OFFProduct[];
}

export interface OFFProductResponse {
    code: string;
    status: number;
    status_verbose: string;
    product?: OFFProduct;
}

// =====================================================
// USDA FoodData Central API Types
// =====================================================

export interface USDAFoodNutrient {
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
}

export interface USDAFood {
    fdcId: number;
    description: string;
    dataType: string;
    brandName?: string;
    brandOwner?: string;
    foodNutrients: USDAFoodNutrient[];
    servingSize?: number;
    servingSizeUnit?: string;
    householdServingFullText?: string;
}

export interface USDASearchResponse {
    totalHits: number;
    currentPage: number;
    totalPages: number;
    foods: USDAFood[];
}
