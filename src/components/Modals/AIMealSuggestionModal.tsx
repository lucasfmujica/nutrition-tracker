import { ChefHat, Loader2, Plus, Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { MealSuggestion } from '../../services/ai/mealService';
import { FoodEntry } from '../../types/domain';

interface AIMealSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AIMealSuggestionModal: React.FC<AIMealSuggestionModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();
    const {
        suggestions,
        loading,
        error,
        openSaveComboModal,
        saveFoodEntry,
        selectedFoodDate,
    } = useTracker() as any;

    if (!isOpen) return null;

    const handleAddSuggestion = async (suggestion: MealSuggestion) => {
        // Create entries for each ingredient
        const now = new Date();
        const time = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const newEntries: FoodEntry[] = suggestion.ingredients.map((ing) => ({
            id: crypto.randomUUID(),
            date: selectedFoodDate,
            time,
            meal: 'lunch', // Default, user can change later
            name: ing.name,
            description: ing.amount,
            calories: ing.calories || 0,
            protein: 0, // AI prompt currently returns total macros, not per ingredient. TODO: Improve prompt to distribute macros
            carbs: 0,
            fat: 0,
            fiber: 0,
            source: 'template', // Mark as template/ai
            reviewed: true,
            confidence: 1,
            sourceId: null,
        }));

        // Distribute macros proportionally to calories?
        // Or just add ONE main item with the macros and others as 0-cal ingredients?
        // Better: Add ONE single entry representing the whole meal if ingredients don't have macros.
        // OR: Improved prompt returns simple list.
        // Let's stick to: Create ONE entry for the meal, and maybe put ingredients in description?
        // "Chicken Salad (Chicken, Lettuce...)"

        // Revised Strategy: Single Entry for simplicity now, as ingredients lack detailed macros in current prompt
        const singleEntry: FoodEntry = {
            id: crypto.randomUUID(),
            date: selectedFoodDate,
            time,
            meal: 'lunch',
            name: suggestion.name,
            description: suggestion.description,
            calories: suggestion.macros.calories,
            protein: suggestion.macros.protein,
            carbs: suggestion.macros.carbs,
            fat: suggestion.macros.fat,
            fiber: 0,
            source: 'ai-text',
            reviewed: true,
            confidence: 0.9,
            sourceId: null,
        };

        try {
            await saveFoodEntry(singleEntry);
            onClose();
        } catch (err) {
            console.error('Error adding AI suggestion', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-purple-200 shadow-2xl relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

                <div className="flex justify-between items-center mb-6 relative">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-purple-500/20">
                            <Sparkles size={20} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">
                            Chef IA
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                        ×
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <Loader2
                            size={40}
                            className="text-purple-600 animate-spin mb-4"
                        />
                        <p className="text-gray-900 font-bold mb-1">
                            Pensando en deliciosas opciones...
                        </p>
                        <p className="text-xs text-gray-500">
                            Analizando tus macros restantes
                        </p>
                    </div>
                ) : error ? (
                    <div className="py-8 text-center">
                        <p className="text-red-500 font-medium mb-2">{error}</p>
                        <button
                            onClick={onClose}
                            className="text-sm font-bold text-gray-600 hover:text-gray-900 underline">
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {suggestions.map(
                            (suggestion: MealSuggestion, idx: number) => (
                                <div
                                    key={idx}
                                    className="group relative bg-white border border-gray-100 hover:border-purple-200 rounded-2xl p-4 transition-all hover:shadow-lg hover:shadow-purple-500/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                                            {suggestion.name}
                                        </h4>
                                        <span className="text-xs font-bold bg-gray-900 text-white px-2 py-1 rounded-lg">
                                            {suggestion.macros.calories} kcal
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                        {suggestion.description}
                                    </p>

                                    <div className="flex gap-2 mb-4">
                                        <div className="px-2 py-1 bg-green-50 rounded-lg text-[10px] font-bold text-green-700">
                                            {suggestion.macros.protein}g Prot
                                        </div>
                                        <div className="px-2 py-1 bg-amber-50 rounded-lg text-[10px] font-bold text-amber-700">
                                            {suggestion.macros.carbs}g Carb
                                        </div>
                                        <div className="px-2 py-1 bg-orange-50 rounded-lg text-[10px] font-bold text-orange-700">
                                            {suggestion.macros.fat}g Fat
                                        </div>
                                    </div>

                                    <button
                                        onClick={() =>
                                            handleAddSuggestion(suggestion)
                                        }
                                        className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-xs group-hover:bg-purple-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
                                        <Plus size={14} />
                                        Agregar al Diario
                                    </button>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
