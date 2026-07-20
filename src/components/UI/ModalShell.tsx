import { X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { useSheetDrag } from './useSheetDrag';

type ModalSize = 'sm' | 'md' | 'lg' | 'full';

interface ModalShellProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    size?: ModalSize;
    /** Permite cerrar con overlay/Escape/drag (default true). */
    dismissible?: boolean;
    /** Footer sticky (botones de acción). */
    footer?: React.ReactNode;
    /** Rol ARIA: dialog (default) o alertdialog para confirmaciones. */
    role?: 'dialog' | 'alertdialog';
    children: React.ReactNode;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
    sm: 'lg:max-w-sm',
    md: 'lg:max-w-lg',
    lg: 'lg:max-w-2xl',
    full: 'lg:max-w-4xl',
};

/**
 * Shell compartido de modales: bottom-sheet en mobile (slide-up, drag
 * handle, drag-to-dismiss) y modal centrado en desktop (lg+). Un solo
 * árbol DOM — el comportamiento responsive es 100% CSS.
 */
export const ModalShell: React.FC<ModalShellProps> = ({
    open,
    onClose,
    title,
    subtitle,
    icon,
    size = 'md',
    dismissible = true,
    footer,
    role = 'dialog',
    children,
}) => {
    const { t } = useTranslation();
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const { panelRef, handleProps } = useSheetDrag({
        onDismiss: onClose,
        enabled: dismissible,
    });

    // Scroll lock + focus return + Escape
    useEffect(() => {
        if (!open) return;
        previouslyFocused.current = document.activeElement as HTMLElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && dismissible) onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKey);
            previouslyFocused.current?.focus?.();
        };
    }, [open, dismissible, onClose]);

    if (!open) return null;

    /* Portal a body: evita que ancestros con transform (ej. PullToRefresh)
       conviertan el fixed en relativo al contenido scrolleado. */
    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center"
            onClick={dismissible ? onClose : undefined}>
            {/* Overlay único para toda la app */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            <div
                ref={panelRef}
                role={role}
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    'relative w-full flex flex-col bg-surface-elevated border border-border shadow-float',
                    // Mobile: bottom-sheet
                    'rounded-t-card max-h-[90dvh] animate-slide-up',
                    // Desktop: modal centrado
                    'lg:rounded-card lg:max-h-[85vh] lg:mx-4 lg:animate-fade-in',
                    SIZE_CLASSES[size],
                )}>
                {/* Drag handle (solo mobile) */}
                <div
                    className="lg:hidden pt-3 pb-1 flex justify-center cursor-grab touch-none"
                    {...handleProps}>
                    <span className="w-10 h-1 rounded-full bg-muted" />
                </div>

                {(title || dismissible) && (
                    <div className="flex items-start gap-3 px-5 pt-2 lg:pt-5 pb-3">
                        {icon && (
                            <span className="flex-shrink-0 w-10 h-10 rounded-control bg-primary-soft text-primary flex items-center justify-center">
                                {icon}
                            </span>
                        )}
                        <div className="flex-1 min-w-0">
                            {title && (
                                <h2 className="text-heading text-text-primary truncate">
                                    {title}
                                </h2>
                            )}
                            {subtitle && (
                                <p className="text-caption text-text-tertiary mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        {dismissible && (
                            <button
                                onClick={onClose}
                                aria-label={t('common.close')}
                                className="flex-shrink-0 w-9 h-9 -mr-1 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-lighter transition-colors">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
                    {children}
                </div>

                {footer && (
                    <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-surface-elevated rounded-b-none lg:rounded-b-card pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-4">
                        {footer}
                    </div>
                )}
                {/* Safe area cuando no hay footer */}
                {!footer && <div className="lg:hidden pb-safe" />}
            </div>
        </div>,
        document.body,
    );
};
