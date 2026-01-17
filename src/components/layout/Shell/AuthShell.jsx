import React from 'react';
import { useTracker } from '../../../context/TrackerContext';
import { AuthUI } from '../../auth/AuthUI';
import { OnboardingWizard } from '../../onboarding/OnboardingWizard';
import { LoadingScreen } from './LoadingScreen';

export const AuthShell = ({ children }) => {
  const {
    supabase,
    showAuth, setShowAuth,
    showOnboarding, setShowOnboarding,
    offlineMode, setOfflineMode,
    isLoading,
    setConfig
  } = useTracker();

  // Helper functions moved from NutritionTracker
  const handleSignIn = async (email, password) => {
    try {
      console.log('[NutritionTracker] handleSignIn called');
      const result = await supabase.signIn(email, password);
      // Log logic kept for consistency with original
      console.log('[NutritionTracker] signIn result:', result);
      if (result && !result.error) {
        console.log('[NutritionTracker] Setting showAuth to false');
        setShowAuth(false);
      }
      return result || { error: { message: 'No response from server' } };
    } catch (err) {
      console.error('[NutritionTracker] signIn error:', err);
      return { error: { message: err.message || 'Error de conexión' } };
    }
  };

  const handleSignUp = async (email, password) => {
    try {
      const result = await supabase.signUp(email, password);
      if (result && !result.error && !result.needsConfirmation) {
        setShowAuth(false);
      }
      return result || { error: { message: 'No response from server' } };
    } catch (err) {
      console.error('[NutritionTracker] signUp error:', err);
      return { error: { message: err.message || 'Error de conexión' } };
    }
  };

  const handleOnboardingComplete = async (profileData) => {
    try {
      await supabase.saveOnboardingProfile(profileData);
      setShowOnboarding(false);

      if (profileData.calorie_goal) {
        setConfig(prev => ({
          ...prev,
          targetCalories: profileData.calorie_goal,
          targetProtein: profileData.protein_goal || 150,
          targetCarbs: profileData.carbs_goal || 220,
          targetFat: profileData.fat_goal || 73,
        }));
      }
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setShowOnboarding(false);
    }
  };

  // State Checks
  if (showAuth === null && supabase.loading) {
    return <LoadingScreen message="Cargando LukenFit..." />;
  }

  if (showAuth === true && !offlineMode) {
    return (
      <AuthUI
        onAuth={{
          signIn: handleSignIn,
          signUp: handleSignUp,
          signInWithGoogle: supabase.signInWithGoogle,
          resetPassword: supabase.resetPassword,
          continueOffline: () => {
            setOfflineMode(true);
            setShowAuth(false);
          },
        }}
        error={supabase.authError}
        isSupabaseConfigured={supabase.isSupabaseConfigured}
        loading={supabase.loading}
      />
    );
  }

  if (showOnboarding && !offlineMode) {
    return (
      <OnboardingWizard
        onComplete={handleOnboardingComplete}
        userEmail={supabase.user?.email}
      />
    );
  }

  if (showAuth === null || (isLoading && showAuth === false)) {
    return <LoadingScreen message="Cargando datos..." />;
  }

  return children;
};
