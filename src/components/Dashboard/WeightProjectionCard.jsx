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
            {projection.weeklyRate > 0 ? '-' : '+'}{Math.abs(projection.weeklyRate)}
            <span className="text-xs font-normal text-gray-500">kg/sem</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Ritmo actual</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <div className="text-xl font-bold text-blue-600">
            {projection.weeksToGoal ? `~${projection.weeksToGoal}` : '-'}
            <span className="text-xs font-normal text-gray-500">sem</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Para objetivo</div>
        </div>
      </div>

      {projection.goalDate && (
        <div className="mb-4 text-center">
           <span className="text-xs text-gray-400">Fecha estimada: </span>
           <span className="text-sm font-semibold text-gray-900">{projection.goalDate}</span>
        </div>
      )}

      {projection.recommendation && (
        <div className={`p-3 rounded-xl text-xs leading-relaxed ${
          projection.recommendation.type === 'good' ? 'bg-blue-50 text-blue-700' :
          projection.recommendation.type === 'decrease' ? 'bg-amber-50 text-amber-700' :
            'bg-red-50 text-red-700'
        }`}>
          💡 {projection.recommendation.text}
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        Basado en {projection.dataPoints} registros ({projection.daysCovered} días)
      </p>
    </div>
  );
};
