import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Sparkles } from 'lucide-react';
import { PlannedMealItem } from '../../hooks/useMealPrepPlan';
import { Button } from '../UI/Button';
import { Input, Textarea } from '../UI/FormField';
import { ModalShell } from '../UI/ModalShell';

interface AddMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (items: PlannedMealItem[], notes?: string) => Promise<void>;
    onOpenAIChef?: () => void;
    date: string;
    mealType: string;
}

/**
 * AddMealModal - Simple modal to add meals to meal prep plan
 *
 * Features:
 * - Manual entry: name + optional calories
 * - Quick add button for AI Chef integration
 */
export const AddMealModal: React.FC<AddMealModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    onOpenAIChef,
    date,
    mealType,
}) => {
    const { t } = useTranslation();
    const [mealName, setMealName] = useState('');
    const [calories, setCalories] = useState('');
    const [notes, setNotes] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!mealName.trim()) return;

        setIsAdding(true);
        try {
            const plannedItems: PlannedMealItem[] = [
                {
                    name: mealName.trim(),
                    calories: calories ? parseInt(calories) : undefined,
                },
            ];

            await onAdd(plannedItems, notes.trim() || undefined);

            // Reset form
            setMealName('');
            setCalories('');
            setNotes('');
            onClose();
        } catch (err) {
            console.error('[AddMealModal] Error adding meal:', err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleAIChef = () => {
        onClose();
        onOpenAIChef?.();
    };

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            title={t('mealPrep.addMeal.title')}
            subtitle={`${t(`mealTypes.${mealType}`)} • ${new Date(date).toLocaleDateString()}`}
            size="md"
            footer={
                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        fullWidth
                        onClick={handleSubmit}
                        disabled={!mealName.trim() || isAdding}
                        icon={<Plus size={18} />}
                        className="!bg-accent hover:!bg-accent/90 !shadow-float">
                        {isAdding ? t('common.adding') : t('common.add')}
                    </Button>
                </div>
            }>
            <div className="space-y-4">
                {/* AI Chef Quick Action */}
                {onOpenAIChef && (
                    <Button
                        fullWidth
                        onClick={handleAIChef}
                        icon={<Sparkles size={18} />}
                        className="!bg-oura hover:!opacity-90 !shadow-float">
                        {t('mealPrep.addMeal.useAIChef')}
                    </Button>
                )}

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-surface-elevated text-text-tertiary uppercase font-bold tracking-wider">
                            {t('mealPrep.addMeal.orManual')}
                        </span>
                    </div>
                </div>

                {/* Manual Entry Form */}
                <div className="space-y-3">
                    <Input
                        label={t('mealPrep.addMeal.mealName')}
                        type="text"
                        value={mealName}
                        onChange={(e) => setMealName(e.target.value)}
                        placeholder={t('mealPrep.addMeal.mealNamePlaceholder')}
                        autoFocus
                    />

                    <Input
                        label={`${t('mealPrep.addMeal.calories')} (${t('common.optional')})`}
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        placeholder="0"
                    />

                    <Textarea
                        label={`${t('mealPrep.addMeal.notes')} (${t('common.optional')})`}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('mealPrep.addMeal.notesPlaceholder')}
                        rows={2}
                    />
                </div>
            </div>
        </ModalShell>
    );
};
