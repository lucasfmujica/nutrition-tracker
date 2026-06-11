import { formatDistanceToNow } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { Clock, Search, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFoodHistorySearch } from '../../hooks/useFoodHistorySearch';
import { FoodEntry } from '../../types/domain';

interface FoodHistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    foodLog: FoodEntry[];
    onSelectFood: (food: FoodEntry) => void;
}

/**
 * FoodHistoryPanel - Search and select from previously logged foods
 * Floating panel accessible from FAB showing recent foods and search
 */
export const FoodHistoryPanel: React.FC<FoodHistoryPanelProps> = ({
    isOpen,
    onClose,
    foodLog,
    onSelectFood,
}) => {
    const { t, i18n } = useTranslation();
    const {
        searchQuery,
        setSearchQuery,
        filteredFoods,
        recentFoods,
        hasResults,
        hasSearch,
    } = useFoodHistorySearch(foodLog);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset search when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen, setSearchQuery]);

    if (!isOpen) return null;

    const displayFoods = hasSearch ? filteredFoods : recentFoods;

    const formatLastSeen = (date: string) => {
        try {
            const foodDate = new Date(date);
            const dateLocale = i18n.language === 'es' ? es : enUS;
            return formatDistanceToNow(foodDate, {
                addSuffix: true,
                locale: dateLocale,
            });
        } catch {
            return date;
        }
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 sm:pt-20 overflow-y-auto"
            onClick={onClose}>
            <div
                className="bg-surface rounded-3xl w-full max-w-md shadow-2xl border border-border mb-24"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Clock className="text-indigo-600 dark:text-indigo-400" size={20} />
                        <h2 className="text-lg font-bold text-text-primary">
                            {t('food.history.title')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                    aria-label={t('common.close')}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-lighter text-text-tertiary hover:bg-surface-lighter transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('food.history.searchPlaceholder')}
                            className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-2xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                aria-label={t('a11y.clearSearch')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-lighter text-text-tertiary hover:bg-surface-lighter">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto">
                    {/* Section Header */}
                    {!hasSearch && (
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                                {t('food.history.recent')}
                            </div>
                            <div className="flex-1 h-px bg-surface-lighter" />
                        </div>
                    )}

                    {/* Empty State */}
                    {displayFoods.length === 0 && (
                        <div className="text-center py-8 text-text-tertiary">
                            {hasSearch ? (
                                <>
                                    <Search
                                        size={32}
                                        className="mx-auto mb-2 opacity-50"
                                    />
                                    <p>{t('food.history.noResults')}</p>
                                    <p className="text-xs mt-1">
                                        {t('food.history.tryAgain')}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Clock
                                        size={32}
                                        className="mx-auto mb-2 opacity-50"
                                    />
                                    <p>{t('food.history.empty')}</p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Food List */}
                    <div className="space-y-2">
                        {displayFoods.map((food) => (
                            <FoodHistoryItem
                                key={`${food.id}-${food.date}`}
                                food={food}
                                onSelect={() => {
                                    onSelectFood(food);
                                    onClose();
                                }}
                                lastSeen={formatLastSeen(food.date)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Food History Item Component
const FoodHistoryItem: React.FC<{
    food: FoodEntry;
    onSelect: () => void;
    lastSeen: string;
}> = ({ food, onSelect, lastSeen }) => (
    <button
        onClick={onSelect}
        className="w-full text-left p-3 bg-background hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-colors group border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800">
        <div className="flex justify-between items-start mb-1">
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-text-primary truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {food.name}
                </h3>
                {food.description && (
                    <p className="text-xs text-text-tertiary truncate">
                        {food.description}
                    </p>
                )}
            </div>
        </div>
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-orange-600 dark:text-orange-400">
                    {food.calories} kcal
                </span>
                <span className="text-green-600 dark:text-green-400">P: {food.protein}g</span>
            </div>
            <span className="text-[10px] text-text-tertiary">{lastSeen}</span>
        </div>
    </button>
);
