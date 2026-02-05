import { ChefHat, Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Macros } from '../../types/domain';

interface DaySummaryProps {
    totals: Macros;
    targets: Macros;
    onSuggestMeal?: () => void;
}

export const DaySummary: React.FC<DaySummaryProps> = ({
    totals,
    targets,
    onSuggestMeal,
}) => {
    const { t } = useTranslation();
    const calsLeft = Math.round(targets.calories - totals.calories);

    return (
        <div className="bg-surface border border-border rounded-2xl p-4 mt-2 relative max-w-4xl mx-auto shadow-sm">
            <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-tertiary">
                        {t('diary.summary.title')}
                    </span>
                    {onSuggestMeal && calsLeft > 100 && (
                        <button
                            onClick={onSuggestMeal}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30">
                            <ChefHat size={12} />
                            {t('aiChef.title')}
                        </button>
                    )}
                </div>
                <span
                    className={`text-sm font-bold ${calsLeft < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {calsLeft} kcal {t('diary.summary.remaining')}
                </span>
            </div>

            <div className="flex gap-2 text-center">
                {[
                    {
                        label: t('dashboard.macros.protein'),
                        current: totals.protein,
                        target: targets.protein,
                        color: 'bg-green-500',
                    },
                    {
                        label: t('dashboard.macros.carbs'),
                        current: totals.carbs,
                        target: targets.carbs,
                        color: 'bg-amber-500',
                    },
                    {
                        label: t('dashboard.macros.fat'),
                        current: totals.fat,
                        target: targets.fat,
                        color: 'bg-orange-500',
                    },
                ].map((macro) => (
                    <div
                        key={macro.label}
                        className="flex-1 bg-background rounded-lg p-2">
                        <div className="text-xs text-text-tertiary mb-1">
                            {macro.label}
                        </div>
                        <div className="relative h-1 w-full bg-surface-lighter rounded-full overflow-hidden mb-1">
                            <div
                                className={`h-full ${macro.color}`}
                                role="progressbar"
                                aria-label={`${macro.label} progress`}
                                aria-valuenow={Math.round(macro.current || 0)}
                                aria-valuemin={0}
                                aria-valuemax={Math.round(macro.target || 1)}
                                style={{
                                    width: `${Math.min(((macro.current || 0) / (macro.target || 1)) * 100, 100)}%`,
                                }}
                            />
                        </div>
                        <div className="text-xs font-bold text-text-primary">
                            {Math.round(macro.current || 0)}{' '}
                            <span className="text-[10px] text-text-tertiary font-normal">
                                / {Math.round(macro.target || 0)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
