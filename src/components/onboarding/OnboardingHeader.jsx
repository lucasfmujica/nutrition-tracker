import React from 'react';

/**
 * Header component for the Onboarding Wizard
 * Displays the welcome message and progress bar
 */
export function OnboardingHeader({ step, totalSteps }) {
  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <span className="text-2xl">💪</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">¡Bienvenido a LukenFit!</h1>
        <p className="text-gray-400">Configuremos tu perfil en {totalSteps} pasos</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full transition-all ${
              s <= step ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    </>
  );
}
