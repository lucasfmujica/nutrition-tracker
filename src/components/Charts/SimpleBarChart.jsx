/**
 * SimpleBarChart - Simple bar chart for weekly data
 * Displays bars for each day with target line
 */
export const SimpleBarChart = ({ data, dataKey, target, color, label }) => {
  const maxVal = Math.max(...data.map(d => d[dataKey]), target) * 1.1 || target * 1.1;
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold text-slate-400">Meta: {target}</span>
      </div>
      <div className="flex items-end justify-between h-20 gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-full bg-slate-50 rounded-t-lg relative group" style={{ height: '56px' }}>
              <div className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${color} ${d[dataKey] > target ? 'opacity-80' : ''}`} style={{ height: `${Math.min((d[dataKey] / maxVal) * 100, 100)}%` }}>
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none transition-opacity font-bold z-10 whitespace-nowrap">
                  {d[dataKey].toLocaleString()}
                </div>
              </div>
              <div className="absolute w-full border-t border-dashed border-slate-200" style={{ bottom: `${(target / maxVal) * 100}%` }} />
              {d.completed && <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 text-[10px] bg-white rounded-full shadow-sm w-4 h-4 flex items-center justify-center">✓</div>}
            </div>
            <span className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
