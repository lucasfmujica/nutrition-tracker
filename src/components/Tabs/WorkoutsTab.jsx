import { addDaysToDate, getArgentinaDateString, getMondayOfWeek } from '../../utils/dateUtils';
import { SwipeableItem } from '../ui/SwipeableItem';

/**
 * WorkoutsTab - Workout tracking and history
 * Displays weekly analysis, workout list, and weekly schedule
 */
export const WorkoutsTab = ({
  // Date management
  selectedWorkoutDate,
  setSelectedWorkoutDate,
  changeDate,
  // Data
  workoutAnalysis,
  getWorkoutsForDate,
  // Actions
  confirmDelete,
  confirmWorkout
}) => {
  const workoutsForSelectedDate = getWorkoutsForDate(selectedWorkoutDate);

  return (
    <div className="space-y-3">
      {/* Weekly Analysis */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-gray-900">Resumen Semanal</h2>
          <span className="text-xs text-gray-500">desde {workoutAnalysis.weekStart}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-amber-500">{workoutAnalysis.gymCount}</div>
            <div className="text-xs text-gray-500 font-medium">Gym</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-green-500">{workoutAnalysis.tennisCount}</div>
            <div className="text-xs text-gray-500 font-medium">Tenis</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-cyan-500">{workoutAnalysis.totalDuration}'</div>
            <div className="text-xs text-gray-500 font-medium">Min</div>
          </div>
        </div>
        <div className="space-y-0.5">
          {workoutAnalysis.analysis.map((line, i) => <p key={i} className="text-xs text-gray-300">{line}</p>)}
        </div>
      </div>

      {/* Header with date navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrenos</h1>
          <p className="text-sm text-gray-500">Registro de actividad física</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedWorkoutDate(changeDate(selectedWorkoutDate, -1))}
            className="w-10 h-10 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="date"
            value={selectedWorkoutDate}
            onChange={(e) => setSelectedWorkoutDate(e.target.value)}
            className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
          />
          <button
            onClick={() => setSelectedWorkoutDate(changeDate(selectedWorkoutDate, 1))}
            disabled={selectedWorkoutDate >= getArgentinaDateString()}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedWorkoutDate >= getArgentinaDateString() ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-400 hover:text-blue-500'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Swipe hint */}
      {workoutsForSelectedDate.length > 0 && (
        <p className="text-xs text-gray-400 text-center uppercase tracking-widest font-bold">← Desliza para eliminar</p>
      )}

      {/* Workout list */}
      {workoutsForSelectedDate.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💪</div>
          <h3 className="text-gray-900 font-bold text-lg mb-1">Sin entrenos registrados</h3>
          <p className="text-gray-500 text-sm">Registra tu actividad para hoy.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workoutsForSelectedDate.map(workout => {
            const needsReview = !workout.reviewed || (workout.confidence && workout.confidence < 0.7);
            return (
              <SwipeableItem
                key={workout.id}
                onDelete={() => confirmDelete('workout', workout.id, workout.name)}
              >
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden">
                  {/* Type Indicator */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${workout.type === 'gym' ? 'bg-amber-500' : 'bg-green-500'}`} />

                  <div className="flex justify-between items-start mb-2 pl-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${workout.type === 'gym' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                          {workout.type}
                        </span>
                        {needsReview && (
                          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">REVISAR</span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{workout.name}</h3>
                    </div>
                    {needsReview && (
                      <button onClick={() => confirmWorkout(workout.id)} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-90 transition-transform flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3 pl-2">
                    {workout.duration && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="text-blue-500">⏱️</span> {workout.duration} min
                      </span>
                    )}
                    {workout.volume && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="text-amber-500">📊</span> {workout.volume.toLocaleString()} kg
                      </span>
                    )}
                    {workout.calories && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="text-red-500">🔥</span> {workout.calories} kcal
                      </span>
                    )}
                  </div>

                  {workout.exercises?.length > 0 && (
                    <div className="space-y-2 border-t border-gray-50 pt-3 pl-2">
                      {workout.exercises.map((ex, idx) => (
                        <div key={idx} className="text-sm flex justify-between items-center group">
                          <span className="text-gray-700 font-medium truncate flex-1">{ex.name}</span>
                          <span className="text-gray-400 font-mono text-xs tabular-nums ml-4 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">{ex.sets}x{ex.reps} · {ex.weight}kg</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {workout.notes && (
                    <div className="mt-3 pl-2 pt-2 border-t border-gray-50">
                      <p className="text-sm text-blue-600 bg-blue-50/50 p-2 rounded-xl italic">
                        "{workout.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </SwipeableItem>
            );
          })}
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Plan Semanal</h3>
        <div className="grid grid-cols-7 gap-2 text-center">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => {
            const mondayOfWeek = getMondayOfWeek(getArgentinaDateString());
            const dayDate = addDaysToDate(mondayOfWeek, i);
            return (
              <button
                key={day}
                onClick={() => setSelectedWorkoutDate(dayDate)}
                className={`p-2 rounded-xl border transition-all hover:scale-105 cursor-pointer ${[0, 3, 5].includes(i) ? 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100' : i === 2 ? 'bg-green-50 border-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}
              >
                <div className="font-bold text-xs">{day}</div>
                <div className="text-[10px] font-bold mt-1 tracking-tighter">{[0, 3, 5].includes(i) ? 'GYM' : i === 2 ? 'TEN' : 'OFF'}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
