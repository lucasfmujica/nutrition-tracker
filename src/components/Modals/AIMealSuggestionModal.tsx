import { ChefHat, Settings, Sparkles, UtensilsCrossed } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIMeals } from '../../context/AIMealSuggestionsContext';
import { useTracker } from '../../context/TrackerContext';
import { getCurrentTimeString } from '../../utils/dateUtils';
import {
    generateRecipeInstructions,
    MealSuggestion,
    RecipeDetail,
} from '../../services/ai/mealService';
import { AIChefMealTime, FoodEntry } from '../../types/domain';
import { ModalShell } from '../UI/ModalShell';
import { getMealCalorieBudget } from './AIChefCards';
import { AIChefIngredientInput, AIChefPreferencesPanel } from './AIChefPanels';
import { AIMealSuggestionContent } from './AIMealSuggestionContent';

// =====================================================
// MAIN MODAL COMPONENT
// =====================================================

interface AIMealSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabId = 'suggestions' | 'ingredients' | 'config';

export const AIMealSuggestionModal: React.FC<AIMealSuggestionModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { t, i18n } = useTranslation();
    const {
        // AI Chef state
        suggestions,
        loading,
        error,
        aiChefTab,
        setAIChefTab,
        preferences,
        updatePreferences,
        ingredientInput,
        setIngredientInput,
        ingredients,
        addIngredient,
        removeIngredient,
        getContextualSuggestions,
        getSuggestionsFromIngredients,
        rejectSuggestion,
        currentMealTime,
    } = useAIMeals();
    const {
        // Tracker state
        saveFoodEntry,
        selectedFoodDate,
        getTotalsForDate,
        getTargetsForDate,
        workoutLog,
    } = useTracker() as any;

    // Local state for meal time override
    const [selectedMealTime, setSelectedMealTime] = useState<AIChefMealTime | null>(null);

    // Recipe detail state
    const [selectedSuggestion, setSelectedSuggestion] = useState<MealSuggestion | null>(null);
    const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
    const [recipeLoading, setRecipeLoading] = useState(false);

    // Use override if set, otherwise use current meal time
    const effectiveMealTime = selectedMealTime || currentMealTime;

    // Calculate remaining macros (full day)
    const remaining = useMemo(() => {
        const totals = getTotalsForDate?.(selectedFoodDate) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
        const targets = getTargetsForDate?.(selectedFoodDate) || { calories: 2000, protein: 150, carbs: 200, fat: 70 };
        return {
            calories: Math.max(0, targets.calories - totals.calories),
            protein: Math.max(0, targets.protein - totals.protein),
            carbs: Math.max(0, targets.carbs - totals.carbs),
            fat: Math.max(0, targets.fat - totals.fat),
            fiber: 0,
        };
    }, [getTotalsForDate, getTargetsForDate, selectedFoodDate]);

    // Calculate per-meal budget
    const mealBudget = useMemo(() => {
        return getMealCalorieBudget(remaining, effectiveMealTime);
    }, [remaining, effectiveMealTime]);

    // Check if training day
    const isTrainingDay = useMemo(() => {
        return workoutLog?.some((w: any) => w.date === selectedFoodDate) || false;
    }, [workoutLog, selectedFoodDate]);

    // Get effective meal type (respects user override). A 'late_night' meal is
    // logged to the diary as 'dinner' (the diary has no late-night meal type).
    const inferMealType = (): 'breakfast' | 'lunch' | 'snack' | 'dinner' => {
        if (effectiveMealTime === 'late_night') return 'dinner';
        return effectiveMealTime || 'lunch';
    };

    // Handle add suggestion to diary
    const handleAddSuggestion = async (suggestion: MealSuggestion) => {
        const time = getCurrentTimeString();

        const entry: FoodEntry = {
            id: crypto.randomUUID(),
            date: selectedFoodDate,
            time,
            meal: inferMealType(),
            name: suggestion.name,
            description: suggestion.description,
            calories: suggestion.macros.calories,
            protein: suggestion.macros.protein,
            carbs: suggestion.macros.carbs,
            fat: suggestion.macros.fat,
            fiber: 0,
            source: 'ai-text',
            reviewed: true,
            confidence: 0.9,
            sourceId: null,
        };

        try {
            await saveFoodEntry(entry);
            onClose();
        } catch (err) {
            console.error('[AIMealSuggestionModal] Error adding suggestion:', err);
        }
    };

    // Handle regenerate (uses per-meal budget)
    const handleRegenerate = () => {
        setSelectedSuggestion(null);
        setRecipeDetail(null);
        getContextualSuggestions(mealBudget, isTrainingDay, null, effectiveMealTime);
    };

    // Handle ingredient search (uses per-meal budget)
    const handleIngredientSearch = () => {
        getSuggestionsFromIngredients(mealBudget, isTrainingDay, null, effectiveMealTime);
    };

    // Handle apply config and regenerate (uses per-meal budget)
    const handleApplyAndRegenerate = () => {
        setAIChefTab('suggestions');
        getContextualSuggestions(mealBudget, isTrainingDay, null, effectiveMealTime);
    };

    // Handle viewing recipe detail
    const handleViewRecipe = useCallback(async (suggestion: MealSuggestion) => {
        setSelectedSuggestion(suggestion);
        setRecipeDetail(null);
        setRecipeLoading(true);
        try {
            const result = await generateRecipeInstructions(suggestion, i18n.language);
            setRecipeDetail(result);
        } catch (err) {
            console.error('[AIMealSuggestionModal] Error generating recipe:', err);
        } finally {
            setRecipeLoading(false);
        }
    }, [i18n.language]);

    // Handle back from recipe detail
    const handleBackFromRecipe = () => {
        setSelectedSuggestion(null);
        setRecipeDetail(null);
    };

    if (!isOpen) return null;

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'suggestions', label: t('aiChef.tabs.suggestions'), icon: <Sparkles size={16} /> },
        { id: 'ingredients', label: t('aiChef.tabs.ingredients'), icon: <UtensilsCrossed size={16} /> },
        { id: 'config', label: t('aiChef.tabs.config'), icon: <Settings size={16} /> },
    ];

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            title={t('aiChef.title')}
            subtitle={t('aiChef.subtitle')}
            icon={<ChefHat size={20} />}
            size="md">
            {/* Tabs */}
            <div className="flex gap-1 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setAIChefTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-control text-xs font-bold transition-all ${
                            aiChefTab === tab.id
                                ? 'bg-oura text-white'
                                : 'bg-background dark:bg-surface-lighter text-text-tertiary hover:text-text-secondary'
                        }`}>
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {aiChefTab === 'suggestions' && (
                <AIMealSuggestionContent
                    suggestions={suggestions}
                    loading={loading}
                    error={error}
                    effectiveMealTime={effectiveMealTime}
                    isTrainingDay={isTrainingDay}
                    remainingCalories={remaining.calories}
                    mealBudgetCalories={mealBudget.calories}
                    onMealTimeChange={setSelectedMealTime}
                    selectedSuggestion={selectedSuggestion}
                    recipeDetail={recipeDetail}
                    recipeLoading={recipeLoading}
                    onAdd={handleAddSuggestion}
                    onReject={rejectSuggestion}
                    onViewRecipe={handleViewRecipe}
                    onBack={handleBackFromRecipe}
                    onRegenerate={handleRegenerate}
                />
            )}

            {aiChefTab === 'ingredients' && (
                <AIChefIngredientInput
                    value={ingredientInput}
                    onChange={setIngredientInput}
                    onAdd={() => addIngredient(ingredientInput)}
                    ingredients={ingredients}
                    onRemove={removeIngredient}
                    onSearch={handleIngredientSearch}
                    loading={loading}
                />
            )}

            {aiChefTab === 'config' && (
                <AIChefPreferencesPanel
                    preferences={preferences}
                    onUpdate={updatePreferences}
                    onApplyAndRegenerate={handleApplyAndRegenerate}
                    loading={loading}
                />
            )}
        </ModalShell>
    );
};
