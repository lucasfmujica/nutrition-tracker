import { Camera, Dumbbell, Import, Plus, Star, Utensils } from 'lucide-react';
import { useState } from 'react';

// =====================================================
// FLOATING ACTION BUTTON COMPONENT
// =====================================================
export const FloatingActionButton = ({ onAddFood, onAddWorkout, onImportFood, onImportWorkout, onQuickAdd, onScanFood }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: <Utensils size={24} />, label: 'Comida', sublabel: 'Agregar manual', onClick: onAddFood, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { icon: <Dumbbell size={24} />, label: 'Entreno', sublabel: 'Agregar manual', onClick: onAddWorkout, color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: <Star size={24} />, label: 'Favoritos', sublabel: 'Plantillas rápidas', onClick: onQuickAdd, color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: <Camera size={20} />, label: 'Escanear', sublabel: 'Foto con IA', onClick: onScanFood, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: <Import size={20} />, label: 'IA Work', sublabel: 'Importar JSON', onClick: onImportWorkout, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 transition-all duration-300 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Menu */}
      <div
        className={`fixed inset-x-4 bottom-28 z-50 transition-all duration-300 transform ${
          isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-gray-100 max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-4">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => { action.onClick(); setIsOpen(false); }}
                className={`${i === 4 ? 'col-span-2' : ''} group flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-all active:scale-95`}
              >
                <div className={`${action.bg} ${action.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">{action.label}</div>
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{action.sublabel}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-6 bottom-24 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-2xl shadow-blue-500/40 transition-all duration-300 active:scale-90 ${
          isOpen ? 'rotate-45 bg-slate-800 from-slate-800 to-slate-900' : 'scale-100'
        }`}
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>
    </>
  );
};
