import {
    ChefHat,
    Loader2,
    RefreshCw,
    Settings,
    Sparkles,
    UtensilsCrossed,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import {
    generateRecipeInstructions,
    MealSuggestion,
    RecipeDetail,
} from '../../services/ai/mealService';
import { AIChefMealTime, FoodEntry } from '../../types/domain';
import {
    AIChefContextBanner,
    AIChefRecipeDetail,
    AIChefSuggestionCard,
    getMealCalorieBudget,
} from './AIChefCards';
import { AIChefIngredientInput, AIChefPreferencesPanel } from './AIChefPanels';

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

    // Get effective meal type (respects user override)
    const inferMealType = (): 'breakfast' | 'lunch' | 'snack' | 'dinner' => {
        return effectiveMealTime || 'lunch';
    };

    // Handle add suggestion to diary
    const handleAddSuggestion = async (suggestion: MealSuggestion) => {
        const now = new Date();
        const time = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        });

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-3xl w-full max-w-md border border-purple-200 dark:border-purple-800 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

                {/* Header */}
                <div className="flex justify-between items-center p-6 pb-4 relative">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-purple-500/20">
                            <ChefHat size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-text-primary tracking-tight">
                                {t('aiChef.title')}
                            </h3>
                            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">
                                {t('aiChef.subtitle')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-lighter text-text-tertiary hover:text-text-secondary hover:bg-surface-lighter transition-colors">
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-6 mb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setAIChefTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                aiChefTab === tab.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-background dark:bg-surface-lighter text-text-tertiary hover:text-text-secondary'
                            }`}>
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {aiChefTab === 'suggestions' && (
                        <>
                            <AIChefContextBanner
                                mealTime={effectiveMealTime}
                                isTrainingDay={isTrainingDay}
                                remainingCalories={remaining.calories}
                                mealBudgetCalories={mealBudget.calories}
                                onMealTimeChange={setSelectedMealTime}
                            />

                            {selectedSuggestion ? (
                                <AIChefRecipeDetail
                                    suggestion={selectedSuggestion}
                                    recipe={recipeDetail}
                                    loading={recipeLoading}
                                    onAdd={() => handleAddSuggestion(selectedSuggestion)}
                                    onBack={handleBackFromRecipe}
                                />
                            ) : loading ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <Loader2
                                        size={40}
                                        className="text-purple-600 animate-spin mb-4"
                                    />
                                    <p className="text-text-primary font-bold mb-1">
                                        {t('modals.aiSuggestion.loading')}
                                    </p>
                                    <p className="text-xs text-text-tertiary">
                                        {t('modals.aiSuggestion.loadingSubtitle')}
                                    </p>
                                </div>
                            ) : error ? (
                                <div className="py-8 text-center">
                                    <p className="text-red-500 font-medium mb-2">{error}</p>
                                    <button
                                        onClick={handleRegenerate}
                                        className="text-sm font-bold text-purple-600 hover:text-purple-700 underline">
                                        {t('aiChef.tryAgain')}
                                    </button>
                                </div>
                            ) : suggestions.length === 0 ? (
                                <div className="py-12 text-center">
                                    <ChefHat
                                        size={48}
                                        className="text-purple-300 dark:text-purple-700 mx-auto mb-4"
                                    />
                                    <p className="text-text-secondary font-medium mb-4">
                                        {t('aiChef.noSuggestions')}
                                    </p>
                                    <button
                                        onClick={handleRegenerate}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 mx-auto">
                                        <Sparkles size={16} />
                                        {t('aiChef.generateSuggestions')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {suggestions.map((suggestion: MealSuggestion, idx: number) => (
                                        <AIChefSuggestionCard
                                            key={idx}
                                            suggestion={suggestion}
                                            onAdd={() => handleAddSuggestion(suggestion)}
                                            onReject={() => rejectSuggestion(suggestion.name)}
                                            onViewRecipe={() => handleViewRecipe(suggestion)}
                                        />
                                    ))}

                                    <button
                                        onClick={handleRegenerate}
                                        disabled={loading}
                                        className="w-full py-3 mt-4 bg-background dark:bg-surface-lighter text-text-secondary rounded-xl font-bold text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-center gap-2">
                                        <RefreshCw size={16} />
                                        {t('aiChef.regenerate')}
                                    </button>
                                </div>
                            )}
                        </>
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
                </div>
            </div>
        </div>
    );
};
