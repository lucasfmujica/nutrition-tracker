import { Plus } from 'lucide-react';
import React from 'react';
import { FoodItem } from './FoodItem';

export const MealSection = ({ title, foods, totals, onAddFood, onEditFood, onDeleteFood }) => {
  return (
    <div className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-50/50 border-b border-gray-100">
        <h3 className="text-gray-900 font-bold text-base">{title}</h3>
        <span className="text-sm font-semibold text-gray-900">{totals.calories} <span className="text-xs font-normal text-gray-500">kcal</span></span>
      </div>

      {/* Foods List */}
      <div className="divide-y divide-gray-50">
        {foods.map(food => (
          <FoodItem
            key={food.id}
            food={food}
            onEdit={() => onEditFood(food)}
            onDelete={() => onDeleteFood(food)}
          />
        ))}
        {foods.length === 0 && (
          <div className="p-4 text-center text-xs text-gray-400 italic">
            Sin alimentos registrados
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={onAddFood}
        className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors active:bg-blue-100"
      >
        <Plus size={16} /> Agregar Comida
      </button>
    </div>
  );
};
