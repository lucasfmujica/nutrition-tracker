import React, { useMemo } from 'react';
import { useTracker } from '../../context/TrackerContext';

/**
 * GoalInsightsCard - Strategic long-term progress visualization
 */
export const GoalInsightsCard: React.FC = () => {
    const {
        currentTrend,
        estimatedGoalDate,
        weeklyAdherence,
        remainingWeight,
        profile,
    } = useTracker() as any; // Cast as any for now until TrackerContext is fully typed

    const STARTING_WEIGHT = 84.9; // kg - Initial weight
    const TARGET_WEIGHT = profile?.targetWeight || 75; // kg - Goal weight
    const TOTAL_JOURNEY = STARTING_WEIGHT - TARGET_WEIGHT;

    // Calculate progress percentage
    const progressPercentage = useMemo(() => {
        const currentWeight = profile?.currentWeight || STARTING_WEIGHT;
        const completed = STARTING_WEIGHT - currentWeight;
        return Math.min(Math.max((completed / TOTAL_JOURNEY) * 100, 0), 100);
    }, [profile?.currentWeight, TOTAL_JOURNEY]);

    // Format goal date in Argentina locale
    const formattedGoalDate = useMemo(() => {
        if (!estimatedGoalDate || estimatedGoalDate === 'Meta alcanzada! 🎉') {
            return estimatedGoalDate;
        }

        try {
            const date = new Date(estimatedGoalDate + 'T12:00:00');
            return new Intl.DateTimeFormat('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'America/Argentina/Buenos_Aires',
            }).format(date);
        } catch (err) {
            console.error('[GoalInsightsCard] Error formatting date:', err);
            return 'Calculando...';
        }
    }, [estimatedGoalDate]);

    // Edge case: Goal already reached
    if (remainingWeight !== null && remainingWeight <= 0) {
        return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm rounded-2xl border border-green-100">
                <div className="text-center py-6">
                    <span className="text-6xl">🎉</span>
                    <h3 className="text-2xl font-bold text-green-600 mt-4">
                        ¡Meta alcanzada!
                    </h3>
                    <p className="text-sm text-green-700 mt-2">
                        Has llegado a tu peso objetivo de {TARGET_WEIGHT} kg
                    </p>
                </div>
            </div>
        );
    }

    // Edge case: Insufficient data
    if (!estimatedGoalDate && !currentTrend) {
        return (
            <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100">
                <div className="text-center py-8">
                    <span className="text-5xl mb-4 block">📊</span>
                    <h3 className="text-lg font-semibold text-gray-600">
                        Calculando...
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Necesitamos al menos 14 días de datos para proyectar tu meta
                    </p>
                </div>
            </div>
        );
    }

    // Trend color and icon logic
    const getTrendDisplay = () => {
        if (currentTrend === null || currentTrend === undefined) {
            return {
                icon: '—',
                text: 'Sin datos',
                color: 'text-gray-400 bg-gray-100 border-gray-200',
            };
        }

        if (currentTrend < 0) {
            return {
                icon: '↓',
                text: `${Math.abs(currentTrend).toFixed(1)} kg/sem`,
                color: 'text-green-600 bg-green-50 border-green-200',
            };
        } else if (currentTrend > 0) {
            return {
                icon: '↑',
                text: `${currentTrend.toFixed(1)} kg/sem`,
                color: 'text-amber-600 bg-amber-50 border-amber-200',
            };
        } else {
            return {
                icon: '→',
                text: 'Manteniendo',
                color: 'text-gray-600 bg-gray-50 border-gray-200',
            };
        }
    };

    // Adherence color logic (traffic light system)
    const getAdherenceColor = () => {
        if (weeklyAdherence >= 80) {
            return 'text-green-600 bg-green-50 border-green-200';
        } else if (weeklyAdherence >= 50) {
            return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        } else {
            return 'text-red-600 bg-red-50 border-red-200';
        }
    };

    const trendDisplay = getTrendDisplay();
    const adherenceColor = getAdherenceColor();

    return (
        <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-40 pointer-events-none"></div>

            <div className="relative z-10">
                {/* Header */}
                <h2 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">
                    Objetivo {TARGET_WEIGHT} kg
                </h2>

                {/* Hero: Estimated Goal Date */}
                <div className="mb-6">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {formattedGoalDate || 'Calculando...'}
                    </div>
                    <p className="text-sm text-gray-500">Fecha estimada</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-600">
                            {STARTING_WEIGHT}kg
                        </span>
                        <span className="text-xs font-medium text-blue-600">
                            {progressPercentage.toFixed(0)}%
                        </span>
                        <span className="text-xs font-semibold text-gray-600">
                            {TARGET_WEIGHT}kg
                        </span>
                    </div>

                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Secondary Metrics Row */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Trend Badge */}
                    <div
                        className={`rounded-xl p-3 border ${trendDisplay.color} transition-colors`}>
                        <div className="text-2xl font-bold mb-0.5">
                            {trendDisplay.icon}
                        </div>
                        <div className="text-xs font-medium">
                            {trendDisplay.text}
                        </div>
                        <div className="text-xs opacity-70 mt-0.5">Tendencia</div>
                    </div>

                    {/* Adherence Badge */}
                    <div
                        className={`rounded-xl p-3 border ${adherenceColor} transition-colors`}>
                        <div className="text-2xl font-bold mb-0.5">
                            {weeklyAdherence}%
                        </div>
                        <div className="text-xs font-medium">Semanal</div>
                        <div className="text-xs opacity-70 mt-0.5">Adherencia</div>
                    </div>

                    {/* Remaining Weight Badge */}
                    <div className="rounded-xl p-3 border bg-blue-50 text-blue-600 border-blue-200 transition-colors">
                        <div className="text-2xl font-bold mb-0.5">
                            {remainingWeight?.toFixed(1) || '—'}
                        </div>
                        <div className="text-xs font-medium">kg</div>
                        <div className="text-xs opacity-70 mt-0.5">Restante</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
