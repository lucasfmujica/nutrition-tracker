import { Camera, ChevronDown } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type {
    CalculatedMacros,
    FoodSearchResult,
} from '../../services/foodApi/types';
import type { FoodEntry } from '../../types/domain';

interface BarcodeResultCardProps {
    product: FoodSearchResult;
    calculatedMacros: CalculatedMacros;
    amount: number;
    setAmount: (amount: number) => void;
    unit: 'g' | 'serving';
    setUnit: (unit: 'g' | 'serving') => void;
    selectedMeal: FoodEntry['meal'];
    setSelectedMeal: (meal: FoodEntry['meal']) => void;
    onScanAgain: () => void;
}

/**
 * BarcodeResultCard - Found-product UI for BarcodeScannerModal:
 * product card, amount/unit inputs, meal selection, calculated macros
 * and "scan another" action.
 */
export const BarcodeResultCard: React.FC<BarcodeResultCardProps> = ({
    product,
    calculatedMacros,
    amount,
    setAmount,
    unit,
    setUnit,
    selectedMeal,
    setSelectedMeal,
    onScanAgain,
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            {/* Product Card */}
            <div className="bg-success-soft rounded-card p-4 border border-success/20">
                <div className="flex gap-3">
                    {product.imageUrl && (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-16 h-16 rounded-control object-cover bg-surface flex-shrink-0"
                            onError={(e) => {
                                (
                                    e.target as HTMLImageElement
                                ).style.display = 'none';
                            }}
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-bold uppercase tracking-wider mb-1">
                            {t('modals.barcode.found')}
                        </span>
                        <h3 className="font-bold text-text-primary truncate">
                            {product.name}
                        </h3>
                        {product.brand && (
                            <p className="text-sm text-text-tertiary truncate">
                                {product.brand}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Amount Input */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                        {t('modals.foods.amount')}
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) =>
                            setAmount(
                                Math.max(
                                    0,
                                    parseInt(e.target.value) || 0,
                                ),
                            )
                        }
                        className="w-full bg-background border border-border rounded-control px-4 py-3 text-text-primary text-center font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                        {t('modals.foods.unit')}
                    </label>
                    <div className="relative">
                        <select
                            value={unit}
                            onChange={(e) =>
                                setUnit(
                                    e.target.value as 'g' | 'serving',
                                )
                            }
                            className="w-full bg-background border border-border rounded-control px-4 py-3 text-text-primary font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer">
                            <option value="g">
                                {t('modals.foods.grams')}
                            </option>
                            <option value="serving">
                                {t('modals.foods.serving')}{' '}
                                {product.servingSizeGrams &&
                                    `(${product.servingSizeGrams}g)`}
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
                            setSelectedMeal(
                                e.target.value as FoodEntry['meal'],
                            )
                        }
                        className="w-full bg-background border border-border rounded-control px-4 py-3 text-text-primary font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer">
                        <option value="breakfast">
                            {t('mealTypes.breakfast')}
                        </option>
                        <option value="lunch">
                            {t('mealTypes.lunch')}
                        </option>
                        <option value="snack">
                            {t('mealTypes.snack')}
                        </option>
                        <option value="dinner">
                            {t('mealTypes.dinner')}
                        </option>
                        <option value="other">
                            {t('mealTypes.other')}
                        </option>
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
                        highlight
                    />
                    <MacroValue
                        label={t('modals.foods.macros.protein')}
                        value={calculatedMacros.protein}
                        suffix="g"
                    />
                    <MacroValue
                        label={t('modals.foods.macros.carbs')}
                        value={calculatedMacros.carbs}
                        suffix="g"
                    />
                    <MacroValue
                        label={t('modals.foods.macros.fat')}
                        value={calculatedMacros.fat}
                        suffix="g"
                    />
                    <MacroValue
                        label={t('modals.foods.macros.fiber')}
                        value={calculatedMacros.fiber}
                        suffix="g"
                    />
                </div>
            </div>

            {/* Scan Another Button */}
            <button
                onClick={onScanAgain}
                className="w-full py-3 rounded-control bg-surface-lighter hover:bg-surface-lighter text-text-secondary text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                <Camera size={16} />
                {t('modals.barcode.scanAnother')}
            </button>
        </div>
    );
};

// Sub-component
const MacroValue: React.FC<{
    label: string;
    value: number;
    suffix?: string;
    highlight?: boolean;
}> = ({ label, value, suffix, highlight }) => (
    <div>
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
            {label}
        </p>
        <p
            className={`text-lg font-bold ${highlight ? 'text-fat' : 'text-text-primary'}`}>
            {value}
            {suffix && (
                <span className="text-xs font-normal text-text-tertiary">
                    {suffix}
                </span>
            )}
        </p>
    </div>
);
