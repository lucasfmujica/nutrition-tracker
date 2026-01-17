import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { addDaysToDate, getArgentinaDateString } from '../../utils/dateUtils';
import { OuraBentoGrid } from '../Oura/OuraBentoGrid';

/**
 * OuraTab - Automated Oura Ring Dashboard
 * Displays read-only synchronized data via OuraBentoGrid
 */
export const OuraTab = ({
  // Props kept for compatibility if passed from parent, but mostly unused now
  ouraLog = []
}) => {
  // Get data for selected date
  const { syncOuraData, isSyncing, syncStatus, getStepsForDate } = useTracker();
  const [selectedDate, setSelectedDate] = useState(getArgentinaDateString());
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const dailyOuraData = ouraLog.find(e => e.date === selectedDate);
  const steps = getStepsForDate(selectedDate);

  // Merge steps into data passed to BentoGrid
  const dailyData = dailyOuraData ? { ...dailyOuraData, steps } : null;

  useEffect(() => {
    const rawTime = localStorage.getItem('oura_last_sync');
    if (rawTime) {
      const date = new Date(parseInt(rawTime));
      setLastSyncTime(date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [syncStatus]); // Update timestamp when sync finishes

  const handleDateChange = (days) => {
     setSelectedDate(prev => addDaysToDate(prev, days));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="px-1 text-center md:text-left">
           <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center md:justify-start">
             Oura Ring
             <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider">Sync V2</span>
           </h1>
           <p className="text-sm text-gray-500">Recuperación y métricas de sueño</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm mx-auto md:mx-0">
           {/* Date Nav */}
           <div className="flex items-center bg-gray-50 rounded-lg">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm font-bold text-gray-700 w-24 text-center">{selectedDate}</span>
              </div>
              <button
                onClick={() => handleDateChange(1)}
                className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                disabled={selectedDate >= getArgentinaDateString()}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
           </div>

           <div className="w-px h-8 bg-gray-100 mx-1" />

           {/* Sync Button */}
           <div className="flex items-center gap-2 pr-2">
              <div className="text-right hidden sm:block">
                 <p className="text-[10px] mobile-label text-gray-400 font-bold uppercase tracking-wider">Última sinc.</p>
                 <p className="text-xs font-bold text-gray-700">{lastSyncTime || '--:--'}</p>
              </div>
              <button
                onClick={() => syncOuraData(true)}
                disabled={isSyncing}
                className={`p-2 rounded-lg transition-all ${isSyncing ? 'bg-purple-50 text-purple-500' : 'bg-gray-50 text-gray-500 hover:bg-purple-50 hover:text-purple-600'}`}
                title="Sincronizar ahora"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <OuraBentoGrid data={dailyData} />

      {/* Sync Status Feedback */}
      {isSyncing && (
         <div className="text-center text-xs text-purple-500 font-medium animate-pulse">
            Sincronizando con Oura Cloud...
         </div>
      )}
    </div>
  );
};
