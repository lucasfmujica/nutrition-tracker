import { Database, Globe, Loader2, Search, X } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type {
    CalculatedMacros,
    FoodSearchResult,
} from '../../services/foodApi/types';

interface FoodFormSearchProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    searchResults: FoodSearchResult[];
    setSearchResults: (value: FoodSearchResult[]) => void;
    isSearching: boolean;
    showResults: boolean;
    setShowResults: (value: boolean) => void;
    setSelectedFromSearch: (value: boolean) => void;
    selectedSearchFood: FoodSearchResult | null;
    setSelectedSearchFood: (value: FoodSearchResult | null) => void;
    searchAmount: number;
    setSearchAmount: (value: number) => void;
    searchUnit: 'g' | 'serving';
    setSearchUnit: (value: 'g' | 'serving') => void;
    previewMacros: CalculatedMacros | null;
    resultsRef: React.RefObject<HTMLDivElement>;
    searchInputRef: React.RefObject<HTMLInputElement>;
    onSelectResult: (result: FoodSearchResult) => void;
    onApply: () => void;
}

/**
 * FoodFormSearch - Inline food search section of FoodFormModal
 * (search input, results dropdown, selected preview with amount controls).
 */
export const FoodFormSearch: React.FC<FoodFormSearchProps> = ({
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    showResults,
    setShowResults,
    setSelectedFromSearch,
    selectedSearchFood,
    setSelectedSearchFood,
    searchAmount,
    setSearchAmount,
    searchUnit,
    setSearchUnit,
    previewMacros,
    resultsRef,
    searchInputRef,
    onSelectResult,
    onApply,
}) => {
    const { t } = useTranslation();

    return (
        <div className="relative" ref={resultsRef}>
            <label
                htmlFor="food-search"
                className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5 ml-1">
                {t('modals.foods.searchTitle')}
            </label>
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                    id="food-search"
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
                    className="w-full pl-9 pr-10 py-2.5 bg-primary-soft border border-primary/20 rounded-control text-text-primary text-sm placeholder:text-text-tertiary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                {isSearching && (
                    <Loader2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin"
                    />
                )}
                {searchQuery && !isSearching && (
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                            setSelectedSearchFood(null);
                        }}
                        aria-label={t('a11y.clearSearch')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && !selectedSearchFood && (
                <div className="absolute z-20 w-full mt-1 bg-surface rounded-control shadow-float border border-border max-h-64 overflow-y-auto">
                    {searchResults.map((result) => (
                        <button
                            key={result.id}
                            onClick={() => onSelectResult(result)}
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
                                    <span className="text-xs font-bold text-warning">
                                        {result.calories} kcal
                                    </span>
                                    <SourceBadge source={result.source} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Selected Search Food Preview */}
            {selectedSearchFood && previewMacros && (
                <div className="mt-2 p-3 bg-primary-soft rounded-control border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-primary uppercase">
                            {t('modals.foods.found')}
                        </span>
                        <button
                            onClick={() => {
                                setSelectedSearchFood(null);
                                setSearchQuery('');
                            }}
                            aria-label={t('a11y.clearSearch')}
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
                                    Math.max(0, parseInt(e.target.value) || 0),
                                )
                            }
                            className="w-20 px-2 py-1.5 bg-surface border border-primary/20 rounded-control text-sm text-center font-bold text-text-primary"
                        />
                        <select
                            value={searchUnit}
                            onChange={(e) =>
                                setSearchUnit(e.target.value as 'g' | 'serving')
                            }
                            className="flex-1 px-2 py-1.5 bg-surface border border-primary/20 rounded-control text-sm text-text-primary">
                            <option value="g">{t('modals.foods.grams')}</option>
                            <option value="serving">
                                {t('modals.foods.serving')}{' '}
                                {selectedSearchFood.servingSizeGrams &&
                                    `(${selectedSearchFood.servingSizeGrams}g)`}
                            </option>
                        </select>
                    </div>

                    {/* Preview macros */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-warning">
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
                        onClick={onApply}
                        className="w-full mt-2 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-control transition-colors">
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
    );
};

// Source badge component
const SourceBadge: React.FC<{ source: FoodSearchResult['source'] }> = ({
    source,
}) => {
    const isOFF = source === 'openfoodfacts';
    return (
        <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                isOFF
                    ? 'bg-success-soft text-success'
                    : 'bg-primary-soft text-primary'
            }`}>
            {isOFF ? <Globe size={8} /> : <Database size={8} />}
            {isOFF ? 'OFF' : 'USDA'}
        </span>
    );
};
