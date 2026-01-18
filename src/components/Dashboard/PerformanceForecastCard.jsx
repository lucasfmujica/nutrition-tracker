import { BatteryCharging, Cloud, CloudRain, Loader, Sun } from 'lucide-react';
import React from 'react';
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

  if (!performanceForecast) return null;

  const {
    status,
    title,
    copy,
    icon,
    ui,
    forecastCode
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

          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {copy}
          </p>
        </div>
      </div>
    </div>
  );
};
