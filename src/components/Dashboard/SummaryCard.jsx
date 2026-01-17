import React from 'react';

export const SummaryCard = ({ totals, targets }) => {
  const caloriesRemaining = targets.calories - totals.calories;
  const progress = Math.min((totals.calories / targets.calories) * 100, 100);

  // Color based on remaining calories
  let statusColor = 'text-green-500';
  if (caloriesRemaining < 0) statusColor = 'text-red-500';
  else if (caloriesRemaining < 200) statusColor = 'text-amber-500';

  return (
    <div className="card bg-white p-5 shadow-sm rounded-2xl mb-4 relative overflow-hidden">
      {/* Background decoration */ }
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>

      <div className="relative z-10">
        <h2 className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wide">Calorías Restantes</h2>

        <div className="flex items-end gap-2 mb-4">
          <span className={`text-4xl font-bold tracking-tight ${statusColor}`}>
            {caloriesRemaining}
          </span>
          <span className="text-gray-400 text-sm mb-1.5 font-medium">kcal</span>
        </div>

        {/* Equation */}
        <div className="flex justify-between items-center text-sm text-gray-600 mb-4 px-1">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{targets.calories}</span>
            <span className="text-xs text-gray-400">Objetivo</span>
          </div>
          <span className="text-gray-300">-</span>
          <div className="flex flex-col text-right">
            <span className="font-semibold text-gray-900">{totals.calories}</span>
            <span className="text-xs text-gray-400">Alimentos</span>
          </div>
          <span className="text-gray-300">=</span>
          <div className="flex flex-col text-right">
            <span className={`font-bold ${statusColor}`}>{caloriesRemaining}</span>
            <span className="text-xs text-gray-400">Restante</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              caloriesRemaining < 0 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
