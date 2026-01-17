import React from 'react';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

export const Layout = ({ children, activeTab, setActiveTab, profile, showNav = true }) => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex text-base lg:text-sm">
      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative w-full">
        <main className="flex-1 w-full max-w-7xl mx-auto pb-24 lg:pb-8">
          {children}
        </main>

        {/* Floating Bottom Navigation (Mobile Only) */}
        {showNav && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            <div className="max-w-md mx-auto pointer-events-auto">
              <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
