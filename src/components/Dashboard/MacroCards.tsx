import React from 'react';
import { useTranslation } from 'react-i18next';
import { Macros } from '../../types/domain';

interface MacroCardProps {
    label: string;
    current: number;
    target: number;
    unit?: string;
    colorVar: string;
}

const MacroCard: React.FC<MacroCardProps> = React.memo(
    ({ label, current, target, unit = 'g', colorVar }) => {
        const { t } = useTranslation();
        const percentage = Math.min((current / target) * 100, 100);
        const remaining = Math.max(0, target - current);

        return (
            <div className="bg-surface p-4 rounded-3xl border border-border shadow-sm flex-1 flex flex-col justify-between relative overflow-hidden group hover:border-primary/20 transition-colors">
                <div className="relative z-10">
                    <span className="text-xs text-text-tertiary font-medium mb-1 block">
                        {label}
                    </span>
                    <div className="flex items-end gap-1 mb-1">
                        <span className="text-lg font-bold text-text-primary">
                            {remaining.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-text-tertiary mb-1">
                            {unit} {t('dashboard.macros.left')}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-surface-lighter rounded-full overflow-hidden mt-1">
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${percentage}%`,
                                backgroundColor: `var(${colorVar})`,
                            }}
                        />
                    </div>

                    <div className="mt-1.5 text-[10px] text-text-tertiary text-right">
                        {current.toFixed(0)} / {target.toFixed(0)}
                        {unit}
                    </div>
                </div>
            </div>
        );
    },
);

interface MacroCardsProps {
    totals: Macros | null;
    targets: Macros | null;
}

export const MacroCards: React.FC<MacroCardsProps> = React.memo(
    ({ totals, targets }) => {
        const { t } = useTranslation();
        if (!targets || !totals) return null; // Safety check

        return (
            <div className="flex gap-3 mb-6" data-tutorial="macro-bars">
                <MacroCard
                    label={t('dashboard.macros.protein')}
                    current={totals.protein}
                    target={targets.protein}
                    colorVar="--color-protein"
                />
                <MacroCard
                    label={t('dashboard.macros.carbs')}
                    current={totals.carbs}
                    target={targets.carbs}
                    colorVar="--color-carbs"
                />
                <MacroCard
                    label={t('dashboard.macros.fat')}
                    current={totals.fat}
                    target={targets.fat}
                    colorVar="--color-fat"
                />
            </div>
        );
    },
);
