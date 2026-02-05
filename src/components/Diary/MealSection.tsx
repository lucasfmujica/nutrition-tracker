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
    onCreateCombo?: (items: FoodEntry[]) => void;
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
    onCreateCombo,
}) => {
    const { t } = useTranslation();
    const [isSelectionMode, setIsSelectionMode] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleCreateCombo = () => {
        if (!onCreateCombo) return;
        const selectedFoods = foods.filter((f) => selectedIds.has(f.id));
        onCreateCombo(selectedFoods);
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    };

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
        <div className="mb-6 bg-surface rounded-2xl shadow-sm border border-border overflow-hidden transition-colors">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-background/50 border-b border-border">
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <h3 className="text-text-primary font-bold text-base">
                        {getMealTypeName(title, t)}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {!isSelectionMode && foods.length > 1 && onCreateCombo && (
                        <button
                            onClick={() => setIsSelectionMode(true)}
                            className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors mr-2">
                            Crear Combo
                        </button>
                    )}
                    <span className="text-sm font-semibold text-text-primary bg-surface px-2 py-0.5 rounded-lg border border-border shadow-sm">
                        {totals.calories}{' '}
                        <span className="text-xs font-normal text-text-tertiary">
                            kcal
                        </span>
                    </span>
                </div>
            </div>

            {/* Foods List */}
            <div className="divide-y divide-border">
                {foods.map((food) => (
                    <div key={food.id} className="flex items-center">
                        {isSelectionMode && (
                            <div className="pl-3 pr-0">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(food.id)}
                                    onChange={() => toggleSelection(food.id)}
                                    className="w-5 h-5 rounded-md border-border text-purple-600 focus:ring-purple-500"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <FoodItem
                                food={food}
                                isFavorite={favoriteMap?.has(
                                    food.name.toLowerCase().trim(),
                                )}
                                onEdit={() => onEditFood(food)}
                                onTemplate={() => onToggleFavorite(food)}
                                onDelete={() => onDeleteFood(food)}
                                onDuplicate={
                                    onDuplicateFood
                                        ? () => onDuplicateFood(food)
                                        : undefined
                                }
                            />
                        </div>
                    </div>
                ))}
                {foods.length === 0 && (
                    <div className="p-6 text-center">
                        <p className="text-sm text-text-tertiary italic mb-2">
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

            {/* Footer */}
            {isSelectionMode ? (
                <div className="flex divide-x divide-border bg-purple-50 dark:bg-purple-900/20">
                    <button
                        onClick={() => {
                            setIsSelectionMode(false);
                            setSelectedIds(new Set());
                        }}
                        className="flex-1 py-3 text-sm font-medium text-text-tertiary hover:text-text-secondary transition-colors">
                        Cancelar
                    </button>
                    <button
                        disabled={selectedIds.size < 2}
                        onClick={handleCreateCombo}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${
                            selectedIds.size < 2
                                ? 'text-text-tertiary'
                                : 'text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                        }`}>
                        Guardar Combo ({selectedIds.size})
                    </button>
                </div>
            ) : (
                foods.length > 0 && (
                    <button
                        onClick={onAddFood}
                        className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-text-tertiary hover:text-blue-600 hover:bg-background transition-colors border-t border-border">
                        <Plus size={16} /> {t('diary.addItem')}
                    </button>
                )
            )}
        </div>
    );
};
