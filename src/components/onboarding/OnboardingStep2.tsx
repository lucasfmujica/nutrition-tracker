import React from 'react';

interface OnboardingStep2Props {
    data: {
        calorieGoal: string;
        proteinGoal: string;
        carbsGoal: string;
        fatGoal: string;
        [key: string]: any;
    };
    handlers: {
        updateField: (field: string, value: any) => void;
        handleAutoCalculate: () => void;
    };
}

export const OnboardingStep2: React.FC<OnboardingStep2Props> = ({
    data,
    handlers,
}) => {
    const { updateField, handleAutoCalculate } = handlers;

    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">🎯</span>
                <h2 className="text-xl font-bold text-white">
                    Tus metas nutricionales
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    Calculadas automáticamente según tus datos
                </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-400">Tus metas diarias</span>
                    <button
                        onClick={handleAutoCalculate}
                        className="text-xs text-blue-400 hover:text-blue-300">
                        🔄 Recalcular
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                        { label: 'kcal', field: 'calorieGoal', unit: 'kcal' },
                        { label: 'prot', field: 'proteinGoal', unit: 'g' },
                        { label: 'carbs', field: 'carbsGoal', unit: 'g' },
                        { label: 'fat', field: 'fatGoal', unit: 'g' },
                    ].map(({ label, field, unit }) => (
                        <div key={field}>
                            <input
                                type="number"
                                value={data[field]}
                                onChange={(e) => updateField(field, e.target.value)}
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-2 py-2 text-white text-center text-lg font-bold"
                            />
                            <span className="text-xs text-gray-500">
                                {label} ({unit})
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                <p className="text-xs text-gray-400 leading-relaxed">
                    💡 <strong className="text-white">Tip:</strong> Estas metas se
                    calculan automáticamente basadas en tu peso, altura, edad, género
                    y objetivo. Puedes ajustarlas manualmente si lo deseas.
                </p>
            </div>
        </div>
    );
};
