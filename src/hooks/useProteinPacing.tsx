import { useMemo } from 'react';
import { FoodEntry } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';

interface ProteinSlotConfig {
    id: string;
    name: string;
    startHour: number | null;
    endHour: number | null;
    percentage: number;
    optional?: boolean;
}

/**
 * Protein Slot Configuration
 * Science-based distribution for optimal muscle protein synthesis
 */
const PROTEIN_SLOTS: ProteinSlotConfig[] = [
    {
        id: 'breakfast',
        name: 'proteinPacing.slots.breakfast',
        startHour: 7,
        endHour: 9,
        percentage: 0.15,
    },
    {
        id: 'lunch',
        name: 'proteinPacing.slots.lunch',
        startHour: 12,
        endHour: 14,
        percentage: 0.3,
    },
    {
        id: 'snack',
        name: 'proteinPacing.slots.snack',
        startHour: 16,
        endHour: 18,
        percentage: 0.25,
    },
    {
        id: 'dinner',
        name: 'proteinPacing.slots.dinner',
        startHour: 20,
        endHour: 22,
        percentage: 0.25,
    },
    {
        id: 'workout',
        name: 'proteinPacing.slots.workout',
        startHour: null,
        endHour: null,
        percentage: 0.05,
        optional: true,
    },
];

export interface ProteinSlot {
    id: string;
    name: string;
    targetGrams: number;
    consumedGrams: number;
    progress: number;
    status: 'pending' | 'complete' | 'missed' | 'active' | 'partial';
    timeWindow: string;
}

export interface ProteinPacingData {
    slots: ProteinSlot[];
    totalConsumed: number;
    remainingProtein: number;
    missedSlots: number;
    targetProtein: number;
}

/**
 * useProteinPacing - Protein distribution optimizer
 *
 * Divides daily protein goal into 4-5 optimal windows
 * and tracks completion status for each slot.
 *
 * @param {FoodEntry[]} foodLog - Food entries with protein and time data
 * @param {number} targetProtein - Daily protein target in grams
 * @param {string} [selectedDate] - Date to analyze (defaults to today)
 * @returns {ProteinPacingData} Slots with targets, consumed amounts, and statuses
 */
export const useProteinPacing = (
    foodLog: FoodEntry[],
    targetProtein: number,
    selectedDate?: string,
): ProteinPacingData => {
    return useMemo(() => {
        const date = selectedDate || getArgentinaDateString();
        const protein = targetProtein || 170;

        // Get current hour in Argentina TZ for slot status calculation
        const now = new Date();
        const argentinaHour = parseInt(
            new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Argentina/Buenos_Aires',
                hour: 'numeric',
                hour12: false,
            }).format(now),
        );

        const isToday = date === getArgentinaDateString();

        // Filter food entries for the selected date
        const dayFoods = foodLog?.filter((f) => f.date === date) || [];

        // Map meal types to slots
        const mealToSlot: Record<string, string> = {
            breakfast: 'breakfast',
            lunch: 'lunch',
            snack: 'snack',
            dinner: 'dinner',
            other: 'snack',
            preworkout: 'workout',
            postworkout: 'workout',
        };

        // Calculate protein per slot
        const slotProtein: Record<string, number> = {};
        dayFoods.forEach((food) => {
            const mealType = (food.meal || 'other').trim();
            const slotId = mealToSlot[mealType] || 'snack';
            slotProtein[slotId] =
                (slotProtein[slotId] || 0) + (Number(food.protein) || 0);
        });

        // Build slot data
        const slots = PROTEIN_SLOTS.filter((s) => !s.optional).map((slot) => {
            const targetGrams = Math.round(protein * slot.percentage);
            const consumedGrams = slotProtein[slot.id] || 0;
            const progress = Math.min(consumedGrams / targetGrams, 1);

            // Determine slot status
            let status: ProteinSlot['status'] = 'pending';

            if (isToday) {
                const isPast =
                    slot.endHour !== null && argentinaHour >= slot.endHour;
                const isActive =
                    slot.startHour !== null &&
                    slot.endHour !== null &&
                    argentinaHour >= slot.startHour &&
                    argentinaHour < slot.endHour;

                if (progress >= 0.9) {
                    status = 'complete';
                } else if (isPast) {
                    status = 'missed';
                } else if (isActive) {
                    status = 'active';
                } else if (progress > 0) {
                    status = 'partial';
                }
            } else {
                // Past dates: just check completion
                status =
                    progress >= 0.9
                        ? 'complete'
                        : progress > 0
                          ? 'partial'
                          : 'missed';
            }

            return {
                id: slot.id,
                name: slot.name,
                targetGrams,
                consumedGrams: Math.round(consumedGrams * 10) / 10,
                progress,
                status,
                timeWindow:
                    slot.startHour !== null && slot.endHour !== null
                        ? `${slot.startHour}:00 - ${slot.endHour}:00`
                        : 'Anytime',
            } as ProteinSlot;
        });

        // Calculate totals
        const totalConsumed = slots.reduce((sum, s) => sum + s.consumedGrams, 0);
        const remainingProtein = Math.max(0, protein - totalConsumed);
        const missedSlots = slots.filter((s) => s.status === 'missed').length;

        return {
            slots,
            totalConsumed: Math.round(totalConsumed),
            remainingProtein: Math.round(remainingProtein),
            missedSlots,
            targetProtein: protein,
        };
    }, [foodLog, targetProtein, selectedDate]);
};
