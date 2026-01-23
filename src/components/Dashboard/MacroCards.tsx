import React from 'react';
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
        const percentage = Math.min((current / target) * 100, 100);
        const remaining = Math.max(0, target - current);

        return (
            <div className="bg-white p-3 rounded-2xl border border-gray-50 shadow-sm flex-1 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-xs text-gray-500 font-medium mb-1 block">
                        {label}
                    </span>
                    <div className="flex items-end gap-1 mb-1">
                        <span className="text-lg font-bold text-gray-900">
                            {remaining.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-gray-400 mb-1">
                            {unit} left
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${percentage}%`,
                                backgroundColor: `var(${colorVar})`,
                            }}
                        />
                    </div>

                    <div className="mt-1.5 text-[10px] text-gray-400 text-right">
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
        if (!targets || !totals) return null; // Safety check

        return (
            <div className="flex gap-3 mb-6" data-tutorial="macro-bars">
                <MacroCard
                    label="Proteína"
                    current={totals.protein}
                    target={targets.protein}
                    colorVar="--color-protein"
                />
                <MacroCard
                    label="Carbos"
                    current={totals.carbs}
                    target={targets.carbs}
                    colorVar="--color-carbs"
                />
                <MacroCard
                    label="Grasas"
                    current={totals.fat}
                    target={targets.fat}
                    colorVar="--color-fat"
                />
            </div>
        );
    },
);
