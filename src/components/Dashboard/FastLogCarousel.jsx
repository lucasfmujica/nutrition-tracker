import { Check, Plus, Zap } from 'lucide-react';
import React, { useState } from 'react';

/**
 * FastLogCarousel
 *
 * Premium Action Card Grid for quick logging.
 * Replaces basic list with a horizontally scrolling Bento-style layout.
 */
export const FastLogCarousel = ({
  frequentFoods = [],
  frequentCombos = [],
  onQuickLog,
  userProfile
}) => {
  const [loggingId, setLoggingId] = useState(null); // ID of item currently being logged (loading state)
  const [successId, setSuccessId] = useState(null); // ID of item just logged (success state)

  const handleLog = async (item, isCombo) => {
    const id = isCombo ? item.id : item.name;
    setLoggingId(id);

    try {
      // Haptic feedback if available (mobile)
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }

      const message = await onQuickLog(item);

      if (message) {
        setLoggingId(null);
        setSuccessId(id);

        // Reset success state after 2 seconds
        setTimeout(() => setSuccessId(null), 2000);
      }
    } catch (err) {
      console.error('Quick log error:', err);
      setLoggingId(null);
    }
  };

  if ((!frequentFoods.length && !frequentCombos.length)) return null;

  return (
    <div className="mb-8 pl-1">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <Zap className="w-4 h-4 fill-current" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Fast-Log</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 snap-x">
        {/* Combos First - Highlighted Bento Cards */}
        {frequentCombos.map(combo => (
          <button
            key={combo.id}
            onClick={() => handleLog(combo, true)}
            disabled={loggingId === combo.id}
            className={`
              snap-start shrink-0 relative w-40 h-48 rounded-3xl p-4 flex flex-col justify-between
              transition-all duration-300 transform
              ${successId === combo.id
                ? 'bg-emerald-500 scale-95 ring-4 ring-emerald-200 shadow-none'
                : 'bg-gradient-to-br from-indigo-600 to-violet-700 shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95'
              }
            `}
          >
            <div className="flex justify-between items-start">
              <span className="text-3xl filter drop-shadow-md">
                {successId === combo.id ? '✅' : '🍱'}
              </span>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md
                ${successId === combo.id ? 'bg-white/30 text-white' : 'bg-white/20 text-indigo-100'}
              `}>
                 {successId === combo.id ? <Check size={16} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
              </div>
            </div>

            <div className="text-left">
              <span className={`block text-xs font-bold uppercase tracking-wider mb-1 ${successId === combo.id ? 'text-emerald-100' : 'text-indigo-200'}`}>
                Combo
              </span>
              <h3 className={`font-bold text-lg leading-tight mb-1 ${successId === combo.id ? 'text-white' : 'text-white'}`}>
                {successId === combo.id ? '¡Registrado!' : 'Mi Combo'}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                 <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs text-white font-bold backdrop-blur-sm">
                   {combo.totalCalories} kcal
                 </span>
              </div>
            </div>

            {/* Loading Overlay */}
            {loggingId === combo.id && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </button>
        ))}

        {/* Individual Foods - Clean White Cards with soft shadows */}
        {frequentFoods.map(food => (
          <button
            key={food.name}
            onClick={() => handleLog(food, false)}
            disabled={loggingId === food.name}
            className={`
              snap-start shrink-0 relative w-36 h-48 rounded-3xl p-4 flex flex-col justify-between border
              transition-all duration-300 transform
              ${successId === food.name
                ? 'bg-emerald-50 border-emerald-200 scale-95 ring-2 ring-emerald-100'
                : 'bg-white border-gray-100 shadow-lg shadow-gray-100 hover:shadow-xl hover:scale-105 active:scale-95 hover:border-indigo-100'
              }
            `}
          >
           <div className="flex justify-between items-start">
              <span className="text-3xl">
                {successId === food.name ? '✅' : ''}
              </span>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-colors
                ${successId === food.name ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}
              `}>
                {successId === food.name ? <Check size={16} strokeWidth={3} /> : <Plus size={18} />}
              </div>
            </div>

            <div className="text-left">
              <h3 className={`font-bold text-base leading-tight mb-1 line-clamp-2 ${successId === food.name ? 'text-emerald-800' : 'text-gray-900'}`}>
                {food.name}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-1 mb-2">
                Frecuente
              </p>
              <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${successId === food.name ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {food.calories} kcal
              </span>
            </div>

            {/* Loading Overlay */}
             {loggingId === food.name && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
