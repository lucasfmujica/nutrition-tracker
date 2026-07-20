import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../UI/Button';
import { ModalShell } from '../UI/ModalShell';

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

    const colorClasses = {
        blue: {
            ring: 'focus:ring-primary/20 focus:border-primary',
            button: '',
        },
        amber: {
            ring: 'focus:ring-warning/20 focus:border-warning',
            button: '!bg-warning hover:!opacity-90 !shadow-float',
        },
    };

    const colors = colorClasses[accentColor] || colorClasses.blue;

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            title={title}
            subtitle={description}
            size="md"
            footer={
                <div className="flex gap-2">
                    <Button variant="secondary" fullWidth onClick={onClose}>
                        {t('modals.import.cancel')}
                    </Button>
                    <Button
                        fullWidth
                        onClick={onImport}
                        className={colors.button}>
                        {t('modals.import.import')}
                    </Button>
                </div>
            }>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-background border border-border rounded-control px-4 py-4 text-text-primary text-sm font-mono h-48 resize-none ${colors.ring} outline-none transition-all`}
            />
            {error && (
                <div className="bg-danger-soft text-danger text-xs p-3 rounded-control mt-3 flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}
        </ModalShell>
    );
};
