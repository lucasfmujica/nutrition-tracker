import { User } from '@supabase/supabase-js';
import { useCallback } from 'react';
import { mappers } from '../../lib/mappers';
import { supabase } from '../../lib/supabase';
import { MealTemplate } from '../../types/domain';
import { useSupabaseOperation } from './useSupabaseOperation';

export interface UseTemplateDataReturn {
    fetchTemplates: () => Promise<MealTemplate[]>;
    saveTemplate: (
        template: Partial<MealTemplate>,
    ) => Promise<{ data: MealTemplate | null; error: any }>;
    deleteTemplate: (id: string) => Promise<{ error: any }>;
}

export function useTemplateData(
    user: User | null,
    isOnline: boolean,
): UseTemplateDataReturn {
    const { withSync, withTimeout } = useSupabaseOperation();
    const canUseSupabase = !!(user && isOnline && supabase);

    const fetchTemplates = useCallback(async (): Promise<MealTemplate[]> => {
        if (!canUseSupabase || !user) return [];

        try {
            const { data, error } = await withTimeout(
                supabase!
                    .from('meal_templates')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('name', { ascending: true }),
                45000,
                'fetchTemplates',
            );

            if (error) throw error;
            if (!data) return [];

            return Array.isArray(data) ? data.map(mappers.templateFromDb) : [];
        } catch (err) {
            console.error('fetchTemplates failed:', err);
            throw err;
        }
    }, [canUseSupabase, user, withTimeout]);

    const saveTemplate = useCallback(
        async (
            template: Partial<MealTemplate>,
        ): Promise<{ data: MealTemplate | null; error: any }> => {
            return withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or supabase not configured');
                    const isUpdate = template.id && !template.id.startsWith('tpl-');

                    if (isUpdate) {
                        const { data, error } = await supabase!
                            .from('meal_templates')
                            .update(mappers.templateToDb(template, user.id))
                            .eq('id', template.id!)
                            .eq('user_id', user.id)
                            .select()
                            .single();

                        if (error) throw error;
                        return {
                            data: data ? mappers.templateFromDb(data) : null,
                            error: null,
                        };
                    } else {
                        const { data, error } = await supabase!
                            .from('meal_templates')
                            .insert(mappers.templateToDb(template, user.id) as any) // Casting as any for strict insert
                            .select()
                            .single();

                        if (error) throw error;
                        return {
                            data: data ? mappers.templateFromDb(data) : null,
                            error: null,
                        };
                    }
                },
                { canUseSupabase, errorMessage: 'Error guardando plantilla' },
            );
        },
        [canUseSupabase, user, withSync],
    );

    const deleteTemplate = useCallback(
        async (id: string): Promise<{ error: any }> => {
            if (id.startsWith('tpl-')) return { error: null }; // Only delete from DB if it has a DB ID

            return withSync(
                async () => {
                    if (!user || !supabase)
                        throw new Error('No user or supabase not configured');
                    const { error } = await supabase!
                        .from('meal_templates')
                        .delete()
                        .eq('id', id)
                        .eq('user_id', user.id);

                    if (error) throw error;
                    return { error: null };
                },
                { canUseSupabase, errorMessage: 'Error eliminando plantilla' },
            );
        },
        [canUseSupabase, user, withSync],
    );

    return {
        fetchTemplates,
        saveTemplate,
        deleteTemplate,
    };
}
