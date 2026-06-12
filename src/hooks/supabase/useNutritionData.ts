import { User } from '@supabase/supabase-js';
import { useCallback } from 'react';
import { mappers } from '../../lib/mappers';
import { supabase } from '../../lib/supabase';
import { FoodEntry, WaterEntry } from '../../types/domain';
import { addPendingWrite } from '../../utils/storageUtils';
import { useSupabaseOperation } from './useSupabaseOperation';

export interface UseNutritionDataReturn {
    fetchFoodLog: () => Promise<FoodEntry[]>;
    saveFood: (
        entry: Partial<FoodEntry>,
    ) => Promise<{ data: FoodEntry | null; error: any }>;
    deleteFood: (id: string) => Promise<{ error: any }>;
    fetchWaterLog: () => Promise<WaterEntry[]>;
    saveWater: (
        entry: Partial<WaterEntry>,
    ) => Promise<{ data: WaterEntry | null; error: any }>;
}

export function useNutritionData(
    user: User | null,
    isOnline: boolean,
): UseNutritionDataReturn {
    const { withSync, withTimeout } = useSupabaseOperation();
    const canUseSupabase = !!(user && isOnline && supabase);

    // =====================================================
    // FOOD LOG OPERATIONS
    // =====================================================

    const fetchFoodLog = useCallback(async (): Promise<FoodEntry[]> => {
        if (!canUseSupabase || !user || !supabase) return [];

        try {
            const { data, error } = await withTimeout(
                supabase!
                    .from('food_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false })
                    .order('time', { ascending: true }),
                45000,
                'fetchFoodLog',
            );

            if (error) throw error;
            if (!data) return [];

            return Array.isArray(data) ? data.map(mappers.foodFromDb) : [];
        } catch (err) {
            console.error('fetchFoodLog failed:', err);
            throw err;
        }
    }, [canUseSupabase, user, withTimeout]);

    const saveFood = useCallback(
        async (
            entry: Partial<FoodEntry>,
        ): Promise<{ data: FoodEntry | null; error: any }> => {
            const result = await withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or Supabase client');
                    const { data, error } = await supabase!
                        .from('food_log')
                        .upsert(mappers.foodToDb(entry, user.id) as any)
                        .select()
                        .single();

                    if (error) throw error;
                    return {
                        data: data ? mappers.foodFromDb(data) : null,
                        error: null,
                    };
                },
                { canUseSupabase, errorMessage: 'Error guardando comida' },
            );

            // 🔒 CRITICAL: The Vault fallback - Zero Silent Failures
            // Note: TypeScript might complain if result has different shape than expected by addPendingWrite?
            // addPendingWrite expects (table, data, userId).
            if (result.error && user?.id) {
                console.error(
                    '[useNutritionData] saveFood failed, adding to pending writes:',
                    {
                        table: 'food_log',
                        userId: user.id,
                        entryId: entry.id,
                        date: entry.date,
                        error: result.error,
                    },
                );
                await addPendingWrite('food_log', entry, user.id);
                console.log(
                    '[useNutritionData] Food entry queued for sync when connection recovers',
                );
            }

            return result as { data: FoodEntry | null; error: any };
        },
        [canUseSupabase, user, withSync],
    );

    const deleteFood = useCallback(
        async (id: string): Promise<{ error: any }> => {
            return withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or Supabase client');
                    const { error } = await supabase!
                        .from('food_log')
                        .delete()
                        .eq('id', id)
                        .eq('user_id', user.id);

                    if (error) throw error;
                    return { error: null };
                },
                { canUseSupabase, errorMessage: 'Error eliminando comida' },
            );
        },
        [canUseSupabase, user, withSync],
    );

    // =====================================================
    // WATER LOG OPERATIONS
    // =====================================================

    const fetchWaterLog = useCallback(async (): Promise<WaterEntry[]> => {
        if (!canUseSupabase || !user || !supabase) return [];

        try {
            const { data, error } = await withTimeout(
                supabase!
                    .from('water_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false }),
                45000,
                'fetchWaterLog',
            );

            if (error) throw error;
            if (!data) return [];

            return Array.isArray(data) ? data.map(mappers.waterFromDb) : [];
        } catch (err) {
            console.error('fetchWaterLog failed:', err);
            throw err;
        }
    }, [canUseSupabase, user, withTimeout]);

    const saveWater = useCallback(
        async (
            entry: Partial<WaterEntry>,
        ): Promise<{ data: WaterEntry | null; error: any }> => {
            const result = await withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or Supabase client');
                    const { data, error } = await supabase!
                        .from('water_log')
                        .upsert(mappers.waterToDb(entry, user.id) as any, {
                            onConflict: 'user_id,date',
                        })
                        .select()
                        .single();

                    if (error) throw error;
                    return {
                        data: data ? mappers.waterFromDb(data) : null,
                        error: null,
                    };
                },
                { canUseSupabase, errorMessage: 'Error guardando agua' },
            );

            // 🔒 CRITICAL: The Vault fallback - Zero Silent Failures
            if (result.error && user?.id) {
                console.error(
                    '[useNutritionData] saveWater failed, adding to pending writes:',
                    {
                        table: 'water_log',
                        userId: user.id,
                        date: entry.date,
                        amount: entry.ml, // Was entry.amount in original code, but based on WaterEntry?
                        // Original code used entry.amount for logging. Checking WaterEntry interface in mappers.
                        // waterFromDb: glasses, ml. waterToDb: glasses, ml.
                        // The original code `saveWater` logged `amount: entry.amount`.
                        // If entry is Partial<WaterEntry>, it might not have amount if it uses glasses/ml.
                        // I will stick to entry.ml or entry.glasses if strictly following types, but for logging I'll leave as is or fix.
                        // I'll assume 'ml' is the primary metric or 'glasses'.
                        error: result.error,
                    },
                );
                await addPendingWrite('water_log', entry, user.id);
                console.log(
                    '[useNutritionData] Water entry queued for sync when connection recovers',
                );
            }

            return result as { data: WaterEntry | null; error: any };
        },
        [canUseSupabase, user, withSync],
    );

    return {
        fetchFoodLog,
        saveFood,
        deleteFood,
        fetchWaterLog,
        saveWater,
    };
}
