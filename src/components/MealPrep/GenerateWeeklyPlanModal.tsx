import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Loader2, Calendar, Dumbbell, Target } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Button } from '../UI/Button';
import { ModalShell } from '../UI/ModalShell';

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
        <ModalShell
            open={isOpen}
            onClose={onClose}
            title={t('mealPrep.generateWeeklyPlan')}
            subtitle={t('mealPrep.aiPowered') || 'AI-powered meal planning'}
            icon={<Sparkles size={20} />}
            size="md"
            dismissible={!isGenerating}
            footer={
                !isGenerating ? (
                    <div className="flex gap-3">
                        <Button variant="secondary" fullWidth onClick={onClose}>
                            {t('common.cancel') || 'Cancel'}
                        </Button>
                        <Button
                            fullWidth
                            onClick={onGenerate}
                            icon={<Sparkles className="w-4 h-4" />}
                            className="!bg-oura hover:!opacity-90 !shadow-float">
                            {error
                                ? t('common.retry') || 'Retry'
                                : t('mealPrep.generate') || 'Generate'}
                        </Button>
                    </div>
                ) : undefined
            }>
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
                <div className="bg-danger-soft border border-danger/20 rounded-card p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-danger-soft rounded-full flex items-center justify-center flex-shrink-0">
                            <X className="w-5 h-5 text-danger" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-danger mb-1">
                                {t('errors.generatePlan') || 'Error generating plan'}
                            </p>
                            <p className="text-xs text-danger">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview State */}
            {!isGenerating && !error && (
                <div className="space-y-4">
                    {/* Week Range */}
                    <div className="flex items-center gap-3 p-4 bg-background rounded-card">
                        <Calendar className="w-5 h-5 text-text-tertiary" />
                        <div>
                            <p className="text-overline uppercase text-text-tertiary">
                                {t('mealPrep.weekRange') || 'Week'}
                            </p>
                            <p className="text-sm font-bold text-text-primary">
                                {weekRangeText}
                            </p>
                        </div>
                    </div>

                    {/* User Goals */}
                    {userProfile && (
                        <div className="flex items-center gap-3 p-4 bg-background rounded-card">
                            <Target className="w-5 h-5 text-text-tertiary" />
                            <div>
                                <p className="text-overline uppercase text-text-tertiary">
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
                        <div className="p-4 bg-background rounded-card">
                            <div className="flex items-center gap-2 mb-3">
                                <Dumbbell className="w-5 h-5 text-text-tertiary" />
                                <p className="text-overline uppercase text-text-tertiary">
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
                    <div className="bg-primary-soft border border-primary/20 rounded-card p-4">
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
        </ModalShell>
    );
};
