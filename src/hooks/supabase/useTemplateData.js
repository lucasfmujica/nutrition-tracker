import { useCallback } from 'react';
import { mappers } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { useSupabaseOperation } from './useSupabaseOperation';

export function useTemplateData(user, isOnline) {
  const { withSync, withTimeout } = useSupabaseOperation();
  const canUseSupabase = user && isOnline;

  const fetchTemplates = useCallback(async () => {
    if (!canUseSupabase) return [];

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('meal_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true }),
        45000,
        'fetchTemplates'
      );

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      return data.map(mappers.templateFromDb);
    } catch (err) {
      console.error('fetchTemplates failed:', err);
      return [];
    }
  }, [canUseSupabase, user?.id, withTimeout]);

  const saveTemplate = useCallback(async (template) => {
    return withSync(async () => {
      const isUpdate = template.id && !template.id.startsWith('tpl-');

      if (isUpdate) {
        const { data, error } = await supabase
          .from('meal_templates')
          .update(mappers.templateToDb(template, user.id))
          .eq('id', template.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return { data: data ? mappers.templateFromDb(data) : null, error: null };
      } else {
        const { data, error } = await supabase
          .from('meal_templates')
          .insert(mappers.templateToDb(template, user.id))
          .select()
          .single();

        if (error) throw error;
        return { data: data ? mappers.templateFromDb(data) : null, error: null };
      }
    }, { canUseSupabase, errorMessage: 'Error guardando plantilla' });
  }, [canUseSupabase, user?.id, withSync]);

  const deleteTemplate = useCallback(async (id) => {
    if (id.startsWith('tpl-')) return { error: null }; // Only delete from DB if it has a DB ID

    return withSync(async () => {
      const { error } = await supabase
        .from('meal_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    }, { canUseSupabase, errorMessage: 'Error eliminando plantilla' });
  }, [canUseSupabase, user?.id, withSync]);

  return {
    fetchTemplates,
    saveTemplate,
    deleteTemplate
  };
}
