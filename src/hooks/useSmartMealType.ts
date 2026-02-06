import { useCallback } from 'react';
import { FoodEntry } from '../types/domain';

/**
 * Smart meal type detection based on user's local timezone
 * Auto-selects meal type (Desayuno/Almuerzo/Merienda/Cena) based on current hour
 */
export const useSmartMealType = () => {
    const getAutoMealType = useCallback(
        (referenceDate?: Date): FoodEntry['meal'] => {
            const hour = (referenceDate || new Date()).getHours();

            if (hour >= 6 && hour < 11) return 'breakfast';
            if (hour >= 11 && hour < 16) return 'lunch';
            if (hour >= 16 && hour < 20) return 'snack';
            return 'dinner';
        },
        [],
    );

    return { getAutoMealType };
};
