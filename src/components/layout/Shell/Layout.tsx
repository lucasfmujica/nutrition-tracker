import React from 'react';
import { Profile } from '../../../types/domain';
import { BottomNav } from '../Navigation/BottomNav';
import { Sidebar } from '../Navigation/Sidebar';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    profile: Profile;
    showNav?: boolean;
    pendingRequestCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    activeTab,
    setActiveTab,
    profile,
    showNav = true,
    pendingRequestCount = 0,
}) => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex text-base lg:text-sm">
            {/* Desktop Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                profile={profile}
                pendingRequestCount={pendingRequestCount}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen relative w-full">
                <main className="flex-1 w-full pb-24 lg:pb-8">{children}</main>

                {/* Floating Bottom Navigation (Mobile Only) */}
                {showNav && (
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                        <div className="max-w-md mx-auto pointer-events-auto">
                            <BottomNav
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                pendingRequestCount={pendingRequestCount}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
