import { AlertTriangle, RefreshCw, TrendingDown } from 'lucide-react';
import { useState } from 'react';

/**
 * PlateauAlertCard - Alert UI for weight plateau detection
 *
 * Displays when user is in plateau mode with actionable suggestions.
 * Premium Minimalist styling with amber/warning color palette.
 *
 * @param {Object} plateauData - From usePlateauDetector
 * @param {Function} onApplyAction - Callback when user selects an action
 */
export const PlateauAlertCard = ({ plateauData, onApplyAction }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  if (!plateauData?.isInPlateau || !plateauData?.suggestion) {
    return null;
  }

  const { suggestion } = plateauData;

  const handleApply = (option) => {
    setSelectedOption(option.id);
    if (onApplyAction) {
      onApplyAction(option.action);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-xl flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-900">Plateau Detectado</h3>
          <p className="text-xs text-amber-700 mt-0.5">{suggestion.message}</p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {suggestion.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleApply(option)}
            disabled={selectedOption !== null}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              selectedOption === option.id
                ? 'bg-amber-500 border-amber-500 text-white'
                : selectedOption !== null
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-sm'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
              selectedOption === option.id ? 'bg-amber-400' : 'bg-amber-100'
            }`}>
              {option.id === 'refeed' ? (
                <RefreshCw className={`w-4 h-4 ${
                  selectedOption === option.id ? 'text-white' : 'text-amber-600'
                }`} />
              ) : (
                <TrendingDown className={`w-4 h-4 ${
                  selectedOption === option.id ? 'text-white' : 'text-amber-600'
                }`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`block text-sm font-semibold ${
                selectedOption === option.id ? 'text-white' : 'text-amber-900'
              }`}>
                {option.label}
              </span>
              <span className={`block text-xs truncate ${
                selectedOption === option.id ? 'text-amber-100' : 'text-amber-600'
              }`}>
                {option.description}
              </span>
            </div>
            {selectedOption === option.id && (
              <span className="text-xs font-bold text-amber-100">Aplicado ✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Info */}
      <p className="text-[10px] text-amber-600/70 mt-3 text-center">
        Basado en análisis de los últimos 14 días de peso
      </p>
    </div>
  );
};
