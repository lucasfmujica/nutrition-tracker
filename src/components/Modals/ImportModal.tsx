import React from 'react';
import { useTranslation } from 'react-i18next';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onImport: () => void;
    error?: string | null;
    accentColor?: 'blue' | 'amber';
}

/**
 * ImportModal - Generic JSON import modal
 * Reusable for importing food or workout data from JSON
 */
export const ImportModal: React.FC<ImportModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    placeholder,
    value,
    onChange,
    onImport,
    error,
    accentColor = 'blue',
}) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const colorClasses = {
        blue: {
            ring: 'focus:ring-primary/20 focus:border-primary',
            button: 'bg-primary hover:bg-primary shadow-blue-500/20',
        },
        amber: {
            ring: 'focus:ring-warning/20 focus:border-warning',
            button: 'bg-warning hover:opacity-90 shadow-float',
        },
    };

    const colors = colorClasses[accentColor] || colorClasses.blue;

    return (
        <div className="fixed inset-0 bg-slate-900/40 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto backdrop-blur-sm">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-md border border-border shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-primary">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-lighter text-text-tertiary">
                        ×
                    </button>
                </div>
                <p className="text-sm text-text-tertiary mb-4">{description}</p>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full bg-background border border-border rounded-2xl px-4 py-4 text-text-primary text-sm font-mono h-48 resize-none ${colors.ring} outline-none transition-all`}
                />
                {error && (
                    <div className="bg-danger-soft text-danger text-xs p-3 rounded-xl mt-3 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-surface-lighter hover:bg-surface-lighter py-4 rounded-2xl text-text-secondary font-bold transition-all active:scale-95">
                        {t('modals.import.cancel')}
                    </button>
                    <button
                        onClick={onImport}
                        className={`flex-1 ${colors.button} py-4 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-95`}>
                        {t('modals.import.import')}
                    </button>
                </div>
            </div>
        </div>
    );
};
