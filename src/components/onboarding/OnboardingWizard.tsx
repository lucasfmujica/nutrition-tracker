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
        gender: 'male',
        // Step 2: Goals (auto-calculated)
        calorieGoal: '',
        proteinGoal: '',
        carbsGoal: '',
        fatGoal: '',
        // Step 3: Training & Devices
        trainingDaysPerWeek: 4,
        primaryGoal: 'maintain',
        hasOuraRing: false, // Multi-user: Oura Ring support
        unitSystem: 'metric' as 'metric' | 'imperial',
    });

    const totalSteps = 3;

    const updateField = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCalculateMacros = useCallback((data: any) => {
        const weight = parseFloat(data.currentWeight) || 70;
        const height = parseFloat(data.height) || 170;
        const age = parseFloat(data.age) || 30;

        return calculateMacros({
            weight,
            height,
            age,
            gender: data.gender,
            trainingDaysPerWeek: data.trainingDaysPerWeek || 4,
            primaryGoal: data.primaryGoal,
        });
    }, []);

    // Auto-recalculate on Step 2 entry or when training days/goal change
    useEffect(() => {
        if (
            step === 2 &&
            formData.currentWeight &&
            formData.height &&
            formData.age
        ) {
            handleAutoCalculate();
        }
    }, [step, formData.primaryGoal, formData.trainingDaysPerWeek]);

    const handleAutoCalculate = () => {
        const suggested = handleCalculateMacros(formData);
        setFormData((prev) => ({
            ...prev,
            calorieGoal: suggested.calories.toString(),
            proteinGoal: suggested.protein.toString(),
            carbsGoal: suggested.carbs.toString(),
            fatGoal: suggested.fat.toString(),
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const currentWeight = parseFloat(formData.currentWeight) || 70;

            // Inferir goal_weight basado en primaryGoal
            let goalWeight = currentWeight;
            if (formData.primaryGoal === 'lose') {
                goalWeight = currentWeight - 5; // objetivo: -5kg
            } else if (formData.primaryGoal === 'gain') {
                goalWeight = currentWeight + 3; // objetivo: +3kg
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
                height: parseFloat(formData.height) || null,
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
                formData.age
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-4">
            {/* Font */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
      `}</style>

            <div className="w-full max-w-md">
                <OnboardingHeader step={step} totalSteps={totalSteps} />

                <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
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
