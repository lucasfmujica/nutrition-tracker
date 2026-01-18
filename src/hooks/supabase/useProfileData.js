import { useCallback } from 'react';
import { mappers } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { useSupabaseOperation } from './useSupabaseOperation';

export function useProfileData(user, isOnline, ensureProfileExists) {
  const { withSync, withTimeout } = useSupabaseOperation();
  const canUseSupabase = user && isOnline;

  const fetchProfile = useCallback(async () => {
    if (!canUseSupabase) return null;

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        45000,
        'fetchProfile'
      );

      if (!data) {
        // Profile doesn't exist, create it using the auth helper
        if (ensureProfileExists) {
          const result = await ensureProfileExists(user.id);
          if (result.success) {
            // Retry fetch
            const { data: retryData } = await withTimeout(
              supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single(),
              45000,
              'fetchProfile-retry'
            );

            if (retryData) {
              return {
                profile: mappers.profileFromDb(retryData),
                targets: mappers.targetsFromDb(retryData),
              };
            }
          }
        }
        return null;
      }

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return {
        profile: mappers.profileFromDb(data),
        targets: mappers.targetsFromDb(data),
      };
    } catch (err) {
      console.error('fetchProfile failed:', err);
      return null;
    }
  }, [canUseSupabase, user?.id, ensureProfileExists, withTimeout]);

  const saveProfile = useCallback(async (profile, targets) => {
    return withSync(async () => {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...mappers.profileToDb(profile, user.id),
          ...mappers.targetsToDb(targets),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      return { error: null };
    }, { canUseSupabase, errorMessage: 'Error guardando perfil' });
  }, [canUseSupabase, user?.id, withSync]);

  const saveOnboardingProfile = useCallback(async (onboardingData) => {
    if (!canUseSupabase) return { error: 'Not authenticated or offline' };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          current_weight: onboardingData.current_weight,
          target_weight: onboardingData.goal_weight,
          height: onboardingData.height,
          age: onboardingData.age,
          gender: onboardingData.gender,
          activity_level: onboardingData.activity_level,
          goal: onboardingData.primary_goal === 'lose' ? 'cut' : onboardingData.primary_goal === 'gain' ? 'bulk' : 'maintain',
          target_calories: onboardingData.calorie_goal,
          target_protein: onboardingData.protein_goal,
          target_carbs: onboardingData.carbs_goal,
          target_fat: onboardingData.fat_goal,
          step_goal: 8000,
          training_days_per_week: onboardingData.training_days_per_week,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error('Error saving onboarding profile:', err);
      return { error: err.message };
    }
  }, [canUseSupabase, user?.id]);

  const checkNeedsOnboarding = useCallback(async () => {
    if (!canUseSupabase) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return false;
      }

      return !data?.onboarding_completed;
    } catch (err) {
      console.error('Error checking onboarding:', err);
      return false;
    }
  }, [canUseSupabase, user?.id]);

  return {
    fetchProfile,
    saveProfile,
    saveOnboardingProfile,
    checkNeedsOnboarding
  };
}
