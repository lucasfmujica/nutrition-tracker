import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Loader2, Calendar, Dumbbell, Target } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface GenerateWeeklyPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: () => void;
    isGenerating: boolean;
    progress: string;
    error: string | null;
    weekStartDate: Date;
    userProfile?: {
        targetCalories: number;
        targetProtein: number;
        goal: 'cut' | 'maintain' | 'bulk';
    };
    weeklyWorkouts?: Array<{
        day: number;
        type: string;
        intensity?: string;
    }>;
}

/**
 * GenerateWeeklyPlanModal - Modal for AI-powered weekly meal plan generation
 *
 * Features:
 * - Preview of generation options
 * - Shows user's goals and workout schedule
 * - Loading state with progress indicator
 * - Error handling with retry
 *
 * Mobile-optimized with touch-friendly buttons
 */
export const GenerateWeeklyPlanModal: React.FC<GenerateWeeklyPlanModalProps> = ({
    isOpen,
    onClose,
    onGenerate,
    isGenerating,
    progress,
    error,
    weekStartDate,
    userProfile,
    weeklyWorkouts = [],
}) => {
    const { t, i18n } = useTranslation();

    if (!isOpen) return null;

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const locale = i18n.language === 'es' ? es : enUS;
    const weekRangeText = `${format(weekStartDate, 'd MMM', { locale })} - ${format(
        weekEndDate,
        'd MMM',
        { locale }
    )}`;

    const goalMap = {
        cut: t('profile.goals.cut') || 'Cut',
        maintain: t('profile.goals.maintain') || 'Maintain',
        bulk: t('profile.goals.bulk') || 'Bulk',
    };

    const dayNames = i18n.language === 'es'
        ? ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!isGenerating ? onClose : undefined}
            />

            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-lg bg-surface rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                {/* Close Button */}
                {!isGenerating && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 bg-background rounded-full shadow-md flex items-center justify-center hover:bg-surface-lighter transition-colors z-10">
                        <X className="w-5 h-5 text-text-tertiary" />
                    </button>
                )}

                {/* Header */}
                <div className="bg-oura px-6 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">
                                {t('mealPrep.generateWeeklyPlan')}
                            </h2>
                            <p className="text-sm text-white/80 font-medium">
                                {t('mealPrep.aiPowered') || 'AI-powered meal planning'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Loading State */}
                    {isGenerating && (
                        <div className="text-center py-8">
                            <Loader2 className="w-12 h-12 text-oura animate-spin mx-auto mb-4" />
                            <p className="text-text-primary font-bold mb-2">
                                {t('mealPrep.generating') || 'Generating plan...'}
                            </p>
                            {progress && (
                                <p className="text-sm text-text-tertiary">{progress}</p>
                            )}
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isGenerating && (
                        <div className="bg-danger-soft border border-danger/20 rounded-2xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-danger-soft rounded-full flex items-center justify-center flex-shrink-0">
                                    <X className="w-5 h-5 text-danger" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-danger mb-1">
                                        {t('errors.generatePlan') || 'Error generating plan'}
                                    </p>
                                    <p className="text-xs text-danger">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview State */}
                    {!isGenerating && !error && (
                        <div className="space-y-4">
                            {/* Week Range */}
                            <div className="flex items-center gap-3 p-4 bg-background rounded-2xl">
                                <Calendar className="w-5 h-5 text-text-tertiary" />
                                <div>
                                    <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                                        {t('mealPrep.weekRange') || 'Week'}
                                    </p>
                                    <p className="text-sm font-bold text-text-primary">
                                        {weekRangeText}
                                    </p>
                                </div>
                            </div>

                            {/* User Goals */}
                            {userProfile && (
                                <div className="flex items-center gap-3 p-4 bg-background rounded-2xl">
                                    <Target className="w-5 h-5 text-text-tertiary" />
                                    <div>
                                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                                            {t('mealPrep.yourGoals') || 'Your Goals'}
                                        </p>
                                        <p className="text-sm font-bold text-text-primary">
                                            {userProfile.targetCalories} kcal/{t('common.perDay')} · {userProfile.targetProtein}g {t('common.protein')}
                                        </p>
                                        <p className="text-xs text-text-secondary mt-1">
                                            {goalMap[userProfile.goal]}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Workouts */}
                            {weeklyWorkouts.length > 0 && (
                                <div className="p-4 bg-background rounded-2xl">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Dumbbell className="w-5 h-5 text-text-tertiary" />
                                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                                            {t('mealPrep.workoutsThisWeek') || 'Workouts this week'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        {weeklyWorkouts.map((workout) => (
                                            <div
                                                key={workout.day}
                                                className="flex items-center justify-between text-sm">
                                                <span className="text-text-secondary">
                                                    {dayNames[workout.day]}
                                                </span>
                                                <span className="text-text-primary font-medium">
                                                    {workout.type}{' '}
                                                    {workout.intensity && (
                                                        <span className="text-text-tertiary text-xs">
                                                            ({workout.intensity})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Info Banner */}
                            <div className="bg-primary-soft border border-primary/20 rounded-2xl p-4">
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    <span className="font-bold">
                                        {t('mealPrep.estimatedTime') || 'Estimated time:'}
                                    </span>{' '}
                                    ~30 {t('common.seconds') || 'seconds'}
                                    <br />
                                    {t('mealPrep.aiWillGenerate') ||
                                        'AI will generate 28 meals (7 days × 4 meals/day) based on your goals and workouts.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!isGenerating && (
                    <div className="border-t border-border p-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-background text-text-secondary font-bold rounded-xl hover:bg-surface-lighter transition-colors">
                            {t('common.cancel') || 'Cancel'}
                        </button>
                        <button
                            onClick={onGenerate}
                            className="flex-1 py-3 px-4 bg-oura hover:opacity-90 text-white font-bold rounded-control transition-all flex items-center justify-center gap-2 shadow-float">
                            <Sparkles className="w-4 h-4" />
                            {error
                                ? t('common.retry') || 'Retry'
                                : t('mealPrep.generate') || 'Generate'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
