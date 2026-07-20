import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateMacros, searchFoods } from '../../services/foodApi';
import type { FoodSearchResult } from '../../services/foodApi/types';
import { FoodEntry } from '../../types/domain';
import { Button } from '../UI/Button';
import { ModalShell } from '../UI/ModalShell';
import { FoodFormFields } from './FoodFormFields';
import { FoodFormSearch } from './FoodFormSearch';

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
    const [, setSelectedFromSearch] = useState(false);

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

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            title={
                isEditing
                    ? `✏️ ${t('modals.foodForm.titleEdit')}`
                    : `🍽️ ${t('modals.foodForm.titleAdd')}`
            }
            footer={
                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={onClose}>
                        {t('modals.foodForm.cancel')}
                    </Button>
                    <Button variant="primary" fullWidth onClick={onSubmit}>
                        {isEditing ? t('common.save') : t('modals.foodForm.save')}
                    </Button>
                </div>
            }>
            <div className="space-y-4">
                {/* Search Section (only when not editing) */}
                {!isEditing && (
                    <FoodFormSearch
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchResults={searchResults}
                        setSearchResults={setSearchResults}
                        isSearching={isSearching}
                        showResults={showResults}
                        setShowResults={setShowResults}
                        setSelectedFromSearch={setSelectedFromSearch}
                        selectedSearchFood={selectedSearchFood}
                        setSelectedSearchFood={setSelectedSearchFood}
                        searchAmount={searchAmount}
                        setSearchAmount={setSearchAmount}
                        searchUnit={searchUnit}
                        setSearchUnit={setSearchUnit}
                        previewMacros={previewMacros}
                        resultsRef={resultsRef}
                        searchInputRef={searchInputRef}
                        onSelectResult={handleSelectSearchResult}
                        onApply={applySearchSelection}
                    />
                )}

                <FoodFormFields food={food} onFoodChange={onFoodChange} />
            </div>
        </ModalShell>
    );
};
