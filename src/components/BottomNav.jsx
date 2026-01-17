import React from 'react';

// =====================================================
// BOTTOM NAVIGATION COMPONENT
// =====================================================
export const BottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Home' },
    { id: 'comidas', icon: '🍽️', label: 'Comidas' },
    { id: 'entrenos', icon: '🏋️', label: 'Entrenos' },
    { id: 'peso', icon: '⚖️', label: 'Peso' },
    { id: 'config', icon: '⚙️', label: 'Config' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 bottom-nav z-40">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400'
                : 'text-gray-400 active:text-gray-200'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
