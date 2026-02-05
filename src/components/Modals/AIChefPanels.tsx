import {
    Leaf,
    Loader2,
    Plus,
    RefreshCw,
    Sparkles,
    UtensilsCrossed,
    Wheat,
    X,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    AIChefPreferences,
    DietaryMode,
    Difficulty,
    PrepTime,
} from '../../types/domain';

// =====================================================
// INGREDIENT INPUT
// =====================================================

interface IngredientInputProps {
    value: string;
    onChange: (value: string) => void;
    onAdd: () => void;
    ingredients: string[];
    onRemove: (ingredient: string) => void;
    onSearch: () => void;
    loading: boolean;
}

export const AIChefIngredientInput: React.FC<IngredientInputProps> = ({
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

            <button
                onClick={onSearch}
                disabled={ingredients.length === 0 || loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {t('aiChef.findRecipes')}
            </button>

            <p className="text-[10px] text-text-tertiary text-center">
                {t('aiChef.ingredientHint')}
            </p>
        </div>
    );
};

// =====================================================
// PREFERENCES PANEL
// =====================================================

interface PreferencesPanelProps {
    preferences: AIChefPreferences;
    onUpdate: (partial: Partial<AIChefPreferences>) => void;
    onApplyAndRegenerate: () => void;
    loading: boolean;
}

export const AIChefPreferencesPanel: React.FC<PreferencesPanelProps> = ({
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

            <button
                onClick={onApplyAndRegenerate}
                disabled={loading}
                className="w-full py-3 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {t('aiChef.applyAndRegenerate')}
            </button>
        </div>
    );
};
