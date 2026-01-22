import {
    BarChart2,
    BookOpen,
    Camera,
    Dumbbell,
    Footprints,
    Home,
    Import,
    Moon,
    PlusCircle,
    Star,
    Utensils,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTracker } from '../../../context/TrackerContext';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        setShowFoodScanModal,
    } = useTracker() as any;

    const actions = [
        {
            icon: <Utensils size={24} />,
            label: 'Comida',
            sublabel: 'Agregar manual',
            onClick: () => {
                setNewFood({ ...newFood, date: dashboardDate });
                setShowFoodForm(true);
            },
            color: 'text-cyan-500',
            bg: 'bg-cyan-50',
        },
        {
            icon: <Dumbbell size={24} />,
            label: 'Entreno',
            sublabel: 'Agregar manual',
            onClick: () => {
                setNewWorkout({ ...newWorkout, date: dashboardDate });
                setShowWorkoutForm(true);
            },
            color: 'text-orange-500',
            bg: 'bg-orange-50',
        },
        {
            icon: <Star size={24} />,
            label: 'Favoritos',
            sublabel: 'Plantillas rápidas',
            onClick: () => setShowTemplatesModal(true),
            color: 'text-purple-500',
            bg: 'bg-purple-50',
        },
        {
            icon: <Camera size={20} />,
            label: 'Escanear',
            sublabel: 'Alimentos',
            onClick: () => setShowFoodScanModal(true),
            color: 'text-blue-500',
            bg: 'bg-blue-50',
        },
        {
            icon: <Import size={20} />,
            label: 'Imp. Gravl',
            sublabel: 'Gemini AI',
            onClick: () => setShowImportWorkoutModal(true),
            color: 'text-amber-500',
            bg: 'bg-amber-50',
        },
    ];

    const handleAction = (action: any) => {
        action.onClick();
        setIsMenuOpen(false);
    };

    const tabs = [
        { id: 'dashboard', icon: Home, label: 'Diario' },
        { id: 'comidas', icon: BookOpen, label: 'Comidas' },
        { id: 'entrenos', icon: Dumbbell, label: 'Entrenos' },
        { id: 'add', icon: PlusCircle, label: '', isAction: true },
        { id: 'peso', icon: BarChart2, label: 'Peso' },
        { id: 'pasos', icon: Footprints, label: 'Pasos' },
        { id: 'oura', icon: Moon, label: 'Oura' },
    ];

    return (
        <>
            {/* Menu Overlay */}
            {isMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-slate-900/60 z-40 transition-all duration-300 backdrop-blur-md"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="fixed inset-x-4 bottom-24 z-50 animate-slide-up">
                        <div className="bg-white rounded-[2rem] p-5 shadow-2xl border border-gray-100 max-w-sm mx-auto">
                            <div className="grid grid-cols-1 gap-3">
                                {actions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAction(action)}
                                        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-100 transition-all active:scale-95 border border-transparent">
                                        <div
                                            className={`${action.bg} ${action.color} w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                                            {action.icon}
                                        </div>
                                        <div className="text-left min-w-0 flex-1">
                                            <div className="text-sm font-bold text-gray-900 truncate">
                                                {action.label}
                                            </div>
                                            <div className="text-xs text-gray-500 font-medium truncate">
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

            {/* Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[env(safe-area-inset-bottom)] z-50">
                <div className="flex items-center justify-between h-auto min-h-[64px] py-1 max-w-md mx-auto px-2 xs:px-6 md:justify-around text-[10px] md:text-xs">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;

                        if (tab.isAction) {
                            return (
                                <div
                                    key={tab.id}
                                    className="relative -top-6 flex-shrink-0 z-10">
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 ring-4 ring-white ${
                                            isMenuOpen
                                                ? 'bg-slate-800 rotate-45 scale-105 shadow-slate-800/40'
                                                : 'bg-gradient-to-tr from-blue-600 to-cyan-500 hover:scale-110 hover:-translate-y-1 hover:shadow-blue-500/50 hover:shadow-2xl active:scale-95 shadow-blue-500/30'
                                        }`}>
                                        <PlusCircle size={28} strokeWidth={2.5} />
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as string);
                                    setIsMenuOpen(false);
                                }}
                                className={`flex-shrink-0 flex flex-col items-center justify-center py-2 min-w-[48px] xs:min-w-[64px] transition-colors duration-200 ${
                                    isActive
                                        ? 'text-blue-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}>
                                {tab.icon &&
                                    React.createElement(tab.icon, {
                                        size: isActive ? 24 : 22,
                                        strokeWidth: isActive ? 2.5 : 2,
                                        className: `transition-all duration-200 ${isActive ? '-translate-y-1' : ''}`,
                                    })}
                                <span
                                    className={`text-[10px] font-medium mt-1 transition-all ${
                                        isActive
                                            ? 'opacity-100 font-semibold'
                                            : 'opacity-80 hidden xs:block'
                                    }`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};
