import { useCallback } from 'react';
import { mappers } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { addPendingWrite } from '../../utils/storageUtils';
import { useSupabaseOperation } from './useSupabaseOperation';

export function useWeightData(user, isOnline) {
  const { withSync, withTimeout } = useSupabaseOperation();
  const canUseSupabase = user && isOnline;

  const fetchWeightHistory = useCallback(async () => {
    if (!canUseSupabase) return [];

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('weight_history')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        45000,
        'fetchWeightHistory'
      );

      if (error) {
        console.error('Error fetching weight history:', error);
        return [];
      }

      return data.map(mappers.weightFromDb);
    } catch (err) {
      console.error('fetchWeightHistory failed:', err);
      return [];
    }
  }, [canUseSupabase, user?.id, withTimeout]);

  const saveWeight = useCallback(async (entry) => {
    const result = await withSync(async () => {
      const { data, error } = await supabase
        .from('weight_history')
        .upsert(mappers.weightToDb(entry, user.id), {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data ? mappers.weightFromDb(data) : null, error: null };
    }, { canUseSupabase, errorMessage: 'Error guardando peso' });

    // 🔒 CRITICAL: The Vault fallback - Zero Silent Failures
    if (result.error && user?.id) {
      console.error('[useWeightData] saveWeight failed, adding to pending writes:', {
        table: 'weight_history',
        userId: user.id,
        date: entry.date,
        weight: entry.weight,
        error: result.error
      });
      await addPendingWrite('weight_history', entry, user.id);
      console.log('[useWeightData] Weight entry queued for sync when connection recovers');
    }

    return result;
  }, [canUseSupabase, user?.id, withSync]);

  const deleteWeight = useCallback(async (id) => {
    return withSync(async () => {
      const { error } = await supabase
        .from('weight_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    }, { canUseSupabase, errorMessage: 'Error eliminando peso' });
  }, [canUseSupabase, user?.id, withSync]);

  return {
    fetchWeightHistory,
    saveWeight,
    deleteWeight
  };
}
