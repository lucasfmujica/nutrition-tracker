import { Loader2 } from 'lucide-react';
import React from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
    primary:
        'bg-primary text-white font-bold shadow-glow hover:bg-primary-dark active:scale-[0.98]',
    secondary:
        'bg-surface-lighter text-text-primary font-semibold border border-border hover:bg-progress-track active:scale-[0.98]',
    ghost: 'bg-transparent text-text-secondary font-semibold hover:bg-surface-lighter active:scale-[0.98]',
    danger: 'bg-danger text-white font-bold hover:opacity-90 active:scale-[0.98]',
};

const SIZES: Record<ButtonSize, string> = {
    sm: 'min-h-[36px] px-4 text-sm gap-1.5',
    md: 'min-h-[44px] px-5 text-base gap-2',
    lg: 'min-h-[52px] px-7 text-base gap-2',
};

/**
 * Botón estándar de la app. Variantes: primary (pill + glow), secondary,
 * ghost y danger. Touch target mínimo de 44px en md/lg.
 */
export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = false,
    className,
    children,
    disabled,
    ...rest
}) => (
    <button
        disabled={disabled || loading}
        className={cn(
            'inline-flex items-center justify-center rounded-full transition-all duration-150 select-none',
            'disabled:opacity-50 disabled:pointer-events-none',
            VARIANTS[variant],
            SIZES[size],
            fullWidth && 'w-full',
            className,
        )}
        {...rest}>
        {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
            icon
        )}
        {children}
    </button>
);
