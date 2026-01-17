import React from 'react';
import { BottomNav } from './BottomNav';

export const Layout = ({ children, activeTab, setActiveTab, showNav = true }) => {
  return (
    <div className="min-h-screen bg-background text-gray-900 font-sans pb-safe">
      {/* Main Content Area */}
      <main className="max-w-md mx-auto min-h-screen relative">
        {children}
      </main>

      {/* Floating Bottom Navigation */}
      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      )}
    </div>
  );
};
