import { Activity, CalendarDays, Dumbbell, Flame, Scale, Trophy, Utensils } from 'lucide-react';
import React from 'react';

/**
 * WeeklyReportCard - Premium shareable card for Social Accountability Reports
 * Refactored for minimalist, insightful design.
 */
export const WeeklyReportCard = React.forwardRef(({
  // Activity
  workouts = 0,
  gymCount = 0,
  tennisCount = 0,

  // Nutrition
  proteinAvg = 0,
  avgDeficit = 0,
  consistencyStreak = 0,
  daysTracked = 0,

  // Weight
  weightDelta = null,
  totalLost = null,
  percentToGoal = null,
  currentWeight = null,

  // Meta
  weekRange = ''
}, ref) => {

  // 1. Helper: Generate Insight Logic
  const generateWeeklyFeedback = () => {
    // Priority 1: Weight Loss
    if (weightDelta !== null && weightDelta < 0) {
      if (avgDeficit > 300) return "¡Gran semana! Estás quemando grasa y manteniendo el ritmo.";
      return "El peso baja, la disciplina sube. ¡Sigue así!";
    }

    // Priority 2: Muscle Gain / Protection
    if (proteinAvg >= 150) { // Assuming ~150g is a good baseline or checking against target if passed
       return "Proteína perfecta. Estás protegiendo tu masa muscular.";
    }

    // Priority 3: Workout Volume
    if (workouts >= 4) {
      return "MVP de la semana por tu consistencia en el gym.";
    }

    // Fallback
    return "La constancia es la clave. ¡Vamos por la próxima semana!";
  };

  const insight = generateWeeklyFeedback();

  return (
    <div
      ref={ref}
      className="relative overflow-hidden flex flex-col"
      style={{
        width: '24rem', // Slightly wider for better spacing
        minHeight: '36rem', // Taller for new sections
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRadius: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Decorative Background */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.03]"
        style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-[0.03]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
      />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">REPORTE SEMANAL</p>
            <h1 className="text-xl font-black text-gray-900">{weekRange || 'Esta Semana'}</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
             <Trophy className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* 1. Hero Section: Weight */}
        <div className="mb-8 text-center relative py-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-3xl -z-10" />

          <div className="inline-flex items-center gap-2 mb-2">
             <Scale className="w-4 h-4 text-slate-400" />
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Peso Corporal</span>
          </div>

          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-6xl font-black text-slate-900 tracking-tighter">
              {currentWeight ? currentWeight.toFixed(1) : '--'}
            </span>
            <span className="text-xl font-medium text-slate-400">kg</span>
          </div>

          {/* Cumulative Progress Pill */}
          {(totalLost !== null && totalLost > 0) && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-[11px] font-medium text-slate-600">
                Total perdido: <span className="font-bold text-slate-900">{totalLost} kg</span>
                {percentToGoal && <span className="text-slate-400 mx-1">/</span>}
                {percentToGoal && <span>{percentToGoal}% meta</span>}
              </p>
            </div>
          )}

          {/* Fallback if no total loss/gain data yet */}
          {(totalLost === null || totalLost <= 0) && weightDelta !== null && (
             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-100">
               <span className={`w-2 h-2 rounded-full ${weightDelta <= 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
               <p className="text-[11px] font-medium text-slate-600">
                 Variación: <span className="font-bold text-slate-900">{weightDelta > 0 ? '+' : ''}{weightDelta} kg</span>
               </p>
             </div>
          )}
        </div>

        {/* 2. Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           {/* Average Deficit */}
           <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] flex flex-col items-center">
              <div className="mb-2 p-2 bg-rose-50 rounded-xl">
                <Flame className="w-5 h-5 text-rose-500" strokeWidth={2} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Déficit Prom.</p>
              <p className="text-2xl font-bold text-slate-900">{avgDeficit > 0 ? avgDeficit : '-'}</p>
              <p className="text-[10px] text-slate-400 font-medium">kcal/día</p>
           </div>

           {/* Consistency Streak */}
           <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] flex flex-col items-center">
              <div className="mb-2 p-2 bg-emerald-50 rounded-xl">
                <CalendarDays className="w-5 h-5 text-emerald-500" strokeWidth={2} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Consistencia</p>
              <p className="text-2xl font-bold text-slate-900">
                {consistencyStreak}<span className="text-lg text-slate-300">/{daysTracked || 7}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium">días on track</p>
           </div>
        </div>

        {/* 3. Activity Breakdown */}
        <div className="mb-8">
           <div className="flex items-center gap-2 mb-3 px-1">
             <Activity className="w-4 h-4 text-slate-400" />
             <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Actividad Total</h3>
           </div>

           <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-50 rounded-lg">
                      <Dumbbell className="w-4 h-4 text-blue-600" />
                   </div>
                   <span className="text-sm font-semibold text-slate-700">Fuerza</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{gymCount} <span className="text-xs font-normal text-slate-400">sesiones</span></span>
             </div>

             <div className="w-full h-px bg-slate-50 mb-4" />

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-orange-50 rounded-lg">
                      <Activity className="w-4 h-4 text-orange-600" />
                   </div>
                   <span className="text-sm font-semibold text-slate-700">Tenis</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{tennisCount} <span className="text-xs font-normal text-slate-400">partidos</span></span>
             </div>
           </div>
        </div>

        {/* 4. LukenFit Insights */}
        <div className="mt-auto bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">LUKENFIT INSIGHTS</p>
           <p className="text-sm font-medium leading-relaxed opacity-90">
             "{insight}"
           </p>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="bg-white py-3 border-t border-slate-50 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-900" />
          <span className="text-[10px] font-bold text-slate-900 tracking-[0.2em]">LUKENFIT REPORT</span>
      </div>

    </div>
  );
});

WeeklyReportCard.displayName = 'WeeklyReportCard';

WeeklyReportCard.displayName = 'WeeklyReportCard';
