import { useCallback } from 'react';
import { FoodEntry } from '../types/domain';

/**
 * Smart meal type detection based on Argentina timezone
 * Auto-selects meal type (Desayuno/Almuerzo/Merienda/Cena) based on current hour
 */
export const useSmartMealType = () => {
    const getAutoMealType = useCallback(
        (referenceDate?: Date): FoodEntry['meal'] => {
            const now = referenceDate || new Date();
            const hour = parseInt(
                now.toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    hour12: false,
                    timeZone: 'America/Argentina/Buenos_Aires',
                }),
            );

            if (hour >= 6 && hour < 11) return 'breakfast';
            if (hour >= 11 && hour < 16) return 'lunch';
            if (hour >= 16 && hour < 20) return 'snack';
            return 'dinner';
        },
        [],
    );

    return { getAutoMealType };
};
