import { Database, Globe, Loader2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FoodSearchResult } from '../../services/foodApi/types';

interface FoodSearchResultsProps {
    isLoading: boolean;
    error: string | null;
    hasSearched: boolean;
    results: FoodSearchResult[];
    selectedFood: FoodSearchResult | null;
    onSelect: (food: FoodSearchResult) => void;
}

/**
 * FoodSearchResults - Loading/error/empty states and results list
 * for FoodSearchModal.
 */
export const FoodSearchResults: React.FC<FoodSearchResultsProps> = ({
    isLoading,
    error,
    hasSearched,
    results,
    selectedFood,
    onSelect,
}) => {
    const { t } = useTranslation();

    return (
        <>
            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <span className="ml-2 text-text-tertiary">
                        {t('modals.foods.searching')}
                    </span>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="text-center py-6 text-text-tertiary text-sm">
                    {error}
                </div>
            )}

            {/* Results List */}
            {!isLoading && !selectedFood && results.length > 0 && (
                <div className="space-y-2">
                    {results.map((food) => (
                        <FoodResultItem
                            key={food.id}
                            food={food}
                            onSelect={() => onSelect(food)}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading &&
                !selectedFood &&
                hasSearched &&
                results.length === 0 &&
                !error && (
                    <div className="text-center py-8 text-text-tertiary">
                        <Database
                            size={32}
                            className="mx-auto mb-2 opacity-50"
                        />
                        <p>{t('modals.foods.noResults')}</p>
                        <p className="text-xs mt-1">
                            {t('modals.foods.tryAnother')}
                        </p>
                    </div>
                )}
        </>
    );
};

const FoodResultItem: React.FC<{
    food: FoodSearchResult;
    onSelect: () => void;
}> = ({ food, onSelect }) => (
    <button
        onClick={onSelect}
        className="w-full text-left p-3 bg-background hover:bg-surface-lighter rounded-card transition-colors group">
        <div className="flex gap-3">
            {food.imageUrl && (
                <img
                    src={food.imageUrl}
                    alt={food.name}
                    className="w-12 h-12 rounded-control object-cover bg-surface flex-shrink-0"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                            {food.name}
                        </p>
                        {food.brand && (
                            <p className="text-xs text-text-tertiary truncate">
                                {food.brand}
                            </p>
                        )}
                    </div>
                    <SourceBadge source={food.source} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                    <span className="font-bold text-warning">
                        {food.calories} kcal
                    </span>
                    <span>P: {food.protein}g</span>
                    <span>C: {food.carbs}g</span>
                    <span>G: {food.fat}g</span>
                </div>
            </div>
        </div>
    </button>
);

export const SourceBadge: React.FC<{ source: FoodSearchResult['source'] }> = ({
    source,
}) => {
    const isOFF = source === 'openfoodfacts';
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isOFF
                    ? 'bg-success-soft text-success'
                    : 'bg-primary-soft text-primary'
            }`}>
            {isOFF ? <Globe size={10} /> : <Database size={10} />}
            {isOFF ? 'OFF' : 'USDA'}
        </span>
    );
};
