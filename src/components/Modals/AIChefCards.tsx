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
            <div className="flex items-center gap-2 px-3 py-2 bg-oura-soft rounded-xl flex-wrap">
                <button
                    onClick={() => setShowSelector(!showSelector)}
                    className="flex items-center gap-1 text-oura hover:opacity-80 transition-colors"
                >
                    <Clock size={14} />
                    <span className="text-xs font-medium text-oura">
                        {mealTimeLabels[mealTime]}
                    </span>
                    <ChevronDown size={12} className={`transition-transform ${showSelector ? 'rotate-180' : ''}`} />
                </button>
                {isTrainingDay && (
                    <>
                        <span className="text-oura dark:text-oura">•</span>
                        <Dumbbell size={14} className="text-oura" />
                        <span className="text-xs font-medium text-oura">
                            {t('aiChef.trainingDay')}
                        </span>
                    </>
                )}
                <span className="text-oura dark:text-oura">•</span>
                <span className="text-xs font-bold text-oura">
                    {Math.round(mealBudgetCalories)} kcal
                </span>
                <span className="text-[10px] text-oura dark:text-oura">
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
                                    ? 'bg-oura text-white'
                                    : 'bg-background dark:bg-surface-lighter text-text-tertiary hover:bg-oura-soft'
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
        <div className="group relative bg-surface border border-border hover:border-oura/30 rounded-card p-4 transition-all hover:shadow-card">
            <button
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-surface-lighter text-text-tertiary hover:bg-danger-soft hover:text-danger transition-colors z-10"
                aria-label={t('aiChef.reject')}>
                <X size={14} />
            </button>

            <button onClick={onViewRecipe} className="w-full text-left">
                <div className="flex justify-between items-start mb-2 pr-8">
                    <h4 className="font-bold text-text-primary group-hover:text-oura dark:group-hover:text-oura transition-colors">
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
                    <div className="px-2 py-1 bg-success-soft rounded-lg text-[10px] font-bold text-success dark:text-success">
                        {suggestion.macros.protein}g P
                    </div>
                    <div className="px-2 py-1 bg-warning-soft rounded-lg text-[10px] font-bold text-warning dark:text-warning">
                        {suggestion.macros.carbs}g C
                    </div>
                    <div className="px-2 py-1 bg-fat-soft rounded-lg text-[10px] font-bold text-fat dark:text-fat">
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
                    className="flex items-center gap-1 mb-3 text-[10px] font-bold text-oura hover:opacity-80"
                >
                    {expanded ? <><ChevronUp size={12} />{t('aiChef.showLess')}</> : <><ChevronDown size={12} />{t('aiChef.showMore')}</>}
                </button>
            )}

            <button
                onClick={onAdd}
                className="w-full py-2.5 rounded-xl bg-background dark:bg-surface-lighter text-text-secondary font-bold text-xs group-hover:bg-oura group-hover:text-white transition-all flex items-center justify-center gap-2">
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
                className="flex items-center gap-1 text-sm font-bold text-oura hover:opacity-80 transition-colors"
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
                <div className="px-2 py-1 bg-success-soft rounded-lg text-[10px] font-bold text-success dark:text-success">{suggestion.macros.protein}g P</div>
                <div className="px-2 py-1 bg-warning-soft rounded-lg text-[10px] font-bold text-warning dark:text-warning">{suggestion.macros.carbs}g C</div>
                <div className="px-2 py-1 bg-fat-soft rounded-lg text-[10px] font-bold text-fat dark:text-fat">{suggestion.macros.fat}g F</div>
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
                        <Loader2 size={28} className="text-oura animate-spin mb-3" />
                        <p className="text-xs text-text-tertiary">{t('aiChef.recipe.loading')}</p>
                    </div>
                ) : recipe ? (
                    <div className="space-y-2">
                        {recipe.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3 items-start px-3 py-2 bg-background dark:bg-surface-lighter rounded-lg">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-oura-soft text-oura rounded-full text-[10px] font-bold">{idx + 1}</span>
                                <p className="text-xs text-text-primary leading-relaxed">{step}</p>
                            </div>
                        ))}
                        {recipe.tips && (
                            <div className="px-3 py-2 bg-warning-soft rounded-lg border border-warning/20">
                                <p className="text-[10px] font-bold text-warning dark:text-warning uppercase mb-1">{t('aiChef.recipe.tips')}</p>
                                <p className="text-xs text-warning">{recipe.tips}</p>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            <button
                onClick={onAdd}
                className="w-full py-3 bg-gradient-to-r from-oura to-oura text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
                <Plus size={16} />
                {t('modals.aiSuggestion.addToDiary')}
            </button>
        </div>
    );
};
