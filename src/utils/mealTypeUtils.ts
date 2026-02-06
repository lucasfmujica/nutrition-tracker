import { MealType } from '../types/domain';

export const getMealTypeName = (meal: string, t: any): string => {
    // Use 'other' as fallback key if the specific meal key is not found
    return t(`mealTypes.${meal}`) || t(`mealTypes.other`);
};

export const getMealTypesOrdered = (): MealType[] => {
    // Using explicit strings instead of enum for simplicity and to match domain types
    return [
        'breakfast',
        'lunch',
        'snack',
        'dinner',
        'other',
        'preworkout',
        'postworkout',
    ];
};
