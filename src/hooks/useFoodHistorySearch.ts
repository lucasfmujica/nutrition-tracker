import { useMemo, useState } from 'react';
import { FoodEntry } from '../types/domain';

/**
 * Food History Search Hook
 * Provides search and filtering for previously logged foods
 */
export const useFoodHistorySearch = (foodLog: FoodEntry[]) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filtered foods based on search query
    const filteredFoods = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return [];

        const query = searchQuery.toLowerCase();

        // Deduplicate by name, keep most recent
        const uniqueFoods = new Map<string, FoodEntry>();

        foodLog
            .filter((f) => f.name.toLowerCase().includes(query))
            .forEach((food) => {
                const existing = uniqueFoods.get(food.name);
                if (!existing || food.date > existing.date) {
                    uniqueFoods.set(food.name, food);
                }
            });

        return Array.from(uniqueFoods.values())
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 20); // Top 20 results
    }, [foodLog, searchQuery]);

    // Recent 20 unique foods (when not searching)
    const recentFoods = useMemo(() => {
        // Get last 20 unique foods
        const uniqueMap = new Map<string, FoodEntry>();

        [...foodLog]
            .sort((a, b) => b.date.localeCompare(a.date))
            .forEach((food) => {
                if (!uniqueMap.has(food.name) && uniqueMap.size < 20) {
                    uniqueMap.set(food.name, food);
                }
            });

        return Array.from(uniqueMap.values());
    }, [foodLog]);

    return {
        searchQuery,
        setSearchQuery,
        filteredFoods,
        recentFoods,
        hasResults: filteredFoods.length > 0,
        hasSearch: searchQuery.length >= 2,
    };
};
