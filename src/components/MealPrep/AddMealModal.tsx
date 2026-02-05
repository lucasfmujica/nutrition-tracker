import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Sparkles } from 'lucide-react';
import { PlannedMealItem } from '../../hooks/useMealPrepPlan';

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
 * - Mobile-optimized with touch-friendly buttons
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface rounded-3xl w-full max-w-md border border-border shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 pb-4 border-b border-border">
                    <div>
                        <h3 className="text-xl font-black text-text-primary">
                            {t('mealPrep.addMeal.title')}
                        </h3>
                        <p className="text-xs text-text-tertiary mt-1">
                            {t(`mealTypes.${mealType}`)} • {new Date(date).toLocaleDateString()}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-lighter text-text-tertiary hover:text-text-secondary hover:bg-surface transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* AI Chef Quick Action */}
                    {onOpenAIChef && (
                        <button
                            onClick={handleAIChef}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                            <Sparkles size={18} />
                            {t('mealPrep.addMeal.useAIChef')}
                        </button>
                    )}

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-surface text-text-tertiary uppercase font-bold tracking-wider">
                                {t('mealPrep.addMeal.orManual')}
                            </span>
                        </div>
                    </div>

                    {/* Manual Entry Form */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">
                                {t('mealPrep.addMeal.mealName')}
                            </label>
                            <input
                                type="text"
                                value={mealName}
                                onChange={(e) => setMealName(e.target.value)}
                                placeholder={t('mealPrep.addMeal.mealNamePlaceholder')}
                                className="w-full px-4 py-3 bg-background dark:bg-surface-lighter border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">
                                {t('mealPrep.addMeal.calories')} ({t('common.optional')})
                            </label>
                            <input
                                type="number"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-3 bg-background dark:bg-surface-lighter border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">
                                {t('mealPrep.addMeal.notes')} ({t('common.optional')})
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t('mealPrep.addMeal.notesPlaceholder')}
                                rows={2}
                                className="w-full px-4 py-3 bg-background dark:bg-surface-lighter border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-surface-lighter hover:bg-surface text-text-secondary font-bold rounded-xl transition-colors">
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!mealName.trim() || isAdding}
                        className="flex-1 py-3 bg-accent text-white font-bold rounded-xl shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <Plus size={18} />
                        {isAdding ? t('common.adding') : t('common.add')}
                    </button>
                </div>
            </div>
        </div>
    );
};
