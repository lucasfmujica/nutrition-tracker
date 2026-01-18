import React, { useEffect, useState } from 'react';

const LOADING_MESSAGES = [
  'Sincronizando con tu anillo Oura...',
  'Calculando tu pronóstico de rendimiento...',
  'Ajustando metas para Buenos Aires...',
  'Preparando tu dashboard personalizado...',
  'Cargando datos de nutrición...',
];

export const LoadingScreen = ({ message = null }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    // Only rotate messages if no custom message provided
    if (message) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [message]);

  const displayMessage = message || LOADING_MESSAGES[currentMessageIndex];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="text-center px-6">
        {/* Logo/Branding */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl splash-logo splash-pulse font-bold tracking-tight">
            LukenFit
          </h1>
        </div>

        {/* Loading Bar */}
        <div className="w-64 mx-auto mb-6 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 splash-loading-bar rounded-full" />
        </div>

        {/* Dynamic Message */}
        <div className="text-gray-600 text-base md:text-lg font-medium animate-fade-in">
          {displayMessage}
        </div>
      </div>
    </div>
  );
};
