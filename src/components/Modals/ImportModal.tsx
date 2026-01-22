import React from 'react';

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
    if (!isOpen) return null;

    const colorClasses = {
        blue: {
            ring: 'focus:ring-blue-500/20 focus:border-blue-500',
            button: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20',
        },
        amber: {
            ring: 'focus:ring-amber-500/20 focus:border-amber-500',
            button: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20',
        },
    };

    const colors = colorClasses[accentColor] || colorClasses.blue;

    return (
        <div className="fixed inset-0 bg-slate-900/40 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                        ×
                    </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">{description}</p>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-slate-900 text-sm font-mono h-48 resize-none ${colors.ring} outline-none transition-all`}
                />
                {error && (
                    <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mt-3 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 py-4 rounded-2xl text-slate-600 font-bold transition-all active:scale-95">
                        Cancelar
                    </button>
                    <button
                        onClick={onImport}
                        className={`flex-1 ${colors.button} py-4 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-95`}>
                        Importar
                    </button>
                </div>
            </div>
        </div>
    );
};
