import React from 'react';
import { cn } from '../../utils/cn';

interface FieldWrapperProps {
    label?: string;
    error?: string;
    hint?: string;
    className?: string;
    children: React.ReactNode;
}

/* Estilo compartido de campos. font-size 16px lo garantiza el global de
   index.css (anti-zoom iOS); acá solo forma, color y foco. */
const FIELD_CLASSES =
    'w-full bg-surface border border-border rounded-control px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50';

const FieldWrapper: React.FC<FieldWrapperProps> = ({
    label,
    error,
    hint,
    className,
    children,
}) => (
    <label className={cn('block', className)}>
        {label && (
            <span className="block text-overline uppercase text-text-tertiary mb-1.5">
                {label}
            </span>
        )}
        {children}
        {error ? (
            <span className="block text-caption text-danger mt-1.5">{error}</span>
        ) : (
            hint && (
                <span className="block text-caption text-text-tertiary mt-1.5">
                    {hint}
                </span>
            )
        )}
    </label>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    wrapperClassName?: string;
}

/** Input de texto/número estándar con label, error y hint. */
export const Input: React.FC<InputProps> = ({
    label,
    error,
    hint,
    wrapperClassName,
    className,
    ...rest
}) => (
    <FieldWrapper
        label={label}
        error={error}
        hint={hint}
        className={wrapperClassName}>
        <input
            className={cn(FIELD_CLASSES, error && 'border-danger', className)}
            {...rest}
        />
    </FieldWrapper>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    wrapperClassName?: string;
}

/** Select estándar con label, error y hint. */
export const Select: React.FC<SelectProps> = ({
    label,
    error,
    hint,
    wrapperClassName,
    className,
    children,
    ...rest
}) => (
    <FieldWrapper
        label={label}
        error={error}
        hint={hint}
        className={wrapperClassName}>
        <select
            className={cn(
                FIELD_CLASSES,
                'appearance-none',
                error && 'border-danger',
                className,
            )}
            {...rest}>
            {children}
        </select>
    </FieldWrapper>
);

interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
    wrapperClassName?: string;
}

/** Textarea estándar con label, error y hint. */
export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    hint,
    wrapperClassName,
    className,
    ...rest
}) => (
    <FieldWrapper
        label={label}
        error={error}
        hint={hint}
        className={wrapperClassName}>
        <textarea
            className={cn(
                FIELD_CLASSES,
                'resize-none',
                error && 'border-danger',
                className,
            )}
            {...rest}
        />
    </FieldWrapper>
);
