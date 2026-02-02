import { Clock, Search, X } from 'lucide-react';
import React, { useRef, useEffect } from 'react';
import { FoodEntry } from '../../types/domain';
import { useFoodHistorySearch } from '../../hooks/useFoodHistorySearch';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
    const { searchQuery, setSearchQuery, filteredFoods, recentFoods, hasResults, hasSearch } =
        useFoodHistorySearch(foodLog);
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
            return formatDistanceToNow(foodDate, { addSuffix: true, locale: es });
        } catch {
            return date;
        }
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 sm:pt-20 overflow-y-auto"
            onClick={onClose}>
            <div
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 mb-24"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Clock className="text-indigo-600" size={20} />
                        <h2 className="text-lg font-bold text-slate-900">Historial de Comidas</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar pollo, arroz..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300">
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
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Recientes
                            </div>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>
                    )}

                    {/* Empty State */}
                    {displayFoods.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            {hasSearch ? (
                                <>
                                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No se encontraron resultados</p>
                                    <p className="text-xs mt-1">
                                        Probá con otro término de búsqueda
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Clock size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No hay comidas registradas</p>
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
        className="w-full text-left p-3 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-colors group border border-transparent hover:border-indigo-100">
        <div className="flex justify-between items-start mb-1">
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {food.name}
                </h3>
                {food.description && (
                    <p className="text-xs text-slate-500 truncate">{food.description}</p>
                )}
            </div>
        </div>
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-orange-600">{food.calories} kcal</span>
                <span className="text-green-600">P: {food.protein}g</span>
            </div>
            <span className="text-[10px] text-slate-400">{lastSeen}</span>
        </div>
    </button>
);
