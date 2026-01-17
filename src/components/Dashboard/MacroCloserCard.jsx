import React from 'react';
import { useMacroOptimizer } from '../../hooks/useMacroOptimizer';

export const MacroCloserCard = ({ totals, targets }) => {
  const { gap, suggestions } = useMacroOptimizer(totals, targets);

  // Condition to show:
  // 1. User has started logging (calories > 0)
  // 2. Goal NOT met (gap.protein > 0)
  // 3. Must have suggestions (implies gap exists)
  if (!totals || totals.calories === 0 || gap.protein <= 0 || suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-white rounded-3xl p-6 shadow-sm border border-indigo-100/50">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-bold text-lg text-indigo-950 flex items-center gap-2">
            The Macro Closer
            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Beta</span>
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Te faltan <span className="font-bold text-indigo-600">{Math.round(gap.protein)}g</span> de proteína para tu objetivo.
            {gap.calories < 200 && <span className="block text-xs text-orange-500 mt-1">¡Cuidado con las calorías! Quedan {Math.round(gap.calories)}.</span>}
          </p>
        </div>
        <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {suggestions.map((option, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex flex-col h-full justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1 block">{option.title}</span>
                <div className="font-bold text-gray-800 text-base mb-1 group-hover:text-indigo-600 transition-colors">{option.name}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 font-medium text-gray-700">{option.displayAmount}</span>
                  <span>{Math.round(option.projectedCalories)} kcal</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-indigo-50 text-center">
         <p className="text-xs text-gray-400">Basado en tus objetivos del día y calorías restantes.</p>
      </div>
    </div>
  );
};
