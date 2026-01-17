import { Activity, Dumbbell, Home, Link, Scale, Settings, Utensils } from 'lucide-react';
import React from 'react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'comidas', icon: Utensils, label: 'Comidas' },
    { id: 'entrenos', icon: Dumbbell, label: 'Entrenos' },
    { id: 'peso', icon: Scale, label: 'Peso' },
    { id: 'pasos', icon: Activity, label: 'Pasos' },
    { id: 'oura', icon: Link, label: 'Oura' }, // Using Link icon for "Connected Apps" vibe or similar
    { id: 'config', icon: Settings, label: 'Config' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          LukenFit
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                size={20}
                className={`transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-50">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                LM
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">Lucas Mujica</p>
                <p className="text-xs text-gray-500 truncate">Premium Member</p>
            </div>
        </div>
      </div>
    </aside>
  );
};
