import React from 'react';

export interface WeightProjection {
    realistTrend: number | null;
    adjustedTrend: number | null;
    remainingWeight: number;
    adherencePercent: number;
    adherenceDetails: any;
    projectedGoalDate: string | null;
    formattedGoalDate: string | null;
    weeksToGoal: string | number | null;
    daysToGoal: number | null;
    projectionStatus: 'goal_reached' | 'not_losing' | 'on_track' | undefined;
    actualPath: any[];
    projectedPath: any[];
    targetWeight: number;
    coachMessage: { emoji: string; text: string } | null;
    dataPoints: number;
    daysCovered: number;
}

interface WeightProjectionCardProps {
    projection: WeightProjection | null;
}

/**
 * WeightProjectionCard - Displays weight loss projection and recommendations
 */
export const WeightProjectionCard: React.FC<WeightProjectionCardProps> = ({
    projection,
}) => {
    if (!projection) return null;

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50">
            <h3 className="text-gray-900 font-bold text-lg mb-4">Proyección</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Adjusted Trend */}
                <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-sm sm:text-xs text-gray-500 font-medium">
                        Ritmo actual
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-gray-900">
                            {typeof projection.adjustedTrend === 'number' &&
                            Number.isFinite(projection.adjustedTrend) ? (
                                <>
                                    {projection.adjustedTrend > 0 ? '+' : ''}
                                    {projection.adjustedTrend.toFixed(1)}
                                </>
                            ) : (
                                '—'
                            )}
                        </span>
                        <span className="text-xs text-gray-500">kg/sem</span>
                    </div>
                </div>

                {/* Weeks to Goal */}
                <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-sm sm:text-xs text-gray-500 font-medium">
                        Para objetivo
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-blue-600">
                            {projection.weeksToGoal || '-'}
                        </span>
                        <span className="text-xs text-blue-400">sem</span>
                    </div>
                </div>
            </div>

            {projection.formattedGoalDate && (
                <div className="mb-4 text-center">
                    <span className="text-xs text-gray-400">Fecha estimada: </span>
                    <span className="text-sm font-semibold text-gray-900">
                        {projection.formattedGoalDate}
                    </span>
                </div>
            )}

            <p className="text-[10px] text-gray-400 mt-3 text-center">
                Basado en {projection.dataPoints} registros ({projection.daysCovered}{' '}
                días)
            </p>
        </div>
    );
};
