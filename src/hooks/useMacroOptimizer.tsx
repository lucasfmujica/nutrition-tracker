import { useMemo } from 'react';
import { FoodEntry, Macros, MealTemplate } from '../types/domain';

interface FoodTemplate {
    id: string;
    name: string;
    protein: number;
    calories: number;
    unit: string;
    type: 'quick' | 'meal' | 'finish';
}

const BASE_FOODS: FoodTemplate[] = [
    // Opción A: Rápido (Mínima preparación)
    {
        id: 'whey',
        name: 'Proteína Whey',
        protein: 25,
        calories: 120,
        unit: 'scoop',
        type: 'quick',
    },
    {
        id: 'yogurt',
        name: 'Yogur Griego',
        protein: 10,
        calories: 59,
        unit: '100g',
        type: 'quick',
    },
    {
        id: 'tuna',
        name: 'Atún en lata',
        protein: 20,
        calories: 90,
        unit: 'lata',
        type: 'quick',
    },
    {
        id: 'skyr',
        name: 'Skyr',
        protein: 11,
        calories: 60,
        unit: '100g',
        type: 'quick',
    },

    // Opción B: Comida Completa (Requiere cocinar)
    {
        id: 'chicken',
        name: 'Pechuga de Pollo',
        protein: 31,
        calories: 165,
        unit: '100g',
        type: 'meal',
    },
    {
        id: 'beef',
        name: 'Ternera Magra',
        protein: 26,
        calories: 130,
        unit: '100g',
        type: 'meal',
    },
    {
        id: 'whiteweish',
        name: 'Pescado Blanco',
        protein: 20,
        calories: 90,
        unit: '100g',
        type: 'meal',
    },

    // Opción C: Toque Final (Pequeños añadidos)
    {
        id: 'egg',
        name: 'Huevo Cocido',
        protein: 6,
        calories: 70,
        unit: 'huevo',
        type: 'finish',
    },
    {
        id: 'cheese',
        name: 'Queso Mozzarella',
        protein: 18,
        calories: 280,
        unit: '100g',
        type: 'finish',
    },
    {
        id: 'cottage',
        name: 'Queso Cottage',
        protein: 11,
        calories: 98,
        unit: '100g',
        type: 'finish',
    },
];

export interface Suggestion extends FoodTemplate {
    title: string;
    displayAmount: string;
    projectedCalories: number;
    proteinContribution: number;
    diffCalories: number;
}

/**
 * useMacroOptimizer Hook
 * Calculates the 'Gap to Target' and suggests foods to close it.
 */
export const useMacroOptimizer = (
    totals: Macros | null,
    targets: Macros | null,
    foodHistory: FoodEntry[] = [],
    templates: MealTemplate[] = [],
) => {
    const gap = useMemo(() => {
        if (!totals || !targets) return { protein: 0, calories: 0 };
        return {
            protein: Math.max(0, targets.protein - totals.protein),
            calories: Math.max(0, targets.calories - totals.calories),
        };
    }, [totals, targets]);

    // Extract personalized foods from history and templates
    const personalizedFoods = useMemo(() => {
        const foods: FoodTemplate[] = [];

        // 1. Process templates (high quality source)
        templates.forEach((t) => {
            if (t.protein > 5) {
                foods.push({
                    id: `temp-${t.id}`,
                    name: t.name,
                    protein: t.protein,
                    calories: t.calories,
                    unit: 'ración',
                    type: t.protein > 20 ? 'meal' : 'quick',
                });
            }
        });

        // 2. Process history (find frequent protein-rich items)
        const counts: Record<string, { count: number; p: number; c: number }> = {};
        foodHistory.forEach((f) => {
            if (f.protein > 5) {
                if (!counts[f.name]) {
                    counts[f.name] = { count: 0, p: 0, c: 0 };
                }
                counts[f.name].count++;
                counts[f.name].p += f.protein;
                counts[f.name].c += f.calories;
            }
        });

        Object.entries(counts)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5) // Top 5 favorite protein sources
            .forEach(([name, data]) => {
                const avgP = data.p / data.count;
                const avgC = data.c / data.count;
                foods.push({
                    id: `hist-${name}`,
                    name: name,
                    protein: avgP,
                    calories: avgC,
                    unit: 'porción usual',
                    type: avgP > 20 ? 'meal' : 'quick',
                });
            });

        return foods;
    }, [foodHistory, templates]);

    const suggestions = useMemo((): Suggestion[] => {
        if (gap.protein <= 0 || !totals) return [];

        const combinedFoods = [...personalizedFoods, ...BASE_FOODS];
        const seenNames = new Set<string>();
        const uniqueFoods = combinedFoods.filter((f) => {
            const normalizedName = f.name.toLowerCase();
            if (seenNames.has(normalizedName)) return false;
            seenNames.add(normalizedName);
            return true;
        });

        const candidates = uniqueFoods.map((food) => {
            let amount = 0;
            let displayAmount = '';
            let projectedCalories = 0;

            const ratio = gap.protein / food.protein;

            if (food.unit === '100g') {
                const preciseGrams = ratio * 100;
                amount = Math.round(preciseGrams / 10) * 10;
                displayAmount = `${amount}g`;
                projectedCalories = (amount / 100) * food.calories;
            } else {
                amount = Math.round(ratio * 2) / 2;
                if (amount <= 0.5) amount = 0.5;
                displayAmount = `${amount} ${food.unit}${amount > 1 ? 'es' : ''}`;
                projectedCalories = amount * food.calories;
            }

            return {
                ...food,
                displayAmount,
                projectedCalories,
                proteinContribution: gap.protein,
                diffCalories: gap.calories - projectedCalories,
            };
        });

        // Allow a bit more buffer if it's a personalized food
        const validCandidates = candidates.filter((c) => {
            const buffer =
                c.id.startsWith('hist-') || c.id.startsWith('temp-') ? -80 : -40;
            return c.diffCalories >= buffer;
        });

        const pickBest = (type: 'quick' | 'meal' | 'finish') => {
            const typeCandidates = validCandidates.filter((c) => c.type === type);
            if (typeCandidates.length === 0) return null;

            // Prioritize personalized foods, then best calorie fit
            return typeCandidates.sort((a, b) => {
                const aPers =
                    a.id.startsWith('hist-') || a.id.startsWith('temp-') ? 1 : 0;
                const bPers =
                    b.id.startsWith('hist-') || b.id.startsWith('temp-') ? 1 : 0;
                if (aPers !== bPers) return bPers - aPers;
                return Math.abs(a.diffCalories) - Math.abs(b.diffCalories);
            })[0];
        };

        const options: Suggestion[] = [];
        const quick = pickBest('quick');
        const meal = pickBest('meal');
        const finish = pickBest('finish');

        if (quick) options.push({ title: 'Rápido', ...quick });
        if (meal && gap.protein > 15) options.push({ title: 'Comida', ...meal });
        if (finish && gap.protein <= 12)
            options.push({ title: 'Toque Final', ...finish });

        if (options.length === 0) {
            return validCandidates
                .sort((a, b) => Math.abs(a.diffCalories) - Math.abs(b.diffCalories))
                .slice(0, 3)
                .map((c) => ({ title: 'Sugerencia', ...c }));
        }

        return options.slice(0, 3);
    }, [gap, personalizedFoods, totals]);

    return {
        gap,
        suggestions,
        isClose: gap.protein > 0 && gap.protein < 20,
    };
};
