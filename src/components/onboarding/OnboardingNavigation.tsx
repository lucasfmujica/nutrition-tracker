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
                                ? 'bg-primary hover:bg-primary-dark text-white'
                                : 'bg-gray-700 text-text-tertiary cursor-not-allowed'
                        }`}>
                        {t('onboarding.navigation.next')} →
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-xl font-bold bg-success hover:opacity-90 text-white transition-all">
                        {isSubmitting
                            ? `⏳ ${t('onboarding.navigation.saving')}`
                            : `✓ ${t('onboarding.navigation.start')}`}
                    </button>
                )}
            </div>

            {/* Skip option */}
            <button
                onClick={handleSkip}
                className="w-full mt-4 py-2 text-text-tertiary hover:text-text-tertiary text-sm transition-colors">
                {t('onboarding.navigation.skip')} →
            </button>
        </>
    );
};
