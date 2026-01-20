import { BatteryCharging, Cloud, CloudRain, Info, Loader, Sun } from 'lucide-react';
import React, { useState } from 'react';
import { useTracker } from '../../context/TrackerContext';

/**
 * PerformanceForecastCard - "Tomorrow's Outlook"
 *
 * Displays the predicted training capacity for the next day based on:
 * - Oura Trends (HRV, RHR)
 * - Recent Volume Load
 */
export const PerformanceForecastCard = () => {
  const { performanceForecast } = useTracker();
  const [showExplanation, setShowExplanation] = useState(false);

  if (!performanceForecast) return null;

  const {
    status,
    title,
    copy,
    icon,
    ui,
    forecastCode,
    metrics
  } = performanceForecast;

  // Icon Mapping
  const getIcon = () => {
    switch (icon) {
      case 'sun': return <Sun className="w-8 h-8 text-amber-500" />;
      case 'cloud': return <Cloud className="w-8 h-8 text-slate-400" />;
      case 'cloud-rain': return <CloudRain className="w-8 h-8 text-indigo-400" />;
      case 'battery-charging': return <BatteryCharging className="w-8 h-8 text-purple-500" />; // Or specific battery icon
      case 'loading': return <Loader className="w-8 h-8 text-slate-300 animate-spin" />;
      default: return <Cloud className="w-8 h-8 text-slate-400" />;
    }
  };

  // Gradient Mapping fallback
  const gradientClass = ui?.gradient || 'from-gray-50 to-slate-50';
  const textClass = ui?.textColor || 'text-gray-700';

  return (
    <div className={`card bg-gradient-to-br ${gradientClass} p-5 shadow-sm rounded-2xl border border-white/60 relative overflow-hidden`}>
      {/* Decorative background circle */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/40 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-black/5">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0 w-full">
          <div className="flex justify-between items-start gap-2 w-full">
            <div className="min-w-0 flex-1">
              <h3 className={`text-sm font-bold uppercase tracking-wide mb-1 opacity-80 ${textClass} truncate w-full`}>
                Pronóstico Mañana
              </h3>
              <div className={`text-lg font-bold leading-tight ${textClass} break-words line-clamp-2`}>
                {title}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className={`p-1.5 rounded-lg transition-all ${showExplanation ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="¿Cómo se calcula esto?"
              >
                <Info size={18} />
              </button>
            {/* Status Badge (optional, maybe redundant with title) */}
            {forecastCode === 'peak' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Prime
              </span>
            )}
            {forecastCode === 'recovery' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
                Rest
              </span>
            )}
          </div>
        </div>

          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {copy}
          </p>
        </div>
      </div>

      {/* Logic Explanation - Premium Bento Style */}
      {showExplanation && (
        <div className="mt-4 pt-4 border-t border-white/40 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 space-y-3 ring-1 ring-black/5 shadow-inner">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              Algoritmo de Predicción
            </h4>

            <p className="text-xs text-slate-600 leading-relaxed">
              Analizamos la relación entre tu recuperación reciente y la fatiga acumulada para predecir tu ventana de rendimiento óptimo.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tendencia Readiness</span>
                <div className="flex items-center gap-2">
                   <span className={`text-sm font-black ${parseFloat(metrics.readinessTrend) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                     {metrics.readinessTrend > 0 ? '+' : ''}{metrics.readinessTrend}%
                   </span>
                   <span className="text-[10px] text-slate-400">vs 7d</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tendencia Sueño</span>
                <div className="flex items-center gap-2">
                   <span className={`text-sm font-black ${parseFloat(metrics.sleepTrend) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                     {metrics.sleepTrend > 0 ? '+' : ''}{metrics.sleepTrend}%
                   </span>
                   <span className="text-[10px] text-slate-400">vs 7d</span>
                </div>
              </div>

              <div className="col-span-2 space-y-1 pt-1 border-t border-slate-200/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Carga de Entrenamiento</span>
                <div className="flex items-center justify-between">
                   <span className="text-sm font-black text-slate-700">
                     {metrics.volume48h.toLocaleString()} <span className="text-[10px] font-medium text-slate-400">kg (48h)</span>
                   </span>
                   <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${metrics.volume48h > 10000 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                     {metrics.volume48h > 10000 ? 'ALTA CARGA' : 'ÓPTIMO'}
                   </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-2.5 rounded-lg">
              <p className="text-[10px] text-blue-700 italic leading-snug">
                <strong>¿Por qué esta frase?</strong> {metrics.readinessTrend > 3 && metrics.sleepTrend > 2
                  ? "Tus promedios de 3 días superan a los de 7 días, indicando un ascenso en tu capacidad."
                  : metrics.volume48h > 10000
                    ? "Has acumulado mucho volumen; el algoritmo prioriza la recuperación muscular aunque los scores sean buenos."
                    : "Tus métricas muestran estabilidad fisiológica, lo que sugiere una capacidad estándar."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
