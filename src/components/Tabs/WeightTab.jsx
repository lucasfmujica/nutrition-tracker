import { useWeightForm } from '../../hooks/ui/useWeightForm';
import { WeightLineChart } from '../Charts/WeightLineChart';

/**
 * WeightTab - Weight tracking and history
 * Displays weight entry form, progress, chart, projections, and history
 */
export const WeightTab = ({
  // Data
  weightHistory,
  profile,
  getMostRecentWeight,
  getWeightChartData,
  weightProjection,
  // Editing
  editingWeightId,
  setEditingWeightId,
  editingWeightValue,
  setEditingWeightValue,
  startEditWeight,
  saveEditWeight,
  cancelEditWeight,
  // Delete
  confirmDelete,
  // Utilities
  formatTime
}) => {
  // Local form state
  const {
    weight, setWeight,
    time, setTime,
    date, setDate,
    error,
    handleSubmit
  } = useWeightForm();
  const currentWeight = getMostRecentWeight(weightHistory)?.weight || profile.currentWeight;
  const remaining = (currentWeight - profile.targetWeight).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-2 px-1">
        <h1 className="text-2xl font-bold text-gray-900">Peso</h1>
        <p className="text-sm text-gray-500">Seguimiento de progreso corporal</p>
      </div>

      {/* Entry Form */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">⚖️</span>
          NUEVO REGISTRO
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="84.5"
              className="flex-[1.5] bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg min-w-0 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <span className="flex items-center text-gray-500 text-sm font-medium">kg</span>
          </div>
          <div className="flex gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm min-w-0 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <button
              onClick={handleSubmit}
              disabled={!weight}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 transition-all"
            >
              Guardar
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-2 px-1">{error}</p>}
      </div>

      {/* Progress Summary */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Progreso</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-gray-900">{currentWeight}</div>
            <div className="text-xs text-gray-400 font-medium mt-1">Actual</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-blue-600">{profile.targetWeight}</div>
            <div className="text-xs text-gray-400 font-medium mt-1">Objetivo</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-amber-500">{remaining}</div>
            <div className="text-xs text-gray-400 font-medium mt-1">Faltan</div>
          </div>
        </div>
      </div>

      {/* Weight Chart with 7-day moving average */}
      {getWeightChartData.length > 1 && (
        <WeightLineChart data={getWeightChartData} targetWeight={profile.targetWeight} />
      )}

      {/* Projection */}
      {weightProjection && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Proyección</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xl font-bold text-gray-900">
                {weightProjection.weeklyRate > 0 ? '-' : '+'}{Math.abs(weightProjection.weeklyRate)} <span className="text-xs font-normal text-gray-500">kg</span>
              </div>
              <div className="text-xs text-gray-400 font-medium mt-1">Por semana</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xl font-bold text-blue-600">
                {weightProjection.weeksToGoal ? `${weightProjection.weeksToGoal} sem` : '-'}
              </div>
              <div className="text-xs text-gray-400 font-medium mt-1">Para llegar</div>
            </div>
          </div>

          {weightProjection.goalDate && (
            <div className="text-center p-2 bg-blue-900/20 rounded mb-3">
              <span className="text-sm text-gray-300">Fecha estimada: </span>
              <span className="text-sm font-bold text-blue-400">{weightProjection.goalDate}</span>
            </div>
          )}

          {weightProjection.recommendation && (
            <div className={`p-3 rounded ${weightProjection.recommendation.type === 'good' ? 'bg-blue-900/30 border border-blue-500/30' :
              weightProjection.recommendation.type === 'decrease' ? 'bg-amber-900/30 border border-amber-500/30' :
                'bg-red-900/30 border border-red-500/30'
              }`}>
              <p className={`text-sm ${weightProjection.recommendation.type === 'good' ? 'text-blue-400' :
                weightProjection.recommendation.type === 'decrease' ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                💡 {weightProjection.recommendation.text}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-3 text-center">
            Análisis basado en {weightProjection.dataPoints} registros durante {weightProjection.daysCovered} días
          </p>
        </div>
      )}

      {/* Weight History */}
      {weightHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Historial</h2>
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {weightHistory.map((entry, idx) => (
              <div key={entry.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group">
                <div className="flex flex-col">
                  <span className="text-gray-900 font-bold">{entry.date}</span>
                  {entry.timestamp && <span className="text-xs text-gray-400 font-medium">{formatTime(entry.timestamp)}</span>}
                </div>

                <div className="flex items-center gap-6">
                  {editingWeightId === entry.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={editingWeightValue}
                        onChange={(e) => setEditingWeightValue(e.target.value)}
                        className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-lg font-bold focus:border-blue-500 outline-none transition-all"
                      />
                      <button onClick={saveEditWeight} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">✓</button>
                      <button onClick={cancelEditWeight} className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="text-right flex flex-col items-end">
                        <span className="font-black text-xl text-gray-900">{entry.weight}<span className="text-xs font-medium text-gray-400 ml-1">kg</span></span>
                        {idx < weightHistory.length - 1 && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${entry.weight < weightHistory[idx + 1].weight ? 'bg-blue-50 text-blue-600' : entry.weight > weightHistory[idx + 1].weight ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                            {entry.weight < weightHistory[idx + 1].weight ? '↓' : entry.weight > weightHistory[idx + 1].weight ? '↑' : '='}{Math.abs(entry.weight - weightHistory[idx + 1].weight).toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditWeight(entry.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => confirmDelete('weight', entry.id, `${entry.weight} kg (${entry.date})`)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
