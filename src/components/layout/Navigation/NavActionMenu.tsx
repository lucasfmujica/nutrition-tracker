import gsap from 'gsap';
import React, { useEffect, useRef } from 'react';

export interface NavMenuItem {
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    onClick: () => void;
    /** Clases token de color/fondo del tile del ícono (ej. text-info bg-info-soft). */
    color: string;
    bg: string;
}

interface NavActionMenuProps {
    items: NavMenuItem[];
    onClose: () => void;
}

/**
 * Menú flotante del BottomNav (quick actions / more). Mini-sheet glass
 * anclado sobre el nav island, con animación gsap de entrada.
 */
export const NavActionMenu: React.FC<NavActionMenuProps> = ({
    items,
    onClose,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.fromTo(
            menuRef.current,
            { y: 50, opacity: 0, scale: 0.9 },
            { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power4.out' },
        );
    }, []);

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
                onClick={onClose}
            />
            <div
                ref={menuRef}
                className="fixed inset-x-4 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-50">
                <div className="glass rounded-card p-4 shadow-float max-w-sm mx-auto overflow-hidden">
                    <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                    <div className="flex flex-col gap-2 relative z-10">
                        {items.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    item.onClick();
                                    onClose();
                                }}
                                className="group flex items-center gap-4 p-3 rounded-control bg-background/50 hover:bg-surface-lighter/50 border border-border transition-all active:scale-95 min-h-[56px]">
                                <div
                                    className={`${item.bg} ${item.color} w-11 h-11 rounded-control flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                                    {item.icon}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="text-sm font-satoshi text-text-primary font-black tracking-tight truncate">
                                        {item.label}
                                    </div>
                                    <div className="text-[9px] text-text-tertiary font-black uppercase tracking-widest truncate">
                                        {item.sublabel}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};
