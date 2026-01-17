/**
 * OuraTab - Oura Ring data entry and history
 * Displays Oura data entry form, history, and insights
 */
export const OuraTab = ({
  newOuraEntry,
  setNewOuraEntry,
  addOuraEntry,
  ouraLog
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-2 px-1 text-center md:text-left">
        <h1 className="text-2xl font-bold text-gray-900">Oura</h1>
        <p className="text-sm text-gray-500">Sincronización de sueño y recuperación</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">💍</span>
          REGISTRAR DATOS OURA
        </h2>
        <div className="space-y-4">
          <input
            type="date"
            value={newOuraEntry.date}
            onChange={(e) => setNewOuraEntry({ ...newOuraEntry, date: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
          />

          {/* Scores - 2 cols on mobile, 3 on larger */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Sleep</label>
              <input
                type="number"
                value={newOuraEntry.sleepScore}
                onChange={(e) => setNewOuraEntry({ ...newOuraEntry, sleepScore: e.target.value })}
                placeholder="85"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Ready</label>
              <input
                type="number"
                value={newOuraEntry.readinessScore}
                onChange={(e) => setNewOuraEntry({ ...newOuraEntry, readinessScore: e.target.value })}
                placeholder="80"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Activity</label>
              <input
                type="number"
                value={newOuraEntry.activityScore}
                onChange={(e) => setNewOuraEntry({ ...newOuraEntry, activityScore: e.target.value })}
                placeholder="75"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">HRV</label>
              <input
                type="number"
                value={newOuraEntry.hrv}
                onChange={(e) => setNewOuraEntry({ ...newOuraEntry, hrv: e.target.value })}
                placeholder="45"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">RHR</label>
              <input
                type="number"
                value={newOuraEntry.restingHr}
                onChange={(e) => setNewOuraEntry({ ...newOuraEntry, restingHr: e.target.value })}
                placeholder="58"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Horas</label>
              <input
                type="number"
                step="0.1"
                value={newOuraEntry.sleepHours}
                onChange={(e) => setNewOuraEntry({ ...newOuraEntry, sleepHours: e.target.value })}
                placeholder="7.5"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Sleep details - compact 2x2 grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Deep</label>
              <input
                type="number"
                value={newOuraEntry.deepSleepMins}
                onChange={(e) => setNewOuraEntry({ ...newOuraEntry, deepSleepMins: e.target.value })}
                placeholder="90"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">REM</label>
              <input
                type="number"
                value={newOuraEntry.remSleepMins}
                onChange={(e) => setNewOuraEntry({ ...newOuraEntry, remSleepMins: e.target.value })}
                placeholder="100"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Acostarse</label>
              <input
                type="time"
                value={newOuraEntry.bedtime}
                onChange={(e) => setNewOuraEntry({ ...newOuraEntry, bedtime: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Despertar</label>
              <input
                type="time"
                value={newOuraEntry.wakeTime}
                onChange={(e) => setNewOuraEntry({ ...newOuraEntry, wakeTime: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            onClick={addOuraEntry}
            className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-purple-500/30 transition-all"
          >
            Guardar Datos
          </button>
        </div>
      </div>

      {/* Oura History - Compact */}
      {ouraLog.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">📊</span>
            HISTORIAL
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {ouraLog.slice(0, 14).map((entry, idx) => (
              <div key={idx} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-900 text-sm font-bold">{entry.date}</span>
                  <div className="flex gap-1.5 text-xs">
                    {entry.sleepScore && <span className="text-purple-600 font-bold">😴{entry.sleepScore}</span>}
                    {entry.readinessScore && <span className="text-blue-600 font-bold">⚡{entry.readinessScore}</span>}
                    {entry.activityScore && <span className="text-amber-600 font-bold">🏃{entry.activityScore}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-gray-500 font-medium">
                  {entry.hrv && <span>HRV: <span className="text-gray-900">{entry.hrv}</span></span>}
                  {entry.restingHr && <span>RHR: <span className="text-gray-900">{entry.restingHr}</span></span>}
                  {entry.sleepHours && <span>Horas: <span className="text-gray-900">{entry.sleepHours}h</span></span>}
                  {entry.bedtime && entry.wakeTime && <span>{entry.bedtime} → {entry.wakeTime}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Oura Insights - Compact */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-purple-700 mb-2 uppercase tracking-wider">💡 Guía Rápida</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-purple-600 font-medium">
          <span>😴 Sleep ≥85 = óptimo</span>
          <span>⚡ Ready &lt;70 = descanso</span>
          <span>❤️ HRV = recuperación</span>
        </div>
      </div>
    </div>
  );
};
