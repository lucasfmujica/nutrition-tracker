import { ChefHat, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MealSuggestion, RecipeDetail } from '../../services/ai/mealService';
import { AIChefMealTime } from '../../types/domain';
import {
    AIChefContextBanner,
    AIChefRecipeDetail,
    AIChefSuggestionCard,
} from './AIChefCards';

interface AIMealSuggestionContentProps {
    suggestions: MealSuggestion[];
    loading: boolean;
    error: string | null;
    effectiveMealTime: AIChefMealTime;
    isTrainingDay: boolean;
    remainingCalories: number;
    mealBudgetCalories: number;
    onMealTimeChange: (mealTime: AIChefMealTime) => void;
    selectedSuggestion: MealSuggestion | null;
    recipeDetail: RecipeDetail | null;
    recipeLoading: boolean;
    onAdd: (suggestion: MealSuggestion) => void;
    onReject: (name: string) => void;
    onViewRecipe: (suggestion: MealSuggestion) => void;
    onBack: () => void;
    onRegenerate: () => void;
}

/**
 * AIMealSuggestionContent - "Suggestions" tab of the AI Chef modal:
 * context banner + recipe detail / loading / error / empty / list states.
 */
export const AIMealSuggestionContent: React.FC<AIMealSuggestionContentProps> = ({
    suggestions,
    loading,
    error,
    effectiveMealTime,
    isTrainingDay,
    remainingCalories,
    mealBudgetCalories,
    onMealTimeChange,
    selectedSuggestion,
    recipeDetail,
    recipeLoading,
    onAdd,
    onReject,
    onViewRecipe,
    onBack,
    onRegenerate,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <AIChefContextBanner
                mealTime={effectiveMealTime}
                isTrainingDay={isTrainingDay}
                remainingCalories={remainingCalories}
                mealBudgetCalories={mealBudgetCalories}
                onMealTimeChange={onMealTimeChange}
            />

            {selectedSuggestion ? (
                <AIChefRecipeDetail
                    suggestion={selectedSuggestion}
                    recipe={recipeDetail}
                    loading={recipeLoading}
                    onAdd={() => onAdd(selectedSuggestion)}
                    onBack={onBack}
                />
            ) : loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Loader2
                        size={40}
                        className="text-oura animate-spin mb-4"
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
                    <p className="text-danger font-medium mb-2">{error}</p>
                    <button
                        onClick={onRegenerate}
                        className="text-sm font-bold text-oura hover:text-oura underline">
                        {t('aiChef.tryAgain')}
                    </button>
                </div>
            ) : suggestions.length === 0 ? (
                <div className="py-12 text-center">
                    <ChefHat size={48} className="text-oura mx-auto mb-4" />
                    <p className="text-text-secondary font-medium mb-4">
                        {t('aiChef.noSuggestions')}
                    </p>
                    <button
                        onClick={onRegenerate}
                        className="px-6 py-3 bg-gradient-to-r from-oura to-oura text-white rounded-control font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 mx-auto">
                        <Sparkles size={16} />
                        {t('aiChef.generateSuggestions')}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {suggestions.map(
                        (suggestion: MealSuggestion, idx: number) => (
                            <AIChefSuggestionCard
                                key={idx}
                                suggestion={suggestion}
                                onAdd={() => onAdd(suggestion)}
                                onReject={() => onReject(suggestion.name)}
                                onViewRecipe={() => onViewRecipe(suggestion)}
                            />
                        ),
                    )}

                    <button
                        onClick={onRegenerate}
                        disabled={loading}
                        className="w-full py-3 mt-4 bg-background dark:bg-surface-lighter text-text-secondary rounded-control font-bold text-sm hover:bg-oura-soft transition-all flex items-center justify-center gap-2">
                        <RefreshCw size={16} />
                        {t('aiChef.regenerate')}
                    </button>
                </div>
            )}
        </>
    );
};
