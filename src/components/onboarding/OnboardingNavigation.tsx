import React from 'react';
import { useTranslation } from 'react-i18next';

interface OnboardingNavigationProps {
    step: number;
    totalSteps: number;
    handlers: {
        handleBack: () => void;
        handleNext: () => void;
        handleSubmit: () => void;
        handleSkip: () => void;
    };
    canProceed: boolean;
    isSubmitting: boolean;
}

/**
 * Navigation buttons for the Onboarding Wizard
 */
export const OnboardingNavigation: React.FC<OnboardingNavigationProps> = ({
    step,
    totalSteps,
    handlers,
    canProceed,
    isSubmitting,
}) => {
    const { t } = useTranslation();
    const { handleBack, handleNext, handleSubmit, handleSkip } = handlers;

    return (
        <>
            <div className="flex gap-3 mt-6">
                {step > 1 && (
                    <button
                        onClick={handleBack}
                        className="flex-1 py-3 rounded-xl font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                        ← {t('onboarding.navigation.back')}
                    </button>
                )}
                {step < totalSteps ? (
                    <button
                        onClick={handleNext}
                        disabled={!canProceed}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                            canProceed
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}>
                        {t('onboarding.navigation.next')} →
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all">
                        {isSubmitting
                            ? `⏳ ${t('onboarding.navigation.saving')}`
                            : `✓ ${t('onboarding.navigation.start')}`}
                    </button>
                )}
            </div>

            {/* Skip option */}
            <button
                onClick={handleSkip}
                className="w-full mt-4 py-2 text-gray-500 hover:text-gray-400 text-sm transition-colors">
                {t('onboarding.navigation.skip')} →
            </button>
        </>
    );
};
