import { addDaysToDate, getArgentinaDateString, getMondayOfWeek } from '../utils/dateUtils';
import { downloadBackup, downloadFile, generateNutritionistReport, parseBackupFile } from '../utils/exportUtils';

export const useExport = (trackerData, analyticsObject) => {
  const {
    profile, setProfile,
    customTargets, setCustomTargets,
    weightHistory, saveWeightHistory,
    foodLog, saveFoodLog,
    workoutLog, saveWorkoutLog,
    stepsLog, saveStepsLog,
    ouraLog, saveOuraLog,
    // helpers needed for reports
    getMostRecentWeight,
    getTotalsForDate,
    getTargetsForDate,
    getStepsForDate,
    getWorkoutsForDate
  } = trackerData;

  // Export all data as JSON backup
  const exportBackup = () => {
    try {
      downloadBackup({
        profile,
        customTargets,
        weightHistory,
        foodLog,
        workoutLog,
        stepsLog,
        ouraLog
      });
    } catch (err) {
      console.error('Error exporting backup:', err);
      alert('Error al exportar backup');
    }
  };

  // Import backup from JSON file
  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseBackupFile(file);

      if (data.profile) setProfile(data.profile);
      if (data.customTargets) setCustomTargets(data.customTargets);
      if (data.weightHistory) saveWeightHistory(data.weightHistory);
      if (data.foodLog) saveFoodLog(data.foodLog);
      if (data.workoutLog) saveWorkoutLog(data.workoutLog);
      if (data.stepsLog) saveStepsLog(data.stepsLog);
      if (data.ouraLog) saveOuraLog(data.ouraLog);

      alert('Backup restaurado correctamente!');
    } catch (err) {
      console.error('Error importing backup:', err);
      alert('Error al importar backup: archivo inválido');
    }
    event.target.value = ''; // Reset input
  };

  // Export food log for nutritionist as formatted TXT
  const exportForNutritionist = () => {
    try {
      const report = generateNutritionistReport(foodLog, workoutLog, ouraLog, profile);
      downloadFile(report, `registro-nutricionista-${getArgentinaDateString()}.txt`);
    } catch (err) {
      console.error('Error exporting for nutritionist:', err);
      alert('Error al generar el reporte');
    }
  };

  // Helper for exportForClaude
  const getOuraForDate = (date) => ouraLog.find(o => o.date === date);
  const getFoodsForDate = (date) => foodLog.filter(entry => entry.date === date);

  // Calculate weekly adherence stats (duplicated logic from useAnalytics, but localized for report)
  // Or better, assume trackerData provides analytics functions if possible.
  // BUT the circular dependency if useAnalytics needs data and useExport needs analytics...
  // For now I will duplicate the simple logic or keep it self-contained in the export function to avoid dependency hell.
  // The 'getWeeklyAdherence' logic is complex.
  // Maybe I should pass 'getWeeklyAdherence' from useAnalytics to useExport in NutritionTracker?
  // But NutritionTracker hasn't initialized useAnalytics yet when passing props to useExport?
  // Actually, hooks are called in order.
  // const analytics = useAnalytics(trackerData);
  // const exportOps = useExport(trackerData, analytics);
  // This is a good pattern.
  // I will assume `trackerData` might contain analytics functions OR I will accept a second argument `analytics`.
  // I will write `useExport` to accept `analytics` object as second arg.

  const exportForClaude = () => {
    const { getWeeklyAdherence } = analyticsObject;

    const today = getArgentinaDateString();
    const daysBack = 7; // Last 7 days of data
    const startDate = addDaysToDate(today, -(daysBack - 1));

    // Get dates array
    const dates = [];
    for (let i = 0; i < daysBack; i++) {
      dates.push(addDaysToDate(startDate, i));
    }

    // Current status
    const currentWeight = getMostRecentWeight(weightHistory);
    const todayTotals = getTotalsForDate(today);
    const todayTargets = getTargetsForDate(today);
    const todaySteps = getStepsForDate(today);
    const todayOura = getOuraForDate(today);
    const todayWorkouts = getWorkoutsForDate(today);

    // Weekly stats
    const weekStats = getWeeklyAdherence(0);
    const lastWeekStats = getWeeklyAdherence(1);

    // Build export text
    let txt = '=== LUKENFIT - CONTEXTO PARA CLAUDE ===\n';
    txt += `Fecha: ${today}\n\n`;

    // Current profile
    txt += '## PERFIL ACTUAL\n';
    txt += `Peso actual: ${currentWeight?.weight || profile.currentWeight}kg (${currentWeight?.date || 'N/D'})\n`;
    txt += `Peso objetivo: ${profile.targetWeight}kg\n`;
    txt += `Faltan: ${((currentWeight?.weight || profile.currentWeight) - profile.targetWeight).toFixed(1)}kg\n`;
    txt += `Altura: ${profile.height}cm | Edad: ${profile.age}\n\n`;

    // Targets
    txt += '## OBJETIVOS DIARIOS\n';
    txt += `Rest day: ${customTargets.calories}kcal | ${customTargets.protein}g prot | ${customTargets.carbs}g carbs | ${customTargets.fat}g fat | ${customTargets.fiber}g fibra\n`;
    txt += `Training day: ${customTargets.calories + customTargets.trainingDayCaloriesBonus}kcal | ${customTargets.protein}g prot | ${customTargets.trainingDayCarbs}g carbs\n\n`;

    // Today's status
    txt += '## HOY (' + today + ')\n';
    txt += `Macros: ${todayTotals.calories}/${todayTargets.calories}kcal | ${todayTotals.protein}/${todayTargets.protein}g prot | ${todayTotals.carbs}/${todayTargets.carbs}g carbs | ${todayTotals.fat}/${todayTargets.fat}g fat\n`;
    txt += `Restante: ${todayTargets.calories - todayTotals.calories}kcal | ${todayTargets.protein - todayTotals.protein}g prot\n`;
    txt += `Pasos: ${todaySteps}\n`;
    if (todayWorkouts.length > 0) {
      txt += `Entreno: ${todayWorkouts.map(w => w.name).join(', ')}\n`;
    }
    if (todayOura) {
      txt += `Oura: Sleep ${todayOura.sleepScore} | Readiness ${todayOura.readinessScore} | HRV ${todayOura.hrv}ms\n`;
    }
    txt += '\n';

    // Today's meals
    const todayFoods = getFoodsForDate(today);
    if (todayFoods.length > 0) {
      txt += '## COMIDAS DE HOY\n';
      todayFoods.forEach(f => {
        txt += `- ${f.meal}${f.time ? ' (' + f.time + ')' : ''}: ${f.name} → ${f.calories}kcal, ${f.protein}g prot\n`;
      });
      txt += '\n';
    }

    // Weekly adherence
    txt += '## ADHERENCIA SEMANAL\n';
    txt += `Esta semana: Score ${weekStats.score}/10 | Cal OK: ${weekStats.calOkDays}/${weekStats.daysTracked} | Prot OK: ${weekStats.protOkDays}/${weekStats.daysTracked} | Pasos OK: ${weekStats.stepsOkDays}/${weekStats.daysTracked}\n`;
    txt += `Promedios: ${weekStats.avgCals}kcal/día | ${weekStats.avgProt}g prot/día | ${weekStats.avgSteps} pasos/día\n`;
    txt += `Semana pasada: Score ${lastWeekStats.score}/10 | ${lastWeekStats.avgCals}kcal/día | ${lastWeekStats.avgProt}g prot/día\n\n`;

    // Weight trend
    if (weightHistory.length >= 2) {
      const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
      const recentWeights = sorted.slice(-7);
      txt += '## PESO ÚLTIMOS 7 REGISTROS\n';
      recentWeights.forEach(w => {
        txt += `${w.date}: ${w.weight}kg\n`;
      });

      // Calculate trend
      if (recentWeights.length >= 2) {
        const oldest = recentWeights[0];
        const newest = recentWeights[recentWeights.length - 1];
        const daysDiff = Math.max(1, (new Date(newest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24));
        const weightDiff = oldest.weight - newest.weight;
        const weeklyRate = (weightDiff / daysDiff) * 7;
        txt += `Tendencia: ${weeklyRate > 0 ? '-' : '+'}${Math.abs(weeklyRate).toFixed(2)}kg/semana\n`;
      }
      txt += '\n';
    }

    // Recent workouts
    const recentWorkouts = workoutLog
      .filter(w => w.date >= startDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (recentWorkouts.length > 0) {
      txt += '## ENTRENOS ÚLTIMOS 7 DÍAS\n';
      recentWorkouts.forEach(w => {
        txt += `${w.date}: ${w.type.toUpperCase()} - ${w.name} (${w.duration}min`;
        if (w.volume) txt += `, ${w.volume}kg vol`;
        txt += ')\n';
        if (w.exercises && w.exercises.length > 0) {
          w.exercises.slice(0, 3).forEach(ex => {
            txt += `  - ${ex.name}: ${ex.sets}x${ex.reps}@${ex.weight}kg\n`;
          });
          if (w.exercises.length > 3) txt += `  ... y ${w.exercises.length - 3} ejercicios más\n`;
        }
      });
      txt += '\n';
    }

    // Daily summary last 7 days
    txt += '## RESUMEN DIARIO (ÚLTIMOS 7 DÍAS)\n';
    dates.forEach(date => {
      const totals = getTotalsForDate(date);
      const targets = getTargetsForDate(date);
      const steps = getStepsForDate(date);
      const workouts = getWorkoutsForDate(date);
      const isTraining = workouts.length > 0;

      const calStatus = Math.abs(totals.calories - targets.calories) <= 150 ? '✓' : totals.calories > targets.calories ? '↑' : '↓';
      const protStatus = totals.protein >= targets.protein * 0.9 ? '✓' : '↓';

      txt += `${date}${isTraining ? ' 🏋️' : ''}: ${totals.calories}kcal${calStatus} | ${totals.protein}g prot${protStatus} | ${steps} pasos`;
      if (workouts.length > 0) txt += ` | ${workouts.map(w => w.type).join('+')}`;
      txt += '\n';
    });

    txt += '\n=== FIN EXPORT ===\n';
    txt += 'Pegá esto en el chat con Claude para contexto completo.\n';

    // Copy to clipboard
    navigator.clipboard.writeText(txt).then(() => {
      alert('✓ Copiado al portapapeles!\n\nPegalo en el chat con Claude.');
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-claude-${today}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return {
    exportBackup,
    importBackup,
    exportForNutritionist,
    exportForClaude
  };
};
