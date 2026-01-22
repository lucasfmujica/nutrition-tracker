import React from 'react';
import { Macros } from '../../types/domain';

interface DaySummaryProps {
    totals: Macros;
    targets: Macros;
}

export const DaySummary: React.FC<DaySummaryProps> = ({ totals, targets }) => {
    const calsLeft = Math.round(targets.calories - totals.calories);

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mt-2 relative max-w-4xl mx-auto shadow-sm">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-medium text-gray-500">
                    RESUMEN DIARIO
                </span>
                <span
                    className={`text-sm font-bold ${calsLeft < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {calsLeft} kcal restantes
                </span>
            </div>

            <div className="flex gap-2 text-center">
                {[
                    {
                        label: 'Prot',
                        current: totals.protein,
                        target: targets.protein,
                        color: 'bg-green-500',
                    },
                    {
                        label: 'Carbs',
                        current: totals.carbs,
                        target: targets.carbs,
                        color: 'bg-amber-500',
                    },
                    {
                        label: 'Grasas',
                        current: totals.fat,
                        target: targets.fat,
                        color: 'bg-orange-500',
                    },
                ].map((macro) => (
                    <div
                        key={macro.label}
                        className="flex-1 bg-gray-50 rounded-lg p-2">
                        <div className="text-xs text-gray-500 mb-1">
                            {macro.label}
                        </div>
                        <div className="relative h-1 w-full bg-gray-200 rounded-full overflow-hidden mb-1">
                            <div
                                className={`h-full ${macro.color}`}
                                style={{
                                    width: `${Math.min(((macro.current || 0) / (macro.target || 1)) * 100, 100)}%`,
                                }}
                            />
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                            {Math.round(macro.current || 0)}{' '}
                            <span className="text-[10px] text-gray-400 font-normal">
                                / {Math.round(macro.target || 0)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
