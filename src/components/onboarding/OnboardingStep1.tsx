import React from 'react';
import { useTranslation } from 'react-i18next';

interface OnboardingStep1Props {
    data: {
        name: string;
        currentWeight: string;
        height: string;
        age: string;
        gender: string;
        unitSystem: 'metric' | 'imperial';
    };
    handlers: {
        updateField: (field: string, value: any) => void;
    };
}

export const OnboardingStep1: React.FC<OnboardingStep1Props> = ({
    data,
    handlers,
}) => {
    const { t, i18n } = useTranslation();
    const { updateField } = handlers;

    return (
        <div className="space-y-5">
            {/* Language Selection */}
            <div className="flex justify-center gap-2 mb-6">
                <button
                    onClick={() => i18n.changeLanguage('es')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        i18n.language === 'es'
                            ? 'bg-primary-soft text-primary border border-primary/30'
                            : 'bg-background text-text-tertiary hover:text-text-primary border border-border'
                    }`}>
                    🇦🇷 ES
                </button>
                <button
                    onClick={() => i18n.changeLanguage('en')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        i18n.language === 'en'
                            ? 'bg-primary-soft text-primary border border-primary/30'
                            : 'bg-background text-text-tertiary hover:text-text-primary border border-border'
                    }`}>
                    🇺🇸 EN
                </button>
            </div>
            {/* Unit System Selection */}
            <div className="flex justify-center gap-2 mb-6">
                <button
                    onClick={() => updateField('unitSystem', 'metric')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        data.unitSystem === 'metric'
                            ? 'bg-primary-soft text-primary border border-primary/30'
                            : 'bg-background text-text-tertiary hover:text-text-primary border border-border'
                    }`}>
                    📏 Metric (kg/cm)
                </button>
                <button
                    onClick={() => updateField('unitSystem', 'imperial')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        data.unitSystem === 'imperial'
                            ? 'bg-primary-soft text-primary border border-primary/30'
                            : 'bg-background text-text-tertiary hover:text-text-primary border border-border'
                    }`}>
                    ⚖️ Imperial (lbs/ft)
                </button>
            </div>

            <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">👋</span>
                <h2 className="text-xl font-bold text-text-primary">
                    {t('onboarding.step1.greeting')}
                </h2>
                <p className="text-sm text-text-tertiary mt-1">
                    {t('onboarding.step1.title')}
                </p>
            </div>

            <div>
                <label className="block text-sm text-text-tertiary mb-1.5">
                    {t('onboarding.step1.name')} *
                </label>
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder={t('onboarding.step1.namePlaceholder')}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-lg placeholder-text-tertiary"
                />
            </div>

            <div className="text-center mt-8 mb-4 pt-4 border-t border-border">
                <h2 className="text-lg font-bold text-text-primary">
                    {t('onboarding.step1.physicalData')}
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-text-tertiary mb-1.5">
                        {t('onboarding.step1.currentWeight')} (
                        {data.unitSystem === 'metric' ? 'kg' : 'lbs'}) *
                    </label>
                    <input
                        type="number"
                        value={data.currentWeight}
                        onChange={(e) =>
                            updateField('currentWeight', e.target.value)
                        }
                        placeholder={data.unitSystem === 'metric' ? '75' : '165'}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-center text-lg placeholder-text-tertiary"
                    />
                </div>
                <div>
                    <label className="block text-sm text-text-tertiary mb-1.5">
                        {t('onboarding.step1.height')} (
                        {data.unitSystem === 'metric' ? 'cm' : 'in'}) *
                    </label>
                    <input
                        type="number"
                        value={data.height}
                        onChange={(e) => updateField('height', e.target.value)}
                        placeholder={data.unitSystem === 'metric' ? '175' : '69'}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-center text-lg placeholder-text-tertiary"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm text-text-tertiary mb-1.5">
                    {t('onboarding.step1.age')} *
                </label>
                <input
                    type="number"
                    value={data.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    placeholder="27"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-center text-lg placeholder-text-tertiary"
                />
            </div>

            <div>
                <label className="block text-sm text-text-tertiary mb-2">
                    {t('onboarding.step1.gender')} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => updateField('gender', 'male')}
                        className={`py-3 rounded-xl font-medium transition-all ${
                            data.gender === 'male'
                                ? 'bg-primary text-white'
                                : 'bg-background text-text-tertiary hover:bg-surface-lighter border border-border'
                        }`}>
                        👨 {t('onboarding.step1.male')}
                    </button>
                    <button
                        onClick={() => updateField('gender', 'female')}
                        className={`py-3 rounded-xl font-medium transition-all ${
                            data.gender === 'female'
                                ? 'bg-danger text-white'
                                : 'bg-background text-text-tertiary hover:bg-surface-lighter border border-border'
                        }`}>
                        👩 {t('onboarding.step1.female')}
                    </button>
                </div>
            </div>
        </div>
    );
};
