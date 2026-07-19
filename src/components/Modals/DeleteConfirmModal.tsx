import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../UI/Button';
import { ModalShell } from '../UI/ModalShell';

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

    return (
        <ModalShell
            open={isOpen}
            onClose={onCancel}
            title={t('modals.deleteConfirm.title')}
            size="sm"
            role="alertdialog"
            footer={
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={onCancel}>
                        {t('modals.deleteConfirm.cancel')}
                    </Button>
                    <Button variant="danger" fullWidth onClick={onConfirm}>
                        {t('modals.deleteConfirm.confirm')}
                    </Button>
                </div>
            }>
            <p className="text-body-md text-text-secondary">"{itemName}"</p>
        </ModalShell>
    );
};
