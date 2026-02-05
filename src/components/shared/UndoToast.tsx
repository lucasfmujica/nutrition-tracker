import React from 'react';

interface UndoToastProps {
    undoAction: {
        restore: () => void;
    } | null;
    setUndoAction: (action: any) => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({
    undoAction,
    setUndoAction,
}) => {
    if (!undoAction) return null;

    return (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-full px-4 py-2 flex items-center gap-3 z-50 shadow-lg">
            <span className="text-sm text-text-tertiary">Eliminado</span>
            <button
                onClick={() => {
                    if (undoAction.restore) undoAction.restore();
                    if (setUndoAction) setUndoAction(null);
                }}
                className="text-blue-400 font-bold text-sm active:text-cyan-300">
                DESHACER
            </button>
        </div>
    );
};
