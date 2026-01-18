import { Activity, Dumbbell, Moon, Pencil, RefreshCw, Target, Trophy, Zap } from 'lucide-react';
import { useTracker } from '../../context/TrackerContext';
import { useEffortAnalytics } from '../../hooks/useEffortAnalytics';
import { addDaysToDate, getArgentinaDateString, getMondayOfWeek } from '../../utils/dateUtils';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';
import { SwipeableItem } from '../UI/SwipeableItem';
import { EffortRadar } from '../Workouts/EffortRadar';

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
  workoutLog,
  workoutAnalysis,
  weightAnalytics,
  ouraLog,
  currentWeight,
  getWorkoutsForDate,
  // Actions
  confirmDelete,
  confirmWorkout
}) => {
  const workoutsForSelectedDate = getWorkoutsForDate(selectedWorkoutDate);
  const dailyOura = ouraLog.find(e => e.date === selectedWorkoutDate);

  // AES Intelligence Engine - Now date-aware!
  const effortAnalytics = useEffortAnalytics(workoutLog, ouraLog, weightAnalytics, selectedWorkoutDate);
  const { syncOuraData, isSyncing, syncStatus, handleEditWorkout } = useTracker();

  return (
    <div className="space-y-3 pb-24 lg:pb-8">
      {/* Weekly Summary - Bento Box Layout */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900">Resumen Semanal</h2>
            <button
              onClick={() => syncOuraData(true)}
              disabled={isSyncing}
              className={`p-1.5 rounded-lg transition-all ${isSyncing ? 'bg-blue-50 text-blue-500' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
              title="Sincronizar Oura Ring"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            {isSyncing && <span className="text-[10px] text-blue-500 font-medium animate-pulse">Sincronizando...</span>}
          </div>
          <span className="text-xs text-gray-500">desde {workoutAnalysis.weekStart}</span>
        </div>

        {/* Header with date navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrenos</h1>
          <p className="text-sm text-gray-500">Registro de actividad física</p>
        </div>
        <div className="w-full md:w-auto">
          <LukenFitDatePicker
            selectedDate={selectedWorkoutDate}
            onChange={setSelectedWorkoutDate}
            label="Fecha"
          />
        </div>
      </div>

        {/* Main Grid: AI Insight + Stats */}
        {/* Main Grid: AI Insight + Stats */}
        <div className="space-y-3">
          {/* AI Coach Insight Card - Full Width Row 1 */}
          <div className="w-full">
            <EffortRadar analytics={effortAnalytics} />
          </div>

          {/* Metrics Row 2 - Bento Grid */}
          <div className="grid grid-cols-2 gap-3">
             {/* Total Workouts Card - Big Block */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-center items-center">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-gray-900 font-bold">Total</h3>
              </div>
              <div className="text-3xl font-black text-gray-900 leading-none mb-1">
                {workoutAnalysis.gymCount + workoutAnalysis.tennisCount}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Entrenamientos</p>
            </div>

            {/* Duration Block */}
             <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4 border border-cyan-100 flex flex-col justify-center items-center">
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-xl">⏱️</span>
                 <h3 className="text-cyan-900 font-bold">Tiempo</h3>
               </div>
               <div className="text-3xl font-black text-cyan-700 leading-none mb-1">
                 {workoutAnalysis.totalDuration}'
               </div>
               <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">Minutos Totales</p>
             </div>
          </div>

          {/* Type Split Row 3 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div className="text-left">
                   <div className="text-lg font-bold text-gray-900 leading-none">{workoutAnalysis.gymCount}</div>
                   <div className="text-[10px] text-gray-400 font-bold uppercase">Gym</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <Target className="w-4 h-4" />
                </div>
                <div className="text-left">
                   <div className="text-lg font-bold text-gray-900 leading-none">{workoutAnalysis.tennisCount}</div>
                   <div className="text-[10px] text-gray-400 font-bold uppercase">Tenis</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Oura Recovery Metrics */}
        {dailyOura && (
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                      <Moon className="w-4 h-4" />
                   </div>
                   <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sueño</p>
                      <p className="text-xl font-bold text-gray-900">{dailyOura.sleepScore}</p>
                   </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${dailyOura.sleepScore >= 85 ? 'bg-green-500' : dailyOura.sleepScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} />
             </div>

             <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Zap className="w-4 h-4" />
                   </div>
                   <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Readiness</p>
                      <p className="text-xl font-bold text-gray-900">{dailyOura.readinessScore}</p>
                   </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${dailyOura.readinessScore >= 85 ? 'bg-green-500' : dailyOura.readinessScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} />
             </div>
          </div>
        )}
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

                      </div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{workout.name}</h3>
                    </div>
                    <div className="flex gap-2 items-center flex-shrink-0">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditWorkout(workout)}
                        className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors active:scale-90"
                        title="Editar entreno"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
