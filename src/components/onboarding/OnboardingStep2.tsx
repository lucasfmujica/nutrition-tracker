import React from 'react';

interface OnboardingStep2Props {
    data: {
        primaryGoal: string;
        activityLevel: string;
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

    const goalOptions = [
        { value: 'lose', label: '⬇️ Bajar', color: 'green' },
        { value: 'maintain', label: '➡️ Mantener', color: 'blue' },
        { value: 'gain', label: '⬆️ Subir', color: 'orange' },
    ];

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

            <div>
                <label className="block text-sm text-gray-400 mb-2">
                    Objetivo principal
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {goalOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => updateField('primaryGoal', opt.value)}
                            className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                                data.primaryGoal === opt.value
                                    ? opt.color === 'green'
                                        ? 'bg-green-600 text-white'
                                        : opt.color === 'orange'
                                          ? 'bg-orange-600 text-white'
                                          : 'bg-blue-600 text-white'
                                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                            }`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-2">
                    Nivel de actividad
                </label>
                <select
                    value={data.activityLevel}
                    onChange={(e) => updateField('activityLevel', e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white">
                    <option value="sedentary">Sedentario (poco ejercicio)</option>
                    <option value="light">Ligero (1-2 días/semana)</option>
                    <option value="moderate">Moderado (3-4 días/semana)</option>
                    <option value="active">Activo (5-6 días/semana)</option>
                    <option value="very_active">Muy activo (todos los días)</option>
                </select>
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
        </div>
    );
};
