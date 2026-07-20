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
                    className="flex-1 px-4 py-3 bg-background dark:bg-surface-lighter border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-oura/30"
                />
                <button
                    onClick={onAdd}
                    disabled={!value.trim()}
                    className="px-4 py-3 bg-oura-soft text-oura rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-oura/20 transition-colors">
                    <Plus size={18} />
                </button>
            </div>

            {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {ingredients.map((ing) => (
                        <span
                            key={ing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-oura-soft text-oura rounded-full text-xs font-medium">
                            {ing}
                            <button
                                onClick={() => onRemove(ing)}
                                className="hover:opacity-80">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <button
                onClick={onSearch}
                disabled={ingredients.length === 0 || loading}
                className="w-full py-3 bg-gradient-to-r from-oura to-oura text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2">
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
                                    ? 'bg-oura text-white'
                                    : 'bg-background dark:bg-surface-lighter text-text-secondary hover:bg-oura-soft'
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
                                    ? 'bg-oura text-white'
                                    : 'bg-background dark:bg-surface-lighter text-text-secondary hover:bg-oura-soft'
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
                                    ? 'bg-oura text-white'
                                    : 'bg-background dark:bg-surface-lighter text-text-secondary hover:bg-oura-soft'
                            }`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {preferences.rejectedMeals.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-danger-soft rounded-xl">
                    <span className="text-xs text-danger dark:text-danger">
                        {t('aiChef.rejectedCount', { count: preferences.rejectedMeals.length })}
                    </span>
                    <button
                        onClick={() => onUpdate({ rejectedMeals: [], rejectedMealsExpiry: 0 })}
                        className="text-xs font-bold text-danger hover:opacity-80">
                        {t('aiChef.clearRejected')}
                    </button>
                </div>
            )}

            <button
                onClick={onApplyAndRegenerate}
                disabled={loading}
                className="w-full py-3 mt-4 bg-gradient-to-r from-oura to-oura text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {t('aiChef.applyAndRegenerate')}
            </button>
        </div>
    );
};
