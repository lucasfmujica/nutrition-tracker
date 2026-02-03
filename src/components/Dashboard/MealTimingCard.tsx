import { Clock, Moon, Utensils, Zap } from 'lucide-react';
import React from 'react';

interface MealTimingInsights {
    avgFirstMealTime: string;
    avgLastMealTime: string;
    avgEatingWindow: number;
    ifDaysCount: number;

    sleepImpact: {
        avgMealBedtimeGap: number;
        lateEatingDays: number;
        sleepScoreCorrelation: number;
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
    if (!insights.hasData) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="text-primary" size={20} />
                    <h3 className="text-gray-900 font-bold text-lg">
                        Timing Nutricional
                    </h3>
                </div>
                <div className="text-center py-8">
                    <Clock size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm">
                        Registrá comidas con horarios para ver análisis de timing
                    </p>
                </div>
            </div>
        );
    }

    const getSleepImpactColor = () => {
        if (insights.sleepImpact.avgMealBedtimeGap >= 2.5) return 'text-green-500';
        if (insights.sleepImpact.avgMealBedtimeGap >= 1.5) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getConsistencyRating = (variance: number) => {
        if (variance < 30)
            return { label: 'MUY CONSISTENTE', color: 'text-green-500' };
        if (variance < 60) return { label: 'MODERADO', color: 'text-yellow-500' };
        return { label: 'VARIABLE', color: 'text-red-500' };
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="text-indigo-600" size={20} />
                <h3 className="text-gray-900 font-bold text-lg">
                    Timing Nutricional
                </h3>
            </div>

            {/* Eating Window */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                    <div className="text-xs text-blue-600 font-bold mb-1">
                        PRIMERA COMIDA
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                        {insights.avgFirstMealTime}
                    </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                    <div className="text-xs text-purple-600 font-bold mb-1">
                        ÚLTIMA COMIDA
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                        {insights.avgLastMealTime}
                    </div>
                </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 font-bold">
                        VENTANA ALIMENTARIA
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                        {insights.avgEatingWindow.toFixed(1)}h
                    </span>
                </div>
                {insights.ifDaysCount > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                        🔹 {insights.ifDaysCount} días con ventana &lt;10h (IF
                        pattern)
                    </p>
                )}
            </div>

            {/* Sleep Impact */}
            <div className="border-t border-slate-100 pt-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Moon size={16} className="text-indigo-500" />
                    <h4 className="text-sm font-bold text-slate-700">
                        Impacto en Sueño
                    </h4>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">
                            Gap Comida → Cama
                        </span>
                        <span
                            className={`text-sm font-bold ${getSleepImpactColor()}`}>
                            {insights.sleepImpact.avgMealBedtimeGap.toFixed(1)}h
                        </span>
                    </div>
                    {insights.sleepImpact.avgMealBedtimeGap < 2 && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            ⚠️ Comés muy cerca de dormir. Intentá 2.5-3h antes de
                            acostarte.
                        </p>
                    )}
                    {insights.sleepImpact.lateEatingDays > 7 && (
                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            🔴 {insights.sleepImpact.lateEatingDays} días con comidas
                            después de 21:00
                        </p>
                    )}
                    {insights.sleepImpact.avgMealBedtimeGap >= 2.5 &&
                        insights.sleepImpact.lateEatingDays <= 5 && (
                            <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                ✅ Timing óptimo para calidad de sueño
                            </p>
                        )}
                </div>
            </div>

            {/* Workout Nutrition */}
            {insights.workoutNutrition.workoutDaysWithData > 0 && (
                <div className="border-t border-slate-100 pt-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={16} className="text-orange-500" />
                        <h4 className="text-sm font-bold text-slate-700">
                            Nutrición de Entreno
                        </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-orange-50 rounded">
                            <div className="text-[10px] text-orange-600 font-bold">
                                PROMEDIO CARBS
                            </div>
                            <div className="text-lg font-bold text-orange-900">
                                {insights.workoutNutrition.avgPreWorkoutCarbs.toFixed(
                                    0,
                                )}
                                g
                            </div>
                        </div>
                        <div className="p-2 bg-green-50 rounded">
                            <div className="text-[10px] text-green-600 font-bold">
                                PROMEDIO PROTEIN
                            </div>
                            <div className="text-lg font-bold text-green-900">
                                {insights.workoutNutrition.avgPostWorkoutProtein.toFixed(
                                    0,
                                )}
                                g
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                        Promedio en días de entreno (
                        {insights.workoutNutrition.workoutDaysWithData} días)
                    </p>
                </div>
            )}

            {/* Consistency */}
            <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                    <Utensils size={16} className="text-cyan-500" />
                    <h4 className="text-sm font-bold text-slate-700">
                        Consistencia de Horarios
                    </h4>
                </div>
                <div className="space-y-1">
                    {[
                        {
                            label: 'Desayuno',
                            variance: insights.consistency.breakfastVariance,
                        },
                        {
                            label: 'Almuerzo',
                            variance: insights.consistency.lunchVariance,
                        },
                        {
                            label: 'Cena',
                            variance: insights.consistency.dinnerVariance,
                        },
                    ].map((meal) => {
                        const rating = getConsistencyRating(meal.variance);
                        return meal.variance > 0 ? (
                            <div
                                key={meal.label}
                                className="flex justify-between items-center text-xs">
                                <span className="text-slate-600">{meal.label}</span>
                                <span className={`font-bold ${rating.color}`}>
                                    {rating.label} (±{meal.variance.toFixed(0)} min)
                                </span>
                            </div>
                        ) : null;
                    })}
                </div>
            </div>
        </div>
    );
};
