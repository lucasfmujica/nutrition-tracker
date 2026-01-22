import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { FoodEntry, MealTemplate } from '../types/domain';
import { ARGENTINA_TZ } from '../utils/dateUtils';

interface UseMealTemplatesParams {
    mealTemplates: MealTemplate[];
    setMealTemplates: Dispatch<SetStateAction<MealTemplate[]>>;
    storage: any;
    setSaveStatus: (status: string) => void;
    selectedFoodDate: string;
    saveFoodLog: (log: FoodEntry[]) => void;
    foodLog: FoodEntry[];
    saveFoodEntry: (entry: FoodEntry) => Promise<FoodEntry | null>;
    saveTemplate: (
        template: MealTemplate,
    ) => Promise<{ data: MealTemplate | null; error: any }>;
    deleteTemplateDb: (id: string) => Promise<{ error: any }>;
    useCloud: boolean;
}

export const useMealTemplates = ({
    mealTemplates,
    setMealTemplates,
    storage,
    setSaveStatus,
    selectedFoodDate,
    saveFoodLog,
    foodLog,
    saveFoodEntry,
    saveTemplate,
    deleteTemplateDb,
    useCloud,
}: UseMealTemplatesParams) => {
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [templateToSave, setTemplateToSave] =
        useState<Partial<MealTemplate> | null>(null);

    // Load templates from storage on mount if not already loaded (fallback for offline/initial)
    useEffect(() => {
        const loadTemplates = async () => {
            if (mealTemplates && mealTemplates.length > 0) return;

            try {
                const stored = await storage.get('lucas-meal-templates-v1');
                if (stored?.value) {
                    setMealTemplates(JSON.parse(stored.value));
                }
            } catch (err) {
                console.log('Using default templates');
            }
        };
        if (storage && !useCloud) {
            loadTemplates();
        }
    }, [storage, useCloud]);

    // Save templates to storage
    const saveTemplatesToLocal = async (templates: MealTemplate[]) => {
        setMealTemplates(templates);
        try {
            await storage.set('lucas-meal-templates-v1', JSON.stringify(templates));
        } catch (err) {
            console.error('Error saving templates to local:', err);
        }
    };

    // Add food from template
    const addFromTemplate = async (template: MealTemplate) => {
        const now = new Date();
        const time = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: ARGENTINA_TZ,
        });

        const entry: FoodEntry = {
            id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: selectedFoodDate,
            time,
            meal: template.meal,
            name: template.name,
            description: template.description || '',
            calories: template.calories,
            protein: template.protein,
            carbs: template.carbs,
            fat: template.fat,
            fiber: template.fiber || 0,
            source: 'template',
            reviewed: true,
            confidence: 1,
            sourceId: template.id.startsWith('tpl-')
                ? template.id
                : `tpl-${template.id}`,
        };

        // Save to Supabase
        let finalEntry = entry;
        try {
            const savedEntry = await saveFoodEntry(entry);
            if (savedEntry?.id) {
                finalEntry = savedEntry;
            }
        } catch (saveErr) {
            console.error('Error saving template food to Supabase:', saveErr);
        }

        saveFoodLog([...foodLog, finalEntry]);
        setShowTemplatesModal(false);
        setSaveStatus(`✓ ${template.name}`);
        setTimeout(() => setSaveStatus(''), 2000);
    };

    // Confirm save template
    const confirmSaveTemplate = async () => {
        if (!templateToSave?.name) return;

        const newTemplate: MealTemplate = {
            id: `tpl-${Date.now()}`,
            name: templateToSave.name,
            meal: templateToSave.meal || 'Almuerzo',
            description: templateToSave.description || '',
            calories: templateToSave.calories || 0,
            protein: templateToSave.protein || 0,
            carbs: templateToSave.carbs || 0,
            fat: templateToSave.fat || 0,
            fiber: templateToSave.fiber || 0,
        };

        // Optimistic update
        const updatedTemplates = [...mealTemplates, newTemplate];
        saveTemplatesToLocal(updatedTemplates);

        // Save to Supabase if cloud enabled
        if (useCloud && saveTemplate) {
            try {
                const result = await saveTemplate(newTemplate);
                if (result?.data) {
                    // Replace optimistic temp ID with DB ID
                    setMealTemplates((prev) =>
                        prev.map((t) =>
                            t.id === newTemplate.id ? result.data! : t,
                        ),
                    );
                    // Update local storage again with DB ID
                    const finalTemplates = updatedTemplates.map((t) =>
                        t.id === newTemplate.id ? result.data! : t,
                    );
                    storage.set(
                        'lucas-meal-templates-v1',
                        JSON.stringify(finalTemplates),
                    );
                }
            } catch (err) {
                console.error('Error saving template to Supabase:', err);
            }
        }

        setShowSaveTemplateModal(false);
        setTemplateToSave(null);
        setSaveStatus('✓ Plantilla guardada');
        setTimeout(() => setSaveStatus(''), 2000);
    };

    // Delete template
    const deleteTemplate = async (id: string) => {
        // Optimistic delete
        const updatedTemplates = mealTemplates.filter((t) => t.id !== id);
        saveTemplatesToLocal(updatedTemplates);

        // Delete from Supabase if cloud enabled
        if (useCloud && deleteTemplateDb) {
            try {
                await deleteTemplateDb(id);
            } catch (err) {
                console.error('Error deleting template from Supabase:', err);
            }
        }
    };

    return {
        mealTemplates,
        setMealTemplates,
        showTemplatesModal,
        setShowTemplatesModal,
        showSaveTemplateModal,
        setShowSaveTemplateModal,
        templateToSave,
        setTemplateToSave,
        saveAsTemplate: (food: FoodEntry) => {
            setTemplateToSave({
                name: food.name,
                meal: food.meal,
                description: food.description || '',
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                fiber: food.fiber || 0,
            });
            setShowSaveTemplateModal(true);
        },
        confirmSaveTemplate,
        deleteTemplate,
        addFromTemplate,
    };
};
