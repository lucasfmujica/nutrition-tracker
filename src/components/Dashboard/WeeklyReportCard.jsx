// ... imports
import { Activity, Dumbbell, Scale, Utensils } from 'lucide-react';
import React from 'react';

/**
 * WeeklyReportCard - Premium shareable card for Social Accountability Reports
 * ...
 */
export const WeeklyReportCard = React.forwardRef(({
  workouts = 0, // Fallback total
  gymCount = 0,
  tennisCount = 0,
  proteinAdherence = 0,
  proteinAvg = 0,
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
  const StatItem = ({ icon: Icon, iconBg, iconColor, label, value, unit, subtext }) => (
    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-gray-50 shadow-sm">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
      </div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${typeof value === 'string' && value.includes('-') || typeof value === 'string' && value.includes('+') ? getWeightDeltaColor() : 'text-gray-900'}`}>
          {value}
        </span>
        {unit && <span className="text-[10px] text-gray-400 font-bold">{unit}</span>}
      </div>
      {subtext && <span className="text-[9px] text-gray-400">{subtext}</span>}
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
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
        borderRadius: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Background Decor */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.03] translate-x-1/3 -translate-y-1/3"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.03] -translate-x-1/3 translate-y-1/3"
        style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
      />

      {/* Content Container */}
      <div className="relative h-full flex flex-col px-8 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100/80 backdrop-blur-sm rounded-full mb-3 border border-gray-100">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
              LUKENFIT REPORT
            </span>
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
            {weekRange || 'Esta Semana'}
          </h1>
        </div>

        {/* Stats Grid - 2x2 Layout */}
        <div className="flex-1 grid grid-cols-2 gap-4 place-content-center">
            {/* 1. Bodybuilding/Gym */}
            <StatItem
              icon={Dumbbell}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="Fuerza"
              value={gymCount}
              unit="sesiones"
            />

            {/* 2. Tennis/Sport */}
            <StatItem
              icon={Activity}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              label="Tenis"
              value={tennisCount}
              unit="partidos"
            />

            {/* 3. Protein */}
            <StatItem
              icon={Utensils}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-500"
              label="Proteína"
              value={proteinAvg || 0}
              unit="g/día"
              subtext={`${proteinAdherence}% adherencia`}
            />

            {/* 4. Weight */}
            <StatItem
              icon={Scale}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-500"
              label="Peso"
              value={formatWeightDelta()}
              unit="kg"
            />
        </div>

        {/* Footer */}
        <div className="pt-6 flex flex-col items-center justify-center gap-1">
          <div className="h-0.5 w-8 bg-gray-200 rounded-full mb-2"></div>
          <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
            Semana Finalizada
          </span>
        </div>
      </div>
    </div>
  );
});

WeeklyReportCard.displayName = 'WeeklyReportCard';
