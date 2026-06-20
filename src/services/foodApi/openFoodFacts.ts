/**
 * OpenFoodFacts API Service
 * Free, open-source product database with 3M+ products
 * No API key required
 *
 * @see https://world.openfoodfacts.org/data
 */

import type {
    FoodSearchResult,
    OFFProduct,
    OFFSearchResponse,
    OFFProductResponse,
} from './types';

const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const OFF_SEARCH_URL = `${OFF_BASE_URL}/cgi/search.pl`;
const OFF_PRODUCT_URL = `${OFF_BASE_URL}/api/v0/product`;

// User-Agent required by OpenFoodFacts
const OFF_USER_AGENT = 'LukenFit/1.0 (contact@lukenfit.app)';

/**
 * Convert kJ to kcal if needed
 */
const kjToKcal = (kj: number): number => Math.round(kj / 4.184);

/**
 * Parse serving size string to extract grams
 * Examples: "30g", "1 portion (50g)", "100 ml"
 */
const parseServingSize = (servingSize?: string): number | undefined => {
    if (!servingSize) return undefined;

    // Match patterns like "30g", "30 g", "(30g)", "30 gr"
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
 * Normalize OpenFoodFacts product to unified FoodSearchResult
 */
const normalizeOFFProduct = (product: OFFProduct): FoodSearchResult | null => {
    // Skip products without nutritional data
    if (!product.nutriments) {
        return null;
    }

    const nutriments = product.nutriments;

    // Get calories (prefer kcal, fallback to kJ conversion)
    let calories = nutriments['energy-kcal_100g'] ?? 0;
    if (calories === 0 && nutriments['energy_100g']) {
        calories = kjToKcal(nutriments['energy_100g']);
    }

    // Get product name (prefer Spanish, fallback to default)
    const name = product.product_name_es || product.product_name;
    if (!name) {
        return null;
    }

    return {
        id: `off_${product.code}`,
        source: 'openfoodfacts',
        name: name.trim(),
        brand: product.brands?.split(',')[0]?.trim(),
        calories: Math.round(calories),
        protein: Math.round((nutriments['proteins_100g'] ?? 0) * 10) / 10,
        carbs: Math.round((nutriments['carbohydrates_100g'] ?? 0) * 10) / 10,
        fat: Math.round((nutriments['fat_100g'] ?? 0) * 10) / 10,
        fiber: Math.round((nutriments['fiber_100g'] ?? 0) * 10) / 10,
        servingSize: product.serving_size,
        servingSizeGrams: product.serving_quantity || parseServingSize(product.serving_size),
        imageUrl: product.image_front_small_url || product.image_front_url || product.image_url,
        barcode: product.code,
    };
};

/**
 * Search OpenFoodFacts by text query
 * @param query Search term (food name, brand, etc.)
 * @param page Page number (1-indexed)
 * @param pageSize Results per page (max 100)
 */
export const searchOpenFoodFacts = async (
    query: string,
    page: number = 1,
    pageSize: number = 20
): Promise<FoodSearchResult[]> => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    try {
        const params = new URLSearchParams({
            search_terms: query.trim(),
            search_simple: '1',
            action: 'process',
            json: '1',
            page: page.toString(),
            page_size: pageSize.toString(),
            // Prefer products with nutritional info
            sort_by: 'unique_scans_n',
            // Include Spanish products
            tagtype_0: 'countries',
            tag_contains_0: 'contains',
            tag_0: 'argentina',
        });

        const response = await fetch(`${OFF_SEARCH_URL}?${params}`, {
            signal: AbortSignal.timeout(8000),
            headers: {
                'User-Agent': OFF_USER_AGENT,
            },
        });

        if (!response.ok) {
            console.error('[OpenFoodFacts] Search failed:', response.status, response.statusText);
            return [];
        }

        const data: OFFSearchResponse = await response.json();

        // Also search without country filter for more results
        if (data.products.length < 5) {
            const globalParams = new URLSearchParams({
                search_terms: query.trim(),
                search_simple: '1',
                action: 'process',
                json: '1',
                page: page.toString(),
                page_size: pageSize.toString(),
                sort_by: 'unique_scans_n',
            });

            const globalResponse = await fetch(`${OFF_SEARCH_URL}?${globalParams}`, {
                signal: AbortSignal.timeout(8000),
                headers: {
                    'User-Agent': OFF_USER_AGENT,
                },
            });

            if (globalResponse.ok) {
                const globalData: OFFSearchResponse = await globalResponse.json();
                // Merge results, prioritizing local products
                const existingCodes = new Set(data.products.map(p => p.code));
                const newProducts = globalData.products.filter(p => !existingCodes.has(p.code));
                data.products = [...data.products, ...newProducts];
            }
        }

        // Normalize and filter valid products
        const results = data.products
            .map(normalizeOFFProduct)
            .filter((p): p is FoodSearchResult => p !== null && p.calories > 0);

        return results;
    } catch (error) {
        console.error('[OpenFoodFacts] Search error:', error);
        return [];
    }
};

/**
 * Get product by barcode from OpenFoodFacts
 * @param barcode Product barcode (EAN-13, UPC-A, etc.)
 */
export const getProductByBarcode = async (
    barcode: string
): Promise<FoodSearchResult | null> => {
    if (!barcode || barcode.trim().length < 8) {
        console.warn('[OpenFoodFacts] Invalid barcode:', barcode);
        return null;
    }

    // Clean barcode (remove spaces, dashes)
    const cleanBarcode = barcode.replace(/[\s-]/g, '');

    try {
        const response = await fetch(`${OFF_PRODUCT_URL}/${cleanBarcode}.json`, {
            signal: AbortSignal.timeout(8000),
            headers: {
                'User-Agent': OFF_USER_AGENT,
            },
        });

        if (!response.ok) {
            console.error('[OpenFoodFacts] Barcode lookup failed:', response.status);
            return null;
        }

        const data: OFFProductResponse = await response.json();

        if (data.status !== 1 || !data.product) {
            console.log('[OpenFoodFacts] Product not found for barcode:', cleanBarcode);
            return null;
        }

        return normalizeOFFProduct(data.product);
    } catch (error) {
        console.error('[OpenFoodFacts] Barcode lookup error:', error);
        return null;
    }
};
