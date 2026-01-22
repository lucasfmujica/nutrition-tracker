import React from 'react';

interface OnboardingStep3Props {
    data: {
        trainingDaysPerWeek: number;
        currentWeight: string;
        goalWeight: string;
        calorieGoal: string;
        proteinGoal: string;
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
                    <div className="text-gray-400">Objetivo:</div>
                    <div className="text-white font-medium">
                        {data.goalWeight || data.currentWeight || '-'} kg
                    </div>
                    <div className="text-gray-400">Calorías diarias:</div>
                    <div className="text-white font-medium">
                        {data.calorieGoal || '-'} kcal
                    </div>
                    <div className="text-gray-400">Proteína:</div>
                    <div className="text-white font-medium">
                        {data.proteinGoal || '-'}g
                    </div>
                    <div className="text-gray-400">Entrenos/semana:</div>
                    <div className="text-white font-medium">
                        {data.trainingDaysPerWeek} días
                    </div>
                </div>
            </div>
        </div>
    );
};
