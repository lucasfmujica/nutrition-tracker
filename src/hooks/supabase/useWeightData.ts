import { User } from '@supabase/supabase-js';
import { useCallback } from 'react';
import { mappers } from '../../lib/mappers';
import { supabase } from '../../lib/supabase';
import { WeightEntry } from '../../types/domain';
import { addPendingWrite } from '../../utils/storageUtils';
import { useSupabaseOperation } from './useSupabaseOperation';

export interface UseWeightDataReturn {
    fetchWeightHistory: () => Promise<WeightEntry[]>;
    saveWeight: (
        entry: Partial<WeightEntry>,
    ) => Promise<{ data: WeightEntry | null; error: any }>;
    deleteWeight: (id: string) => Promise<{ error: any }>;
}

export function useWeightData(
    user: User | null,
    isOnline: boolean,
): UseWeightDataReturn {
    const { withSync, withTimeout } = useSupabaseOperation();
    const canUseSupabase = !!(user && isOnline && supabase);

    const fetchWeightHistory = useCallback(async (): Promise<WeightEntry[]> => {
        if (!canUseSupabase || !user) return [];

        try {
            const { data, error } = await withTimeout(
                supabase!
                    .from('weight_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false }),
                45000,
                'fetchWeightHistory',
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
    }, [canUseSupabase, user, withTimeout]);

    const saveWeight = useCallback(
        async (
            entry: Partial<WeightEntry>,
        ): Promise<{ data: WeightEntry | null; error: any }> => {
            const result = await withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or supabase not configured');
                    if (!entry.date || entry.weight === undefined)
                        throw new Error('Date and weight are required');

                    const { data, error } = await supabase!
                        .from('weight_history')
                        .upsert(mappers.weightToDb(entry, user.id) as any, {
                            onConflict: 'user_id,date',
                        })
                        .select()
                        .single();

                    if (error) throw error;
                    return {
                        data: data ? mappers.weightFromDb(data) : null,
                        error: null,
                    };
                },
                { canUseSupabase, errorMessage: 'Error guardando peso' },
            );

            // 🔒 CRITICAL: The Vault fallback - Zero Silent Failures
            if (result.error && user?.id) {
                console.error(
                    '[useWeightData] saveWeight failed, adding to pending writes:',
                    {
                        table: 'weight_history',
                        userId: user.id,
                        date: entry.date,
                        weight: entry.weight,
                        error: result.error,
                    },
                );
                await addPendingWrite('weight_history', entry, user.id);
                console.log(
                    '[useWeightData] Weight entry queued for sync when connection recovers',
                );
            }

            return result as { data: WeightEntry | null; error: any };
        },
        [canUseSupabase, user, withSync],
    );

    const deleteWeight = useCallback(
        async (id: string): Promise<{ error: any }> => {
            return withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or supabase not configured');
                    const { error } = await supabase!
                        .from('weight_history')
                        .delete()
                        .eq('id', id)
                        .eq('user_id', user.id);

                    if (error) throw error;
                    return { error: null };
                },
                { canUseSupabase, errorMessage: 'Error eliminando peso' },
            );
        },
        [canUseSupabase, user, withSync],
    );

    return {
        fetchWeightHistory,
        saveWeight,
        deleteWeight,
    };
}
