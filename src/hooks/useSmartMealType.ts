import { useCallback } from 'react';
import { FoodEntry } from '../types/domain';

/**
 * Smart meal type detection based on Argentina timezone
 * Auto-selects meal type (Desayuno/Almuerzo/Merienda/Cena) based on current hour
 */
export const useSmartMealType = () => {
    const getAutoMealType = useCallback((): FoodEntry['meal'] => {
        const now = new Date();
        const hour = parseInt(
            now.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                hour12: false,
                timeZone: 'America/Argentina/Buenos_Aires',
            }),
        );

        if (hour >= 6 && hour < 11) return 'Desayuno';
        if (hour >= 11 && hour < 16) return 'Almuerzo';
        if (hour >= 16 && hour < 20) return 'Merienda';
        return 'Cena';
    }, []);

    return { getAutoMealType };
};
