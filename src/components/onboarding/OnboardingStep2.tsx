import React from 'react';
import { useTranslation } from 'react-i18next';

interface OnboardingStep2Props {
    data: {
        calorieGoal: string;
        proteinGoal: string;
        carbsGoal: string;
        fatGoal: string;
        [key: string]: any;
    };
    handlers: {
        updateField: (field: string, value: any) => void;
        handleAutoCalculate: () => void;
    };
}

export const OnboardingStep2: React.FC<OnboardingStep2Props> = ({
    data,
    handlers,
}) => {
    const { t } = useTranslation();
    const { updateField, handleAutoCalculate } = handlers;

    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">🎯</span>
                <h2 className="text-xl font-bold text-white">
                    {t('onboarding.step2.title')}
                </h2>
                <p className="text-sm text-text-tertiary mt-1">
                    {t('onboarding.step2.autoCalculate')}
                </p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-info/10 border border-primary/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-text-tertiary">
                        {t('onboarding.step2.title')}
                    </span>
                    <button
                        onClick={handleAutoCalculate}
                        className="text-xs text-primary hover:opacity-80">
                        🔄 {t('onboarding.step2.autoCalculate')}
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                        {
                            label: t('onboarding.step2.calorieGoal'),
                            field: 'calorieGoal',
                            unit: 'kcal',
                        },
                        {
                            label: t('onboarding.step2.proteinGoal'),
                            field: 'proteinGoal',
                            unit: 'g',
                        },
                        {
                            label: t('onboarding.step2.carbsGoal'),
                            field: 'carbsGoal',
                            unit: 'g',
                        },
                        {
                            label: t('onboarding.step2.fatGoal'),
                            field: 'fatGoal',
                            unit: 'g',
                        },
                    ].map(({ label, field, unit }) => (
                        <div key={field}>
                            <input
                                type="number"
                                value={data[field]}
                                onChange={(e) => updateField(field, e.target.value)}
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-2 py-2 text-white text-center text-lg font-bold"
                            />
                            <span className="text-xs text-text-tertiary">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                <p className="text-xs text-text-tertiary leading-relaxed">
                    {t('onboarding.step2.tip')}
                </p>
            </div>
        </div>
    );
};
