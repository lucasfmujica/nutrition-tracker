import React from 'react';

export function OnboardingStep1({ data, handlers }) {
  const { updateField } = handlers;

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <span className="text-3xl mb-2 block">📊</span>
        <h2 className="text-xl font-bold text-white">Tus datos físicos</h2>
        <p className="text-sm text-gray-400 mt-1">Para calcular tus metas personalizadas</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Peso actual (kg) *</label>
          <input
            type="number"
            value={data.currentWeight}
            onChange={(e) => updateField('currentWeight', e.target.value)}
            placeholder="75"
            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Peso objetivo (kg)</label>
          <input
            type="number"
            value={data.goalWeight}
            onChange={(e) => updateField('goalWeight', e.target.value)}
            placeholder="70"
            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Altura (cm) *</label>
          <input
            type="number"
            value={data.height}
            onChange={(e) => updateField('height', e.target.value)}
            placeholder="175"
            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Edad *</label>
          <input
            type="number"
            value={data.age}
            onChange={(e) => updateField('age', e.target.value)}
            placeholder="27"
            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Género</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateField('gender', 'male')}
            className={`py-3 rounded-xl font-medium transition-all ${
              data.gender === 'male'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
            }`}
          >
            👨 Masculino
          </button>
          <button
            onClick={() => updateField('gender', 'female')}
            className={`py-3 rounded-xl font-medium transition-all ${
              data.gender === 'female'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
            }`}
          >
            👩 Femenino
          </button>
        </div>
      </div>
    </div>
  );
}
