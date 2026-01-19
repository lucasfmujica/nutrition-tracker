import { Droplets, Footprints, Minus, Plus } from 'lucide-react';
import React from 'react';

const ActivityCard = ({ title, value, target, unit, icon: Icon, color, onAdd, onDecrease, subtext }) => {
  const percentage = Math.min((value / target) * 100, 100);

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 relative overflow-hidden flex-1">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-full ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex gap-1">
          {onDecrease && (
            <button
              onClick={onDecrease}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Minus size={16} />
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      <div>
        <span className="text-2xl font-bold text-gray-900 block">{value}</span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{unit}</span>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color.replace('bg-', 'bg-')}`} // Reuse color class logic or explicit
            style={{ width: `${percentage}%`, backgroundColor: 'currentColor' }}
          />
        </div>
        {subtext && <p className="text-[10px] text-gray-400 mt-1.5 text-right">{subtext}</p>}
      </div>
    </div>
  );
};

export const ActivityCards = ({ steps, stepsTarget, water, waterTarget, onAddWater, onRemoveWater }) => {
  return (
    <div className="flex gap-3 mb-6">
      {/* Steps Card */}
      <ActivityCard
        title="Pasos"
        value={steps}
        target={stepsTarget}
        unit="Pasos"
        icon={Footprints}
        color="bg-orange-500"
        subtext={`Meta: ${stepsTarget}`}
      />

      {/* Water Card */}
      <ActivityCard
        title="Agua"
        value={water}
        target={waterTarget}
        unit="Vasos"
        icon={Droplets}
        color="bg-blue-400"
        onAdd={onAddWater}
        onDecrease={onRemoveWater}
        subtext={`${water}/${waterTarget}`}
      />
    </div>
  );
};
