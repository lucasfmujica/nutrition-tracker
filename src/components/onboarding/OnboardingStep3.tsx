import React from 'react';

interface OnboardingStep3Props {
    data: {
        trainingDaysPerWeek: number;
        currentWeight: string;
        calorieGoal: string;
        proteinGoal: string;
        hasOuraRing?: boolean;
        primaryGoal?: string;
        [key: string]: any;
    };
    handlers: {
        updateField: (field: string, value: any) => void;
    };
}

export const OnboardingStep3: React.FC<OnboardingStep3Props> = ({
    data,
    handlers,
}) => {
    const { updateField } = handlers;

    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">🏋️</span>
                <h2 className="text-xl font-bold text-white">
                    Tu rutina de entreno
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    Para trackear tu progreso
                </p>
            </div>

            {/* Goal Selection */}
            <div>
                <label className="block text-sm text-gray-400 mb-3">
                    ¿Cuál es tu objetivo principal?
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        {
                            value: 'lose',
                            label: 'Bajar',
                            emoji: '📉',
                            desc: 'Perder peso',
                        },
                        {
                            value: 'maintain',
                            label: 'Mantener',
                            emoji: '⚖️',
                            desc: 'Mantener peso',
                        },
                        {
                            value: 'gain',
                            label: 'Subir',
                            emoji: '📈',
                            desc: 'Ganar músculo',
                        },
                    ].map((goal) => (
                        <button
                            key={goal.value}
                            onClick={() => updateField('primaryGoal', goal.value)}
                            className={`p-3 rounded-xl text-center transition-all ${
                                data.primaryGoal === goal.value
                                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                            }`}>
                            <span className="text-xl block mb-1">{goal.emoji}</span>
                            <span className="font-bold text-sm">{goal.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-3">
                    ¿Cuántos días entrenas por semana?
                </label>
                <div className="flex justify-between gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <button
                            key={day}
                            onClick={() => updateField('trainingDaysPerWeek', day)}
                            className={`w-10 h-10 rounded-xl font-bold transition-all ${
                                data.trainingDaysPerWeek === day
                                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                            }`}>
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Oura Ring Toggle */}
            <div className="mt-4">
                <label className="flex items-center gap-3 p-4 bg-gray-700/30 rounded-xl cursor-pointer hover:bg-gray-700/50 transition-colors">
                    <input
                        type="checkbox"
                        checked={data.hasOuraRing || false}
                        onChange={(e) =>
                            updateField('hasOuraRing', e.target.checked)
                        }
                        className="w-5 h-5 rounded border-gray-500 text-blue-500 focus:ring-blue-500 bg-gray-700"
                    />
                    <div className="flex-1">
                        <span className="text-white font-medium">
                            ¿Tenés un Oura Ring?
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Sincroniza automáticamente sueño, HRV y recuperación
                        </p>
                    </div>
                    <span className="text-2xl">💍</span>
                </label>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-700/30 rounded-xl">
                <h3 className="font-semibold text-white mb-3">
                    📋 Resumen de tu perfil
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">Peso actual:</div>
                    <div className="text-white font-medium">
                        {data.currentWeight || '-'} kg
                    </div>
                    <div className="text-gray-400">Calorías diarias:</div>
                    <div className="text-white font-medium">
                        {data.calorieGoal || '-'} kcal
                    </div>
                    <div className="text-gray-400">Proteína:</div>
                    <div className="text-white font-medium">
                        {data.proteinGoal || '-'}g
                    </div>
                    <div className="text-gray-400">Objetivo:</div>
                    <div className="text-white font-medium">
                        {data.primaryGoal === 'lose'
                            ? '📉 Bajar peso'
                            : data.primaryGoal === 'gain'
                              ? '📈 Subir peso'
                              : '⚖️ Mantener'}
                    </div>
                    <div className="text-gray-400">Entrenos/semana:</div>
                    <div className="text-white font-medium">
                        {data.trainingDaysPerWeek} días
                    </div>
                    {data.hasOuraRing && (
                        <>
                            <div className="text-gray-400">Oura Ring:</div>
                            <div className="text-green-400 font-medium">
                                ✓ Activado (token requerido)
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
