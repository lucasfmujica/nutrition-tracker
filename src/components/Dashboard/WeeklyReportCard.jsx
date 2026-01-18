import { Dumbbell, Scale, Utensils } from 'lucide-react';
import React from 'react';

/**
 * WeeklyReportCard - Premium shareable card for Social Accountability Reports
 *
 * Designed for image conversion with html2canvas.
 * Optimized for WhatsApp Stories (4:5 aspect ratio).
 * Follows UX-Lead 'Premium Minimalist' guidelines from Clearframe Studio.
 *
 * @param {Object} props
 * @param {number} props.workouts - Number of completed workout sessions
 * @param {number} props.proteinAdherence - Average protein target adherence (%)
 * @param {number|null} props.weightDelta - Weight change from week start (kg)
 * @param {string} props.weekRange - Formatted week range (e.g., "13 Ene - 19 Ene")
 * @param {React.Ref} ref - Forwarded ref for html2canvas capture
 */
export const WeeklyReportCard = React.forwardRef(({
  workouts = 0,
  proteinAdherence = 0,
  weightDelta = null,
  weekRange = ''
}, ref) => {
  // Format weight delta for display
  const formatWeightDelta = () => {
    if (weightDelta === null || weightDelta === undefined) return '-';
    const sign = weightDelta > 0 ? '+' : '';
    return `${sign}${weightDelta.toFixed(1)}`;
  };

  // Determine weight delta color
  const getWeightDeltaColor = () => {
    if (weightDelta === null || weightDelta === undefined) return 'text-gray-400';
    if (weightDelta < 0) return 'text-emerald-500'; // Losing weight (goal)
    if (weightDelta > 0) return 'text-amber-500'; // Gaining weight
    return 'text-gray-600'; // No change
  };

  // Stat item component for visual consistency
  const StatItem = ({ icon: Icon, iconBg, iconColor, label, value, unit }) => (
    <div className="text-center">
      <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
        <Icon className={`w-7 h-7 ${iconColor}`} strokeWidth={1.5} />
      </div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1">
        {label}
      </p>
      <div className="flex items-baseline justify-center gap-1">
        <span className={`text-3xl font-bold ${typeof value === 'string' && value.includes('-') ? getWeightDeltaColor() : 'text-gray-900'}`}>
          {value}
        </span>
        <span className="text-xs text-gray-400 font-medium">{unit}</span>
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{
        width: '22rem',
        height: '28rem',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)',
        borderRadius: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Subtle Decorative Elements */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full opacity-[0.03]"
        style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
      />

      {/* Content Container - Generous padding for breathing room */}
      <div className="relative h-full flex flex-col px-8 py-8">

        {/* Header - Clean & Minimal */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-full mb-4">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em]">
              Resumen Semanal
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {weekRange || 'Esta Semana'}
          </h1>
        </div>

        {/* Stats Grid - Horizontal Layout */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-6 w-full">
            <StatItem
              icon={Dumbbell}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
              label="Entrenos"
              value={workouts}
              unit=""
            />
            <StatItem
              icon={Utensils}
              iconBg="bg-rose-50"
              iconColor="text-rose-500"
              label="Proteína"
              value={`${proteinAdherence || 0}%`}
              unit=""
            />
            <StatItem
              icon={Scale}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-500"
              label="Peso"
              value={formatWeightDelta()}
              unit="kg"
            />
          </div>
        </div>

        {/* Footer / Branding - Subtle & Professional */}
        <div className="pt-6 flex items-center justify-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
          />
          <span className="text-[11px] font-semibold text-gray-300 tracking-wider">
            LUKENFIT
          </span>
        </div>
      </div>
    </div>
  );
});

WeeklyReportCard.displayName = 'WeeklyReportCard';
