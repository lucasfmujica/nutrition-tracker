import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomTargets, WeightEntry } from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

export interface PlateauOption {
    id: 'refeed' | 'deficit';
    label: string;
    description: string;
    action: {
        type: 'refeed' | 'deficit';
        calories: number;
        duration: number;
    };
}

export interface PlateauSuggestion {
    type: 'plateau';
    message: string;
    options: PlateauOption[];
}

export interface PlateauAnalysis {
    isInPlateau: boolean;
    plateauWeeks: number;
    suggestion: PlateauSuggestion | null;
    suggestedAction: 'refeed' | 'deficit' | null;
    weeklyAverages: {
        week1: number | null;
        week2: number | null;
    };
    variance: number | null;
}

/**
 * usePlateauDetector - Weight Plateau Detection Engine
 *
 * Analyzes 14 days of weight data to detect plateaus:
 * - Calculates 7-day moving averages for two consecutive weeks
 * - Triggers Plateau Mode if variance < 0.1% for 2 weeks
 *
 * @param {WeightEntry[]} weightHistory - Weight entries from Supabase
 * @param {CustomTargets} customTargets - Current nutrition targets for deficit calculation
 * @returns {PlateauAnalysis} Plateau status and suggestions
 */
export const usePlateauDetector = (
    weightHistory: WeightEntry[],
    customTargets: CustomTargets,
): PlateauAnalysis => {
    const { t } = useTranslation();

    return useMemo(() => {
        // Default return if insufficient data
        if (!weightHistory || weightHistory.length < 7) {
            return {
                isInPlateau: false,
                plateauWeeks: 0,
                suggestion: null,
                suggestedAction: null,
                weeklyAverages: { week1: null, week2: null },
                variance: null,
            };
        }

        const today = getArgentinaDateString();

        // Get entries for last 14 days
        const fourteenDaysAgo = addDaysToDate(today, -14);
        const sevenDaysAgo = addDaysToDate(today, -7);

        // Filter and sort entries
        const recentEntries = weightHistory
            .filter((e) => e.date >= fourteenDaysAgo && e.date <= today)
            .sort((a, b) => a.date.localeCompare(b.date));

        // Split into two weeks
        const week1Entries = recentEntries.filter(
            (e) => e.date >= fourteenDaysAgo && e.date < sevenDaysAgo,
        );
        const week2Entries = recentEntries.filter(
            (e) => e.date >= sevenDaysAgo && e.date <= today,
        );

        // Need at least 3 entries per week for meaningful average
        if (week1Entries.length < 3 || week2Entries.length < 3) {
            return {
                isInPlateau: false,
                plateauWeeks: 0,
                suggestion: null,
                suggestedAction: null,
                weeklyAverages: { week1: null, week2: null },
                variance: null,
            };
        }

        // Calculate 7-day moving averages
        const week1Avg =
            week1Entries.reduce((sum, e) => sum + (Number(e.weight) || 0), 0) /
            week1Entries.length;
        const week2Avg =
            week2Entries.reduce((sum, e) => sum + (Number(e.weight) || 0), 0) /
            week2Entries.length;

        // Calculate variance as percentage
        const variance = Math.abs((week2Avg - week1Avg) / week1Avg) * 100;

        // Plateau Detection: variance < 0.1%
        const isInPlateau = variance < 0.1;

        // Generate suggestions if in plateau
        let suggestion: PlateauSuggestion | null = null;
        let suggestedAction: PlateauAnalysis['suggestedAction'] = null;

        if (isInPlateau) {
            const currentCalories = customTargets?.calories || 2100;

            // Two options: Refeed Day OR 10% Deficit
            const refeedCalories = Math.round(currentCalories * 1.25); // +25% for refeed
            const deficitCalories = Math.round(currentCalories * 0.9); // -10% for deficit

            suggestion = {
                type: 'plateau',
                message: t('dashboard.plateau.message', {
                    weight: week2Avg.toFixed(1),
                }),
                options: [
                    {
                        id: 'refeed',
                        label: t('dashboard.plateau.refeedLabel'),
                        description: t('dashboard.plateau.refeedDesc', {
                            calories: refeedCalories,
                        }),
                        action: {
                            type: 'refeed',
                            calories: refeedCalories,
                            duration: 1,
                        },
                    },
                    {
                        id: 'deficit',
                        label: t('dashboard.plateau.deficitLabel'),
                        description: t('dashboard.plateau.deficitDesc', {
                            calories: deficitCalories,
                        }),
                        action: {
                            type: 'deficit',
                            calories: deficitCalories,
                            duration: 3,
                        },
                    },
                ],
            };

            // Default action suggestion based on how long they've been in plateau
            suggestedAction = 'refeed';
        }

        return {
            isInPlateau,
            plateauWeeks: isInPlateau ? 2 : 0,
            suggestion,
            suggestedAction,
            weeklyAverages: {
                week1: week1Avg,
                week2: week2Avg,
            },
            variance,
        };
    }, [weightHistory, customTargets, t]);
};
