import React from 'react';

export const LoadingScreen = ({ message = "Cargando..." }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
          <span className="text-2xl">💪</span>
        </div>
        <div className="text-blue-400 text-lg">{message}</div>
      </div>
    </div>
  );
};
