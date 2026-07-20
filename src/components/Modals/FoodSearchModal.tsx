/**
 * FoodSearchModal - Search foods from OpenFoodFacts + USDA databases
 * Allows users to search by food name, select, and log with custom amounts
 */

import { Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { useFoodSearch } from '../../hooks/useFoodSearch';
import { useSmartMealType } from '../../hooks/useSmartMealType';
import { FoodEntry } from '../../types/domain';
import { getArgentinaDateString, getCurrentTimeString } from '../../utils/dateUtils';
import { Button } from '../UI/Button';
import { ModalShell } from '../UI/ModalShell';
import { FoodSearchResults } from './FoodSearchResults';
import { FoodSearchSelected } from './FoodSearchSelected';

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

    const { t } = useTranslation();
    const { saveFoodEntry, setSaveStatus, selectedFoodDate } = useTracker();
    const { getAutoMealType } = useSmartMealType();
    const inputRef = useRef<HTMLInputElement>(null);

    // Meal selection - auto-detect based on current time
    const [selectedMeal, setSelectedMeal] =
        useState<FoodEntry['meal']>(getAutoMealType());
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
                time: getCurrentTimeString(),
                meal: selectedMeal,
                name: selectedFood.brand
                    ? `${selectedFood.name} (${selectedFood.brand})`
                    : selectedFood.name,
                description: `${amount}${unit === 'g' ? 'g' : ` ${t('modals.foods.serving')}`}${amount > 1 ? 's' : ''} - via search`,
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
            setSaveStatus(t('modals.foods.added'));
            setTimeout(() => setSaveStatus(''), 2000);

            onClose();
        } catch (err) {
            console.error('[FoodSearchModal] Error saving:', err);
            setSaveStatus(t('modals.foods.error'));
            setTimeout(() => setSaveStatus(''), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            title={t('modals.foods.searchTitle')}
            footer={
                selectedFood ? (
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleSave}
                        loading={isSaving}
                        disabled={isSaving || amount <= 0}>
                        {isSaving
                            ? t('modals.foods.saving')
                            : t('modals.foods.save')}
                    </Button>
                ) : undefined
            }>
            {/* Search Input */}
            <div className="relative mb-4">
                <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('modals.foods.placeholder')}
                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-control text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        aria-label={t('a11y.clearSearch')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-lighter text-text-tertiary hover:bg-surface-lighter">
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Results or Selected Food */}
            <div className="max-h-[50vh] overflow-y-auto">
                <FoodSearchResults
                    isLoading={isLoading}
                    error={error}
                    hasSearched={hasSearched}
                    results={results}
                    selectedFood={selectedFood}
                    onSelect={setSelectedFood}
                />

                {/* Selected Food Editor */}
                {selectedFood && calculatedMacros && (
                    <FoodSearchSelected
                        selectedFood={selectedFood}
                        calculatedMacros={calculatedMacros}
                        amount={amount}
                        setAmount={setAmount}
                        unit={unit}
                        setUnit={setUnit}
                        selectedMeal={selectedMeal}
                        setSelectedMeal={setSelectedMeal}
                        onBack={clearSelection}
                    />
                )}
            </div>
        </ModalShell>
    );
};
