import gsap from 'gsap';
import {
    BarChart2,
    BookOpen,
    CalendarDays,
    Camera,
    Drumstick,
    Dumbbell,
    Footprints,
    Home,
    Image,
    Import,
    Moon,
    MoreHorizontal,
    Plus,
    Settings,
    Star,
    Users,
    Utensils,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../../context/TrackerContext';

// =====================================================
// BOTTOM NAVIGATION - PERFORMANCE LAB EDITION
// =====================================================

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    pendingRequestCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
    activeTab,
    setActiveTab,
    pendingRequestCount = 0,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const {
        setShowFoodForm,
        setShowWorkoutForm,
        setShowImportWorkoutModal,
        setShowTemplatesModal,
        newFood,
        setNewFood,
        newWorkout,
        setNewWorkout,
        dashboardDate,
        selectedFoodDate,
        selectedWorkoutDate,
        setShowFoodScanModal,
        setShowSuggestionModal,
    } = useTracker() as any;
    const { t } = useTranslation();

    useEffect(() => {
        if (isMenuOpen) {
            gsap.fromTo(
                menuRef.current,
                { y: 50, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power4.out' },
            );
        }
    }, [isMenuOpen]);

    useEffect(() => {
        if (isMoreMenuOpen) {
            gsap.fromTo(
                moreMenuRef.current,
                { y: 50, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power4.out' },
            );
        }
    }, [isMoreMenuOpen]);

    // Determine which date to use based on active tab
    const getContextualDate = () => {
        if (activeTab === 'comidas') return selectedFoodDate;
        if (activeTab === 'entrenos') return selectedWorkoutDate;
        return dashboardDate; // Default for dashboard, peso, progreso, social, etc.
    };

    const actions = [
        {
            icon: <Utensils size={22} />,
            label: t('navigation.meals').toUpperCase(),
            sublabel: t('modals.foods.manualEntry').toUpperCase(),
            onClick: () => {
                setNewFood({ ...newFood, date: getContextualDate() });
                setShowFoodForm(true);
            },
            color: 'text-accent-blue',
            bg: 'bg-accent-blue/10',
        },
        {
            icon: <Dumbbell size={22} />,
            label: t('navigation.workouts').toUpperCase(),
            sublabel: t('modals.foods.manualEntry').toUpperCase(),
            onClick: () => {
                setNewWorkout({ ...newWorkout, date: getContextualDate() });
                setShowWorkoutForm(true);
            },
            color: 'text-fat',
            bg: 'bg-fat/10',
        },
        {
            icon: <Star size={22} />,
            label: t('common.favorites')?.toUpperCase() || 'FAVORITOS',
            sublabel: 'TEMPLATES',
            onClick: () => setShowTemplatesModal(true),
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
        },
        {
            icon: <Drumstick size={20} />,
            label: t('common.scan')?.toUpperCase() || 'ESCANEAR',
            sublabel: 'VISION IA',
            onClick: () => setShowFoodScanModal(true),
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
        {
            icon: <Import size={20} />,
            label: t('workouts.importGravl').toUpperCase(),
            sublabel: 'GEMINI AI',
            onClick: () => setShowImportWorkoutModal(true),
            color: 'text-carbs',
            bg: 'bg-carbs/10',
        },
        {
            icon: <BookOpen size={20} />,
            label: 'AI CHEF',
            sublabel: 'SUGERENCIAS',
            onClick: () => setShowSuggestionModal(true),
            color: 'text-orange-400',
            bg: 'bg-orange-400/10',
        },
    ];

    const moreOptions = [
        {
            icon: <CalendarDays size={22} />,
            label: t('mealPrep.title').toUpperCase(),
            sublabel: t('mealPrep.subtitle').toUpperCase(),
            onClick: () => {
                setActiveTab('meal-prep');
                setIsMoreMenuOpen(false);
            },
            color: 'text-green-400',
            bg: 'bg-green-400/10',
        },
        {
            icon: <Footprints size={22} />,
            label: t('navigation.steps').toUpperCase(),
            sublabel: t('dashboard.activity.steps').toUpperCase(),
            onClick: () => {
                setActiveTab('pasos');
                setIsMoreMenuOpen(false);
            },
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10',
        },
        {
            icon: <Moon size={22} />,
            label: 'OURA',
            sublabel: 'SUEÑO & HRV',
            onClick: () => {
                setActiveTab('oura');
                setIsMoreMenuOpen(false);
            },
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
        },
        {
            icon: <Image size={22} />,
            label: t('navigation.progress').toUpperCase(),
            sublabel: 'FOTOS',
            onClick: () => {
                setActiveTab('progreso');
                setIsMoreMenuOpen(false);
            },
            color: 'text-pink-400',
            bg: 'bg-pink-400/10',
        },
        {
            icon: <Settings size={22} />,
            label: t('navigation.config').toUpperCase(),
            sublabel: t('config.title').toUpperCase(),
            onClick: () => {
                setActiveTab('config');
                setIsMoreMenuOpen(false);
            },
            color: 'text-text-tertiary',
            bg: 'bg-text-tertiary/10',
        },
    ];

    const tabs = [
        {
            id: 'dashboard',
            icon: Home,
            label: t('navigation.dashboard').toUpperCase(),
            tutorialId: 'dashboard-tab',
        },
        {
            id: 'comidas',
            icon: Utensils,
            label: t('navigation.meals').toUpperCase(),
            tutorialId: 'diary-tab',
        },
        {
            id: 'entrenos',
            icon: Dumbbell,
            label: t('navigation.workouts').toUpperCase(),
            tutorialId: 'workouts-tab',
        },
        {
            id: 'add',
            icon: Plus,
            label: '',
            isAction: true,
            tutorialId: 'fab-button',
        },
        {
            id: 'peso',
            icon: BarChart2,
            label: t('navigation.weight').toUpperCase(),
            tutorialId: 'weight-tab',
        },
        {
            id: 'more',
            icon: MoreHorizontal,
            label: t('navigation.more')?.toUpperCase() || 'MORE',
            isMore: true,
        },
        {
            id: 'social',
            icon: Users,
            label: t('navigation.social').toUpperCase(),
            tutorialId: 'social-tab',
        },
    ];

    return (
        <>
            {/* Action Menu Overlay */}
            {isMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-background/80 z-40 backdrop-blur-2xl transition-all duration-500"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div ref={menuRef} className="fixed inset-x-4 bottom-28 z-50">
                        <div className="glass rounded-[2.5rem] p-6 shadow-2xl border border-white/5 max-w-sm mx-auto overflow-hidden">
                            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                            <div className="flex flex-col gap-3 relative z-10">
                                {actions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            action.onClick();
                                            setIsMenuOpen(false);
                                        }}
                                        className="group flex items-center gap-4 p-4 rounded-2xl bg-background/50 hover:bg-surface-lighter/50 border border-border hover:border-border transition-all active:scale-95">
                                        <div
                                            className={`${action.bg} ${action.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            {action.icon}
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="text-sm font-satoshi text-text-primary font-black tracking-tight">
                                                {action.label}
                                            </div>
                                            <div className="text-[9px] text-text-tertiary font-black uppercase tracking-widest">
                                                {action.sublabel}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* More Menu Overlay */}
            {isMoreMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-background/80 z-40 backdrop-blur-2xl transition-all duration-500"
                        onClick={() => setIsMoreMenuOpen(false)}
                    />
                    <div
                        ref={moreMenuRef}
                        className="fixed inset-x-4 bottom-28 z-50">
                        <div className="glass rounded-[2.5rem] p-6 shadow-2xl border border-white/5 max-w-sm mx-auto overflow-hidden">
                            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                            <div className="flex flex-col gap-3 relative z-10">
                                {moreOptions.map((option, i) => (
                                    <button
                                        key={i}
                                        onClick={option.onClick}
                                        className="group flex items-center gap-4 p-4 rounded-2xl bg-background/50 hover:bg-surface-lighter/50 border border-border hover:border-border transition-all active:scale-95">
                                        <div
                                            className={`${option.bg} ${option.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            {option.icon}
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="text-sm font-satoshi text-text-primary font-black tracking-tight">
                                                {option.label}
                                            </div>
                                            <div className="text-[9px] text-text-tertiary font-black uppercase tracking-widest">
                                                {option.sublabel}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Main Navigation Island */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-50">
                <nav className="glass rounded-full px-6 h-14 flex items-center justify-between border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-visible">
                    <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none rounded-full" />

                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;

                        if (tab.isAction) {
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    data-tutorial={tab.tutorialId}
                                    aria-label="Open quick actions"
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 relative -top-7 z-20 shadow-2xl ${
                                        isMenuOpen
                                            ? 'bg-slate-900 text-white rotate-45 scale-110'
                                            : 'bg-primary text-white shadow-primary/40 hover:scale-110 hover:-translate-y-1'
                                    }`}>
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                                    <Plus
                                        size={28}
                                        strokeWidth={3}
                                        className="relative z-10"
                                    />

                                    {/* Glass reflection on button */}
                                    <div className="absolute top-1 left-2 right-2 h-1/2 bg-surface/10 rounded-t-full filter blur-[1px] pointer-events-none" />
                                </button>
                            );
                        }

                        if (tab.isMore) {
                            const isMoreActive = [
                                'meal-prep',
                                'pasos',
                                'oura',
                                'progreso',
                                'config',
                            ].includes(activeTab);
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() =>
                                        setIsMoreMenuOpen(!isMoreMenuOpen)
                                    }
                                    className={`flex flex-col items-center justify-center transition-[color,transform,opacity] duration-200 relative group min-w-[40px] h-full ${
                                        isMoreActive
                                            ? 'text-primary'
                                            : 'text-text-tertiary hover:text-text-secondary'
                                    }`}>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="relative">
                                            {tab.icon &&
                                                React.createElement(tab.icon, {
                                                    size: 20,
                                                    strokeWidth: isMoreActive
                                                        ? 2.5
                                                        : 2,
                                                    className: `transition-[color,transform,opacity] duration-200 ${isMoreActive ? '-translate-y-1 scale-110' : 'group-hover:scale-105'}`,
                                                })}
                                        </div>

                                        <div
                                            className={`flex flex-col items-center transition-[color,transform,opacity] duration-200 overflow-hidden ${
                                                isMoreActive
                                                    ? 'max-h-6 opacity-100 mt-1'
                                                    : 'max-h-0 opacity-0'
                                            }`}>
                                            <span className="w-1 h-1 bg-primary rounded-full mb-1 shadow-[0_0_8px_rgba(0,102,238,0.5)]" />
                                            <span className="text-[8px] font-black tracking-[0.05em] uppercase leading-none">
                                                {tab.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Hover background effect */}
                                    {!isMoreActive && (
                                        <span className="absolute inset-x-0 inset-y-2 bg-surface-lighter/0 group-hover:bg-surface-lighter/50 rounded-xl transition-colors duration-300 -z-0" />
                                    )}
                                </button>
                            );
                        }

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as string)}
                                data-tutorial={tab.tutorialId}
                                className={`flex flex-col items-center justify-center transition-[color,transform,opacity] duration-200 relative group min-w-[40px] h-full ${
                                    isActive
                                        ? 'text-primary'
                                        : 'text-text-tertiary hover:text-text-secondary'
                                }`}>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="relative">
                                        {tab.icon &&
                                            React.createElement(tab.icon, {
                                                size: 20,
                                                strokeWidth: isActive ? 2.5 : 2,
                                                className: `transition-[color,transform,opacity] duration-200 ${isActive ? '-translate-y-1 scale-110' : 'group-hover:scale-105'}`,
                                            })}

                                        {/* Notification Badge for Social Tab */}
                                        {tab.id === 'social' &&
                                            pendingRequestCount > 0 && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                                    <span className="text-[8px] font-black text-white">
                                                        {pendingRequestCount > 9
                                                            ? '9+'
                                                            : pendingRequestCount}
                                                    </span>
                                                </div>
                                            )}
                                    </div>

                                    <div
                                        className={`flex flex-col items-center transition-[color,transform,opacity] duration-200 overflow-hidden ${
                                            isActive
                                                ? 'max-h-6 opacity-100 mt-1'
                                                : 'max-h-0 opacity-0'
                                        }`}>
                                        <span className="w-1 h-1 bg-primary rounded-full mb-1 shadow-[0_0_8px_rgba(0,102,238,0.5)]" />
                                        <span className="text-[8px] font-black tracking-[0.05em] uppercase leading-none">
                                            {tab.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Hover background effect */}
                                {!isActive && (
                                    <span className="absolute inset-x-0 inset-y-2 bg-surface-lighter/0 group-hover:bg-surface-lighter/50 rounded-xl transition-colors duration-300 -z-0" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
};
