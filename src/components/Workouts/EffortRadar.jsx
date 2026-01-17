import React from 'react';

/**
 * EffortRadar - Visualizes the Adaptive Effort Score
 *
 * Simple horizontal gauge with 3 zones:
 * - Recovering (Left, Blue)
 * - Optimal (Center, Green)
 * - Overreaching (Right, Orange/Red)
 *
 * @param {Object} analytics - Result from useEffortAnalytics
 */
export const EffortRadar = ({ analytics }) => {
  const { status, insight, score } = analytics;

  // Determine color based on status
  let statusColor = 'text-green-600';
  let barColor = 'bg-green-500';
  if (status === 'Overreaching' || status === 'Deload Needed') {
      statusColor = 'text-orange-600';
      barColor = 'bg-orange-500';
  } else if (status === 'Recovering') {
      statusColor = 'text-blue-600';
      barColor = 'bg-blue-500';
  } else if (status === 'Prime') {
      statusColor = 'text-purple-600';
      barColor = 'bg-purple-500';
  }

  // Calculate pointer position (clamped 0-100%)
  const position = Math.max(5, Math.min(95, score));

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
           <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
           </svg>
           Effort Radar
        </h3>
        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gray-50 uppercase tracking-wider ${statusColor}`}>
            {status}
        </span>
      </div>

      {/* The Gauge */}
      <div className="relative h-4 bg-gray-100 rounded-full mb-4 w-full overflow-hidden">
         {/* Zones Background */}
         <div className="absolute inset-0 flex opacity-20">
             <div className="w-1/3 bg-blue-500" />
             <div className="w-1/3 bg-green-500" />
             <div className="w-1/3 bg-orange-500" />
         </div>

         {/* Pointer */}
         <div
            className={`absolute top-0 bottom-0 w-2 ${barColor} shadow-lg transition-all duration-500 ease-out rounded-full border border-white transform -translate-x-1/2`}
            style={{ left: `${position}%` }}
         />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-4">
          <span>Recovering</span>
          <span>Optimal</span>
          <span>Push</span>
      </div>

      {/* Insight Text */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex gap-3 items-start">
        <span className="text-xl">💡</span>
        <p className="text-sm text-gray-600 leading-snug">
            {insight}
        </p>
      </div>
    </div>
  );
};
