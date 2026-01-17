import { useEffect, useState } from 'react';
import { ARGENTINA_TZ } from '../utils/dateUtils';

export const useMealTemplates = ({
  storage,
  setSaveStatus,
  selectedFoodDate,
  saveFoodLog,
  foodLog,
  saveFoodEntry
}) => {
  const [mealTemplates, setMealTemplates] = useState([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateToSave, setTemplateToSave] = useState(null);

  // Load templates from storage on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const stored = await storage.get('lucas-meal-templates-v1');
        if (stored?.value) {
          setMealTemplates(JSON.parse(stored.value));
        }
      } catch (err) {
        console.log('Using default templates');
      }
    };
    if (storage) {
      loadTemplates();
    }
  }, [storage]);

  // Save templates to storage
  const saveTemplatesToStorage = async (templates) => {
    setMealTemplates(templates);
    try {
      await storage.set('lucas-meal-templates-v1', JSON.stringify(templates));
    } catch (err) {
      console.error('Error saving templates:', err);
    }
  };

  // Add food from template
  const addFromTemplate = async (template) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: ARGENTINA_TZ });

    const entry = {
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
      sourceId: `tpl-${Date.now()}`
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

  // Save current food as template
  const saveAsTemplate = (food) => {
    setTemplateToSave({
      name: food.name,
      meal: food.meal,
      description: food.description || '',
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber || 0
    });
    setShowSaveTemplateModal(true);
  };

  // Confirm save template
  const confirmSaveTemplate = () => {
    if (!templateToSave?.name) return;
    const newTemplate = {
      id: `tpl-${Date.now()}`,
      ...templateToSave
    };
    saveTemplatesToStorage([...mealTemplates, newTemplate]);
    setShowSaveTemplateModal(false);
    setTemplateToSave(null);
    setSaveStatus('✓ Plantilla guardada');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Delete template
  const deleteTemplate = (id) => {
    saveTemplatesToStorage(mealTemplates.filter(t => t.id !== id));
  };

  return {
    mealTemplates,
    setMealTemplates, // Exposed in case needed, but logic is mostly encapsulated
    showTemplatesModal,
    setShowTemplatesModal,
    showSaveTemplateModal,
    setShowSaveTemplateModal,
    templateToSave,
    setTemplateToSave,
    saveAsTemplate,
    confirmSaveTemplate,
    deleteTemplate,
    addFromTemplate
  };
};
