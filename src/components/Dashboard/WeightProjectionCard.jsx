/**
 * WeightProjectionCard - Displays weight loss projection and recommendations
 * Based on current weight trends and goals
 */
export const WeightProjectionCard = ({ projection }) => {
  if (!projection) return null;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50">
      <h3 className="text-gray-900 font-bold text-lg mb-4">Proyección</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <div className="text-xl font-bold text-gray-900">
            {Number.isFinite(projection.adjustedTrend) ? (
              <>
                {projection.adjustedTrend > 0 ? '+' : ''}{projection.adjustedTrend.toFixed(1)}
              </>
            ) : '—'}
            <span className="text-xs font-normal text-gray-500">kg/sem</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Ritmo actual</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <div className="text-xl font-bold text-blue-600">
            {projection.weeksToGoal ? `${projection.weeksToGoal} sem` : '-'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Para objetivo</div>
        </div>
      </div>

      {projection.formattedGoalDate && (
        <div className="mb-4 text-center">
           <span className="text-xs text-gray-400">Fecha estimada: </span>
           <span className="text-sm font-semibold text-gray-900">{projection.formattedGoalDate}</span>
        </div>
      )}

      {projection.coachMessage && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-800 flex items-center justify-center gap-2">
            <span className="text-lg">{projection.coachMessage.emoji}</span>
            {projection.coachMessage.text}
          </p>
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        Basado en {projection.dataPoints} registros ({projection.daysCovered} días)
      </p>
    </div>
  );
};
