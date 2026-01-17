import { BarChart2, BookOpen, Home, PlusCircle, User } from 'lucide-react';
import React from 'react';

export const BottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Diario' },
    { id: 'diary', icon: BookOpen, label: 'Alimentos' },
    { id: 'add', icon: PlusCircle, label: '', isFab: true },
    { id: 'reports', icon: BarChart2, label: 'Progreso' },
    { id: 'profile', icon: User, label: 'Perfil' }
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[env(safe-area-inset-bottom)] px-4">
      <div className="flex justify-between items-end h-16 max-w-md mx-auto relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.isFab) {
             return (
               <div key={tab.id} className="relative -top-5">
                 <button
                   onClick={() => setActiveTab('dashboard')} // Usually opens a menu, keeping simple for now
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
              className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors duration-200 ${
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
