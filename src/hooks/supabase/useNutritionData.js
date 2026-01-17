import { useCallback } from 'react';
import { mappers } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { addPendingWrite } from '../../utils/storageUtils';
import { useSupabaseOperation } from './useSupabaseOperation';

export function useNutritionData(user, isOnline) {
  const { withSync, withTimeout } = useSupabaseOperation();
  const canUseSupabase = user && isOnline;

  // =====================================================
  // FOOD LOG OPERATIONS
  // =====================================================

  const fetchFoodLog = useCallback(async () => {
    if (!canUseSupabase) return [];

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('food_log')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .order('time', { ascending: true }),
        45000,
        'fetchFoodLog'
      );

      if (error) {
        console.error('Error fetching food log:', error);
        return [];
      }

      return data.map(mappers.foodFromDb);
    } catch (err) {
      console.error('fetchFoodLog failed:', err);
      return [];
    }
  }, [canUseSupabase, user?.id, withTimeout]);

  const saveFood = useCallback(async (entry) => {
    const result = await withSync(async () => {
      const isUpdate = entry.id && !entry.id.startsWith('f-');

      if (isUpdate) {
        const { data, error } = await supabase
          .from('food_log')
          .update(mappers.foodToDb(entry, user.id))
          .eq('id', entry.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return { data: data ? mappers.foodFromDb(data) : null, error: null };
      } else {
        const { data, error } = await supabase
          .from('food_log')
          .insert(mappers.foodToDb(entry, user.id))
          .select()
          .single();

        if (error) throw error;
        return { data: data ? mappers.foodFromDb(data) : null, error: null };
      }
    }, { canUseSupabase, errorMessage: 'Error guardando comida' });

    // 🔒 CRITICAL: The Vault fallback - Zero Silent Failures
    if (result.error && user?.id) {
      console.error('[useNutritionData] saveFood failed, adding to pending writes:', {
        table: 'food_log',
        userId: user.id,
        entryId: entry.id,
        date: entry.date,
        error: result.error
      });
      await addPendingWrite('food_log', entry, user.id);
      console.log('[useNutritionData] Food entry queued for sync when connection recovers');
    }

    return result;
  }, [canUseSupabase, user?.id, withSync]);

  const deleteFood = useCallback(async (id) => {
    return withSync(async () => {
      const { error } = await supabase
        .from('food_log')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    }, { canUseSupabase, errorMessage: 'Error eliminando comida' });
  }, [canUseSupabase, user?.id, withSync]);

  // =====================================================
  // WATER LOG OPERATIONS
  // =====================================================

  const fetchWaterLog = useCallback(async () => {
    if (!canUseSupabase) return [];

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('water_log')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        45000,
        'fetchWaterLog'
      );

      if (error) {
        console.error('Error fetching water log:', error);
        return [];
      }

      return data.map(mappers.waterFromDb);
    } catch (err) {
      console.error('fetchWaterLog failed:', err);
      return [];
    }
  }, [canUseSupabase, user?.id, withTimeout]);

  const saveWater = useCallback(async (entry) => {
    const result = await withSync(async () => {
      const { data, error } = await supabase
        .from('water_log')
        .upsert(mappers.waterToDb(entry, user.id), {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data ? mappers.waterFromDb(data) : null, error: null };
    }, { canUseSupabase, errorMessage: 'Error guardando agua' });

    // 🔒 CRITICAL: The Vault fallback - Zero Silent Failures
    if (result.error && user?.id) {
      console.error('[useNutritionData] saveWater failed, adding to pending writes:', {
        table: 'water_log',
        userId: user.id,
        date: entry.date,
        amount: entry.amount,
        error: result.error
      });
      await addPendingWrite('water_log', entry, user.id);
      console.log('[useNutritionData] Water entry queued for sync when connection recovers');
    }

    return result;
  }, [canUseSupabase, user?.id, withSync]);

  return {
    fetchFoodLog,
    saveFood,
    deleteFood,
    fetchWaterLog,
    saveWater
  };
}
