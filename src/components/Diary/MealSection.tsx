import { Coffee, Cookie, Moon, Plus, Sun, Sunrise } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FoodEntry } from '../../types/domain';
import { getMealTypeName } from '../../utils/mealTypeUtils';
import { FoodItem } from './FoodItem';

interface MealSectionProps {
    title: string;
    foods: FoodEntry[];
    totals: { calories: number };
    onAddFood: () => void;
    onEditFood: (food: FoodEntry) => void;
    onDeleteFood: (food: FoodEntry) => void;
    onDuplicateFood?: (food: FoodEntry) => void;
    onToggleFavorite: (food: FoodEntry) => void;
    favoriteMap: Map<string, string>;
}

export const MealSection: React.FC<MealSectionProps> = ({
    title,
    foods,
    totals,
    onAddFood,
    onEditFood,
    onDeleteFood,
    onDuplicateFood,
    onToggleFavorite,
    favoriteMap,
}) => {
    const { t } = useTranslation();
    const getIcon = () => {
        switch (title) {
            case 'breakfast':
                return <Sunrise className="text-orange-500" size={20} />;
            case 'lunch':
                return <Sun className="text-yellow-500" size={20} />;
            case 'snack':
                return <Coffee className="text-amber-700" size={20} />; // Adjusted brown color
            case 'dinner':
                return <Moon className="text-indigo-500" size={20} />;
            default:
                return <Cookie className="text-pink-500" size={20} />;
        }
    };

    return (
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-gray-50/50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <h3 className="text-gray-900 font-bold text-base">
                        {getMealTypeName(title, t)}
                    </h3>
                </div>
                <span className="text-sm font-semibold text-gray-900 bg-white px-2 py-0.5 rounded-lg border border-gray-100 shadow-sm">
                    {totals.calories}{' '}
                    <span className="text-xs font-normal text-gray-500">kcal</span>
                </span>
            </div>

            {/* Foods List */}
            <div className="divide-y divide-gray-50">
                {foods.map((food) => (
                    <FoodItem
                        key={food.id}
                        food={food}
                        isFavorite={favoriteMap?.has(food.name.toLowerCase().trim())}
                        onEdit={() => onEditFood(food)}
                        onTemplate={() => onToggleFavorite(food)}
                        onDelete={() => onDeleteFood(food)}
                        onDuplicate={
                            onDuplicateFood ? () => onDuplicateFood(food) : undefined
                        }
                    />
                ))}
                {foods.length === 0 && (
                    <div className="p-6 text-center">
                        <p className="text-sm text-gray-400 italic mb-2">
                            {t('diary.noFoodsInMeal')}
                        </p>
                        <button
                            onClick={onAddFood}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                            +{' '}
                            {t('diary.addMeal', { meal: getMealTypeName(title, t) })}
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Add Footer */}
            {foods.length > 0 && (
                <button
                    onClick={onAddFood}
                    className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors border-t border-gray-50">
                    <Plus size={16} /> {t('diary.addItem')}
                </button>
            )}
        </div>
    );
};
