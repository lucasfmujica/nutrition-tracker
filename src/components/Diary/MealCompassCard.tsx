import React from 'react';
import { useTranslation } from 'react-i18next';

export interface CompassSuggestion {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
}

interface MealCompassCardProps {
    suggestions: CompassSuggestion[];
    onSelect: (suggestion: CompassSuggestion) => void;
}

export const MealCompassCard: React.FC<MealCompassCardProps> = ({
    suggestions,
    onSelect,
}) => {
    const { t } = useTranslation();

    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-surface p-1.5 rounded-lg shadow-sm">
                    <span className="text-xl">🧭</span>
                </div>
                <div>
                    <h3 className="font-bold text-indigo-900 leading-tight">
                        {t('diary.compass.title')}
                    </h3>
                    <p className="text-xs text-indigo-600/80 font-medium">
                        {t('diary.compass.smartSubtitle')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {suggestions.map((meal, index) => (
                    <button
                        key={`${meal.name}-${index}`}
                        onClick={() => onSelect(meal)}
                        className="flex items-center justify-between bg-surface p-3 rounded-xl border border-indigo-50 hover:border-indigo-200 hover:shadow-md transition-all group text-left w-full">
                        <div className="min-w-0">
                            <p className="font-bold text-text-primary truncate group-hover:text-indigo-600 transition-colors">
                                {meal.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                                <span className="font-semibold text-text-secondary">
                                    {meal.calories} kcal
                                </span>
                                <span>•</span>
                                <span className="text-indigo-600 font-medium">
                                    {meal.protein}g P
                                </span>
                                <span>•</span>
                                <span>{meal.carbs}g C</span>
                                <span>•</span>
                                <span>{meal.fat}g F</span>
                            </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
