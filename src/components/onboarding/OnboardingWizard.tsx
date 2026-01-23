import React, { useCallback, useEffect, useState } from 'react';
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
        // Step 1: Physical stats (no defaults for critical numbers)
        currentWeight: '',
        goalWeight: '',
        height: '',
        age: '',
        gender: 'male',
        // Step 2: Goals
        calorieGoal: '',
        proteinGoal: '',
        carbsGoal: '',
        fatGoal: '',
        // Step 3: Training & Devices
        trainingDaysPerWeek: 4,
        primaryGoal: 'maintain',
        activityLevel: 'moderate',
        hasOuraRing: false, // Multi-user: Oura Ring support
    });

    const totalSteps = 3;

    const updateField = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const calculateMacros = useCallback((data: any) => {
        const weight = parseFloat(data.currentWeight) || 70;
        const height = parseFloat(data.height) || 170;
        const age = parseFloat(data.age) || 30;
        const isMale = data.gender === 'male';

        let bmr = isMale
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;

        const multipliers: Record<string, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9,
        };
        const tdee = bmr * (multipliers[data.activityLevel] || 1.55);

        let calories = tdee;
        if (data.primaryGoal === 'lose') calories -= 500;
        if (data.primaryGoal === 'gain') calories += 300;

        return {
            calories: Math.round(calories),
            protein: Math.round((calories * 0.3) / 4),
            carbs: Math.round((calories * 0.4) / 4),
            fat: Math.round((calories * 0.3) / 9),
        };
    }, []);

    // Auto-recalculate on Step 2 entry or goal/activity change
    useEffect(() => {
        if (
            step === 2 &&
            formData.currentWeight &&
            formData.height &&
            formData.age
        ) {
            handleAutoCalculate();
        }
    }, [step, formData.primaryGoal, formData.activityLevel]);

    const handleAutoCalculate = () => {
        const suggested = calculateMacros(formData);
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
            // Maps to snake_case for Supabase
            await onComplete({
                current_weight: parseFloat(formData.currentWeight) || null,
                goal_weight: parseFloat(formData.goalWeight) || null,
                height: parseFloat(formData.height) || null,
                age: parseInt(formData.age) || null,
                gender: formData.gender, // string
                calorie_goal: parseInt(formData.calorieGoal) || 2200,
                protein_goal: parseInt(formData.proteinGoal) || 150,
                carbs_goal: parseInt(formData.carbsGoal) || 220,
                fat_goal: parseInt(formData.fatGoal) || 73,
                training_days_per_week: formData.trainingDaysPerWeek,
                primary_goal: formData.primaryGoal, // string
                activity_level: formData.activityLevel, // string
                has_oura_ring: formData.hasOuraRing, // Multi-user: Oura Ring support
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
            return formData.currentWeight && formData.height && formData.age;
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
