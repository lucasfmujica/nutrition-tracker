/**
 * MigrationModal - Cloud migration prompt
 * Shows when local data is found and user needs to decide on sync
 */
export const MigrationModal = ({
  isOpen,
  data,
  onMigrate,
  onSkip,
  isMigrating
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-blue-200 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">☁️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Datos locales encontrados</h3>
          <p className="text-gray-600 text-sm">
            Tienes datos guardados en este dispositivo. ¿Quieres sincronizarlos con tu cuenta?
          </p>
        </div>

        {/* Summary of data to migrate */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm border border-blue-100">
          <div className="grid grid-cols-2 gap-2 text-gray-700 font-medium">
            {data.weightHistory?.length > 0 && (
              <div>📊 {data.weightHistory.length} registros de peso</div>
            )}
            {data.foodLog?.length > 0 && (
              <div>🍽️ {data.foodLog.length} comidas</div>
            )}
            {data.workouts?.length > 0 && (
              <div>🏋️ {data.workouts.length} entrenos</div>
            )}
            {data.stepsLog?.length > 0 && (
              <div>👟 {data.stepsLog.length} días de pasos</div>
            )}
            {data.ouraLog?.length > 0 && (
              <div>💍 {data.ouraLog.length} registros Oura</div>
            )}
            {data.profile && (
              <div>👤 Perfil y objetivos</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onMigrate}
            disabled={isMigrating}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50"
          >
            {isMigrating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Migrando datos...
              </span>
            ) : (
              'Sí, sincronizar todo'
            )}
          </button>

          <button
            onClick={onSkip}
            disabled={isMigrating}
            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            No, empezar de cero
          </button>

          <p className="text-xs text-gray-600 text-center font-medium">
            Si eliges "empezar de cero", los datos locales se mantendrán pero no se sincronizarán.
          </p>
        </div>
      </div>
    </div>
  );
};
