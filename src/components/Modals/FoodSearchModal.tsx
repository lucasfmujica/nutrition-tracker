/**
 * FoodSearchModal - Search foods from OpenFoodFacts + USDA databases
 * Allows users to search by food name, select, and log with custom amounts
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2, Database, Globe, ChevronDown } from 'lucide-react';
import { useFoodSearch } from '../../hooks/useFoodSearch';
import { useSmartMealType } from '../../hooks/useSmartMealType';
import { useTracker } from '../../context/TrackerContext';
import type { FoodSearchResult } from '../../services/foodApi/types';
import { FoodEntry } from '../../types/domain';
import { getArgentinaDateString } from '../../utils/dateUtils';

interface FoodSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
    isOpen,
    onClose,
}) => {
    const {
        query,
        setQuery,
        results,
        isLoading,
        error,
        hasSearched,
        selectedFood,
        setSelectedFood,
        amount,
        setAmount,
        unit,
        setUnit,
        calculatedMacros,
        clearSearch,
        clearSelection,
    } = useFoodSearch();

    const { saveFoodEntry, setSaveStatus, selectedFoodDate } = useTracker();
    const { getAutoMealType } = useSmartMealType();
    const inputRef = useRef<HTMLInputElement>(null);

    // Meal selection - auto-detect based on current time
    const [selectedMeal, setSelectedMeal] = useState<FoodEntry['meal']>(getAutoMealType());
    const [isSaving, setIsSaving] = useState(false);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            clearSearch();
            clearSelection();
            setSelectedMeal(getAutoMealType());
        }
    }, [isOpen, clearSearch, clearSelection, getAutoMealType]);

    const handleSave = async () => {
        if (!selectedFood || !calculatedMacros) return;

        setIsSaving(true);

        try {
            const entry: FoodEntry = {
                id: crypto.randomUUID(),
                date: selectedFoodDate || getArgentinaDateString(),
                time: new Date().toLocaleTimeString('es-AR', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }),
                meal: selectedMeal,
                name: selectedFood.brand
                    ? `${selectedFood.name} (${selectedFood.brand})`
                    : selectedFood.name,
                description: `${amount}${unit === 'g' ? 'g' : ' porción(es)'} - vía búsqueda`,
                calories: calculatedMacros.calories,
                protein: calculatedMacros.protein,
                carbs: calculatedMacros.carbs,
                fat: calculatedMacros.fat,
                fiber: calculatedMacros.fiber,
                source: 'barcode', // Using 'barcode' as it's closest to API search
                reviewed: true,
                confidence: 0.95,
                sourceId: selectedFood.id,
            };

            await saveFoodEntry(entry);
            setSaveStatus('✓ Alimento agregado');
            setTimeout(() => setSaveStatus(''), 2000);

            onClose();
        } catch (err) {
            console.error('[FoodSearchModal] Error saving:', err);
            setSaveStatus('❌ Error al guardar');
            setTimeout(() => setSaveStatus(''), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 sm:pt-20 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 mb-24"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-slate-900">
                        Buscar Alimento
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
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
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre o marca..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results or Selected Food */}
                <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 size={24} className="animate-spin text-blue-500" />
                            <span className="ml-2 text-slate-500">Buscando...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="text-center py-6 text-slate-500 text-sm">
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
                                    onSelect={() => setSelectedFood(food)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !selectedFood && hasSearched && results.length === 0 && !error && (
                        <div className="text-center py-8 text-slate-400">
                            <Database size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No se encontraron resultados</p>
                            <p className="text-xs mt-1">Probá con otro término de búsqueda</p>
                        </div>
                    )}

                    {/* Selected Food Editor */}
                    {selectedFood && calculatedMacros && (
                        <div className="space-y-4">
                            {/* Back Button */}
                            <button
                                onClick={clearSelection}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                ← Volver a resultados
                            </button>

                            {/* Selected Food Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
                                <div className="flex gap-3">
                                    {selectedFood.imageUrl && (
                                        <img
                                            src={selectedFood.imageUrl}
                                            alt={selectedFood.name}
                                            className="w-16 h-16 rounded-xl object-cover bg-white"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate">
                                            {selectedFood.name}
                                        </h3>
                                        {selectedFood.brand && (
                                            <p className="text-sm text-slate-500 truncate">
                                                {selectedFood.brand}
                                            </p>
                                        )}
                                        <SourceBadge source={selectedFood.source} />
                                    </div>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                        Unidad
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value as 'g' | 'serving')}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="g">gramos</option>
                                            <option value="serving">
                                                porción {selectedFood.servingSizeGrams && `(${selectedFood.servingSizeGrams}g)`}
                                            </option>
                                        </select>
                                        <ChevronDown
                                            size={16}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Meal Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                    Comida
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedMeal}
                                        onChange={(e) => setSelectedMeal(e.target.value as FoodEntry['meal'])}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Desayuno">Desayuno</option>
                                        <option value="Almuerzo">Almuerzo</option>
                                        <option value="Merienda">Merienda</option>
                                        <option value="Cena">Cena</option>
                                        <option value="Snack">Snack</option>
                                        <option value="Pre-entreno">Pre-entreno</option>
                                        <option value="Post-entreno">Post-entreno</option>
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />
                                </div>
                            </div>

                            {/* Calculated Macros */}
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <div className="grid grid-cols-5 gap-2 text-center">
                                    <MacroValue label="Cal" value={calculatedMacros.calories} unit="" highlight />
                                    <MacroValue label="Prot" value={calculatedMacros.protein} unit="g" />
                                    <MacroValue label="Carbs" value={calculatedMacros.carbs} unit="g" />
                                    <MacroValue label="Grasa" value={calculatedMacros.fat} unit="g" />
                                    <MacroValue label="Fibra" value={calculatedMacros.fiber} unit="g" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                {selectedFood && (
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || amount <= 0}
                            className="w-full bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:from-slate-300 disabled:to-slate-400 py-4 rounded-2xl text-white font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-components

const FoodResultItem: React.FC<{
    food: FoodSearchResult;
    onSelect: () => void;
}> = ({ food, onSelect }) => (
    <button
        onClick={onSelect}
        className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors group"
    >
        <div className="flex gap-3">
            {food.imageUrl && (
                <img
                    src={food.imageUrl}
                    alt={food.name}
                    className="w-12 h-12 rounded-xl object-cover bg-white flex-shrink-0"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {food.name}
                        </p>
                        {food.brand && (
                            <p className="text-xs text-slate-500 truncate">{food.brand}</p>
                        )}
                    </div>
                    <SourceBadge source={food.source} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="font-bold text-orange-600">{food.calories} kcal</span>
                    <span>P: {food.protein}g</span>
                    <span>C: {food.carbs}g</span>
                    <span>G: {food.fat}g</span>
                </div>
            </div>
        </div>
    </button>
);

const SourceBadge: React.FC<{ source: FoodSearchResult['source'] }> = ({ source }) => {
    const isOFF = source === 'openfoodfacts';
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isOFF
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
            }`}
        >
            {isOFF ? <Globe size={10} /> : <Database size={10} />}
            {isOFF ? 'OFF' : 'USDA'}
        </span>
    );
};

const MacroValue: React.FC<{
    label: string;
    value: number;
    unit: string;
    highlight?: boolean;
}> = ({ label, value, unit, highlight }) => (
    <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
        </p>
        <p className={`text-lg font-bold ${highlight ? 'text-orange-600' : 'text-slate-900'}`}>
            {value}
            <span className="text-xs font-normal text-slate-400">{unit}</span>
        </p>
    </div>
);
