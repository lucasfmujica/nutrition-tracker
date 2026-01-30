/**
 * useFoodSearch Hook
 * Handles food search state and API calls with debouncing
 *
 * Uses OpenFoodFacts + USDA APIs for comprehensive food database coverage
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchFoods, calculateMacros } from '../services/foodApi';
import type { FoodSearchResult, CalculatedMacros } from '../services/foodApi/types';

export interface UseFoodSearchReturn {
    // Search state
    query: string;
    setQuery: (query: string) => void;
    results: FoodSearchResult[];
    isLoading: boolean;
    error: string | null;
    hasSearched: boolean;

    // Selection state
    selectedFood: FoodSearchResult | null;
    setSelectedFood: (food: FoodSearchResult | null) => void;
    amount: number;
    setAmount: (amount: number) => void;
    unit: 'g' | 'serving';
    setUnit: (unit: 'g' | 'serving') => void;

    // Calculated values
    calculatedMacros: CalculatedMacros | null;

    // Actions
    clearSearch: () => void;
    clearSelection: () => void;
}

const DEBOUNCE_MS = 300;

export const useFoodSearch = (): UseFoodSearchReturn => {
    // Search state
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FoodSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Selection state
    const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
    const [amount, setAmount] = useState(100);
    const [unit, setUnit] = useState<'g' | 'serving'>('g');

    // Debounce timer ref
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search effect
    useEffect(() => {
        // Clear previous timer
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Don't search if query is too short
        if (query.trim().length < 2) {
            setResults([]);
            setIsLoading(false);
            setError(null);
            setHasSearched(false);
            return;
        }

        // Set loading state immediately for UX
        setIsLoading(true);
        setError(null);

        // Debounce the actual search
        debounceRef.current = setTimeout(async () => {
            try {
                const searchResults = await searchFoods(query.trim());
                setResults(searchResults);
                setHasSearched(true);

                if (searchResults.length === 0) {
                    setError('No se encontraron resultados. Intentá con otro término.');
                }
            } catch (err) {
                console.error('[useFoodSearch] Search error:', err);
                setError('Error al buscar. Verificá tu conexión e intentá de nuevo.');
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, DEBOUNCE_MS);

        // Cleanup
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    // Calculate macros when selection or amount changes
    const calculatedMacros = selectedFood
        ? calculateMacros(selectedFood, amount, unit)
        : null;

    // When selecting a food, auto-set amount based on serving size
    const handleSelectFood = useCallback((food: FoodSearchResult | null) => {
        setSelectedFood(food);

        if (food) {
            // If food has a known serving size, default to serving mode
            if (food.servingSizeGrams) {
                setUnit('serving');
                setAmount(1);
            } else {
                // Default to 100g
                setUnit('g');
                setAmount(100);
            }
        }
    }, []);

    // Clear search
    const clearSearch = useCallback(() => {
        setQuery('');
        setResults([]);
        setError(null);
        setHasSearched(false);
        setIsLoading(false);
    }, []);

    // Clear selection only
    const clearSelection = useCallback(() => {
        setSelectedFood(null);
        setAmount(100);
        setUnit('g');
    }, []);

    return {
        // Search state
        query,
        setQuery,
        results,
        isLoading,
        error,
        hasSearched,

        // Selection state
        selectedFood,
        setSelectedFood: handleSelectFood,
        amount,
        setAmount,
        unit,
        setUnit,

        // Calculated values
        calculatedMacros,

        // Actions
        clearSearch,
        clearSelection,
    };
};
