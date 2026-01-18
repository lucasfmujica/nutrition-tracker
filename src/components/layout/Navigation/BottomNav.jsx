import { Activity, BarChart2, BookOpen, Dumbbell, Footprints, Home, Moon, PlusCircle } from 'lucide-react';
import React from 'react';

export const BottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Diario' },
    { id: 'comidas', icon: BookOpen, label: 'Comidas' },
    { id: 'entrenos', icon: Dumbbell, label: 'Entrenos' },
    { id: 'add', icon: PlusCircle, label: '', isFab: true },
    { id: 'peso', icon: BarChart2, label: 'Peso' },
    { id: 'peso', icon: BarChart2, label: 'Peso' },
    { id: 'pasos', icon: Footprints, label: 'Pasos' },
    { id: 'oura', icon: Moon, label: 'Oura' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex items-center h-auto min-h-[64px] py-1 max-w-md mx-auto overflow-x-auto no-scrollbar px-2 md:justify-around text-[10px] md:text-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.isFab) {
             return (
               <div key={tab.id} className="relative -top-6 mx-2 flex-shrink-0">
                 <button
                   onClick={() => setActiveTab('dashboard')}
                   className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all duration-200"
                 >
                   <PlusCircle size={28} strokeWidth={2.5} />
                 </button>
               </div>
             );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex flex-col items-center justify-center py-2 min-w-[64px] transition-colors duration-200 ${
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon
                size={isActive ? 24 : 22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-200 ${isActive ? '-translate-y-1' : ''}`}
              />
              <span className={`text-[10px] font-medium mt-1 transition-all ${
                isActive ? 'opacity-100 font-semibold' : 'opacity-80'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
