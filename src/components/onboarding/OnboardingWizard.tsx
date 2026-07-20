import React, { useCallback, useEffect, useState } from 'react';
import { calculateMacros } from '../../utils/macroCalculator';
import { OnboardingHeader } from './OnboardingHeader';
import { OnboardingNavigation } from './OnboardingNavigation';
import { OnboardingStep1 } from './OnboardingStep1';
import { OnboardingStep2 } from './OnboardingStep2';
import { OnboardingStep3 } from './OnboardingStep3';

interface OnboardingWizardProps {
    onComplete: (data: any) => Promise<void>;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
    onComplete,
}) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        // Step 1: Physical stats
        name: '',
        currentWeight: '',
        height: '',
        age: '',
        gender: '',
        // Step 2: Goals (auto-calculated)
        calorieGoal: '',
        proteinGoal: '',
        carbsGoal: '',
        fatGoal: '',
        // Step 3: Training & Devices
        trainingDaysPerWeek: 4,
        primaryGoal: 'maintain',
        goalWeight: '', // vacío = usar la sugerencia (-5kg / +3kg según objetivo)
        hasOuraRing: false, // Multi-user: Oura Ring support
        unitSystem: 'metric' as 'metric' | 'imperial',
    });

    const totalSteps = 3;

    const updateField = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Convierte peso (lbs→kg) y altura (in→cm) si el usuario eligió imperial
    const toMetric = (data: any) => {
        const rawWeight = parseFloat(data.currentWeight);
        const rawHeight = parseFloat(data.height);
        const isImperial = data.unitSystem === 'imperial';
        return {
            weightKg: rawWeight
                ? Math.round((isImperial ? rawWeight / 2.20462 : rawWeight) * 10) / 10
                : null,
            heightCm: rawHeight
                ? Math.round((isImperial ? rawHeight * 2.54 : rawHeight) * 10) / 10
                : null,
        };
    };

    const handleCalculateMacros = useCallback((data: any) => {
        const { weightKg, heightCm } = toMetric(data);
        const age = parseFloat(data.age);
        if (!weightKg || !heightCm || !age || !data.gender) return null;

        return calculateMacros({
            weight: weightKg,
            height: heightCm,
            age,
            gender: data.gender,
            trainingDaysPerWeek: data.trainingDaysPerWeek || 4,
            primaryGoal: data.primaryGoal,
        });
    }, []);

    const handleAutoCalculate = () => {
        const suggested = handleCalculateMacros(formData);
        if (!suggested) return;
        setFormData((prev) => ({
            ...prev,
            calorieGoal: suggested.calories.toString(),
            proteinGoal: suggested.protein.toString(),
            carbsGoal: suggested.carbs.toString(),
            fatGoal: suggested.fat.toString(),
        }));
    };

    // Llenar macros al entrar al Paso 2 si todavía no hay valores
    useEffect(() => {
        if (step === 2 && !formData.calorieGoal) {
            handleAutoCalculate();
        }
    }, [step]);

    // Recalcular cuando cambian objetivo o días de entrenamiento (Paso 3 incluido).
    // No depende de `step` para no pisar ediciones manuales al navegar.
    useEffect(() => {
        if (step >= 2) {
            handleAutoCalculate();
        }
    }, [formData.primaryGoal, formData.trainingDaysPerWeek]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Siempre se persiste en métrico (kg/cm), sin importar el unitSystem elegido
            const { weightKg, heightCm } = toMetric(formData);
            const currentWeight = weightKg || 70;

            // Peso objetivo: lo que ingresó el usuario (en sus unidades), o inferido del objetivo
            const isImperial = formData.unitSystem === 'imperial';
            const rawGoalWeight = parseFloat(formData.goalWeight);
            let goalWeight = currentWeight;
            if (rawGoalWeight) {
                goalWeight = isImperial
                    ? Math.round((rawGoalWeight / 2.20462) * 10) / 10
                    : rawGoalWeight;
            } else if (formData.primaryGoal === 'lose') {
                goalWeight = currentWeight - 5; // sugerencia: -5kg
            } else if (formData.primaryGoal === 'gain') {
                goalWeight = currentWeight + 3; // sugerencia: +3kg
            }

            // Inferir activity_level basado en trainingDaysPerWeek
            let activityLevel = 'moderate';
            const days = formData.trainingDaysPerWeek;
            if (days <= 1) activityLevel = 'sedentary';
            else if (days <= 2) activityLevel = 'light';
            else if (days <= 4) activityLevel = 'moderate';
            else if (days <= 6) activityLevel = 'active';
            else activityLevel = 'very_active';

            // Maps to snake_case for Supabase
            await onComplete({
                name: formData.name,
                current_weight: currentWeight,
                goal_weight: goalWeight,
                height: heightCm,
                age: parseInt(formData.age) || null,
                gender: formData.gender,
                calorie_goal: parseInt(formData.calorieGoal) || 2200,
                protein_goal: parseInt(formData.proteinGoal) || 150,
                carbs_goal: parseInt(formData.carbsGoal) || 220,
                fat_goal: parseInt(formData.fatGoal) || 73,
                training_days_per_week: formData.trainingDaysPerWeek,
                primary_goal: formData.primaryGoal,
                activity_level: activityLevel,
                has_oura_ring: formData.hasOuraRing,
                unit_system: formData.unitSystem,
                onboarding_completed: true,
            });
        } catch (err) {
            console.error('Error saving onboarding:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceed = () => {
        if (step === 1)
            return (
                formData.name &&
                formData.currentWeight &&
                formData.height &&
                formData.age &&
                formData.gender
            );
        if (step === 2) return formData.calorieGoal;
        return true;
    };

    const handlers = {
        updateField,
        handleAutoCalculate,
        handleBack: () => setStep((p) => Math.max(p - 1, 1)),
        handleNext: () => setStep((p) => Math.min(p + 1, totalSteps)),
        handleSubmit,
        handleSkip: () => onComplete({ onboarding_completed: true }),
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <OnboardingHeader step={step} totalSteps={totalSteps} />

                <div className="bg-surface border border-border rounded-3xl p-6 shadow-card">
                    {step === 1 && (
                        <OnboardingStep1 data={formData} handlers={handlers} />
                    )}
                    {step === 2 && (
                        <OnboardingStep2 data={formData} handlers={handlers} />
                    )}
                    {step === 3 && (
                        <OnboardingStep3 data={formData} handlers={handlers} />
                    )}

                    <OnboardingNavigation
                        step={step}
                        totalSteps={totalSteps}
                        handlers={handlers}
                        canProceed={!!canProceed()}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>
        </div>
    );
};
