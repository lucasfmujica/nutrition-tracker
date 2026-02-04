import gsap from 'gsap';
import { Drumstick, Dumbbell, Import, Plus, Star, Utensils } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// =====================================================
// FLOATING ACTION BUTTON COMPONENT - PERFORMANCE LAB
// =====================================================

interface FloatingActionButtonProps {
    onAddFood: () => void;
    onAddWorkout: () => void;
    onImportFood: () => void;
    onImportWorkout: () => void;
    onQuickAdd: () => void;
    onScanFood: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    onAddFood,
    onAddWorkout,
    onImportWorkout,
    onQuickAdd,
    onScanFood,
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            gsap.fromTo(
                menuRef.current,
                { opacity: 0, y: 40, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' },
            );
            gsap.fromTo(
                itemsRef.current,
                { opacity: 0, x: -20 },
                {
                    opacity: 1,
                    x: 0,
                    stagger: 0.05,
                    duration: 0.3,
                    ease: 'back.out(1.7)',
                    delay: 0.1,
                },
            );
        }
    }, [isOpen]);

    const actions = [
        {
            icon: <Utensils size={24} />,
            label: t('navigation.meals').toUpperCase(),
            sublabel: t('modals.foods.manualEntry').toUpperCase(),
            onClick: onAddFood,
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
        {
            icon: <Dumbbell size={24} />,
            label: t('navigation.workouts').toUpperCase(),
            sublabel: t('modals.foods.manualEntry').toUpperCase(),
            onClick: onAddWorkout,
            color: 'text-fat',
            bg: 'bg-fat/10',
        },
        {
            icon: <Star size={24} />,
            label: (t('common.favorites') || 'FAVORITOS').toUpperCase(),
            sublabel: 'PLANTILLAS RÁPIDAS',
            onClick: onQuickAdd,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
        },
        {
            icon: <Drumstick size={20} />,
            label: (t('common.scan') || 'ESCANEAR').toUpperCase(),
            sublabel: 'RECONOCIMIENTO IA',
            onClick: onScanFood,
            color: 'text-accent',
            bg: 'bg-accent/10',
        },
        {
            icon: <Import size={20} />,
            label: 'IMP. GRAVL',
            sublabel: 'SINC GEN AI',
            onClick: onImportWorkout,
            color: 'text-carbs',
            bg: 'bg-carbs/10',
        },
    ];

    return (
        <>
            {/* Backdrop with extreme blur */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-white/60 z-40 backdrop-blur-xl transition-all duration-500"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* FAB Menu - Floating Island */}
            <div
                ref={menuRef}
                className={`fixed inset-x-4 bottom-32 z-50 transition-all transform ${
                    isOpen ? 'block' : 'hidden'
                }`}>
                <div className="glass rounded-[3rem] p-8 shadow-card border border-black/5 max-w-lg mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200" />
                            <span className="font-satoshi text-slate-400 tracking-[0.2em] text-[10px] font-black">
                                {t('layout.fab.add').toUpperCase()}
                            </span>
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200" />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {actions.map((action, i) => (
                                <button
                                    key={i}
                                    ref={(el) => {
                                        itemsRef.current[i] = el;
                                    }}
                                    onClick={() => {
                                        action.onClick();
                                        setIsOpen(false);
                                    }}
                                    className="group flex items-center gap-4 p-4 rounded-[2rem] bg-slate-50/50 hover:bg-slate-100/50 border border-slate-100 hover:border-slate-200 transition-all active:scale-95">
                                    <div
                                        className={`${action.bg} ${action.color} w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                                        {action.icon}
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="text-lg font-satoshi text-slate-900 tracking-tight leading-none mb-1">
                                            {action.label}
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em]">
                                            {action.sublabel}
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-primary/30 group-hover:text-primary transition-colors">
                                        <Plus
                                            size={14}
                                            className="group-hover:rotate-90 transition-transform duration-300"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main FAB - Pulse Engine */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed right-8 bottom-28 z-50 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500 ring-8 ring-white/80 backdrop-blur-sm active:scale-90 ${
                    isOpen
                        ? 'rotate-45 bg-slate-900 !text-white ring-slate-100'
                        : 'scale-100 bg-primary shadow-primary/40 hover:scale-110 hover:-translate-y-2 hover:shadow-primary/60'
                }`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                <Plus size={40} strokeWidth={3} className="relative z-10" />
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-primary animate-ping-slow opacity-20" />
                )}
            </button>
        </>
    );
};
