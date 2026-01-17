import { useCallback } from 'react';
import { mappers } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { useSupabaseOperation } from './useSupabaseOperation';

export function useMigration(user, isOnline) {
  const { setSyncStatus, setSyncError, setLastSyncTime } = useSupabaseOperation();
  const canUseSupabase = user && isOnline;

  const migrateLocalStorageToSupabase = useCallback(async (localData) => {
    if (!canUseSupabase) {
      return { success: false, error: 'Not authenticated' };
    }

    setSyncStatus('syncing');
    const errors = [];

    try {
      // Migrate profile and targets
      if (localData.profile || localData.targets) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            ...mappers.profileToDb(localData.profile || {}, user.id),
            ...mappers.targetsToDb(localData.targets || {}),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (error) errors.push('profile');
      }

      // Migrate weight history
      if (localData.weightHistory?.length > 0) {
        for (const entry of localData.weightHistory) {
          try {
            await supabase
              .from('weight_history')
              .upsert(mappers.weightToDb(entry, user.id), {
                onConflict: 'user_id,date',
              });
          } catch (e) {
            errors.push(`weight-${entry.date}`);
          }
        }
      }

      // Migrate food log - use upsert to avoid duplicates
      if (localData.foodLog?.length > 0) {
        for (const entry of localData.foodLog) {
          try {
            await supabase
              .from('food_log')
              .upsert(mappers.foodToDb(entry, user.id), {
                onConflict: 'id',
              });
          } catch (e) {
            errors.push(`food-${entry.id}`);
          }
        }
      }

      // Migrate workouts - use upsert to avoid duplicates
      if (localData.workouts?.length > 0) {
        for (const entry of localData.workouts) {
          try {
            await supabase
              .from('workouts')
              .upsert(mappers.workoutToDb(entry, user.id), {
                onConflict: 'id',
              });
          } catch (e) {
            errors.push(`workout-${entry.id}`);
          }
        }
      }

      // Migrate steps
      if (localData.stepsLog?.length > 0) {
        for (const entry of localData.stepsLog) {
          try {
            await supabase
              .from('steps_log')
              .upsert(mappers.stepsToDb(entry, user.id), {
                onConflict: 'user_id,date',
              });
          } catch (e) {
            errors.push(`steps-${entry.date}`);
          }
        }
      }

      // Migrate Oura data
      if (localData.ouraLog?.length > 0) {
        for (const entry of localData.ouraLog) {
          try {
            await supabase
              .from('oura_log')
              .upsert(mappers.ouraToDb(entry, user.id), {
                onConflict: 'user_id,date',
              });
          } catch (e) {
            errors.push(`oura-${entry.date}`);
          }
        }
      }

      setSyncStatus('success');
      setLastSyncTime(new Date());
      setTimeout(() => setSyncStatus('idle'), 1500);

      if (errors.length > 0) {
        console.warn('Some items failed to migrate:', errors);
        return { success: true, partialErrors: errors };
      }

      return { success: true };
    } catch (err) {
      console.error('Migration error:', err);
      setSyncStatus('error');
      setSyncError(err.message);
      // Reset to idle after error
      setTimeout(() => setSyncStatus('idle'), 3000);
      return { success: false, error: err.message };
    }
  }, [canUseSupabase, user?.id, setSyncStatus, setSyncError, setLastSyncTime]);

  const checkLocalStorageForMigration = useCallback(() => {
    const keys = [
      'lucas-profile-v5',
      'lucas-weight-history-v5',
      'lucas-food-log-v5',
      'lucas-workout-log-v5',
      'lucas-steps-log-v5',
      'lucas-targets-v5',
      'lucas-oura-log-v5'
    ];

    let hasData = false;
    const localData = {};

    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        hasData = true;
        try {
          const parsed = JSON.parse(value);
          if (key.includes('profile')) localData.profile = parsed;
          if (key.includes('targets')) localData.targets = parsed;
          if (key.includes('weight')) localData.weightHistory = parsed;
          if (key.includes('food')) localData.foodLog = parsed;
          if (key.includes('workout')) localData.workouts = parsed;
          if (key.includes('steps')) localData.stepsLog = parsed;
          if (key.includes('oura')) localData.ouraLog = parsed;
        } catch (e) {
          console.error('Error parsing localStorage:', key, e);
        }
      }
    }

    return { hasData, localData };
  }, []);

  const clearMigratedLocalStorage = useCallback(() => {
    const keys = [
      'lucas-profile-v5',
      'lucas-weight-history-v5',
      'lucas-food-log-v5',
      'lucas-workout-log-v5',
      'lucas-steps-log-v5',
      'lucas-targets-v5',
      'lucas-oura-log-v5'
    ];

    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, []);

  return {
    migrateLocalStorageToSupabase,
    checkLocalStorageForMigration,
    clearMigratedLocalStorage
  };
}
