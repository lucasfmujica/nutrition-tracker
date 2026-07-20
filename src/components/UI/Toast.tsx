/**
 * Toast - Visual renderer for the global toast store (ToastContext)
 *
 * - Stackable, auto-dismissing notifications (success / error / info)
 * - Accessible: role="alert" for errors, role="status" otherwise
 * - Uses the app's semantic tokens (bg-surface / border-border / text-*)
 *   so dark mode works automatically
 */
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import React from 'react';
import {
    dismissToast,
    ToastItem,
    ToastVariant,
    useToasts,
} from '../../context/ToastContext';

const VARIANT_CONFIG: Record<
    ToastVariant,
    { Icon: React.ElementType; iconColor: string; barColor: string }
> = {
    success: {
        Icon: CheckCircle2,
        iconColor: 'text-success',
        barColor: 'bg-success',
    },
    error: {
        Icon: AlertCircle,
        iconColor: 'text-danger',
        barColor: 'bg-danger',
    },
    info: {
        Icon: Info,
        iconColor: 'text-primary',
        barColor: 'bg-primary',
    },
};

const Toast: React.FC<{ item: ToastItem }> = ({ item }) => {
    const { Icon, iconColor, barColor } = VARIANT_CONFIG[item.variant];

    return (
        <div
            role={item.variant === 'error' ? 'alert' : 'status'}
            aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
            className="lukenfit-toast pointer-events-auto relative flex items-start gap-3 w-full max-w-sm overflow-hidden rounded-xl bg-surface border border-border shadow-xl px-4 py-3">
            <span
                className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`}
                aria-hidden="true"
            />
            <Icon
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`}
                strokeWidth={2}
                aria-hidden="true"
            />
            <p className="flex-1 text-sm font-medium text-text-primary break-words">
                {item.message}
            </p>
            <button
                type="button"
                onClick={() => dismissToast(item.id)}
                aria-label="Cerrar notificación"
                className="flex-shrink-0 p-1 -m-1 rounded-md text-text-secondary hover:text-text-primary transition-colors">
                <X className="w-4 h-4" strokeWidth={2} />
            </button>
        </div>
    );
};

/**
 * ToastContainer - Fixed viewport rendering the toast stack
 */
export const ToastContainer: React.FC = () => {
    const toasts = useToasts();

    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
            aria-label="Notificaciones">
            <style>{`
                @keyframes lukenfit-toast-in {
                    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .lukenfit-toast { animation: lukenfit-toast-in 0.2s ease-out; }
            `}</style>
            {toasts.map((item) => (
                <Toast key={item.id} item={item} />
            ))}
        </div>
    );
};

/**
 * ToastProvider - Renders children plus the global toast viewport.
 * Mount once near the app root (see NutritionTracker.tsx).
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => (
    <>
        {children}
        <ToastContainer />
    </>
);
