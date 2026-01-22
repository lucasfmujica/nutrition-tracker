import React from 'react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * DeleteConfirmModal - Confirmation dialog for deletions
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    itemName,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl">
                <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar?</h3>
                <p className="text-base text-gray-600 mb-4">"{itemName}"</p>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-base font-medium transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-base font-bold transition-colors">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};
