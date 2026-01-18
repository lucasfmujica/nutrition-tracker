import { Check, Plus, Zap } from 'lucide-react';
import React, { useState } from 'react';

/**
 * FastLogCarousel
 *
 * Horizontal scrollable list of frequent foods and combos.
 * Enables 1-tap logging with visual feedback.
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
    <div className="mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar py-2">
      <div className="flex gap-3">
        {/* Header/Label (Optional, maybe inline?) */}
        <div className="flex flex-col justify-center px-1 shrink-0">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider text-center">Fast</span>
        </div>

        {/* Combos First */}
        {frequentCombos.map(combo => (
          <button
            key={combo.id}
            onClick={() => handleLog(combo, true)}
            disabled={loggingId === combo.id}
            className={`
              shrink-0 relative group flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl border transition-all active:scale-95
              ${successId === combo.id
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-200'
              }
            `}
          >
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm
              ${successId === combo.id ? 'bg-white' : 'bg-white border border-indigo-50'}
            `}>
              {successId === combo.id ? '✅' : '🍱'}
            </div>

            <div className="text-left">
              <span className={`block text-xs font-bold leading-tight ${successId === combo.id ? 'text-green-800' : 'text-gray-800'}`}>
                {successId === combo.id ? '¡Listo!' : 'Combo'}
              </span>
              <span className="text-[10px] text-gray-500 break-words max-w-[80px] leading-tight block line-clamp-1">
                 {/* Truncate long combo names */}
                 {combo.items.length} items
              </span>
              <span className="text-[10px] font-medium text-indigo-600">
                {combo.totalCalories} kcal
              </span>
            </div>

            {/* Overlay Loading Spinner could go here, but button disable is subtle enough for "Failed" state handling */}
          </button>
        ))}

        {/* Individual Foods */}
        {frequentFoods.map(food => (
          <button
            key={food.name}
            onClick={() => handleLog(food, false)}
            disabled={loggingId === food.name}
            className={`
              shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-95
              ${successId === food.name
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
              }
            `}
          >
            <div className="text-left">
              <span className={`block text-xs font-bold ${successId === food.name ? 'text-green-800' : 'text-gray-800'}`}>
                {food.name}
              </span>
              <span className="text-[10px] text-gray-500">
                {food.calories} kcal
              </span>
            </div>

            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center transition-colors
              ${successId === food.name ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}
            `}>
              {successId === food.name ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
