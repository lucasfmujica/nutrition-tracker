import React from 'react';
import { useTranslation } from 'react-i18next';

interface OnboardingStep1Props {
    data: {
        name: string;
        currentWeight: string;
        height: string;
        age: string;
        gender: string;
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
                            ? 'bg-white text-gray-900 shadow-lg shadow-white/10 scale-105'
                            : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                    }`}>
                    🇦🇷 ES
                </button>
                <button
                    onClick={() => i18n.changeLanguage('en')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        i18n.language === 'en'
                            ? 'bg-white text-gray-900 shadow-lg shadow-white/10 scale-105'
                            : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                    }`}>
                    🇺🇸 EN
                </button>
            </div>

            <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">👋</span>
                <h2 className="text-xl font-bold text-white">
                    {t('onboarding.step1.greeting')} {t('onboarding.step1.name')}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    {t('onboarding.step1.title')}
                </p>
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                    {t('onboarding.step1.name')} *
                </label>
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder={t('onboarding.step1.namePlaceholder')}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-lg"
                />
            </div>

            <div className="text-center mt-8 mb-4 pt-4 border-t border-gray-700/50">
                <h2 className="text-lg font-bold text-white">
                    {t('onboarding.step1.physicalData')}
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                        {t('onboarding.step1.currentWeight')} *
                    </label>
                    <input
                        type="number"
                        value={data.currentWeight}
                        onChange={(e) =>
                            updateField('currentWeight', e.target.value)
                        }
                        placeholder="75"
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                        {t('onboarding.step1.height')} *
                    </label>
                    <input
                        type="number"
                        value={data.height}
                        onChange={(e) => updateField('height', e.target.value)}
                        placeholder="175"
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                    {t('onboarding.step1.age')} *
                </label>
                <input
                    type="number"
                    value={data.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    placeholder="27"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg"
                />
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-2">
                    {t('onboarding.step1.gender')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => updateField('gender', 'male')}
                        className={`py-3 rounded-xl font-medium transition-all ${
                            data.gender === 'male'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                        }`}>
                        👨 {t('onboarding.step1.male')}
                    </button>
                    <button
                        onClick={() => updateField('gender', 'female')}
                        className={`py-3 rounded-xl font-medium transition-all ${
                            data.gender === 'female'
                                ? 'bg-pink-600 text-white'
                                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                        }`}>
                        👩 {t('onboarding.step1.female')}
                    </button>
                </div>
            </div>
        </div>
    );
};
