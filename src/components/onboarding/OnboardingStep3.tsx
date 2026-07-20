import React from 'react';
import { useTranslation } from 'react-i18next';

interface OnboardingStep3Props {
    data: {
        trainingDaysPerWeek: number;
        currentWeight: string;
        calorieGoal: string;
        proteinGoal: string;
        hasOuraRing?: boolean;
        primaryGoal?: string;
        [key: string]: any;
    };
    handlers: {
        updateField: (field: string, value: any) => void;
    };
}

export const OnboardingStep3: React.FC<OnboardingStep3Props> = ({
    data,
    handlers,
}) => {
    const { t } = useTranslation();
    const { updateField } = handlers;

    const getGoalLabel = (goal?: string) => {
        if (!goal) return '-';
        return t(`onboarding.step3.goals.${goal}`);
    };

    const getGoalEmoji = (goal?: string) => {
        switch (goal) {
            case 'lose':
                return '📉';
            case 'gain':
                return '📈';
            case 'maintain':
                return '⚖️';
            default:
                return '🎯';
        }
    };

    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">🏋️</span>
                <h2 className="text-xl font-bold text-text-primary">
                    {t('onboarding.step3.title')}
                </h2>
                <p className="text-sm text-text-tertiary mt-1">
                    {t('onboarding.step3.subtitle')}
                </p>
            </div>

            {/* Goal Selection */}
            <div>
                <label className="block text-sm text-text-tertiary mb-3">
                    {t('onboarding.step3.goal')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {['lose', 'maintain', 'gain'].map((goalValue) => (
                        <button
                            key={goalValue}
                            onClick={() => updateField('primaryGoal', goalValue)}
                            className={`p-3 rounded-xl text-center transition-all ${
                                data.primaryGoal === goalValue
                                    ? 'bg-gradient-to-br from-primary to-accent-blue text-white'
                                    : 'bg-background text-text-tertiary hover:bg-surface-lighter border border-border'
                            }`}>
                            <span className="text-xl block mb-1">
                                {getGoalEmoji(goalValue)}
                            </span>
                            <span className="font-bold text-sm">
                                {t(`onboarding.step3.goals.${goalValue}`)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Goal Weight (solo si quiere bajar o subir) */}
            {(data.primaryGoal === 'lose' || data.primaryGoal === 'gain') && (
                <div>
                    <label className="block text-sm text-text-tertiary mb-1.5">
                        {t('onboarding.step3.goalWeight')} (
                        {data.unitSystem === 'imperial' ? 'lbs' : 'kg'})
                    </label>
                    <input
                        type="number"
                        value={data.goalWeight}
                        onChange={(e) => updateField('goalWeight', e.target.value)}
                        placeholder={(() => {
                            const w = parseFloat(data.currentWeight);
                            if (!w) return '';
                            const isImperial = data.unitSystem === 'imperial';
                            const delta =
                                data.primaryGoal === 'lose'
                                    ? isImperial ? -11 : -5
                                    : isImperial ? 6.6 : 3;
                            return String(Math.round((w + delta) * 10) / 10);
                        })()}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-center text-lg placeholder-text-tertiary"
                    />
                    <p className="text-xs text-text-tertiary mt-1">
                        {t('onboarding.step3.goalWeightHint')}
                    </p>
                </div>
            )}

            <div>
                <label className="block text-sm text-text-tertiary mb-3">
                    {t('onboarding.step3.trainingDays')}
                </label>
                <div className="flex justify-between gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <button
                            key={day}
                            onClick={() => updateField('trainingDaysPerWeek', day)}
                            className={`w-10 h-10 rounded-xl font-bold transition-all ${
                                data.trainingDaysPerWeek === day
                                    ? 'bg-gradient-to-br from-primary to-accent-blue text-white'
                                    : 'bg-background text-text-tertiary hover:bg-surface-lighter border border-border'
                            }`}>
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Oura Ring Toggle */}
            <div className="mt-4">
                <label className="flex items-center gap-3 p-4 bg-background border border-border rounded-xl cursor-pointer hover:bg-surface-lighter transition-colors">
                    <input
                        type="checkbox"
                        checked={data.hasOuraRing || false}
                        onChange={(e) =>
                            updateField('hasOuraRing', e.target.checked)
                        }
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-surface"
                    />
                    <div className="flex-1">
                        <span className="text-text-primary font-medium">
                            {t('onboarding.step3.hasOuraRing')}
                        </span>
                        <p className="text-xs text-text-tertiary mt-0.5">
                            {t('onboarding.step3.ouraDesc')}
                        </p>
                    </div>
                    <span className="text-2xl">💍</span>
                </label>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-background border border-border rounded-xl">
                <h3 className="font-semibold text-text-primary mb-3">
                    📋 {t('onboarding.step3.summary')}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-text-tertiary">
                        {t('onboarding.step3.summaryLabels.weight')}
                    </div>
                    <div className="text-text-primary font-medium">
                        {data.currentWeight || '-'}{' '}
                        {data.unitSystem === 'imperial' ? 'lbs' : 'kg'}
                    </div>
                    <div className="text-text-tertiary">
                        {t('onboarding.step3.summaryLabels.calories')}
                    </div>
                    <div className="text-text-primary font-medium">
                        {data.calorieGoal || '-'} kcal
                    </div>
                    <div className="text-text-tertiary">
                        {t('onboarding.step3.summaryLabels.protein')}
                    </div>
                    <div className="text-text-primary font-medium">
                        {data.proteinGoal || '-'}g
                    </div>
                    <div className="text-text-tertiary">
                        {t('onboarding.step3.summaryLabels.goal')}
                    </div>
                    <div className="text-text-primary font-medium">
                        {getGoalEmoji(data.primaryGoal)}{' '}
                        {getGoalLabel(data.primaryGoal)}
                    </div>
                    <div className="text-text-tertiary">
                        {t('onboarding.step3.summaryLabels.training')}
                    </div>
                    <div className="text-text-primary font-medium">
                        {data.trainingDaysPerWeek}{' '}
                        {t('onboarding.step3.summaryLabels.days')}
                    </div>
                    {data.hasOuraRing && (
                        <>
                            <div className="text-text-tertiary">
                                {t('onboarding.step3.summaryLabels.oura')}
                            </div>
                            <div className="text-success font-medium">
                                {t('onboarding.step3.summaryLabels.ouraActive')}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
