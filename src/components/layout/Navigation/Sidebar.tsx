import {
    Activity,
    Camera,
    Dumbbell,
    Home,
    Link,
    Scale,
    User,
    Users,
    Utensils,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Profile } from '../../../types/domain';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    profile: Profile;
    pendingRequestCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab,
    profile,
    pendingRequestCount = 0,
}) => {
    const { t } = useTranslation();
    const menuItems = [
        { id: 'dashboard', icon: Home, label: t('navigation.dashboard') },
        {
            id: 'comidas',
            icon: Utensils,
            label: t('navigation.meals'),
            tutorialId: 'diary-tab',
        },
        {
            id: 'entrenos',
            icon: Dumbbell,
            label: t('navigation.workouts'),
            tutorialId: 'workouts-tab',
        },
        {
            id: 'peso',
            icon: Scale,
            label: t('navigation.weight'),
            tutorialId: 'weight-tab',
        },
        { id: 'progreso', icon: Camera, label: t('navigation.progress') },
        {
            id: 'social',
            icon: Users,
            label: t('navigation.social'),
            tutorialId: 'social-tab',
        },
        { id: 'pasos', icon: Activity, label: t('navigation.steps') },
        { id: 'oura', icon: Link, label: 'Oura' },
        {
            id: 'config',
            icon: User,
            label: t('navigation.config'),
            tutorialId: 'config-tab',
        },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-border hidden lg:flex flex-col h-screen sticky top-0">
            <div className="p-6 flex items-center gap-3">
                <div className="relative">
                    <svg viewBox="0 0 32 32" className="w-10 h-10 flex-shrink-0">
                        <defs>
                            <linearGradient
                                id="sidebarGrad"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%">
                                <stop offset="0%" style={{ stopColor: '#2563EB' }} />
                                <stop
                                    offset="100%"
                                    style={{ stopColor: '#0891B2' }}
                                />
                            </linearGradient>
                        </defs>
                        <circle
                            cx="16"
                            cy="16"
                            r="15"
                            fill="#F8FAFC"
                            stroke="url(#sidebarGrad)"
                            strokeWidth="1.5"
                        />
                        <path
                            d="M10 7 L10 21 L19 21 L19 18 L13 18 L13 7 Z"
                            fill="url(#sidebarGrad)"
                        />
                        <path
                            d="M18 7 L14 15 L17 15 L15 25 L23 14 L19 14 L22 7 Z"
                            fill="url(#sidebarGrad)"
                            opacity="0.9"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-black text-text-primary tracking-tighter">
                    LUKEN<span className="text-blue-600">FIT</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const showBadge =
                        item.id === 'social' && pendingRequestCount > 0;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            data-tutorial={item.tutorialId}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600/10 to-cyan-500/10 text-blue-700 shadow-sm font-bold'
                                    : 'text-text-tertiary hover:bg-background hover:text-blue-600 hover:translate-x-1'
                            }`}>
                            <div className="relative">
                                <Icon
                                    size={20}
                                    className={`transition-colors ${
                                        isActive
                                            ? 'text-blue-600'
                                            : 'text-text-tertiary group-hover:text-text-secondary'
                                    }`}
                                />
                                {showBadge && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-[8px] font-black text-white">
                                            {pendingRequestCount > 9
                                                ? '9+'
                                                : pendingRequestCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-border">
                <div
                    onClick={() => setActiveTab('config')}
                    className="flex items-center gap-3 p-3 bg-background rounded-xl cursor-pointer hover:bg-surface-lighter transition-colors active:scale-95">
                    {profile?.avatar && profile.avatar.length > 4 ? (
                        <img
                            src={profile.avatar}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {profile?.avatar ||
                                profile?.name?.substring(0, 1).toUpperCase() ||
                                'U'}
                        </div>
                    )}
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-text-primary truncate">
                            {profile?.name || t('common.user')}
                        </p>
                        <p className="text-xs text-text-tertiary truncate">
                            LukenFit Member
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
