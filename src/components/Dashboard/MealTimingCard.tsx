import { Clock, Moon, Utensils, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface MealTimingInsights {
    avgFirstMealTime: string;
    avgLastMealTime: string;
    avgEatingWindow: number;
    ifDaysCount: number;

    sleepImpact: {
        avgMealBedtimeGap: number;
        lateEatingDays: number;
        sleepScoreCorrelation: number;
        lateNightCalories: number;
        deepSleepCorrelation: number;
        remSleepCorrelation: number;
    };

    workoutNutrition: {
        avgPreWorkoutCarbs: number;
        avgPostWorkoutProtein: number;
        workoutDaysWithData: number;
    };

    consistency: {
        breakfastVariance: number;
        lunchVariance: number;
        dinnerVariance: number;
    };

    hasData: boolean;
}

interface MealTimingCardProps {
    insights: MealTimingInsights;
}

/**
 * MealTimingCard - Displays meal timing analytics and circadian insights
 *
 * Shows:
 * - Eating window (first meal → last meal)
 * - Sleep impact analysis
 * - Workout nutrition timing
 * - Meal time consistency
 */
export const MealTimingCard: React.FC<MealTimingCardProps> = ({ insights }) => {
    const { t } = useTranslation();

    if (!insights.hasData) {
        return (
            <div className="bg-surface rounded-card p-6 shadow-card border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="text-primary" size={20} />
                    <h3 className="text-text-primary font-bold text-lg">
                        {t('dashboard.mealTiming.title')}
                    </h3>
                </div>
                <div className="text-center py-8">
                    <Clock size={48} className="mx-auto mb-3 text-text-tertiary" />
                    <p className="text-text-tertiary text-sm">
                        {t('dashboard.mealTiming.empty')}
                    </p>
                </div>
            </div>
        );
    }

    const getSleepImpactColor = () => {
        if (insights.sleepImpact.avgMealBedtimeGap >= 2.5) return 'text-success';
        if (insights.sleepImpact.avgMealBedtimeGap >= 1.5) return 'text-warning';
        return 'text-danger';
    };

    const getConsistencyRating = (variance: number) => {
        if (variance < 30)
            return { label: 'MUY CONSISTENTE', color: 'text-success' };
        if (variance < 60) return { label: 'MODERADO', color: 'text-warning' };
        return { label: 'VARIABLE', color: 'text-danger' };
    };

    return (
        <div className="bg-surface rounded-card p-8 shadow-card border border-border group hover:border-primary/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-soft rounded-control group-hover:scale-110 transition-transform">
                    <Clock className="text-primary" size={20} />
                </div>
                <h3 className="text-text-primary font-bold text-xl tracking-tight">
                    {t('dashboard.mealTiming.title')}
                </h3>
            </div>

            {/* Eating Window */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-primary-soft rounded-control">
                    <div className="text-xs text-primary font-bold mb-1">
                        {t('dashboard.mealTiming.firstMeal')}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                        {insights.avgFirstMealTime}
                    </div>
                </div>
                <div className="p-3 bg-info-soft rounded-control">
                    <div className="text-xs text-info font-bold mb-1">
                        {t('dashboard.mealTiming.lastMeal')}
                    </div>
                    <div className="text-2xl font-bold text-info">
                        {insights.avgLastMealTime}
                    </div>
                </div>
            </div>

            <div className="p-3 bg-background rounded-control mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary font-bold">
                        {t('dashboard.mealTiming.eatingWindow')}
                    </span>
                    <span className="text-lg font-bold text-text-primary">
                        {insights.avgEatingWindow.toFixed(1)}h
                    </span>
                </div>
                {insights.ifDaysCount > 0 && (
                    <p className="text-xs text-text-tertiary mt-2">
                        🔹 {insights.ifDaysCount}{' '}
                        {t('dashboard.mealTiming.ifPattern')}
                    </p>
                )}
            </div>

            {/* Sleep Impact */}
            <div className="border-t border-border pt-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Moon size={16} className="text-primary" />
                    <h4 className="text-sm font-bold text-text-secondary">
                        {t('dashboard.mealTiming.sleepImpact.title')}
                    </h4>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-text-secondary">
                            {t('dashboard.mealTiming.sleepImpact.gap')}
                        </span>
                        <span
                            className={`text-sm font-bold ${getSleepImpactColor()}`}>
                            {insights.sleepImpact.avgMealBedtimeGap.toFixed(1)}h
                        </span>
                    </div>
                    {insights.sleepImpact.avgMealBedtimeGap < 2 && (
                        <p className="text-xs text-warning bg-warning-soft p-2 rounded">
                            {t('dashboard.mealTiming.sleepImpact.warning')}
                        </p>
                    )}
                    {insights.sleepImpact.lateEatingDays > 7 && (
                        <p className="text-xs text-danger bg-danger-soft p-2 rounded">
                            {t('dashboard.mealTiming.sleepImpact.bad', {
                                count: insights.sleepImpact.lateEatingDays,
                            })}
                        </p>
                    )}
                    {insights.sleepImpact.avgMealBedtimeGap >= 2.5 &&
                        insights.sleepImpact.lateEatingDays <= 5 && (
                            <p className="text-xs text-success bg-success-soft p-2 rounded">
                                {t('dashboard.mealTiming.sleepImpact.good')}
                            </p>
                        )}
                    {insights.sleepImpact.lateNightCalories > 0 && (
                        <div className="flex justify-between items-center text-[10px] text-text-tertiary mt-2">
                            <span>
                                {t('dashboard.mealTiming.sleepImpact.lateCalories')}
                            </span>
                            <span className="font-bold">
                                {insights.sleepImpact.lateNightCalories.toFixed(0)}{' '}
                                kcal
                            </span>
                        </div>
                    )}
                    {Math.abs(insights.sleepImpact.sleepScoreCorrelation) > 0.2 && (
                        <p className="text-[10px] text-primary mt-1 italic">
                            {insights.sleepImpact.sleepScoreCorrelation > 0
                                ? t('dashboard.mealTiming.sleepImpact.positiveCorrelation')
                                : t('dashboard.mealTiming.sleepImpact.negativeCorrelation')}
                        </p>
                    )}
                </div>
            </div>

            {/* Workout Nutrition */}
            {insights.workoutNutrition.workoutDaysWithData > 0 && (
                <div className="border-t border-border pt-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={16} className="text-warning" />
                        <h4 className="text-sm font-bold text-text-secondary">
                            {t('dashboard.mealTiming.workoutNutrition.title')}
                        </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-carbs-soft rounded">
                            <div className="text-[10px] text-carbs font-bold">
                                {t('dashboard.mealTiming.workoutNutrition.avgCarbs')}
                            </div>
                            <div className="text-lg font-bold text-carbs">
                                {insights.workoutNutrition.avgPreWorkoutCarbs.toFixed(
                                    0,
                                )}
                                g
                            </div>
                        </div>
                        <div className="p-2 bg-protein-soft rounded">
                            <div className="text-[10px] text-protein font-bold">
                                {t(
                                    'dashboard.mealTiming.workoutNutrition.avgProtein',
                                )}
                            </div>
                            <div className="text-lg font-bold text-protein">
                                {insights.workoutNutrition.avgPostWorkoutProtein.toFixed(
                                    0,
                                )}
                                g
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-2">
                        {t('dashboard.mealTiming.workoutNutrition.daysWithData', {
                            count: insights.workoutNutrition.workoutDaysWithData,
                        })}
                    </p>
                </div>
            )}

            {/* Consistency */}
            <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-2">
                    <Utensils size={16} className="text-info" />
                    <h4 className="text-sm font-bold text-text-secondary">
                        {t('dashboard.mealTiming.consistency.title')}
                    </h4>
                </div>
                <div className="space-y-1">
                    {[
                        {
                            label: t('meals.breakfast', {
                                defaultValue: 'Breakfast',
                            }),
                            variance: insights.consistency.breakfastVariance,
                        },
                        {
                            label: t('meals.lunch', { defaultValue: 'Lunch' }),
                            variance: insights.consistency.lunchVariance,
                        },
                        {
                            label: t('meals.dinner', { defaultValue: 'Dinner' }),
                            variance: insights.consistency.dinnerVariance,
                        },
                    ].map((meal) => {
                        const rating = getConsistencyRating(meal.variance);
                        // Translate the label returned by getConsistencyRating
                        let translatedRating = rating.label;
                        if (rating.label === 'MUY CONSISTENTE')
                            translatedRating = t(
                                'dashboard.mealTiming.consistency.veryConsistent',
                            );
                        if (rating.label === 'MODERADO')
                            translatedRating = t(
                                'dashboard.mealTiming.consistency.moderate',
                            );
                        if (rating.label === 'VARIABLE')
                            translatedRating = t(
                                'dashboard.mealTiming.consistency.variable',
                            );

                        return meal.variance > 0 ? (
                            <div
                                key={meal.label}
                                className="flex justify-between items-center text-xs">
                                <span className="text-text-secondary">{meal.label}</span>
                                <span className={`font-bold ${rating.color}`}>
                                    {translatedRating} (±{meal.variance.toFixed(0)}{' '}
                                    min)
                                </span>
                            </div>
                        ) : null;
                    })}
                </div>
            </div>
        </div>
    );
};
