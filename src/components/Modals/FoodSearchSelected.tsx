import { ChevronDown } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type {
    CalculatedMacros,
    FoodSearchResult,
} from '../../services/foodApi/types';
import { FoodEntry } from '../../types/domain';
import { Input } from '../UI/FormField';
import { SourceBadge } from './FoodSearchResults';

interface FoodSearchSelectedProps {
    selectedFood: FoodSearchResult;
    calculatedMacros: CalculatedMacros;
    amount: number;
    setAmount: (amount: number) => void;
    unit: 'g' | 'serving';
    setUnit: (unit: 'g' | 'serving') => void;
    selectedMeal: FoodEntry['meal'];
    setSelectedMeal: (meal: FoodEntry['meal']) => void;
    onBack: () => void;
}

/**
 * FoodSearchSelected - Selected food editor of FoodSearchModal
 * (food card, amount/unit, meal selection and calculated macros).
 */
export const FoodSearchSelected: React.FC<FoodSearchSelectedProps> = ({
    selectedFood,
    calculatedMacros,
    amount,
    setAmount,
    unit,
    setUnit,
    selectedMeal,
    setSelectedMeal,
    onBack,
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="text-sm text-primary hover:text-primary-dark font-medium">
                ← {t('modals.foods.backToResults')}
            </button>

            {/* Selected Food Card */}
            <div className="bg-primary-soft rounded-card p-4 border border-primary/20">
                <div className="flex gap-3">
                    {selectedFood.imageUrl && (
                        <img
                            src={selectedFood.imageUrl}
                            alt={selectedFood.name}
                            className="w-16 h-16 rounded-control object-cover bg-surface"
                            onError={(e) => {
                                (
                                    e.target as HTMLImageElement
                                ).style.display = 'none';
                            }}
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary truncate">
                            {selectedFood.name}
                        </h3>
                        {selectedFood.brand && (
                            <p className="text-sm text-text-tertiary truncate">
                                {selectedFood.brand}
                            </p>
                        )}
                        <SourceBadge source={selectedFood.source} />
                    </div>
                </div>
            </div>

            {/* Amount Input */}
            <div className="grid grid-cols-2 gap-3">
                <Input
                    type="number"
                    label={t('modals.foods.amount')}
                    value={amount}
                    onChange={(e) =>
                        setAmount(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="text-center font-bold"
                />
                <div>
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                        {t('modals.foods.unit')}
                    </label>
                    <div className="relative">
                        <select
                            value={unit}
                            onChange={(e) =>
                                setUnit(e.target.value as 'g' | 'serving')
                            }
                            className="w-full bg-background border border-border rounded-control px-4 py-3 text-text-primary font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer">
                            <option value="g">{t('modals.foods.grams')}</option>
                            <option value="serving">
                                {t('modals.foods.serving')}{' '}
                                {selectedFood.servingSizeGrams &&
                                    `(${selectedFood.servingSizeGrams}g)`}
                            </option>
                        </select>
                        <ChevronDown
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                        />
                    </div>
                </div>
            </div>

            {/* Meal Selection */}
            <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                    {t('modals.foods.meal')}
                </label>
                <div className="relative">
                    <select
                        value={selectedMeal}
                        onChange={(e) =>
                            setSelectedMeal(e.target.value as FoodEntry['meal'])
                        }
                        className="w-full bg-background border border-border rounded-control px-4 py-3 text-text-primary font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer">
                        <option value="breakfast">
                            {t('mealTypes.breakfast')}
                        </option>
                        <option value="lunch">{t('mealTypes.lunch')}</option>
                        <option value="snack">{t('mealTypes.snack')}</option>
                        <option value="dinner">{t('mealTypes.dinner')}</option>
                        <option value="other">{t('mealTypes.other')}</option>
                        <option value="Pre-entreno">
                            {t('mealTypes.preworkout')}
                        </option>
                        <option value="Post-entreno">
                            {t('mealTypes.postworkout')}
                        </option>
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                    />
                </div>
            </div>

            {/* Calculated Macros */}
            <div className="bg-background rounded-card p-4">
                <div className="grid grid-cols-5 gap-2 text-center">
                    <MacroValue
                        label={t('modals.foods.macros.cal')}
                        value={calculatedMacros.calories}
                        unit=""
                        highlight
                    />
                    <MacroValue
                        label={t('modals.foods.macros.protein')}
                        value={calculatedMacros.protein}
                        unit="g"
                    />
                    <MacroValue
                        label={t('modals.foods.macros.carbs')}
                        value={calculatedMacros.carbs}
                        unit="g"
                    />
                    <MacroValue
                        label={t('modals.foods.macros.fat')}
                        value={calculatedMacros.fat}
                        unit="g"
                    />
                    <MacroValue
                        label={t('modals.foods.macros.fiber')}
                        value={calculatedMacros.fiber}
                        unit="g"
                    />
                </div>
            </div>
        </div>
    );
};

const MacroValue: React.FC<{
    label: string;
    value: number;
    unit: string;
    highlight?: boolean;
}> = ({ label, value, unit, highlight }) => (
    <div>
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
            {label}
        </p>
        <p
            className={`text-lg font-bold ${highlight ? 'text-warning' : 'text-text-primary'}`}>
            {value}
            <span className="text-xs font-normal text-text-tertiary">{unit}</span>
        </p>
    </div>
);
