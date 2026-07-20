import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../UI/Button';
import { Input, Select } from '../UI/FormField';
import { ModalShell } from '../UI/ModalShell';

interface SaveTemplateModalProps {
    isOpen: boolean;
    templateToSave: any;
    onTemplateChange: (template: any) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

/** Modal para guardar una comida o combo como favorito/template. */
export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
    isOpen,
    templateToSave,
    onTemplateChange,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();
    if (!templateToSave) return null;

    const isCombo = !!(templateToSave.items && templateToSave.items.length > 0);

    return (
        <ModalShell
            open={isOpen}
            onClose={onCancel}
            size="sm"
            title={
                <span className="text-oura">
                    {isCombo
                        ? `⭐ ${t('favorites.saveCombo')}`
                        : `⭐ ${t('favorites.saveAsFavorite')}`}
                </span>
            }
            footer={
                <div className="flex gap-2">
                    <Button variant="secondary" fullWidth onClick={onCancel}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        fullWidth
                        onClick={onConfirm}
                        className="!bg-oura hover:!opacity-90 !shadow-float">
                        {t('common.save')}
                    </Button>
                </div>
            }>
            <div className="space-y-3">
                <Input
                    label={t('favorites.name')}
                    type="text"
                    value={templateToSave.name}
                    placeholder={
                        isCombo
                            ? t('favorites.placeholderCombo')
                            : t('favorites.placeholderSingle')
                    }
                    autoFocus
                    onChange={(e) =>
                        onTemplateChange({
                            ...templateToSave,
                            name: e.target.value,
                        })
                    }
                />
                <div className="grid grid-cols-2 gap-2">
                    <Select
                        label={t('favorites.type')}
                        value={templateToSave.meal}
                        onChange={(e) =>
                            onTemplateChange({
                                ...templateToSave,
                                meal: e.target.value,
                            })
                        }>
                        <option value="breakfast">
                            {t('mealTypes.breakfast')}
                        </option>
                        <option value="lunch">{t('mealTypes.lunch')}</option>
                        <option value="snack">{t('mealTypes.snack')}</option>
                        <option value="dinner">{t('mealTypes.dinner')}</option>
                        <option value="other">{t('mealTypes.other')}</option>
                    </Select>
                    <Input
                        label={t('favorites.calories')}
                        type="number"
                        value={templateToSave.calories}
                        disabled={isCombo}
                        onChange={(e) =>
                            onTemplateChange({
                                ...templateToSave,
                                calories: parseInt(e.target.value) || 0,
                            })
                        }
                    />
                </div>
                <div className="text-xs text-text-secondary font-medium bg-background px-3 py-2 rounded-control flex justify-between items-center tabular-nums">
                    <span>
                        P: {templateToSave.protein}g · C: {templateToSave.carbs}g
                        · F: {templateToSave.fat}g
                    </span>
                    {isCombo && (
                        <span className="text-[10px] bg-oura-soft text-oura px-1.5 py-0.5 rounded">
                            {templateToSave.items.length} items
                        </span>
                    )}
                </div>
            </div>
        </ModalShell>
    );
};
