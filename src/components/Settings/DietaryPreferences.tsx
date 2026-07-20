import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { AIChefPreferences, DietaryMode } from '../../types/domain';
import {
    loadDietaryPreferences,
    saveDietaryPreferences,
} from '../../utils/dietaryPreferences';

const DIETARY_MODES: DietaryMode[] = [
    'standard',
    'vegetarian',
    'vegan',
    'gluten_free',
    'lactose_free',
];

interface ChipInputProps {
    label: string;
    placeholder: string;
    values: string[];
    onAdd: (value: string) => void;
    onRemove: (value: string) => void;
    chipClassName: string;
}

/**
 * ChipInput - Free-text chips input (Enter or comma to add)
 */
const ChipInput: React.FC<ChipInputProps> = ({
    label,
    placeholder,
    values,
    onAdd,
    onRemove,
    chipClassName,
}) => {
    const [input, setInput] = useState('');

    const commit = () => {
        const trimmed = input.trim().replace(/,$/, '');
        if (trimmed) onAdd(trimmed);
        setInput('');
    };

    return (
        <div>
            <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                {label}
            </label>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        commit();
                    }
                }}
                onBlur={commit}
                placeholder={placeholder}
                className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm text-text-primary focus:border-success focus:ring-4 focus:ring-success/10 outline-none transition-all"
            />
            {values.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {values.map((value) => (
                        <span
                            key={value}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${chipClassName}`}>
                            {value}
                            <button
                                onClick={() => onRemove(value)}
                                className="hover:opacity-70 transition-opacity"
                                aria-label={`Remove ${value}`}>
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * DietaryPreferences - Config section for dietary mode, allergies/exclusions,
 * disliked meals and rejected AI meals.
 *
 * Persists in localStorage (shared with AI Chef + weekly plan generation).
 * NOTE: profiles table has no dietary columns yet — localStorage is the
 * single source for these preferences until a DB column exists.
 */
export const DietaryPreferences: React.FC = () => {
    const { t } = useTranslation();
    const [prefs, setPrefs] = useState<AIChefPreferences>(loadDietaryPreferences);

    const update = (partial: Partial<AIChefPreferences>) => {
        const updated = { ...prefs, ...partial };
        setPrefs(updated);
        saveDietaryPreferences(updated);
    };

    const allergies = prefs.allergies || [];
    const dislikedMeals = prefs.dislikedMeals || [];

    const addUnique = (list: string[], value: string) =>
        list.some((v) => v.toLowerCase() === value.toLowerCase())
            ? list
            : [...list, value];

    return (
        <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success-soft rounded-full -mr-12 -mt-12 opacity-50" />
            <div className="relative z-10 space-y-6">
                <div>
                    <h2 className="text-xs font-black text-success mb-1 uppercase tracking-[0.2em] flex items-center gap-2">
                        🥗 {t('config.dietary.title')}
                    </h2>
                    <p className="text-sm text-text-tertiary">
                        {t('config.dietary.subtitle')}
                    </p>
                </div>

                {/* Dietary Mode */}
                <div>
                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                        {t('config.dietary.mode')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {DIETARY_MODES.map((mode) => (
                            <button
                                key={mode}
                                onClick={() => update({ dietaryMode: mode })}
                                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                    prefs.dietaryMode === mode
                                        ? 'bg-success text-white shadow-float'
                                        : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                                }`}>
                                {t(`config.dietary.modes.${mode}`)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Allergies / Exclusions */}
                <ChipInput
                    label={t('config.dietary.allergies')}
                    placeholder={t('config.dietary.allergiesPlaceholder')}
                    values={allergies}
                    onAdd={(v) => update({ allergies: addUnique(allergies, v) })}
                    onRemove={(v) =>
                        update({ allergies: allergies.filter((a) => a !== v) })
                    }
                    chipClassName="bg-danger-soft text-danger border border-danger/20"
                />

                {/* Disliked Meals */}
                <ChipInput
                    label={t('config.dietary.dislikedMeals')}
                    placeholder={t('config.dietary.dislikedMealsPlaceholder')}
                    values={dislikedMeals}
                    onAdd={(v) =>
                        update({ dislikedMeals: addUnique(dislikedMeals, v) })
                    }
                    onRemove={(v) =>
                        update({
                            dislikedMeals: dislikedMeals.filter((m) => m !== v),
                        })
                    }
                    chipClassName="bg-warning-soft text-warning border border-warning/20"
                />

                {/* Rejected meals (from AI suggestions / meal plan) */}
                {prefs.rejectedMeals.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2 px-1">
                            <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                                {t('config.dietary.rejectedMeals')}
                            </label>
                            <button
                                onClick={() =>
                                    update({
                                        rejectedMeals: [],
                                        rejectedMealsExpiry: 0,
                                    })
                                }
                                className="text-xs font-bold text-danger hover:text-danger transition-colors">
                                {t('config.dietary.clearRejected')}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {prefs.rejectedMeals.map((meal) => (
                                <span
                                    key={meal}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-background text-text-secondary border border-border">
                                    {meal}
                                    <button
                                        onClick={() =>
                                            update({
                                                rejectedMeals:
                                                    prefs.rejectedMeals.filter(
                                                        (m) => m !== meal,
                                                    ),
                                            })
                                        }
                                        className="hover:opacity-70 transition-opacity"
                                        aria-label={`Remove ${meal}`}>
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <p className="text-[10px] text-text-tertiary mt-2 px-1">
                            {t('config.dietary.rejectedMealsHelp')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
