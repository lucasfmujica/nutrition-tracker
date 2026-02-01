import gsap from 'gsap';
import {
    BarChart2,
    BookOpen,
    Camera,
    Dumbbell,
    Footprints,
    Home,
    Image,
    Import,
    MoreHorizontal,
    Moon,
    Plus,
    Settings,
    Star,
    Users,
    Utensils,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTracker } from '../../../context/TrackerContext';

// =====================================================
// BOTTOM NAVIGATION - PERFORMANCE LAB EDITION
// =====================================================

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    pendingRequestCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, pendingRequestCount = 0 }) => {
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
    } = useTracker() as any;

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
            label: 'COMIDA',
            sublabel: 'MANUAL',
            onClick: () => {
                setNewFood({ ...newFood, date: getContextualDate() });
                setShowFoodForm(true);
            },
            color: 'text-accent-blue',
            bg: 'bg-accent-blue/10',
        },
        {
            icon: <Dumbbell size={22} />,
            label: 'ENTRENO',
            sublabel: 'MANUAL',
            onClick: () => {
                setNewWorkout({ ...newWorkout, date: getContextualDate() });
                setShowWorkoutForm(true);
            },
            color: 'text-fat',
            bg: 'bg-fat/10',
        },
        {
            icon: <Star size={22} />,
            label: 'FAVORITOS',
            sublabel: 'TEMPLATES',
            onClick: () => setShowTemplatesModal(true),
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
        },
        {
            icon: <Camera size={20} />,
            label: 'ESCANEAR',
            sublabel: 'VISION IA',
            onClick: () => setShowFoodScanModal(true),
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
        {
            icon: <Import size={20} />,
            label: 'IMP. GRAVL',
            sublabel: 'GEMINI AI',
            onClick: () => setShowImportWorkoutModal(true),
            color: 'text-carbs',
            bg: 'bg-carbs/10',
        },
    ];

    const moreOptions = [
        {
            icon: <Footprints size={22} />,
            label: 'PASOS',
            sublabel: 'ACTIVIDAD',
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
            label: 'PROGRESO',
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
            label: 'AJUSTES',
            sublabel: 'CONFIGURACIÓN',
            onClick: () => {
                setActiveTab('config');
                setIsMoreMenuOpen(false);
            },
            color: 'text-slate-400',
            bg: 'bg-slate-400/10',
        },
    ];

    const tabs = [
        { id: 'dashboard', icon: Home, label: 'LAB', tutorialId: 'dashboard-tab' },
        { id: 'comidas', icon: BookOpen, label: 'FUEL', tutorialId: 'diary-tab' },
        { id: 'entrenos', icon: Dumbbell, label: 'TRAIN', tutorialId: 'workouts-tab' },
        { id: 'add', icon: Plus, label: '', isAction: true, tutorialId: 'fab-button' },
        { id: 'peso', icon: BarChart2, label: 'WEIGHT', tutorialId: 'weight-tab' },
        { id: 'more', icon: MoreHorizontal, label: 'MORE', isMore: true },
        { id: 'social', icon: Users, label: 'CREW', tutorialId: 'social-tab' },
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
                                        className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-100/50 border border-slate-100 hover:border-slate-200 transition-all active:scale-95">
                                        <div
                                            className={`${action.bg} ${action.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            {action.icon}
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="text-sm font-satoshi text-slate-900 font-black tracking-tight">
                                                {action.label}
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
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
                    <div ref={moreMenuRef} className="fixed inset-x-4 bottom-28 z-50">
                        <div className="glass rounded-[2.5rem] p-6 shadow-2xl border border-white/5 max-w-sm mx-auto overflow-hidden">
                            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                            <div className="flex flex-col gap-3 relative z-10">
                                {moreOptions.map((option, i) => (
                                    <button
                                        key={i}
                                        onClick={option.onClick}
                                        className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-100/50 border border-slate-100 hover:border-slate-200 transition-all active:scale-95">
                                        <div
                                            className={`${option.bg} ${option.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            {option.icon}
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="text-sm font-satoshi text-slate-900 font-black tracking-tight">
                                                {option.label}
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
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
                                    <div className="absolute top-1 left-2 right-2 h-1/2 bg-white/10 rounded-t-full filter blur-[1px] pointer-events-none" />
                                </button>
                            );
                        }

                        if (tab.isMore) {
                            const isMoreActive = ['pasos', 'oura', 'progreso', 'config'].includes(activeTab);
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                    className={`flex flex-col items-center justify-center transition-all duration-300 relative group min-w-[40px] h-full ${
                                        isMoreActive
                                            ? 'text-primary'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="relative">
                                            {tab.icon &&
                                                React.createElement(tab.icon, {
                                                    size: 20,
                                                    strokeWidth: isMoreActive ? 2.5 : 2,
                                                    className: `transition-all duration-300 ${isMoreActive ? '-translate-y-1 scale-110' : 'group-hover:scale-105'}`,
                                                })}
                                        </div>

                                        <div
                                            className={`flex flex-col items-center transition-all duration-300 overflow-hidden ${
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
                                        <span className="absolute inset-x-0 inset-y-2 bg-slate-100/0 group-hover:bg-slate-100/50 rounded-xl transition-colors duration-300 -z-0" />
                                    )}
                                </button>
                            );
                        }

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as string)}
                                data-tutorial={tab.tutorialId}
                                className={`flex flex-col items-center justify-center transition-all duration-300 relative group min-w-[40px] h-full ${
                                    isActive
                                        ? 'text-primary'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="relative">
                                        {tab.icon &&
                                            React.createElement(tab.icon, {
                                                size: 20,
                                                strokeWidth: isActive ? 2.5 : 2,
                                                className: `transition-all duration-300 ${isActive ? '-translate-y-1 scale-110' : 'group-hover:scale-105'}`,
                                            })}

                                        {/* Notification Badge for Social Tab */}
                                        {tab.id === 'social' && pendingRequestCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                                <span className="text-[8px] font-black text-white">
                                                    {pendingRequestCount > 9 ? '9+' : pendingRequestCount}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={`flex flex-col items-center transition-all duration-300 overflow-hidden ${
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
                                    <span className="absolute inset-x-0 inset-y-2 bg-slate-100/0 group-hover:bg-slate-100/50 rounded-xl transition-colors duration-300 -z-0" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
};
