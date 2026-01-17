import React from 'react';
import { useTracker } from '../../../context/TrackerContext';

export const TrackerNavigation = () => {
  const { activeTab, setActiveTab } = useTracker();

  if (!['pasos', 'oura'].includes(activeTab)) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-4 shadow-sm">
      <div className="max-w-6xl mx-auto flex gap-1">
        {['pasos', 'oura'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-bold transition-all ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab === 'oura' ? '💍 Oura' : '👟 Pasos'}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="ml-auto text-gray-500 text-xs px-2"
        >
          ← Volver
        </button>
      </div>
    </nav>
  );
};
