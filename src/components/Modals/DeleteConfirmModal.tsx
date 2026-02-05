import React from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl p-6 max-w-sm w-full border border-border shadow-2xl">
                <h3 className="text-lg font-bold text-text-primary mb-2">{t('modals.deleteConfirm.title')}</h3>
                <p className="text-base text-text-secondary mb-4">"{itemName}"</p>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-surface-lighter hover:bg-surface-lighter text-text-secondary py-2.5 rounded-xl text-base font-medium transition-colors">
                        {t('modals.deleteConfirm.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-base font-bold transition-colors">
                        {t('modals.deleteConfirm.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};
