import React from 'react';
import { useTracker } from '../../../context/TrackerContext';
import { AuthUI } from '../../auth/AuthUI';
import { OnboardingWizard } from '../../onboarding/OnboardingWizard';
import { LoadingScreen } from './LoadingScreen';

interface AuthShellProps {
    children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ children }) => {
    const {
        supabase,
        showAuth,
        setShowAuth,
        showOnboarding,
        setShowOnboarding,
        offlineMode,
        setOfflineMode,
        isLoading,
        setProfile,
        setCustomTargets,
    } = useTracker();

    const handleSignIn = async (email: string, password: string) => {
        try {
            console.log('[NutritionTracker] handleSignIn called');
            const result = await supabase.signIn(email, password);
            console.log('[NutritionTracker] signIn result:', result);
            if (result && !result.error) {
                console.log('[NutritionTracker] Setting showAuth to false');
                setShowAuth(false);
            }
            return result || { error: { message: 'No response from server' } };
        } catch (err: any) {
            console.error('[NutritionTracker] signIn error:', err);
            return { error: { message: err.message || 'Error de conexión' } };
        }
    };

    const handleSignUp = async (email: string, password: string) => {
        try {
            const result = await supabase.signUp(email, password);
            if (result && !result.error && !result.needsConfirmation) {
                setShowAuth(false);
            }
            return result || { error: { message: 'No response from server' } };
        } catch (err: any) {
            console.error('[NutritionTracker] signUp error:', err);
            return { error: { message: err.message || 'Error de conexión' } };
        }
    };

    const handleOnboardingComplete = async (profileData: any) => {
        try {
            await supabase.saveOnboardingProfile(profileData);
            setShowOnboarding(false);

            if (profileData.calorie_goal) {
                setCustomTargets({
                    calories: profileData.calorie_goal,
                    protein: profileData.protein_goal || 150,
                    carbs: profileData.carbs_goal || 220,
                    fat: profileData.fat_goal || 73,
                    fiber: 30,
                    trainingDayCaloriesBonus: 200,
                    trainingDayCarbs: 220,
                });

                setProfile((prev) => ({
                    ...prev,
                    name: profileData.name || prev.name,
                    currentWeight: profileData.current_weight || prev.currentWeight,
                    targetWeight: profileData.goal_weight || prev.targetWeight,
                    height: profileData.height || prev.height,
                    age: profileData.age || prev.age,
                    goal:
                        profileData.primary_goal === 'lose'
                            ? 'cut'
                            : profileData.primary_goal === 'gain'
                              ? 'bulk'
                              : 'maintain',
                    activityLevel: profileData.activity_level || prev.activityLevel,
                    targetCalories: profileData.calorie_goal,
                    targetProtein: profileData.protein_goal || 150,
                    targetCarbs: profileData.carbs_goal || 220,
                    targetFat: profileData.fat_goal || 73,
                    onboardingCompleted: true,
                }));
            }
        } catch (err) {
            console.error('Error completing onboarding:', err);
            setShowOnboarding(false);
        }
    };

    if (showAuth === null && supabase.loading) {
        return <LoadingScreen message="Sincronizando con tu anillo Oura..." />;
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
        return <OnboardingWizard onComplete={handleOnboardingComplete} />;
    }

    if (showAuth === null || (isLoading && showAuth === false)) {
        return (
            <LoadingScreen message="Calculando tu pronóstico de rendimiento..." />
        );
    }

    return <>{children}</>;
};
