import { LucideIcon } from 'lucide-react';
import React from 'react';
import { cn } from '../../../utils/cn';

interface NavTabButtonProps {
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    onClick: () => void;
    tutorialId?: string;
    badgeCount?: number;
    ariaLabel?: string;
    ariaExpanded?: boolean;
    ariaHasPopup?: boolean;
    ariaCurrent?: boolean;
}

/**
 * Tab del nav island mobile: ícono + dot/label overline al activarse,
 * badge opcional (ej. solicitudes pendientes). Touch target >= 44px.
 */
export const NavTabButton: React.FC<NavTabButtonProps> = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    tutorialId,
    badgeCount = 0,
    ariaLabel,
    ariaExpanded,
    ariaHasPopup,
    ariaCurrent,
}) => (
    <button
        onClick={onClick}
        data-tutorial={tutorialId}
        aria-label={ariaLabel || label}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHasPopup ? 'menu' : undefined}
        aria-current={ariaCurrent ? 'page' : undefined}
        className={cn(
            'flex flex-col items-center justify-center transition-[color,transform,opacity] duration-200 relative group min-w-[44px] h-full',
            isActive
                ? 'text-primary'
                : 'text-text-tertiary hover:text-text-secondary',
        )}>
        <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
                <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                        'transition-[color,transform,opacity] duration-200',
                        isActive
                            ? '-translate-y-1 scale-110'
                            : 'group-hover:scale-105',
                    )}
                />
                {badgeCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full flex items-center justify-center shadow-float animate-pulse">
                        <span className="text-[8px] font-black text-white">
                            {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                    </div>
                )}
            </div>

            <div
                className={cn(
                    'flex flex-col items-center transition-[color,transform,opacity] duration-200 overflow-hidden',
                    isActive ? 'max-h-6 opacity-100 mt-1' : 'max-h-0 opacity-0',
                )}>
                <span className="w-1 h-1 bg-primary rounded-full mb-1 shadow-[0_0_8px_var(--color-primary)]" />
                <span className="text-[8px] font-black tracking-[0.05em] uppercase leading-none">
                    {label}
                </span>
            </div>
        </div>

        {!isActive && (
            <span className="absolute inset-x-0 inset-y-2 bg-surface-lighter/0 group-hover:bg-surface-lighter/50 rounded-control transition-colors duration-300 -z-0" />
        )}
    </button>
);
