import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { tutorialSteps, TutorialStep, getTotalSteps } from './tutorialSteps';

interface TutorialContextValue {
    isActive: boolean;
    currentStep: number;
    currentStepData: TutorialStep | null;
    totalSteps: number;
    startTutorial: () => void;
    endTutorial: () => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;
    skipTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

interface TutorialProviderProps {
    children: React.ReactNode;
    tutorialCompleted?: boolean;
    onComplete?: () => void;
    onNavigate?: (tabIndex: number) => void;
}

/**
 * TutorialProvider - Context provider for the guided tutorial system
 *
 * Features:
 * - Tracks tutorial progress
 * - Auto-starts for new users
 * - Handles step navigation
 * - Triggers tab navigation when steps require it
 */
export const TutorialProvider: React.FC<TutorialProviderProps> = ({
    children,
    tutorialCompleted = false,
    onComplete,
    onNavigate,
}) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const totalSteps = getTotalSteps();
    const currentStepData = isActive ? tutorialSteps[currentStep] : null;

    // Auto-start tutorial for new users
    useEffect(() => {
        if (!tutorialCompleted && !isActive) {
            // Delay to let the UI settle
            const timer = setTimeout(() => {
                setIsActive(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [tutorialCompleted, isActive]);

    // Handle navigation actions from steps
    useEffect(() => {
        if (isActive && currentStepData?.action?.type === 'navigate' && onNavigate) {
            const tabIndex = currentStepData.action.tab;
            if (tabIndex !== undefined) {
                onNavigate(tabIndex);
            }
        }
    }, [isActive, currentStep, currentStepData, onNavigate]);

    const startTutorial = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    const endTutorial = useCallback(() => {
        setIsActive(false);
        setCurrentStep(0);
        onComplete?.();
    }, [onComplete]);

    const nextStep = useCallback(() => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            endTutorial();
        }
    }, [currentStep, totalSteps, endTutorial]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    }, [currentStep]);

    const goToStep = useCallback((step: number) => {
        if (step >= 0 && step < totalSteps) {
            setCurrentStep(step);
        }
    }, [totalSteps]);

    const skipTutorial = useCallback(() => {
        endTutorial();
    }, [endTutorial]);

    return (
        <TutorialContext.Provider
            value={{
                isActive,
                currentStep,
                currentStepData,
                totalSteps,
                startTutorial,
                endTutorial,
                nextStep,
                prevStep,
                goToStep,
                skipTutorial,
            }}
        >
            {children}
        </TutorialContext.Provider>
    );
};

/**
 * Hook to access tutorial context
 */
export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};
