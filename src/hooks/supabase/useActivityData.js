import { useCallback } from 'react';
import { mappers } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { useSupabaseOperation } from './useSupabaseOperation';

export function useActivityData(user, isOnline) {
  const { withSync, withTimeout } = useSupabaseOperation();
  const canUseSupabase = user && isOnline;

  // =====================================================
  // WORKOUT OPERATIONS
  // =====================================================

  const fetchWorkouts = useCallback(async () => {
    if (!canUseSupabase) return [];

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        45000,
        'fetchWorkouts'
      );

      if (error) {
        console.error('Error fetching workouts:', error);
        return [];
      }

      return data.map(mappers.workoutFromDb);
    } catch (err) {
      console.error('fetchWorkouts failed:', err);
      return [];
    }
  }, [canUseSupabase, user?.id, withTimeout]);

  const saveWorkout = useCallback(async (entry) => {
    return withSync(async () => {
      const isUpdate = entry.id && !entry.id.startsWith('w');

      if (isUpdate) {
        const { data, error } = await supabase
          .from('workouts')
          .update(mappers.workoutToDb(entry, user.id))
          .eq('id', entry.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return { data: data ? mappers.workoutFromDb(data) : null, error: null };
      } else {
        const { data, error } = await supabase
          .from('workouts')
          .insert(mappers.workoutToDb(entry, user.id))
          .select()
          .single();

        if (error) throw error;
        return { data: data ? mappers.workoutFromDb(data) : null, error: null };
      }
    }, { canUseSupabase, errorMessage: 'Error guardando entreno' });
  }, [canUseSupabase, user?.id, withSync]);

  const deleteWorkout = useCallback(async (id) => {
    return withSync(async () => {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    }, { canUseSupabase, errorMessage: 'Error eliminando entreno' });
  }, [canUseSupabase, user?.id, withSync]);

  // =====================================================
  // STEPS LOG OPERATIONS
  // =====================================================

  const fetchStepsLog = useCallback(async () => {
    if (!canUseSupabase) return [];

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('steps_log')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        45000,
        'fetchStepsLog'
      );

      if (error) {
        console.error('Error fetching steps:', error);
        return [];
      }

      return data.map(mappers.stepsFromDb);
    } catch (err) {
      console.error('fetchStepsLog failed:', err);
      return [];
    }
  }, [canUseSupabase, user?.id, withTimeout]);

  const saveSteps = useCallback(async (entry) => {
    return withSync(async () => {
      const { data, error } = await supabase
        .from('steps_log')
        .upsert(mappers.stepsToDb(entry, user.id), {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data ? mappers.stepsFromDb(data) : null, error: null };
    }, { canUseSupabase, errorMessage: 'Error guardando pasos' });
  }, [canUseSupabase, user?.id, withSync]);

  // =====================================================
  // OURA LOG OPERATIONS
  // =====================================================

  const fetchOuraLog = useCallback(async () => {
    if (!canUseSupabase) return [];

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('oura_log')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        45000,
        'fetchOuraLog'
      );

      if (error) {
        console.error('Error fetching oura log:', error);
        return [];
      }

      return data.map(mappers.ouraFromDb);
    } catch (err) {
      console.error('fetchOuraLog failed:', err);
      return [];
    }
  }, [canUseSupabase, user?.id, withTimeout]);

  const saveOura = useCallback(async (entry) => {
    return withSync(async () => {
      const { data, error } = await supabase
        .from('oura_log')
        .upsert(mappers.ouraToDb(entry, user.id), {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data ? mappers.ouraFromDb(data) : null, error: null };
    }, { canUseSupabase, errorMessage: 'Error guardando datos Oura' });
  }, [canUseSupabase, user?.id, withSync]);

  return {
    fetchWorkouts,
    saveWorkout,
    deleteWorkout,
    fetchStepsLog,
    saveSteps,
    fetchOuraLog,
    saveOura
  };
}
