import { useState } from 'react';

export const useSyncResolver = (supabase, useCloud, logs) => {
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigration = async (migrationData, callbacks) => {
    setIsMigrating(true);
    try {
      const result = await supabase.migrateLocalStorageToSupabase(migrationData);
      if (result.success) {
        supabase.clearMigratedLocalStorage();
        // Reload data from Supabase
        const data = await supabase.fetchAllData();
        if (data) {
          callbacks.onSuccess(data);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Migration failed:', err);
      return false;
    } finally {
      setIsMigrating(false);
    }
  };

  const forceSyncToCloud = async (setSaveStatus) => {
    // Contract: Must return { success: boolean, synced: object, message?: string }
    if (!useCloud) return { success: false, message: 'No conectado a la nube' };

    setSaveStatus('Sincronizando...');
    let synced = { workouts: 0, foods: 0, steps: 0, oura: 0, water: 0, weight: 0, errors: 0 };
    const { workoutLog, foodLog, stepsLog, ouraLog, waterLog, weightHistory } = logs;

    try {
      // Workouts
      for (const w of workoutLog) {
        try { await supabase.saveWorkout(w); synced.workouts++; } catch { synced.errors++; }
      }
      // Food
      for (const f of foodLog) {
        try { await supabase.saveFood(f); synced.foods++; } catch { synced.errors++; }
      }
      // Steps
      for (const s of stepsLog) {
        try { await supabase.saveSteps(s); synced.steps++; } catch { synced.errors++; }
      }
      // Oura
      for (const o of ouraLog) {
        try { await supabase.saveOura(o); synced.oura++; } catch { synced.errors++; }
      }
      // Water
      for (const w of waterLog) {
        try { await supabase.saveWater(w); synced.water++; } catch { synced.errors++; }
      }
      // Weight
      for (const w of weightHistory) {
        try { await supabase.saveWeight(w); synced.weight++; } catch { synced.errors++; }
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
    isMigrating,
    handleMigration,
    forceSyncToCloud
  };
};
