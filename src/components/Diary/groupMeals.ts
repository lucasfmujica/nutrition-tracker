import { FoodEntry } from '../../types/domain';

export interface MealGroup {
    type: string;
    items: FoodEntry[];
    calories: number;
}

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];

/**
 * Agrupa las comidas del día por tipo de comida (orden fijo
 * desayuno→almuerzo→snack→cena→otro) sumando calorías por grupo.
 */
export const groupMealsByType = (foods: FoodEntry[]): MealGroup[] => {
    if (foods.length === 0) return [];

    const groups = foods.reduce((acc: any, food) => {
        const meal = (food.meal || 'other').trim();
        const normalizedMeal =
            MEAL_ORDER.find((m) => m.toLowerCase() === meal.toLowerCase()) ||
            'other';

        if (!acc[normalizedMeal])
            acc[normalizedMeal] = { items: [], totalCalories: 0 };

        acc[normalizedMeal].items.push(food);
        acc[normalizedMeal].totalCalories += food.calories || 0;
        return acc;
    }, {});

    return MEAL_ORDER.map((mealType) => {
        const group = groups[mealType] || { items: [], totalCalories: 0 };
        return {
            type: mealType,
            items: group.items,
            calories: group.totalCalories,
        };
    });
};
