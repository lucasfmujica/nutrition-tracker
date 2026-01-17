/**
 * AdherenceCard - Weekly adherence score display
 * Shows adherence metrics for calories, protein, and steps
 */
export const AdherenceCard = ({ data, label }) => {
  const getScoreColor = (score) => {
    if (score >= 8) return 'text-blue-400';
    if (score >= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-gray-400">{label}</h4>
        <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>{data.score}/10</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="text-blue-400 font-bold">{data.calOkDays}/{data.daysTracked}</div>
          <div className="text-gray-500">Cal OK</div>
        </div>
        <div>
          <div className="text-blue-400 font-bold">{data.protOkDays}/{data.daysTracked}</div>
          <div className="text-gray-500">Prot OK</div>
        </div>
        <div>
          <div className="text-cyan-400 font-bold">{data.stepsOkDays}/{data.daysTracked}</div>
          <div className="text-gray-500">Pasos OK</div>
        </div>
      </div>
    </div>
  );
};
