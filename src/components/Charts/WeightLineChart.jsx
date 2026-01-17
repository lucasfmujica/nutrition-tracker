/**
 * WeightLineChart - SVG-based weight chart with 7-day moving average
 * Displays weight trend over time with target line
 */
export const WeightLineChart = ({ data, targetWeight }) => {
  if (data.length === 0) return null;

  const weights = data.map(d => d.weight);
  const minWeight = Math.min(...weights) - 0.5;
  const maxWeight = Math.max(...weights) + 0.5;
  const range = maxWeight - minWeight;

  const chartHeight = 120;
  const padding = 10;

  const getY = (weight) => {
    return chartHeight - padding - ((weight - minWeight) / range) * (chartHeight - padding * 2);
  };

  // Create path for actual weight
  const weightPath = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = getY(d.weight);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Create path for 7-day average
  const avgPath = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = getY(d.avg7d);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Target line
  const targetY = getY(targetWeight);

  return (
    <div className="bg-[#2C3E50] rounded-lg p-4 border border-gray-600/30">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-white">📈 PESO</h3>
        <div className="flex gap-3 text-xs text-gray-300">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block"></span> Peso</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block"></span> Media 7d</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-400 inline-block border-dashed"></span> Objetivo</span>
        </div>
      </div>

      <div className="relative" style={{ height: chartHeight }}>
        <svg viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full">
          {/* Target line */}
          {targetWeight >= minWeight && targetWeight <= maxWeight && (
            <line x1="0" y1={targetY} x2="100" y2={targetY} stroke="#9CA3AF" strokeWidth="0.5" strokeDasharray="2,2" />
          )}

          {/* 7-day average line */}
          <path d={avgPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Actual weight line */}
          <path d={weightPath} fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {data.map((d, i) => (
            <circle key={i} cx={(i / (data.length - 1)) * 100} cy={getY(d.weight)} r="2" fill="#60A5FA" />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 -ml-1">
          <span>{maxWeight.toFixed(1)}</span>
          <span>{minWeight.toFixed(1)}</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        {data.length > 0 && <span>{data[0].dayLabel}</span>}
        {data.length > 1 && <span>{data[data.length - 1].dayLabel}</span>}
      </div>

      {/* Current stats */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-600/30">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{data[data.length - 1]?.weight || '-'}</div>
          <div className="text-xs text-gray-300">Último</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-amber-400">{data[data.length - 1]?.avg7d || '-'}</div>
          <div className="text-xs text-gray-300">Media 7d</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">{targetWeight}</div>
          <div className="text-xs text-gray-300">Objetivo</div>
        </div>
      </div>
    </div>
  );
};
