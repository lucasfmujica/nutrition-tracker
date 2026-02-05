import { LucideIcon, UserPlus } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = UserPlus,
    title,
    description,
    actionLabel,
    onAction,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-lighter flex items-center justify-center mb-4">
                <Icon size={28} className="text-text-tertiary" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
            <p className="text-sm text-text-tertiary max-w-xs mb-6">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95">
                    {actionLabel}
                </button>
            )}
        </div>
    );
};
