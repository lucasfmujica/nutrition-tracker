import {
    ChefHat,
    ChevronDown,
    ChevronUp,
    Clock,
    Dumbbell,
    Leaf,
    Loader2,
    Plus,
    RefreshCw,
    Settings,
    Sparkles,
    UtensilsCrossed,
    Wheat,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { MealSuggestion } from '../../services/ai/mealService';
import {
    AIChefMealTime,
    AIChefPreferences,
    DietaryMode,
    Difficulty,
    FoodEntry,
    PrepTime,
} from '../../types/domain';

// =====================================================
// SUB-COMPONENTS
// =====================================================

interface ContextBannerProps {
    mealTime: AIChefMealTime;
    isTrainingDay: boolean;
    remainingCalories: number;
    onMealTimeChange: (mealTime: AIChefMealTime) => void;
}

const AIChefContextBanner: React.FC<ContextBannerProps> = ({
    mealTime,
    isTrainingDay,
    remainingCalories,
    onMealTimeChange,
}) => {
    const { t } = useTranslation();
    const [showSelector, setShowSelector] = useState(false);

    const mealTimeLabels: Record<AIChefMealTime, string> = {
        breakfast: t('mealTypes.breakfast'),
        lunch: t('mealTypes.lunch'),
        snack: t('mealTypes.snack'),
        dinner: t('mealTypes.dinner'),
        late_night: t('mealTypes.lateNight'),
    };

    const mealTimeOptions: AIChefMealTime[] = ['breakfast', 'lunch', 'snack', 'dinner', 'late_night'];

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
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
                    {Math.round(remainingCalories)} kcal
                </span>
            </div>

            {/* Meal Time Selector */}
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

interface SuggestionCardProps {
    suggestion: MealSuggestion;
    onAdd: () => void;
    onReject: () => void;
}

const AIChefSuggestionCard: React.FC<SuggestionCardProps> = ({
    suggestion,
    onAdd,
    onReject,
}) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    // Check if description is long enough to need expansion
    const needsExpansion = suggestion.description && suggestion.description.length > 100;

    return (
        <div className="group relative bg-surface border border-border hover:border-purple-200 dark:hover:border-purple-700 rounded-2xl p-4 transition-all hover:shadow-lg hover:shadow-purple-500/5">
            {/* Reject button */}
            <button
                onClick={onReject}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-surface-lighter text-text-tertiary hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                aria-label={t('aiChef.reject')}>
                <X size={14} />
            </button>

            <div className="flex justify-between items-start mb-2 pr-8">
                <h4 className="font-bold text-text-primary group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                    {suggestion.name}
                </h4>
            </div>

            {/* Expandable description */}
            <div className="mb-3">
                <p className={`text-xs text-text-tertiary ${!expanded && needsExpansion ? 'line-clamp-2' : ''}`}>
                    {suggestion.description}
                </p>
                {needsExpansion && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 mt-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp size={12} />
                                {t('aiChef.showLess')}
                            </>
                        ) : (
                            <>
                                <ChevronDown size={12} />
                                {t('aiChef.showMore')}
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Macros row */}
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

            {/* Prep time and difficulty */}
            {(suggestion.prepTime || suggestion.difficulty) && (
                <div className="flex gap-2 mb-3 text-[10px] text-text-tertiary">
                    {suggestion.prepTime && (
                        <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {suggestion.prepTime} min
                        </span>
                    )}
                    {suggestion.difficulty && (
                        <span className="capitalize">
                            • {t(`aiChef.difficulty.${suggestion.difficulty}`)}
                        </span>
                    )}
                </div>
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

interface IngredientInputProps {
    value: string;
    onChange: (value: string) => void;
    onAdd: () => void;
    ingredients: string[];
    onRemove: (ingredient: string) => void;
    onSearch: () => void;
    loading: boolean;
}

const AIChefIngredientInput: React.FC<IngredientInputProps> = ({
    value,
    onChange,
    onAdd,
    ingredients,
    onRemove,
    onSearch,
    loading,
}) => {
    const { t } = useTranslation();

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && value.trim()) {
            e.preventDefault();
            onAdd();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('aiChef.ingredientPlaceholder')}
                    className="flex-1 px-4 py-3 bg-background dark:bg-surface-lighter border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
                <button
                    onClick={onAdd}
                    disabled={!value.trim()}
                    className="px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors">
                    <Plus size={18} />
                </button>
            </div>

            {/* Ingredient chips */}
            {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {ingredients.map((ing) => (
                        <span
                            key={ing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                            {ing}
                            <button
                                onClick={() => onRemove(ing)}
                                className="hover:text-purple-900 dark:hover:text-purple-100">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search button */}
            <button
                onClick={onSearch}
                disabled={ingredients.length === 0 || loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2">
                {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Sparkles size={18} />
                )}
                {t('aiChef.findRecipes')}
            </button>

            <p className="text-[10px] text-text-tertiary text-center">
                {t('aiChef.ingredientHint')}
            </p>
        </div>
    );
};

interface PreferencesPanelProps {
    preferences: AIChefPreferences;
    onUpdate: (partial: Partial<AIChefPreferences>) => void;
    onApplyAndRegenerate: () => void;
    loading: boolean;
}

const AIChefPreferencesPanel: React.FC<PreferencesPanelProps> = ({
    preferences,
    onUpdate,
    onApplyAndRegenerate,
    loading,
}) => {
    const { t } = useTranslation();

    const dietaryOptions: { value: DietaryMode; label: string; icon: React.ReactNode }[] = [
        { value: 'standard', label: t('aiChef.dietary.standard'), icon: <UtensilsCrossed size={16} /> },
        { value: 'vegetarian', label: t('aiChef.dietary.vegetarian'), icon: <Leaf size={16} /> },
        { value: 'vegan', label: t('aiChef.dietary.vegan'), icon: <Leaf size={16} /> },
        { value: 'gluten_free', label: t('aiChef.dietary.glutenFree'), icon: <Wheat size={16} /> },
        { value: 'lactose_free', label: t('aiChef.dietary.lactoseFree'), icon: null },
    ];

    const prepTimeOptions: { value: PrepTime; label: string }[] = [
        { value: 'quick', label: t('aiChef.prepTime.quick') },
        { value: 'medium', label: t('aiChef.prepTime.medium') },
        { value: 'long', label: t('aiChef.prepTime.long') },
    ];

    const difficultyOptions: { value: Difficulty; label: string }[] = [
        { value: 'easy', label: t('aiChef.difficulty.easy') },
        { value: 'medium', label: t('aiChef.difficulty.medium') },
        { value: 'hard', label: t('aiChef.difficulty.hard') },
    ];

    return (
        <div className="space-y-6">
            {/* Dietary Mode */}
            <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    {t('aiChef.dietaryLabel')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {dietaryOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onUpdate({ dietaryMode: opt.value })}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                preferences.dietaryMode === opt.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-background dark:bg-surface-lighter text-text-secondary hover:bg-purple-50 dark:hover:bg-purple-900/20'
                            }`}>
                            {opt.icon}
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prep Time */}
            <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    {t('aiChef.prepTimeLabel')}
                </label>
                <div className="flex gap-2">
                    {prepTimeOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onUpdate({ prepTime: opt.value })}
                            className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                preferences.prepTime === opt.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-background dark:bg-surface-lighter text-text-secondary hover:bg-purple-50 dark:hover:bg-purple-900/20'
                            }`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty */}
            <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    {t('aiChef.difficultyLabel')}
                </label>
                <div className="flex gap-2">
                    {difficultyOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onUpdate({ difficulty: opt.value })}
                            className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                preferences.difficulty === opt.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-background dark:bg-surface-lighter text-text-secondary hover:bg-purple-50 dark:hover:bg-purple-900/20'
                            }`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rejected meals count */}
            {preferences.rejectedMeals.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <span className="text-xs text-red-700 dark:text-red-400">
                        {t('aiChef.rejectedCount', { count: preferences.rejectedMeals.length })}
                    </span>
                    <button
                        onClick={() => onUpdate({ rejectedMeals: [], rejectedMealsExpiry: 0 })}
                        className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                        {t('aiChef.clearRejected')}
                    </button>
                </div>
            )}

            {/* Apply and Regenerate Button */}
            <button
                onClick={onApplyAndRegenerate}
                disabled={loading}
                className="w-full py-3 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
            >
                {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <RefreshCw size={16} />
                )}
                {t('aiChef.applyAndRegenerate')}
            </button>
        </div>
    );
};

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
    const { t } = useTranslation();
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

    // Use override if set, otherwise use current meal time
    const effectiveMealTime = selectedMealTime || currentMealTime;

    // Calculate remaining macros
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

    // Handle regenerate
    const handleRegenerate = () => {
        getContextualSuggestions(remaining, isTrainingDay, null, effectiveMealTime);
    };

    // Handle ingredient search
    const handleIngredientSearch = () => {
        getSuggestionsFromIngredients(remaining, isTrainingDay, null, effectiveMealTime);
    };

    // Handle apply config and regenerate
    const handleApplyAndRegenerate = () => {
        setAIChefTab('suggestions');
        getContextualSuggestions(remaining, isTrainingDay, null, effectiveMealTime);
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
                            {/* Context Banner */}
                            <AIChefContextBanner
                                mealTime={effectiveMealTime}
                                isTrainingDay={isTrainingDay}
                                remainingCalories={remaining.calories}
                                onMealTimeChange={setSelectedMealTime}
                            />

                            {loading ? (
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
                                        />
                                    ))}

                                    {/* Regenerate button */}
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
