/**
 * FoodCameraInput Component
 * AI-powered meal scanner with camera/file input
 * Features: Image capture, AI analysis, editable results, auto meal-type selection
 */

import {
    Camera,
    Drumstick,
    Image as ImageIcon,
    Loader2,
    Save,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { useFoodAnalysis } from '../../hooks/useFoodAnalysis';
import { useSmartMealType } from '../../hooks/useSmartMealType';
import { ParsedMealResult } from '../../services/ai/voiceMealService';
import { getArgentinaDateString, getCurrentTimeString } from '../../utils/dateUtils';
import { FoodVoiceInput } from './FoodVoiceInput';
import { PortionAdjustmentUI } from './PortionAdjustmentUI';

interface FoodItem {
    name: string;
    amount: string;
}

interface Macros {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

export const FoodCameraInput: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const { analyzeFood, isLoading, result, error, resetResult } = useFoodAnalysis();
    const { saveFoodEntry } = useTracker();
    const { getAutoMealType } = useSmartMealType();
    const { t } = useTranslation();

    // Editable state for AI results
    const [editableMeal, setEditableMeal] = useState('');
    const [editableItems, setEditableItems] = useState<FoodItem[]>([]);
    const [editableMacros, setEditableMacros] = useState<Macros>({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
    });
    const [selectedMealType, setSelectedMealType] = useState('');

    // Voice flow: when true, show the same edit view with voice-parsed data
    const [hasVoiceResult, setHasVoiceResult] = useState(false);
    const [entrySource, setEntrySource] = useState<'ai-photo' | 'ai-voice'>('ai-photo');

    // Portion adjustment phase
    const [showPortionAdjust, setShowPortionAdjust] = useState(false);
    const [baseMacros, setBaseMacros] = useState<Macros>({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
    });

    /**
     * Handle file selection from camera/gallery
     */
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Analyze with AI
        const aiResult = await analyzeFood(file);

        if (aiResult) {
            // Store base macros for portion adjustment
            const macros = aiResult.total_macros || {
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
            };
            setBaseMacros(macros);

            // Populate editable fields with AI results
            setEditableMeal(aiResult.meal_name || '');
            setEditableItems(
                aiResult.items.map((item) => ({
                    name: item.name,
                    amount: item.amount,
                })),
            );

            // Set editable macros immediately so edit view shows AI values
            setEditableMacros(macros);

            // Use file timestamp if available, otherwise default to current time via auto-meal logic
            const fileDate = file.lastModified
                ? new Date(file.lastModified)
                : undefined;
            setSelectedMealType(getAutoMealType(fileDate));

            // Go directly to edit view (not portion adjustment)
            setEntrySource('ai-photo');
            setShowPortionAdjust(false);
        }

        // Reset file input
        e.target.value = '';
    };

    /**
     * Handle voice-parsed meal - feed into the same editable review flow
     */
    const handleVoiceParsed = (parsed: ParsedMealResult) => {
        const macros = {
            calories: parsed.totals.calories,
            protein: parsed.totals.protein,
            carbs: parsed.totals.carbs,
            fat: parsed.totals.fat,
            fiber: 0,
        };
        setBaseMacros(macros);
        setEditableMacros(macros);
        setEditableMeal(parsed.mealName);
        setEditableItems(
            parsed.items.map((item) => ({ name: item.name, amount: item.quantity })),
        );
        setSelectedMealType(parsed.mealType);
        setEntrySource('ai-voice');
        setShowPortionAdjust(false);
        setHasVoiceResult(true);
    };

    /**
     * Handle confirm - transform AI result to Supabase schema and save
     */
    const handleConfirm = async () => {
        try {
            // Get current date and time in Argentina TZ
            const date = getArgentinaDateString();
            const time = getCurrentTimeString();

            // Transform items array to description string
            const description = editableItems
                .map((item) => `${item.amount} ${item.name}`)
                .join(', ');

            // Build food entry matching Supabase schema
            const foodEntry = {
                id: `f-${Date.now()}`, // Temporary string ID for new entries (f- prefix indicates new)
                date,
                time,
                meal: selectedMealType,
                name: editableMeal,
                description,
                calories: editableMacros.calories || 0,
                protein: editableMacros.protein || 0,
                carbs: editableMacros.carbs || 0,
                fat: editableMacros.fat || 0,
                fiber: editableMacros.fiber || 0,
                source: entrySource,
            } as any;

            // Save to database via TrackerContext
            await saveFoodEntry(foodEntry);

            // Reset state
            resetResult();
            setEditableMeal('');
            setEditableItems([]);
            setEditableMacros({
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
            });
            setSelectedMealType('');
            setHasVoiceResult(false);
        } catch (err) {
            console.error('[FoodCameraInput] Error saving food entry:', err);
            alert(t('common.error'));
        }
    };

    /**
     * Handle portion adjustment confirmation
     */
    const handlePortionConfirm = (multiplier: number, adjustedMacros: typeof baseMacros) => {
        // Update editable macros with adjusted values
        setEditableMacros(adjustedMacros);
        // Hide portion adjustment UI and show edit view
        setShowPortionAdjust(false);
    };

    /**
     * Handle cancel - discard AI results
     */
    const handleCancel = () => {
        resetResult();
        setEditableMeal('');
        setEditableItems([]);
        setEditableMacros({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
        setSelectedMealType('');
        setShowPortionAdjust(false);
        setBaseMacros({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
        setHasVoiceResult(false);
    };

    const hasResult = Boolean(result) || hasVoiceResult;

    // If showing portion adjustment view
    if (hasResult && showPortionAdjust) {
        return (
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <PortionAdjustmentUI
                    baseMacros={{
                        calories: baseMacros.calories,
                        protein: baseMacros.protein,
                        carbs: baseMacros.carbs,
                        fat: baseMacros.fat,
                    }}
                    onConfirm={handlePortionConfirm}
                    onCancel={handleCancel}
                />
            </div>
        );
    }

    // If showing results/edit view
    if (hasResult && !showPortionAdjust) {
        return (
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-text-primary">
                        {t('food.camera.editTitle')}
                    </h3>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-surface-lighter rounded-lg transition-colors">
                        <X className="w-5 h-5 text-text-tertiary" />
                    </button>
                </div>

                {/* Meal Name */}
                <div>
                    <label className="text-sm font-semibold text-text-secondary mb-2 block">
                        {t('food.camera.nameLabel')}
                    </label>
                    <input
                        type="text"
                        value={editableMeal}
                        onChange={(e) => setEditableMeal(e.target.value)}
                        className="w-full px-4 py-3 bg-background text-text-primary border border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={t('food.camera.namePlaceholder')}
                    />
                </div>

                {/* Meal Type Dropdown */}
                <div>
                    <label className="text-sm font-semibold text-text-secondary mb-2 block">
                        {t('food.camera.typeLabel')}
                    </label>
                    <select
                        value={selectedMealType}
                        onChange={(e) => setSelectedMealType(e.target.value)}
                        className="w-full px-4 py-3 bg-background text-text-primary border border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option value="breakfast">{t('mealTypes.breakfast')}</option>
                        <option value="lunch">{t('mealTypes.lunch')}</option>
                        <option value="snack">{t('mealTypes.snack')}</option>
                        <option value="dinner">{t('mealTypes.dinner')}</option>
                    </select>
                </div>

                {/* Items List */}
                <div>
                    <label className="text-sm font-semibold text-text-secondary mb-2 block">
                        {t('food.camera.ingredientsLabel')}
                    </label>
                    <div className="space-y-2">
                        {editableItems.map((item, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={item.amount}
                                    onChange={(e) => {
                                        const newItems = [...editableItems];
                                        newItems[index].amount = e.target.value;
                                        setEditableItems(newItems);
                                    }}
                                    className="w-24 px-3 py-2 bg-background text-text-primary border border-border rounded-lg text-sm"
                                    placeholder={t(
                                        'food.camera.ingredientsPlaceholderAmount',
                                    )}
                                />
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => {
                                        const newItems = [...editableItems];
                                        newItems[index].name = e.target.value;
                                        setEditableItems(newItems);
                                    }}
                                    className="flex-1 px-3 py-2 bg-background text-text-primary border border-border rounded-lg text-sm"
                                    placeholder={t(
                                        'food.camera.ingredientsPlaceholderName',
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Macros */}
                <div>
                    <label className="text-sm font-semibold text-text-secondary mb-2 block">
                        {t('food.camera.macrosLabel')}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-text-secondary mb-1 block">
                                {t('modals.foodForm.calories')}
                            </label>
                            <input
                                type="number"
                                value={editableMacros.calories}
                                onChange={(e) =>
                                    setEditableMacros({
                                        ...editableMacros,
                                        calories: parseFloat(e.target.value) || 0,
                                    })
                                }
                                className="w-full px-3 py-2 bg-background text-text-primary border border-border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-secondary mb-1 block">
                                {t('modals.foodForm.protein')}
                            </label>
                            <input
                                type="number"
                                value={editableMacros.protein}
                                onChange={(e) =>
                                    setEditableMacros({
                                        ...editableMacros,
                                        protein: parseFloat(e.target.value) || 0,
                                    })
                                }
                                className="w-full px-3 py-2 bg-background text-text-primary border border-border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-secondary mb-1 block">
                                {t('modals.foodForm.carbs')}
                            </label>
                            <input
                                type="number"
                                value={editableMacros.carbs}
                                onChange={(e) =>
                                    setEditableMacros({
                                        ...editableMacros,
                                        carbs: parseFloat(e.target.value) || 0,
                                    })
                                }
                                className="w-full px-3 py-2 bg-background text-text-primary border border-border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-secondary mb-1 block">
                                {t('modals.foodForm.fat')}
                            </label>
                            <input
                                type="number"
                                value={editableMacros.fat}
                                onChange={(e) =>
                                    setEditableMacros({
                                        ...editableMacros,
                                        fat: parseFloat(e.target.value) || 0,
                                    })
                                }
                                className="w-full px-3 py-2 bg-background text-text-primary border border-border rounded-lg text-sm"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-text-secondary mb-1 block">
                                {t('modals.foodForm.fiber')}
                            </label>
                            <input
                                type="number"
                                value={editableMacros.fiber}
                                onChange={(e) =>
                                    setEditableMacros({
                                        ...editableMacros,
                                        fiber: parseFloat(e.target.value) || 0,
                                    })
                                }
                                className="w-full px-3 py-2 bg-background text-text-primary border border-border rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Adjust Portion Button */}
                <button
                    onClick={() => setShowPortionAdjust(true)}
                    className="w-full py-3 bg-background border-2 border-border text-text-secondary rounded-xl font-semibold hover:bg-surface-lighter transition-colors flex items-center justify-center gap-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    {t('food.camera.adjustPortion')}
                </button>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleCancel}
                        className="flex-1 py-3 bg-surface-lighter text-text-secondary rounded-xl font-semibold hover:bg-surface-lighter transition-colors">
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" />
                        {t('common.save')}
                    </button>
                </div>
            </div>
        );
    }

    // Default view - Scan button
    return (
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />

            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}

            <div className="space-y-3">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-200/70 transition-all active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('food.camera.analyzing')}
                        </>
                    ) : (
                        <>
                            <Drumstick className="w-5 h-5" />
                            {t('food.camera.scanButton')}
                        </>
                    )}
                </button>

                <button
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full py-4 bg-surface border-2 border-border text-text-secondary rounded-xl font-bold hover:bg-background transition-all active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ImageIcon className="w-5 h-5" />
                    {t('food.camera.galleryButton')}
                </button>

                {/* Voice input - same review flow as camera */}
                <FoodVoiceInput onParsed={handleVoiceParsed} disabled={isLoading} />
            </div>

            <p className="text-xs text-text-tertiary text-center mt-3">
                {t('food.camera.helper')}
            </p>
        </div>
    );
};
