import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Clock,
    Dumbbell,
    Loader2,
    Plus,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MealSuggestion, RecipeDetail } from '../../services/ai/mealService';
import { AIChefMealTime } from '../../types/domain';

// =====================================================
// MEAL CALORIE DISTRIBUTION
// =====================================================

const MEAL_DISTRIBUTION: Record<AIChefMealTime, number> = {
    breakfast: 0.20,
    lunch: 0.35,
    snack: 0.15,
    dinner: 0.25,
    late_night: 0.05,
};

const MEAL_ORDER: AIChefMealTime[] = ['breakfast', 'lunch', 'snack', 'dinner', 'late_night'];

export interface MealMacros {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

/**
 * Calculate per-meal macro budget based on remaining daily macros
 * and which meals are still ahead in the day.
 */
export const getMealCalorieBudget = (
    remaining: MealMacros,
    currentMeal: AIChefMealTime,
): MealMacros => {
    const currentIdx = MEAL_ORDER.indexOf(currentMeal);
    const currentPct = MEAL_DISTRIBUTION[currentMeal];

    const futurePct = MEAL_ORDER
        .slice(currentIdx + 1)
        .reduce((sum, meal) => sum + MEAL_DISTRIBUTION[meal], 0);

    const totalPct = currentPct + futurePct;
    const ratio = totalPct > 0 ? currentPct / totalPct : 1;

    return {
        calories: Math.round(remaining.calories * ratio),
        protein: Math.round(remaining.protein * ratio),
        carbs: Math.round(remaining.carbs * ratio),
        fat: Math.round(remaining.fat * ratio),
        fiber: 0,
    };
};

// =====================================================
// CONTEXT BANNER
// =====================================================

interface ContextBannerProps {
    mealTime: AIChefMealTime;
    isTrainingDay: boolean;
    remainingCalories: number;
    mealBudgetCalories: number;
    onMealTimeChange: (mealTime: AIChefMealTime) => void;
}

export const AIChefContextBanner: React.FC<ContextBannerProps> = ({
    mealTime,
    isTrainingDay,
    remainingCalories,
    mealBudgetCalories,
    onMealTimeChange,
}) => {
    const { t, i18n } = useTranslation();
    const [showSelector, setShowSelector] = useState(false);

    const mealTimeLabels: Record<AIChefMealTime, string> = {
        breakfast: t('mealTypes.breakfast'),
        lunch: t('mealTypes.lunch'),
        snack: t('mealTypes.snack'),
        dinner: t('mealTypes.dinner'),
        late_night: t('mealTypes.lateNight'),
    };

    const mealTimeOptions: AIChefMealTime[] = ['breakfast', 'lunch', 'snack', 'dinner', 'late_night'];
    const dailyLabel = i18n.language.startsWith('en') ? 'daily' : 'diario';

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex-wrap">
                <button
                    onClick={() => setShowSelector(!showSelector)}
                    className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                >
                    <Clock size={14} />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        {mealTimeLabels[mealTime]}
                    </span>
                    <ChevronDown size={12} className={`transition-transform ${showSelector ? 'rotate-180' : ''}`} />
                </button>
                {isTrainingDay && (
                    <>
                        <span className="text-purple-300 dark:text-purple-600">•</span>
                        <Dumbbell size={14} className="text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                            {t('aiChef.trainingDay')}
                        </span>
                    </>
                )}
                <span className="text-purple-300 dark:text-purple-600">•</span>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                    {Math.round(mealBudgetCalories)} kcal
                </span>
                <span className="text-[10px] text-purple-400 dark:text-purple-500">
                    ({Math.round(remainingCalories)} {dailyLabel})
                </span>
            </div>

            {showSelector && (
                <div className="grid grid-cols-3 gap-1 mt-2">
                    {mealTimeOptions.map((option) => (
                        <button
                            key={option}
                            onClick={() => {
                                onMealTimeChange(option);
                                setShowSelector(false);
                            }}
                            className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all ${
                                mealTime === option
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-background dark:bg-surface-lighter text-text-tertiary hover:bg-purple-100 dark:hover:bg-purple-900/30'
                            }`}
                        >
                            {mealTimeLabels[option]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// =====================================================
// SUGGESTION CARD
// =====================================================

interface SuggestionCardProps {
    suggestion: MealSuggestion;
    onAdd: () => void;
    onReject: () => void;
    onViewRecipe: () => void;
}

export const AIChefSuggestionCard: React.FC<SuggestionCardProps> = ({
    suggestion,
    onAdd,
    onReject,
    onViewRecipe,
}) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const needsExpansion = suggestion.description && suggestion.description.length > 100;

    return (
        <div className="group relative bg-surface border border-border hover:border-purple-200 dark:hover:border-purple-700 rounded-2xl p-4 transition-all hover:shadow-lg hover:shadow-purple-500/5">
            <button
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-surface-lighter text-text-tertiary hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors z-10"
                aria-label={t('aiChef.reject')}>
                <X size={14} />
            </button>

            <button onClick={onViewRecipe} className="w-full text-left">
                <div className="flex justify-between items-start mb-2 pr-8">
                    <h4 className="font-bold text-text-primary group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                        {suggestion.name}
                    </h4>
                </div>
                <div className="mb-3">
                    <p className={`text-xs text-text-tertiary ${!expanded && needsExpansion ? 'line-clamp-2' : ''}`}>
                        {suggestion.description}
                    </p>
                </div>
                <div className="flex gap-2 mb-3 flex-wrap">
                    <div className="px-2 py-1 bg-gray-900 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-white">
                        {suggestion.macros.calories} kcal
                    </div>
                    <div className="px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded-lg text-[10px] font-bold text-green-700 dark:text-green-400">
                        {suggestion.macros.protein}g P
                    </div>
                    <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        {suggestion.macros.carbs}g C
                    </div>
                    <div className="px-2 py-1 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-[10px] font-bold text-orange-700 dark:text-orange-400">
                        {suggestion.macros.fat}g F
                    </div>
                </div>
                {(suggestion.prepTime || suggestion.difficulty) && (
                    <div className="flex gap-2 mb-3 text-[10px] text-text-tertiary">
                        {suggestion.prepTime && (
                            <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {suggestion.prepTime} min
                            </span>
                        )}
                        {suggestion.difficulty && (
                            <span className="capitalize">• {t(`aiChef.difficulty.${suggestion.difficulty}`)}</span>
                        )}
                    </div>
                )}
            </button>

            {needsExpansion && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 mb-3 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                >
                    {expanded ? <><ChevronUp size={12} />{t('aiChef.showLess')}</> : <><ChevronDown size={12} />{t('aiChef.showMore')}</>}
                </button>
            )}

            <button
                onClick={onAdd}
                className="w-full py-2.5 rounded-xl bg-background dark:bg-surface-lighter text-text-secondary font-bold text-xs group-hover:bg-purple-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
                <Plus size={14} />
                {t('modals.aiSuggestion.addToDiary')}
            </button>
        </div>
    );
};

// =====================================================
// RECIPE DETAIL
// =====================================================

interface RecipeDetailProps {
    suggestion: MealSuggestion;
    recipe: RecipeDetail | null;
    loading: boolean;
    onAdd: () => void;
    onBack: () => void;
}

export const AIChefRecipeDetail: React.FC<RecipeDetailProps> = ({
    suggestion,
    recipe,
    loading,
    onAdd,
    onBack,
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
            >
                <ArrowLeft size={16} />
                {t('aiChef.recipe.back')}
            </button>

            <div>
                <h4 className="text-lg font-black text-text-primary">{suggestion.name}</h4>
                <p className="text-xs text-text-tertiary mt-1">{suggestion.description}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                <div className="px-2 py-1 bg-gray-900 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-white">{suggestion.macros.calories} kcal</div>
                <div className="px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded-lg text-[10px] font-bold text-green-700 dark:text-green-400">{suggestion.macros.protein}g P</div>
                <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-400">{suggestion.macros.carbs}g C</div>
                <div className="px-2 py-1 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-[10px] font-bold text-orange-700 dark:text-orange-400">{suggestion.macros.fat}g F</div>
            </div>

            <div>
                <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t('aiChef.recipe.ingredients')}</h5>
                <div className="space-y-1">
                    {suggestion.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex justify-between items-center px-3 py-1.5 bg-background dark:bg-surface-lighter rounded-lg">
                            <span className="text-xs text-text-primary">{ing.name}</span>
                            <span className="text-[10px] text-text-tertiary font-medium">{ing.amount}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t('aiChef.recipe.instructions')}</h5>
                {loading ? (
                    <div className="py-8 flex flex-col items-center justify-center">
                        <Loader2 size={28} className="text-purple-600 animate-spin mb-3" />
                        <p className="text-xs text-text-tertiary">{t('aiChef.recipe.loading')}</p>
                    </div>
                ) : recipe ? (
                    <div className="space-y-2">
                        {recipe.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3 items-start px-3 py-2 bg-background dark:bg-surface-lighter rounded-lg">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-bold">{idx + 1}</span>
                                <p className="text-xs text-text-primary leading-relaxed">{step}</p>
                            </div>
                        ))}
                        {recipe.tips && (
                            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">{t('aiChef.recipe.tips')}</p>
                                <p className="text-xs text-amber-800 dark:text-amber-300">{recipe.tips}</p>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            <button
                onClick={onAdd}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
            >
                <Plus size={16} />
                {t('modals.aiSuggestion.addToDiary')}
            </button>
        </div>
    );
};
