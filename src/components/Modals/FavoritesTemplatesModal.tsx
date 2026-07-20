import React from 'react';
import { useTranslation } from 'react-i18next';
import { ModalShell } from '../UI/ModalShell';

interface FavoritesTemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    mealTemplates: any[];
    onAddFromTemplate: (template: any) => void;
    onDeleteTemplate: (id: string) => void;
}

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];
const MEAL_EMOJI: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    snack: '🍎',
    dinner: '🌙',
    other: '🍴',
};

/** Modal de favoritos/templates de comidas, agrupados por tipo de comida. */
export const FavoritesTemplatesModal: React.FC<FavoritesTemplatesModalProps> = ({
    isOpen,
    onClose,
    mealTemplates,
    onAddFromTemplate,
    onDeleteTemplate,
}) => {
    const { t } = useTranslation();

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            title={<span className="text-oura">⭐ Favoritos</span>}
            size="md">
            {mealTemplates.length === 0 ? (
                <p className="text-text-tertiary text-sm text-center py-4">
                    {t('favorites.empty')}
                </p>
            ) : (
                <div className="space-y-3">
                    {MEAL_ORDER.map((mealType) => {
                        const mealsOfType = mealTemplates.filter(
                            (tpl: any) => tpl.meal === mealType,
                        );
                        if (mealsOfType.length === 0) return null;
                        return (
                            <div key={mealType} className="space-y-2">
                                <div className="text-overline uppercase text-text-tertiary tracking-wider px-1 font-bold">
                                    {MEAL_EMOJI[mealType]}{' '}
                                    {t(`mealTypes.${mealType}`)}
                                </div>
                                {mealsOfType.map((template: any) => (
                                    <div
                                        key={template.id}
                                        className="bg-oura-soft rounded-control p-3 border border-oura/20 active:bg-oura/20 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <button
                                                onClick={() =>
                                                    onAddFromTemplate(template)
                                                }
                                                className="flex-1 text-left">
                                                <span className="text-xs text-oura uppercase font-bold">
                                                    {template.meal}
                                                </span>
                                                <h4 className="font-medium text-sm text-text-primary">
                                                    {template.name}
                                                </h4>
                                                {template.description && (
                                                    <p className="text-xs text-text-secondary truncate">
                                                        {template.description}
                                                    </p>
                                                )}
                                                <div className="flex gap-2 mt-1 text-xs font-medium tabular-nums">
                                                    <span className="text-primary">
                                                        {template.calories}kcal
                                                    </span>
                                                    <span className="text-protein">
                                                        {template.protein}P
                                                    </span>
                                                    <span className="text-carbs">
                                                        {template.carbs}C
                                                    </span>
                                                    <span className="text-fat">
                                                        {template.fat}F
                                                    </span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    onDeleteTemplate(template.id)
                                                }
                                                aria-label={`${t('a11y.deleteFavorite')}: ${template.name}`}
                                                className="text-text-tertiary hover:text-danger active:text-danger w-9 h-9 flex items-center justify-center transition-colors">
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-xs text-text-tertiary mt-3 text-center">
                {t('favorites.hint')}
            </p>
        </ModalShell>
    );
};
