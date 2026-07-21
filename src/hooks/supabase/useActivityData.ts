import { User } from '@supabase/supabase-js';
import { useCallback } from 'react';
import { mappers } from '../../lib/mappers';
import { supabase } from '../../lib/supabase';
import { OuraEntry, StepsEntry, Workout } from '../../types/domain';
import { addPendingWrite } from '../../utils/storageUtils';
import { useSupabaseOperation } from './useSupabaseOperation';
import { devLog } from '../../utils/devLog';

export interface UseActivityDataReturn {
    fetchWorkouts: () => Promise<Workout[]>;
    saveWorkout: (
        entry: Partial<Workout>,
    ) => Promise<{ data: Workout | null; error: any }>;
    deleteWorkout: (id: string) => Promise<{ error: any }>;
    fetchStepsLog: () => Promise<StepsEntry[]>;
    saveSteps: (
        entry: Partial<StepsEntry>,
    ) => Promise<{ data: StepsEntry | null; error: any }>;
    fetchOuraLog: () => Promise<OuraEntry[]>;
    saveOura: (
        entry: Partial<OuraEntry>,
    ) => Promise<{ data: OuraEntry | null; error: any }>;
}

export function useActivityData(
    user: User | null,
    isOnline: boolean,
): UseActivityDataReturn {
    const { withSync, withTimeout } = useSupabaseOperation();
    const canUseSupabase = !!(user && isOnline && supabase);

    // =====================================================
    // WORKOUT OPERATIONS
    // =====================================================

    const fetchWorkouts = useCallback(async (): Promise<Workout[]> => {
        if (!canUseSupabase || !user || !supabase) return [];

        try {
            const { data, error } = await withTimeout(
                supabase!
                    .from('workouts')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false }),
                45000,
                'fetchWorkouts',
            );

            if (error) throw error;
            if (!data) return [];

            return Array.isArray(data) ? data.map(mappers.workoutFromDb) : [];
        } catch (err) {
            console.error('fetchWorkouts failed:', err);
            throw err;
        }
    }, [canUseSupabase, user, withTimeout]);

    const saveWorkout = useCallback(
        async (
            entry: Partial<Workout>,
        ): Promise<{ data: Workout | null; error: any }> => {
            const result = await withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or Supabase client');
                    const isUpdate = entry.id && !entry.id.startsWith('w');

                    if (isUpdate) {
                        const { data, error } = await supabase!
                            .from('workouts')
                            .update(mappers.workoutToDb(entry, user.id))
                            .eq('id', entry.id!)
                            .eq('user_id', user.id)
                            .select()
                            .single();

                        if (error) throw error;
                        return {
                            data: data ? mappers.workoutFromDb(data) : null,
                            error: null,
                        };
                    } else {
                        const { data, error } = await supabase!
                            .from('workouts')
                            .insert(mappers.workoutToDb(entry, user.id) as any) // Casting as any to avoid strict type checks on insert for partials
                            .select()
                            .single();

                        if (error) throw error;
                        return {
                            data: data ? mappers.workoutFromDb(data) : null,
                            error: null,
                        };
                    }
                },
                { canUseSupabase, errorMessage: 'Error guardando entreno' },
            );

            // 🔒 CRITICAL: The Vault fallback - Zero Silent Failures
            if (result.error && user?.id) {
                console.error(
                    '[useActivityData] saveWorkout failed, adding to pending writes:',
                    {
                        table: 'workouts',
                        userId: user.id,
                        entryId: entry.id,
                        date: entry.date,
                        error: result.error,
                    },
                );
                await addPendingWrite('workouts', entry, user.id);
                devLog(
                    '[useActivityData] Workout entry queued for sync when connection recovers',
                );
            }

            return result as { data: Workout | null; error: any };
        },
        [canUseSupabase, user, withSync],
    );

    const deleteWorkout = useCallback(
        async (id: string): Promise<{ error: any }> => {
            return withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or Supabase client');
                    const { error } = await supabase!
                        .from('workouts')
                        .delete()
                        .eq('id', id)
                        .eq('user_id', user.id);

                    if (error) throw error;
                    return { error: null };
                },
                { canUseSupabase, errorMessage: 'Error eliminando entreno' },
            );
        },
        [canUseSupabase, user, withSync],
    );

    // =====================================================
    // STEPS LOG OPERATIONS
    // =====================================================

    const fetchStepsLog = useCallback(async (): Promise<StepsEntry[]> => {
        if (!canUseSupabase || !user || !supabase) return [];

        try {
            const { data, error } = await withTimeout(
                supabase!
                    .from('steps_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false }),
                45000,
                'fetchStepsLog',
            );

            if (error) throw error;
            if (!data) return [];

            return Array.isArray(data) ? data.map(mappers.stepsFromDb) : [];
        } catch (err) {
            console.error('fetchStepsLog failed:', err);
            throw err;
        }
    }, [canUseSupabase, user, withTimeout]);

    const saveSteps = useCallback(
        async (
            entry: Partial<StepsEntry>,
        ): Promise<{ data: StepsEntry | null; error: any }> => {
            const result = await withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or Supabase client');
                    const { data, error } = await supabase!
                        .from('steps_log')
                        .upsert(mappers.stepsToDb(entry, user.id) as any, {
                            onConflict: 'user_id,date',
                        })
                        .select()
                        .single();

                    if (error) throw error;
                    return {
                        data: data ? mappers.stepsFromDb(data) : null,
                        error: null,
                    };
                },
                { canUseSupabase, errorMessage: 'Error guardando pasos' },
            );

            // 🔒 CRITICAL: The Vault fallback - Zero Silent Failures
            if (result.error && user?.id) {
                console.error(
                    '[useActivityData] saveSteps failed, adding to pending writes:',
                    {
                        table: 'steps_log',
                        userId: user.id,
                        date: entry.date,
                        steps: entry.steps,
                        error: result.error,
                    },
                );
                await addPendingWrite('steps_log', entry, user.id);
                devLog(
                    '[useActivityData] Steps entry queued for sync when connection recovers',
                );
            }

            return result as { data: StepsEntry | null; error: any };
        },
        [canUseSupabase, user, withSync],
    );

    // =====================================================
    // OURA LOG OPERATIONS
    // =====================================================

    const fetchOuraLog = useCallback(async (): Promise<OuraEntry[]> => {
        if (!canUseSupabase || !user || !supabase) return [];

        try {
            const { data, error } = await withTimeout(
                supabase!
                    .from('oura_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false }),
                45000,
                'fetchOuraLog',
            );

            if (error) throw error;
            if (!data) return [];

            return Array.isArray(data) ? data.map(mappers.ouraFromDb) : [];
        } catch (err) {
            console.error('fetchOuraLog failed:', err);
            throw err;
        }
    }, [canUseSupabase, user, withTimeout]);

    const saveOura = useCallback(
        async (
            entry: Partial<OuraEntry>,
        ): Promise<{ data: OuraEntry | null; error: any }> => {
            const result = await withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or Supabase client');
                    const { data, error } = await supabase!
                        .from('oura_log')
                        .upsert(mappers.ouraToDb(entry, user.id) as any, {
                            onConflict: 'user_id,date',
                        })
                        .select()
                        .single();

                    if (error) throw error;
                    return {
                        data: data ? mappers.ouraFromDb(data) : null,
                        error: null,
                    };
                },
                { canUseSupabase, errorMessage: 'Error guardando datos Oura' },
            );

            // 🔒 CRITICAL: The Vault fallback - Zero Silent Failures
            if (result.error && user?.id) {
                console.error(
                    '[useActivityData] saveOura failed, adding to pending writes:',
                    {
                        table: 'oura_log',
                        userId: user.id,
                        date: entry.date,
                        error: result.error,
                    },
                );
                await addPendingWrite('oura_log', entry, user.id);
                devLog(
                    '[useActivityData] Oura entry queued for sync when connection recovers',
                );
            }

            return result as { data: OuraEntry | null; error: any };
        },
        [canUseSupabase, user, withSync],
    );

    return {
        fetchWorkouts,
        saveWorkout,
        deleteWorkout,
        fetchStepsLog,
        saveSteps,
        fetchOuraLog,
        saveOura,
    };
}
