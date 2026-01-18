// useSyncResolver - Handles force sync to cloud operations

export const useSyncResolver = (supabase, useCloud, logs) => {
  const forceSyncToCloud = async (setSaveStatus) => {
    // Contract: Must return { success: boolean, synced: object, message?: string }
    if (!useCloud) return { success: false, message: 'No conectado a la nube' };

    setSaveStatus('Sincronizando...');
    let synced = { workouts: 0, foods: 0, steps: 0, oura: 0, water: 0, weight: 0, errors: 0 };
    const { workoutLog, foodLog, stepsLog, ouraLog, waterLog, weightHistory } = logs;

    try {
      // Workouts
      for (const w of workoutLog) {
        try {
          await supabase.saveWorkout(w);
          synced.workouts++;
        } catch (err) {
          console.error('[SyncResolver] Workout sync failed:', { date: w.date, name: w.name, error: err.message });
          synced.errors++;
        }
      }
      // Food
      for (const f of foodLog) {
        try {
          await supabase.saveFood(f);
          synced.foods++;
        } catch (err) {
          console.error('[SyncResolver] Food sync failed:', { date: f.date, name: f.name, error: err.message });
          synced.errors++;
        }
      }
      // Steps
      for (const s of stepsLog) {
        try {
          await supabase.saveSteps(s);
          synced.steps++;
        } catch (err) {
          console.error('[SyncResolver] Steps sync failed:', { date: s.date, steps: s.steps, error: err.message });
          synced.errors++;
        }
      }
      // Oura
      for (const o of ouraLog) {
        try {
          await supabase.saveOura(o);
          synced.oura++;
        } catch (err) {
          console.error('[SyncResolver] Oura sync failed:', { date: o.date, error: err.message });
          synced.errors++;
        }
      }
      // Water
      for (const w of waterLog) {
        try {
          await supabase.saveWater(w);
          synced.water++;
        } catch (err) {
          console.error('[SyncResolver] Water sync failed:', { date: w.date, glasses: w.glasses, error: err.message });
          synced.errors++;
        }
      }
      // Weight
      for (const w of weightHistory) {
        try {
          await supabase.saveWeight(w);
          synced.weight++;
        } catch (err) {
          console.error('[SyncResolver] Weight sync failed:', { date: w.date, weight: w.weight, error: err.message });
          synced.errors++;
        }
      }

      const total = Object.values(synced).reduce((a, b) => a + b, 0) - synced.errors;
      setSaveStatus(`✓ Sincronizado: ${total} registros`);
      setTimeout(() => setSaveStatus(''), 4000);
      return { success: true, ...synced };
    } catch (err) {
      setSaveStatus('❌ Error al sincronizar');
      setTimeout(() => setSaveStatus(''), 3000);
      return { success: false, message: err.message };
    }
  };

  return {
    forceSyncToCloud
  };
};
