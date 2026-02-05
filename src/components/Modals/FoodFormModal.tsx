import { Database, Globe, Loader2, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateMacros, searchFoods } from '../../services/foodApi';
import type { FoodSearchResult } from '../../services/foodApi/types';
import { FoodEntry } from '../../types/domain';

interface FoodFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    food: Partial<FoodEntry>;
    onFoodChange: (food: Partial<FoodEntry>) => void;
    onSubmit: () => void;
    isEditing: boolean;
}

/**
 * FoodFormModal - Manual food entry form with integrated search
 * Modal for adding/editing food entries with macro tracking
 * Includes inline search from OpenFoodFacts + USDA databases
 */
export const FoodFormModal: React.FC<FoodFormModalProps> = ({
    isOpen,
    onClose,
    food,
    onFoodChange,
    onSubmit,
    isEditing,
}) => {
    const { t } = useTranslation();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedFromSearch, setSelectedFromSearch] = useState(false);

    // Amount state for search results
    const [searchAmount, setSearchAmount] = useState(100);
    const [searchUnit, setSearchUnit] = useState<'g' | 'serving'>('g');
    const [selectedSearchFood, setSelectedSearchFood] =
        useState<FoodSearchResult | null>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Reset search state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setShowResults(false);
            setSelectedFromSearch(false);
            setSelectedSearchFood(null);
            setSearchAmount(100);
            setSearchUnit('g');
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        debounceRef.current = setTimeout(async () => {
            try {
                const results = await searchFoods(searchQuery.trim());
                setSearchResults(results.slice(0, 8)); // Limit results for UI
            } catch (err) {
                console.error('[FoodFormModal] Search error:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery]);

    // Handle clicking outside results
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                resultsRef.current &&
                !resultsRef.current.contains(e.target as Node)
            ) {
                setShowResults(false);
            }
        };

        if (showResults) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showResults]);

    // Select a food from search results
    const handleSelectSearchResult = useCallback((result: FoodSearchResult) => {
        setSelectedSearchFood(result);
        setSelectedFromSearch(true);
        setShowResults(false);
        setSearchQuery(
            result.brand ? `${result.name} (${result.brand})` : result.name,
        );

        // Set default amount based on serving size
        if (result.servingSizeGrams) {
            setSearchUnit('serving');
            setSearchAmount(1);
        } else {
            setSearchUnit('g');
            setSearchAmount(100);
        }
    }, []);

    // Apply search selection to form
    const applySearchSelection = useCallback(() => {
        if (!selectedSearchFood) return;

        const macros = calculateMacros(selectedSearchFood, searchAmount, searchUnit);
        const amountStr =
            searchUnit === 'g'
                ? `${searchAmount}g`
                : `${searchAmount} ${t('modals.foods.serving')}${searchAmount > 1 ? 's' : ''}`;

        onFoodChange({
            ...food,
            name: selectedSearchFood.brand
                ? `${selectedSearchFood.name} (${selectedSearchFood.brand})`
                : selectedSearchFood.name,
            description: `${amountStr} - via search`, // Key not in JSON, but following pattern
            calories: macros.calories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            fiber: macros.fiber,
        });

        // Clear search state
        setSelectedSearchFood(null);
        setSelectedFromSearch(false);
        setSearchQuery('');
    }, [selectedSearchFood, searchAmount, searchUnit, food, onFoodChange]);

    // Calculate preview macros
    const previewMacros = selectedSearchFood
        ? calculateMacros(selectedSearchFood, searchAmount, searchUnit)
        : null;

    if (!isOpen) return null;

    const handleBackdropClick = () => {
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/40 flex items-start justify-center z-50 p-4 pt-12 pb-20 overflow-y-auto backdrop-blur-sm"
            onClick={handleBackdropClick}>
            <div
                className="bg-surface rounded-3xl p-4 lg:p-8 w-full max-w-sm lg:max-w-md border border-border shadow-2xl"
                onClick={(e) => e.stopPropagation()}>
                {/* Header with close button */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl lg:text-2xl font-bold text-text-primary">
                        {isEditing
                            ? `✏️ ${t('modals.foodForm.titleEdit')}`
                            : `🍽️ ${t('modals.foodForm.titleAdd')}`}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-background hover:bg-surface-lighter text-text-tertiary hover:text-text-secondary transition-colors">
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Search Section (only when not editing) */}
                    {!isEditing && (
                        <div className="relative" ref={resultsRef}>
                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5 ml-1">
                                {t('modals.foods.searchTitle')}
                            </label>
                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                                />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowResults(true);
                                        setSelectedSearchFood(null);
                                        setSelectedFromSearch(false);
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    placeholder={t('modals.foods.placeholder')}
                                    className="w-full pl-9 pr-10 py-2.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl text-text-primary text-sm placeholder:text-text-tertiary focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                                {isSearching && (
                                    <Loader2
                                        size={16}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin"
                                    />
                                )}
                                {searchQuery && !isSearching && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSearchResults([]);
                                            setSelectedSearchFood(null);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults &&
                                searchResults.length > 0 &&
                                !selectedSearchFood && (
                                    <div className="absolute z-20 w-full mt-1 bg-surface rounded-xl shadow-lg border border-border max-h-64 overflow-y-auto">
                                        {searchResults.map((result) => (
                                            <button
                                                key={result.id}
                                                onClick={() =>
                                                    handleSelectSearchResult(result)
                                                }
                                                className="w-full text-left px-3 py-2.5 hover:bg-background border-b border-border last:border-0 transition-colors">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-text-primary truncate">
                                                            {result.name}
                                                        </p>
                                                        {result.brand && (
                                                            <p className="text-xs text-text-tertiary truncate">
                                                                {result.brand}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-xs font-bold text-orange-600">
                                                            {result.calories} kcal
                                                        </span>
                                                        <SourceBadge
                                                            source={result.source}
                                                        />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                            {/* Selected Search Food Preview */}
                            {selectedSearchFood && previewMacros && (
                                <div className="mt-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                                            {t('modals.foods.found')}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setSelectedSearchFood(null);
                                                setSearchQuery('');
                                            }}
                                            className="text-text-tertiary hover:text-text-secondary">
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* Amount controls */}
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="number"
                                            value={searchAmount}
                                            onChange={(e) =>
                                                setSearchAmount(
                                                    Math.max(
                                                        0,
                                                        parseInt(e.target.value) ||
                                                            0,
                                                    ),
                                                )
                                            }
                                            className="w-20 px-2 py-1.5 bg-surface border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-center font-bold text-text-primary"
                                        />
                                        <select
                                            value={searchUnit}
                                            onChange={(e) =>
                                                setSearchUnit(
                                                    e.target.value as
                                                        | 'g'
                                                        | 'serving',
                                                )
                                            }
                                            className="flex-1 px-2 py-1.5 bg-surface border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-text-primary">
                                            <option value="g">
                                                {t('modals.foods.grams')}
                                            </option>
                                            <option value="serving">
                                                {t('modals.foods.serving')}{' '}
                                                {selectedSearchFood.servingSizeGrams &&
                                                    `(${selectedSearchFood.servingSizeGrams}g)`}
                                            </option>
                                        </select>
                                    </div>

                                    {/* Preview macros */}
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-orange-600 dark:text-orange-400">
                                            {previewMacros.calories} kcal
                                        </span>
                                        <span className="text-text-secondary">
                                            P: {previewMacros.protein}g
                                        </span>
                                        <span className="text-text-secondary">
                                            C: {previewMacros.carbs}g
                                        </span>
                                        <span className="text-text-secondary">
                                            G: {previewMacros.fat}g
                                        </span>
                                    </div>

                                    {/* Apply button */}
                                    <button
                                        onClick={applySearchSelection}
                                        className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors">
                                        {t('modals.foods.useValues')}
                                    </button>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="flex items-center gap-3 mt-3 mb-1">
                                <div className="flex-1 h-px bg-surface-lighter" />
                                <span className="text-xs text-text-tertiary uppercase font-bold">
                                    {t('modals.foods.manualEntry')}
                                </span>
                                <div className="flex-1 h-px bg-surface-lighter" />
                            </div>
                        </div>
                    )}

                    {/* Row 1: Meal type + Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr] gap-3">
                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                                {t('modals.foodForm.meal')}
                            </label>
                            <select
                                value={food.meal || ''}
                                onChange={(e) =>
                                    onFoodChange({
                                        ...food,
                                        meal: e.target.value as any,
                                    })
                                }
                                className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer">
                                <option value="breakfast">
                                    {t('mealTypes.breakfast')}
                                </option>
                                <option value="lunch">{t('mealTypes.lunch')}</option>
                                <option value="snack">{t('mealTypes.snack')}</option>
                                <option value="dinner">
                                    {t('mealTypes.dinner')}
                                </option>
                                <option value="other">{t('mealTypes.other')}</option>
                                <option value="preworkout">
                                    {t('mealTypes.preworkout')}
                                </option>
                                <option value="postworkout">
                                    {t('mealTypes.postworkout')}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                                {t('modals.foodForm.time')}
                            </label>
                            <input
                                type="time"
                                value={food.time || ''}
                                onChange={(e) =>
                                    onFoodChange({ ...food, time: e.target.value })
                                }
                                className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Row 2: Name */}
                    <div>
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                            {t('modals.foodForm.name')} *
                        </label>
                        <input
                            type="text"
                            value={food.name || ''}
                            onChange={(e) =>
                                onFoodChange({ ...food, name: e.target.value })
                            }
                            placeholder={t('modals.foodForm.namePlaceholder')}
                            className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Row 3: Description */}
                    <div>
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                            {t('modals.foodForm.description')}
                        </label>
                        <input
                            type="text"
                            value={food.description || ''}
                            onChange={(e) =>
                                onFoodChange({
                                    ...food,
                                    description: e.target.value,
                                })
                            }
                            placeholder={t('modals.foodForm.descriptionPlaceholder')}
                            className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Row 4: Macros - 3+2 grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">
                                Cal *
                            </label>
                            <input
                                type="number"
                                value={food.calories || ''}
                                onChange={(e) =>
                                    onFoodChange({
                                        ...food,
                                        calories: parseInt(e.target.value) || 0,
                                    })
                                }
                                placeholder="500"
                                className="w-full bg-background border border-border rounded-2xl px-2 py-3 text-text-primary text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">
                                Prot
                            </label>
                            <input
                                type="number"
                                value={food.protein || ''}
                                onChange={(e) =>
                                    onFoodChange({
                                        ...food,
                                        protein: parseInt(e.target.value) || 0,
                                    })
                                }
                                placeholder="40"
                                className="w-full bg-background border border-border rounded-2xl px-2 py-3 text-text-primary text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">
                                Carbs
                            </label>
                            <input
                                type="number"
                                value={food.carbs || ''}
                                onChange={(e) =>
                                    onFoodChange({
                                        ...food,
                                        carbs: parseInt(e.target.value) || 0,
                                    })
                                }
                                placeholder="50"
                                className="w-full bg-background border border-border rounded-2xl px-2 py-3 text-text-primary text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">
                                Fat
                            </label>
                            <input
                                type="number"
                                value={food.fat || ''}
                                onChange={(e) =>
                                    onFoodChange({
                                        ...food,
                                        fat: parseInt(e.target.value) || 0,
                                    })
                                }
                                placeholder="15"
                                className="w-full bg-background border border-border rounded-2xl px-2 py-3 text-text-primary text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">
                                {t('modals.foodForm.fiber')}
                            </label>
                            <input
                                type="number"
                                value={food.fiber || ''}
                                onChange={(e) =>
                                    onFoodChange({
                                        ...food,
                                        fiber: parseInt(e.target.value) || 0,
                                    })
                                }
                                placeholder="5"
                                className="w-full bg-background border border-border rounded-2xl px-2 py-3 text-text-primary text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <input type="hidden" value={food.date} />
                </div>

                <div className="flex gap-4 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-surface-lighter hover:bg-surface-lighter py-4 rounded-2xl text-text-secondary text-sm lg:text-base font-bold transition-all active:scale-95">
                        {t('modals.foodForm.cancel')}
                    </button>
                    <button
                        onClick={onSubmit}
                        className="flex-1 bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 py-4 rounded-2xl text-white text-sm lg:text-base font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                        {isEditing ? t('common.save') : t('modals.foodForm.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Source badge component
const SourceBadge: React.FC<{ source: FoodSearchResult['source'] }> = ({
    source,
}) => {
    const isOFF = source === 'openfoodfacts';
    return (
        <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                isOFF ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
            }`}>
            {isOFF ? <Globe size={8} /> : <Database size={8} />}
            {isOFF ? 'OFF' : 'USDA'}
        </span>
    );
};
