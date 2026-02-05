import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../../context/TrackerContext';
import { AuthUI } from '../../auth/AuthUI';
import { OnboardingWizard } from '../../onboarding/OnboardingWizard';
import { LoadingScreen } from './LoadingScreen';

interface AuthShellProps {
    children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ children }) => {
    const { t } = useTranslation();
    const {
        supabase,
        showAuth,
        setShowAuth,
        showOnboarding,
        setShowOnboarding,
        offlineMode,
        setOfflineMode,
        isLoading,
        setIsLoading,
        setProfile,
        setCustomTargets,
    } = useTracker();

    // Emergency timeout to prevent infinite loading
    const [loadingTimedOut, setLoadingTimedOut] = useState(false);
    const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 🚨 EMERGENCY TIMEOUT: Prevent infinite loading state
    // If isLoading is true for more than 30 seconds, force exit and show error
    useEffect(() => {
        if (isLoading && showAuth === false && !supabase.loading) {
            console.log(
                '[AuthShell] Loading started, setting 30s emergency timeout',
            );

            loadingTimeoutRef.current = setTimeout(() => {
                console.error(
                    '[AuthShell] EMERGENCY: Loading timeout after 30s, forcing exit',
                );
                setLoadingTimedOut(true);
                setIsLoading(false);
            }, 30000);
        } else {
            // Clear timeout if loading finished normally
            if (loadingTimeoutRef.current) {
                console.log(
                    '[AuthShell] Loading finished, clearing emergency timeout',
                );
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
            // Reset timeout flag when loading starts again
            if (isLoading) {
                setLoadingTimedOut(false);
            }
        }

        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
        };
    }, [isLoading, showAuth, supabase.loading, setIsLoading]);

    const handleRetry = () => {
        console.log('[AuthShell] User requested retry, reloading page');
        window.location.reload();
    };

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
            } else {
                // If skipped or no goals provided, still mark as completed
                setProfile((prev) => ({
                    ...prev,
                    onboardingCompleted: true,
                }));
            }
        } catch (err) {
            console.error('Error completing onboarding:', err);
            setShowOnboarding(false);
        }
    };

    if (showAuth === null && supabase.loading) {
        return <LoadingScreen message={t('common.loadingState.syncingOura')} />;
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

    // 🚨 Show error screen if loading timed out
    if (loadingTimedOut) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-surface/10 backdrop-blur-lg rounded-2xl p-8 text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-white mb-4">
                        {t('common.errorState.loadingTitle')}
                    </h1>
                    <p className="text-white/80 mb-6">
                        {t('common.errorState.loadingMessage')}
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={handleRetry}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                            🔄 {t('common.errorState.retry')}
                        </button>
                        <button
                            onClick={() => {
                                localStorage.clear();
                                indexedDB.deleteDatabase('nutrition-tracker');
                                window.location.reload();
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                            🗑️ {t('common.errorState.clearDataRetry')}
                        </button>
                    </div>
                    <p className="text-white/60 text-sm mt-4">
                        {t('common.errorState.persistentIssueAdvice')}
                    </p>
                </div>
            </div>
        );
    }

    if (showAuth === null || (isLoading && showAuth === false)) {
        return (
            <LoadingScreen
                message={t('common.loadingState.calculatingPerformance')}
            />
        );
    }

    return <>{children}</>;
};
