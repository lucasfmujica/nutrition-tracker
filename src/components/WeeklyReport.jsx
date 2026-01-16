import { useEffect, useRef, useState } from 'react';

/**
 * Weekly Report Component
 * Shows comprehensive weekly stats with charts and export functionality
 */
export function WeeklyReport({
  foodLog,
  workoutLog,
  weightHistory,
  stepsLog,
  targets,
  onClose
}) {
  const reportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = this week, -1 = last week, etc.

  // Calculate week dates
  const getWeekDates = (weeksAgo = 0) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset - (weeksAgo * 7));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    return {
      monday: monday.toISOString().split('T')[0],
      sunday: sunday.toISOString().split('T')[0],
      dates,
      label: weeksAgo === 0 ? 'Esta Semana' : weeksAgo === -1 ? 'Semana Anterior' : `Hace ${Math.abs(weeksAgo)} semanas`
    };
  };

  const currentWeek = getWeekDates(selectedWeek);
  const previousWeek = getWeekDates(selectedWeek - 1);

  // Calculate stats for a week
  const getWeekStats = (dates) => {
    const weekFood = foodLog.filter(f => dates.includes(f.date));
    const weekWorkouts = workoutLog.filter(w => dates.includes(w.date));
    const weekSteps = stepsLog.filter(s => dates.includes(s.date));
    const weekWeight = weightHistory.filter(w => dates.includes(w.date));

    // Daily stats
    const dailyStats = dates.map(date => {
      const dayFood = weekFood.filter(f => f.date === date);
      const dayWorkouts = weekWorkouts.filter(w => w.date === date);
      const daySteps = weekSteps.find(s => s.date === date);
      const dayWeight = weekWeight.find(w => w.date === date);

      return {
        date,
        calories: dayFood.reduce((sum, f) => sum + f.calories, 0),
        protein: dayFood.reduce((sum, f) => sum + f.protein, 0),
        carbs: dayFood.reduce((sum, f) => sum + f.carbs, 0),
        fat: dayFood.reduce((sum, f) => sum + f.fat, 0),
        workouts: dayWorkouts.length,
        workoutMinutes: dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
        steps: daySteps?.steps || 0,
        weight: dayWeight?.weight || null
      };
    });

    // Totals
    const daysWithFood = dailyStats.filter(d => d.calories > 0).length;
    const totalCalories = dailyStats.reduce((sum, d) => sum + d.calories, 0);
    const totalProtein = dailyStats.reduce((sum, d) => sum + d.protein, 0);
    const totalWorkouts = weekWorkouts.length;
    const totalWorkoutMins = dailyStats.reduce((sum, d) => sum + d.workoutMinutes, 0);
    const totalSteps = dailyStats.reduce((sum, d) => sum + d.steps, 0);

    // Averages
    const avgCalories = daysWithFood > 0 ? Math.round(totalCalories / daysWithFood) : 0;
    const avgProtein = daysWithFood > 0 ? Math.round(totalProtein / daysWithFood) : 0;
    const avgSteps = Math.round(totalSteps / 7);

    // Best day
    const bestCalorieDay = dailyStats.reduce((best, d) => {
      const diff = Math.abs(d.calories - targets.calories);
      const bestDiff = Math.abs(best.calories - targets.calories);
      return diff < bestDiff && d.calories > 0 ? d : best;
    }, dailyStats[0]);

    // Adherence
    const calOkDays = dailyStats.filter(d => d.calories >= targets.calories * 0.9 && d.calories <= targets.calories * 1.1).length;
    const protOkDays = dailyStats.filter(d => d.protein >= targets.protein * 0.9).length;

    return {
      dailyStats,
      summary: {
        avgCalories,
        avgProtein,
        avgSteps,
        totalWorkouts,
        totalWorkoutMins,
        daysWithFood,
        calOkDays,
        protOkDays,
        bestDay: bestCalorieDay
      }
    };
  };

  const thisWeekStats = getWeekStats(currentWeek.dates);
  const lastWeekStats = getWeekStats(previousWeek.dates);

  // Calculate change
  const calChange = lastWeekStats.summary.avgCalories > 0
    ? ((thisWeekStats.summary.avgCalories - lastWeekStats.summary.avgCalories) / lastWeekStats.summary.avgCalories * 100).toFixed(1)
    : 0;
  const protChange = lastWeekStats.summary.avgProtein > 0
    ? ((thisWeekStats.summary.avgProtein - lastWeekStats.summary.avgProtein) / lastWeekStats.summary.avgProtein * 100).toFixed(1)
    : 0;

  // Export as image
  const exportAsImage = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#1f2937',
        scale: 2,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `lukenfit-report-${currentWeek.monday}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error exporting:', err);
      alert('Error al exportar. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  // Day names
  const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  // Bar chart helper
  const getBarHeight = (value, max) => Math.min((value / max) * 100, 100);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 overflow-y-auto">
      <div className="w-full max-w-2xl my-4">
        {/* Header outside export area */}
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-bold text-white">📊 Reporte Semanal</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportAsImage}
              disabled={isExporting}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? '⏳' : '📷'} {isExporting ? 'Exportando...' : 'Exportar'}
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Week selector */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setSelectedWeek(s => s - 1)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
          >
            ← Anterior
          </button>
          <span className="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
            {currentWeek.label}
          </span>
          <button
            onClick={() => setSelectedWeek(s => Math.min(s + 1, 0))}
            disabled={selectedWeek >= 0}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm"
          >
            Siguiente →
          </button>
        </div>

        {/* Exportable Report Card */}
        <div ref={reportRef} className="bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-2xl">💪</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">LukenFit</h3>
                <p className="text-sm text-gray-400">{currentWeek.monday} → {currentWeek.sunday}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">{thisWeekStats.summary.calOkDays}/7</div>
              <p className="text-xs text-gray-400">días en meta</p>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{thisWeekStats.summary.avgCalories}</div>
              <div className="text-xs text-gray-400">kcal/día</div>
              <div className={`text-xs mt-1 ${parseFloat(calChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {calChange > 0 ? '↑' : calChange < 0 ? '↓' : '='} {Math.abs(calChange)}%
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-cyan-400">{thisWeekStats.summary.avgProtein}g</div>
              <div className="text-xs text-gray-400">proteína/día</div>
              <div className={`text-xs mt-1 ${parseFloat(protChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {protChange > 0 ? '↑' : protChange < 0 ? '↓' : '='} {Math.abs(protChange)}%
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{thisWeekStats.summary.totalWorkouts}</div>
              <div className="text-xs text-gray-400">entrenos</div>
              <div className="text-xs mt-1 text-gray-500">{thisWeekStats.summary.totalWorkoutMins} min</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{Math.round(thisWeekStats.summary.avgSteps / 1000)}k</div>
              <div className="text-xs text-gray-400">pasos/día</div>
              <div className="text-xs mt-1 text-gray-500">prom.</div>
            </div>
          </div>

          {/* Calories Chart */}
          <div className="bg-gray-700/30 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-white">Calorías 7 días</h4>
              <span className="text-xs text-gray-400">Meta: {targets.calories}</span>
            </div>
            <div className="flex items-end justify-between gap-1 h-24">
              {thisWeekStats.dailyStats.map((day, i) => {
                const height = getBarHeight(day.calories, targets.calories * 1.3);
                const isOk = day.calories >= targets.calories * 0.9 && day.calories <= targets.calories * 1.1;
                const isOver = day.calories > targets.calories * 1.1;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative" style={{ height: '80px' }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t transition-all ${
                          isOk ? 'bg-green-500' : isOver ? 'bg-red-500' : day.calories > 0 ? 'bg-blue-500' : 'bg-gray-600'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      {/* Goal line */}
                      <div
                        className="absolute w-full border-t border-dashed border-gray-500"
                        style={{ bottom: `${getBarHeight(targets.calories, targets.calories * 1.3)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{dayNames[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Protein Chart */}
          <div className="bg-gray-700/30 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-white">Proteína 7 días</h4>
              <span className="text-xs text-gray-400">Meta: {targets.protein}g</span>
            </div>
            <div className="flex items-end justify-between gap-1 h-24">
              {thisWeekStats.dailyStats.map((day, i) => {
                const height = getBarHeight(day.protein, targets.protein * 1.3);
                const isOk = day.protein >= targets.protein * 0.9;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative" style={{ height: '80px' }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t transition-all ${
                          isOk ? 'bg-cyan-500' : day.protein > 0 ? 'bg-cyan-500/50' : 'bg-gray-600'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <div
                        className="absolute w-full border-t border-dashed border-gray-500"
                        style={{ bottom: `${getBarHeight(targets.protein, targets.protein * 1.3)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{dayNames[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Adherence Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✅</span>
                <span className="text-sm font-medium text-white">Adherencia Calorías</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-green-400">{thisWeekStats.summary.calOkDays}</span>
                <span className="text-gray-400">/7 días</span>
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(thisWeekStats.summary.calOkDays / 7) * 100}%` }}
                />
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💪</span>
                <span className="text-sm font-medium text-white">Adherencia Proteína</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-cyan-400">{thisWeekStats.summary.protOkDays}</span>
                <span className="text-gray-400">/7 días</span>
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{ width: `${(thisWeekStats.summary.protOkDays / 7) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Best Day Highlight */}
          {thisWeekStats.summary.bestDay && thisWeekStats.summary.bestDay.calories > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🏆</span>
                <span className="text-sm font-medium text-amber-400">Mejor día de la semana</span>
              </div>
              <p className="text-white">
                <span className="font-bold">{new Date(thisWeekStats.summary.bestDay.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}</span>
                {' - '}
                {thisWeekStats.summary.bestDay.calories} kcal, {thisWeekStats.summary.bestDay.protein}g proteína
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Generado por LukenFit • {new Date().toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
