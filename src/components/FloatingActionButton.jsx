import { useState } from 'react';

// =====================================================
// FLOATING ACTION BUTTON COMPONENT
// =====================================================
export const FloatingActionButton = ({ onAddFood, onAddWorkout, onImportFood, onImportWorkout, onQuickAdd }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: '⭐', label: 'Favoritos', onClick: onQuickAdd, color: 'bg-purple-500' },
    { icon: '📸', label: 'Importar Comida', onClick: onImportFood, color: 'bg-blue-500' },
    { icon: '🏋️', label: 'Importar Entreno', onClick: onImportWorkout, color: 'bg-amber-500' },
    { icon: '🍽️', label: 'Agregar Comida', onClick: onAddFood, color: 'bg-cyan-500' },
    { icon: '💪', label: 'Agregar Entreno', onClick: onAddWorkout, color: 'bg-orange-500' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Menu - only render when open */}
      {isOpen && (
        <div className="fixed right-4 bottom-40 z-50 flex flex-col items-end gap-2">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); setIsOpen(false); }}
              className={`flex items-center gap-2 ${action.color} hover:brightness-110 text-white px-4 py-3 rounded-full whitespace-nowrap shadow-lg animate-fade-in`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="text-lg">{action.icon}</span>
              <span className="text-sm font-semibold">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB - minimal footprint */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-4 bottom-24 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all duration-300 ${isOpen ? 'rotate-45 scale-90' : 'scale-100'}`}
      >
        <span className="text-3xl font-light leading-none">+</span>
      </button>
    </>
  );
};
