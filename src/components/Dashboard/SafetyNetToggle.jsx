import { Shield } from 'lucide-react';
import React from 'react';

/**
 * SafetyNetToggle - Premium toggle for Modo Escudo (Safety Net)
 *
 * Design:
 * - Shield icon for protective feeling
 * - Blue gradient when active (trust, calm)
 * - Glassmorphism aesthetic
 * - Mobile-first (44x44px touch target)
 *
 * @param {boolean} isActive - Safety net activation status
 * @param {Function} onToggle - Toggle handler
 * @param {string} statusMessage - Optional status message
 */
export const SafetyNetToggle = ({ isActive, onToggle, statusMessage }) => {
  return (
    <button
      onClick={onToggle}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-xl
        transition-all duration-300 ease-out
        min-h-[44px] min-w-[44px]
        ${isActive
          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200/50'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 shadow-sm'
        }
      `}
      title={isActive ? 'Desactivar Modo Escudo' : 'Activar Modo Escudo'}
    >
      {/* Shield Icon */}
      <Shield
        className={`
          w-5 h-5 transition-all duration-300
          ${isActive ? 'text-white' : 'text-gray-400'}
        `}
        fill={isActive ? 'currentColor' : 'none'}
      />

      {/* Label (hidden on mobile) */}
      <div className="hidden sm:flex flex-col items-start">
        <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>
          Modo Escudo
        </span>
        <span className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
          {isActive ? 'Mantenimiento' : 'Desactivado'}
        </span>
      </div>

      {/* Active Glow Effect */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-400 opacity-20 blur-md -z-10 animate-pulse" />
      )}
    </button>
  );
};
