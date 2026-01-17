import React from 'react';
import { useTracker } from '../../../context/TrackerContext';

export const TrackerHeader = () => {
  const {
    profile,
    weightHistory,
    saveStatus,
    supabase,
    forceSyncToCloud,
    handleLogout,
    dashboardDate,
    getMostRecentWeight,
    setOfflineMode,
    setShowAuth,
    isTrainingDay
  } = useTracker();

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-4 lg:py-5 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 flex items-center gap-4">
          <div className="relative">
            <svg viewBox="0 0 32 32" className="w-12 h-12 lg:w-14 lg:h-14 flex-shrink-0">
              <defs>
                <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#2563EB' }} />
                  <stop offset="100%" style={{ stopColor: '#0891B2' }} />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15" fill="#F8FAFC" stroke="url(#headerGrad)" strokeWidth="1.5" />
              <path d="M10 7 L10 21 L19 21 L19 18 L13 18 L13 7 Z" fill="url(#headerGrad)" />
              <path d="M18 7 L14 15 L17 15 L15 25 L23 14 L19 14 L22 7 Z" fill="url(#headerGrad)" opacity="0.9" />
            </svg>
            {isTrainingDay(dashboardDate) && (
              <div className="absolute -top-1 -right-1 bg-amber-400 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">🏋️</div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">LUKEN<span className="text-blue-600">FIT</span></h1>
            <p className="text-xs lg:text-sm font-bold text-slate-400 flex items-center gap-1.5">
              <span className="bg-slate-100 px-2 py-0.5 rounded-full">{getMostRecentWeight(weightHistory)?.weight || profile.currentWeight}kg</span>
              <span className="text-slate-300">→</span>
              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{profile.targetWeight}kg</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {saveStatus && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full animate-pulse border border-blue-100">{saveStatus}</span>
          )}

          {supabase.isAuthenticated ? (
            <div className="flex items-center gap-2">
              {!supabase.isOnline && (
                <span className="text-xs font-bold bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-100">📴 Offline</span>
              )}

              {supabase.isOnline && (
                <span className={`w-10 h-10 lg:w-11 lg:h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm border transition-all ${
                  supabase.syncStatus === 'syncing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  supabase.syncStatus === 'success' ? 'bg-green-50 text-green-600 border-green-100' :
                  supabase.syncStatus === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
                  'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  {supabase.syncStatus === 'syncing' ? (
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : supabase.syncStatus === 'success' ? '✓' : supabase.syncStatus === 'error' ? '⚠' : '☁️'}
                </span>
              )}

              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await forceSyncToCloud();
                }}
                className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-90"
                title="Forzar sincronización a la nube"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                }}
                className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-2xl bg-white hover:bg-red-50 border border-slate-100 text-slate-400 hover:text-red-600 transition-all shadow-sm active:scale-90"
                title="Cerrar sesión"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowAuth(true);
                setOfflineMode(false);
              }}
              className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-2xl border border-blue-100 shadow-sm transition-all active:scale-95"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
