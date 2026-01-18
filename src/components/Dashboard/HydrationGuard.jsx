/**
 * HydrationGuard.jsx
 *
 * Weather-aware hydration dashboard component
 * Displays dynamic water intake targets with personalized coach tips
 *
 * @compliance @claude-md-compliance-checker - Under 150 lines
 */

import { Cloud, Droplets, Flame, Sun, Zap } from 'lucide-react';
import React from 'react';

/**
 * Generate personalized coach tip based on hydration context
 */
const generateCoachTip = (hydrationTarget, currentIntake) => {
  const { heatBonus, activityBonus, needsElectrolytes, weatherStatus, activityMinutes } = hydrationTarget;

  // High heat with electrolyte recommendation
  if (needsElectrolytes) {
    return `🔥 Hace ${weatherStatus?.temperature}°C con alta humedad en BA. Agregá 800ml de agua y electrolitos para mantener tu progreso hacia los 75 kg.`;
  }

  // Activity bonus present
  if (activityBonus > 0 && activityMinutes > 0) {
    return `💪 Registraste ${activityMinutes} minutos de actividad hoy. Tu cuerpo necesita ${activityBonus}ml extra para recuperación óptima.`;
  }

  // Heat bonus without extreme heat
  if (heatBonus > 0) {
    return `☀️ Temperatura de ${weatherStatus?.temperature}°C en BA. Aumentá tu ingesta en ${heatBonus}ml para compensar la pérdida por calor.`;
  }

  // Normal conditions
  return `✅ Condiciones ideales hoy. Mantené tu línea base de 2500ml para un progreso sostenido.`;
};

/**
 * Weather status badge component
 */
const WeatherBadge = ({ weatherStatus, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Cloud size={16} className="animate-pulse" />
        <span>Cargando clima...</span>
      </div>
    );
  }

  if (!weatherStatus) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Cloud size={16} />
        <span>Clima no disponible</span>
      </div>
    );
  }

  const { temperature, humidity, location } = weatherStatus;
  const isHot = temperature > 28;

  return (
    <div className="flex items-center gap-2 text-sm">
      {isHot ? (
        <Sun size={16} className="text-orange-500" />
      ) : (
        <Cloud size={16} className="text-blue-500" />
      )}
      <span className="font-medium text-gray-700">
        {temperature}°C - {location}
      </span>
      <span className="text-gray-400">•</span>
      <Droplets size={14} className="text-blue-400" />
      <span className="text-gray-600">{humidity}%</span>
    </div>
  );
};

/**
 * HydrationGuard Component
 * Main hydration intelligence dashboard
 */
export const HydrationGuard = ({ currentIntake, hydrationTarget, onAddWater }) => {
  const { target, baseline, heatBonus, activityBonus, needsElectrolytes, weatherStatus, isLoadingWeather } = hydrationTarget;

  // Calculate progress percentage
  const progress = Math.min((currentIntake / target) * 100, 100);
  const isOnTrack = currentIntake >= target * 0.8; // 80% threshold

  // Generate coach tip
  const coachTip = generateCoachTip(hydrationTarget, currentIntake);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
      {/* Header with Weather Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500 rounded-xl">
            <Droplets size={18} className="text-white" />
          </div>
          <h3 className="font-bold text-gray-900">Hidratación Inteligente</h3>
        </div>
        <div className="self-start sm:self-auto">
          <WeatherBadge weatherStatus={weatherStatus} isLoading={isLoadingWeather} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-3xl font-bold text-gray-900">{currentIntake}</span>
            <span className="text-lg text-gray-500 ml-1">ml</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">Meta: </span>
            <span className="text-lg font-bold text-blue-600">{target}ml</span>
          </div>
        </div>

        <div className="h-3 w-full bg-white rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOnTrack ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-blue-300'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Target breakdown */}
        {(heatBonus > 0 || activityBonus > 0) && (
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-gray-500">Base: {baseline}ml</span>
            {activityBonus > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-orange-600 flex items-center gap-1">
                  <Zap size={12} />
                  +{activityBonus}ml
                </span>
              </>
            )}
            {heatBonus > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-red-600 flex items-center gap-1">
                  <Flame size={12} />
                  +{heatBonus}ml
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Coach Tip */}
      <div className={`p-3 rounded-xl ${needsElectrolytes ? 'bg-orange-100 border border-orange-200' : 'bg-white border border-gray-100'}`}>
        <p className="text-sm text-gray-700 leading-relaxed">{coachTip}</p>
      </div>
    </div>
  );
};
