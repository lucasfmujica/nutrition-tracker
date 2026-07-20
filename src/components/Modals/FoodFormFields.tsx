import React from 'react';
import { useTranslation } from 'react-i18next';
import { FoodEntry } from '../../types/domain';
import { Input, Select, Textarea } from '../UI/FormField';

interface FoodFormFieldsProps {
    food: Partial<FoodEntry>;
    onFoodChange: (food: Partial<FoodEntry>) => void;
}

/**
 * FoodFormFields - Manual entry fields of FoodFormModal
 * (meal type, time, name, description and macro inputs).
 */
export const FoodFormFields: React.FC<FoodFormFieldsProps> = ({
    food,
    onFoodChange,
}) => {
    const { t } = useTranslation();

    return (
        <>
            {/* Meal Type */}
            <Select
                id="food-meal"
                label={t('modals.foodForm.meal')}
                value={food.meal || ''}
                onChange={(e) =>
                    onFoodChange({
                        ...food,
                        meal: e.target.value as any,
                    })
                }>
                <option value="breakfast">{t('mealTypes.breakfast')}</option>
                <option value="lunch">{t('mealTypes.lunch')}</option>
                <option value="snack">{t('mealTypes.snack')}</option>
                <option value="dinner">{t('mealTypes.dinner')}</option>
                <option value="other">{t('mealTypes.other')}</option>
                <option value="preworkout">{t('mealTypes.preworkout')}</option>
                <option value="postworkout">
                    {t('mealTypes.postworkout')}
                </option>
            </Select>

            {/* Time */}
            <Input
                id="food-time"
                type="time"
                label={t('modals.foodForm.time')}
                value={food.time || ''}
                onChange={(e) => onFoodChange({ ...food, time: e.target.value })}
            />

            {/* Row 2: Name */}
            <Input
                id="food-name"
                type="text"
                label={`${t('modals.foodForm.name')} *`}
                value={food.name || ''}
                onChange={(e) => onFoodChange({ ...food, name: e.target.value })}
                placeholder={t('modals.foodForm.namePlaceholder')}
            />

            {/* Row 3: Description */}
            <Textarea
                id="food-description"
                label={t('modals.foodForm.description')}
                value={food.description || ''}
                onChange={(e) =>
                    onFoodChange({
                        ...food,
                        description: e.target.value,
                    })
                }
                rows={3}
                placeholder={t('modals.foodForm.descriptionPlaceholder')}
                className="overflow-y-auto max-h-32"
            />

            {/* Row 4: Macros - 3+2 grid */}
            <div className="grid grid-cols-3 gap-3">
                <Input
                    id="food-calories"
                    type="number"
                    label="Cal *"
                    value={food.calories || ''}
                    onChange={(e) =>
                        onFoodChange({
                            ...food,
                            calories: parseInt(e.target.value) || 0,
                        })
                    }
                    placeholder="500"
                    className="text-center font-bold px-2"
                />
                <Input
                    id="food-protein"
                    type="number"
                    label="Prot"
                    value={food.protein || ''}
                    onChange={(e) =>
                        onFoodChange({
                            ...food,
                            protein: parseInt(e.target.value) || 0,
                        })
                    }
                    placeholder="40"
                    className="text-center font-bold px-2"
                />
                <Input
                    id="food-carbs"
                    type="number"
                    label="Carbs"
                    value={food.carbs || ''}
                    onChange={(e) =>
                        onFoodChange({
                            ...food,
                            carbs: parseInt(e.target.value) || 0,
                        })
                    }
                    placeholder="50"
                    className="text-center font-bold px-2"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Input
                    id="food-fat"
                    type="number"
                    label="Fat"
                    value={food.fat || ''}
                    onChange={(e) =>
                        onFoodChange({
                            ...food,
                            fat: parseInt(e.target.value) || 0,
                        })
                    }
                    placeholder="15"
                    className="text-center font-bold px-2"
                />
                <Input
                    id="food-fiber"
                    type="number"
                    label={t('modals.foodForm.fiber')}
                    value={food.fiber || ''}
                    onChange={(e) =>
                        onFoodChange({
                            ...food,
                            fiber: parseInt(e.target.value) || 0,
                        })
                    }
                    placeholder="5"
                    className="text-center font-bold px-2"
                />
            </div>
            <input type="hidden" value={food.date} />
        </>
    );
};
