import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTutorial } from './TutorialProvider';
import { TutorialSpotlight } from './TutorialSpotlight';

/**
 * TutorialOverlay - Main tutorial UI component
 *
 * Renders:
 * - Semi-transparent backdrop
 * - Spotlight effect on target element
 * - Tooltip with step content
 * - Navigation controls
 * - Progress indicator
 */
export const TutorialOverlay: React.FC = () => {
    const {
        isActive,
        currentStep,
        currentStepData,
        totalSteps,
        nextStep,
        prevStep,
        skipTutorial,
    } = useTutorial();

    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    // Find target element and get its position
    useEffect(() => {
        if (!isActive || !currentStepData) {
            setTargetRect(null);
            return;
        }

        if (currentStepData.target === 'center') {
            setTargetRect(null);
            return;
        }

        const findTarget = () => {
            const element = document.querySelector(currentStepData.target as string);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            } else {
                setTargetRect(null);
            }
        };

        // Initial find
        findTarget();

        // Re-find on resize/scroll
        window.addEventListener('resize', findTarget);
        window.addEventListener('scroll', findTarget, true);

        return () => {
            window.removeEventListener('resize', findTarget);
            window.removeEventListener('scroll', findTarget, true);
        };
    }, [isActive, currentStepData]);

    if (!isActive || !currentStepData) {
        return null;
    }

    const isCentered = currentStepData.target === 'center' || !targetRect;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    // Calculate tooltip position with viewport clamping
    const getTooltipStyle = (): React.CSSProperties => {
        if (isCentered) {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: 'calc(100vw - 32px)',
                width: '320px',
            };
        }

        const padding = 12;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let style: React.CSSProperties = {
            position: 'fixed',
            maxWidth: windowWidth < 480 ? 'calc(100vw - 32px)' : '280px',
            zIndex: 10000,
        };

        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        let finalPosition = currentStepData.position;

        // Smart position correction: if top/bottom doesn't fit, flip it
        if (finalPosition === 'top' && targetRect.top < 150) {
            finalPosition = 'bottom';
        } else if (
            finalPosition === 'bottom' &&
            windowHeight - targetRect.bottom < 150
        ) {
            finalPosition = 'top';
        }

        // Base positions
        switch (finalPosition) {
            case 'top':
                style.bottom = windowHeight - targetRect.top + padding;
                style.left = targetCenterX;
                style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                style.top = targetRect.bottom + padding;
                style.left = targetCenterX;
                style.transform = 'translateX(-50%)';
                break;
            case 'left':
                style.right = windowWidth - targetRect.left + padding;
                style.top = targetCenterY;
                style.transform = 'translateY(-50%)';
                break;
            case 'right':
                style.left = targetRect.right + padding;
                style.top = targetCenterY;
                style.transform = 'translateY(-50%)';
                break;
        }

        // Horizontal clamping
        const width = windowWidth < 480 ? windowWidth - 32 : 280;
        const halfWidth = width / 2;

        if (finalPosition === 'top' || finalPosition === 'bottom') {
            if (targetCenterX - halfWidth < 16) {
                style.left = '16px';
                style.transform = 'none';
            } else if (targetCenterX + halfWidth > windowWidth - 16) {
                style.left = 'auto';
                style.right = '16px';
                style.transform = 'none';
            }
        } else {
            // Vertical clamping for left/right
            if (targetCenterY - 100 < 16) {
                style.top = '16px';
                style.transform = 'none';
            } else if (targetCenterY + 100 > windowHeight - 16) {
                style.top = 'auto';
                style.bottom = '16px';
                style.transform = 'none';
            }
        }

        return style;
    };

    return (
        <div className="fixed inset-0 z-[9999]">
            {/* Backdrop with spotlight cutout */}
            <TutorialSpotlight targetRect={targetRect} />

            {/* Tooltip */}
            <div
                style={getTooltipStyle()}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Image placeholder if exists */}
                {currentStepData.image && (
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <span className="text-4xl">
                            {currentStepData.id === 'welcome' && '👋'}
                            {currentStepData.id === 'fab-button' && '➕'}
                            {currentStepData.id === 'food-methods' && '📸'}
                            {currentStepData.id === 'diary-swipe' && '👆'}
                            {currentStepData.id === 'weight-prediction' && '📈'}
                            {currentStepData.id === 'complete' && '🎉'}
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {currentStepData.title}
                    </h3>
                    <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {currentStepData.description}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-100">
                    {/* Progress */}
                    <div className="flex items-center gap-1.5">
                        {totalSteps <= 8 ? (
                            Array.from({ length: totalSteps }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                        i === currentStep
                                            ? 'bg-primary w-3'
                                            : i < currentStep
                                              ? 'bg-primary/40'
                                              : 'bg-slate-200'
                                    }`}
                                />
                            ))
                        ) : (
                            <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                                <span className="text-primary font-bold">
                                    {currentStep + 1}
                                </span>
                                <span className="mx-0.5">/</span>
                                {totalSteps}
                            </span>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        {!isFirstStep && (
                            <button
                                onClick={prevStep}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ChevronLeft className="w-5 h-5 text-slate-500" />
                            </button>
                        )}

                        <button
                            onClick={nextStep}
                            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-1">
                            {isLastStep ? 'Empezar' : 'Siguiente'}
                            {!isLastStep && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Skip button - enlarged tap target for mobile */}
                <button
                    onClick={skipTutorial}
                    className="absolute top-1 right-1 p-3 flex items-center justify-center hover:bg-slate-100/50 rounded-xl transition-colors group"
                    aria-label="Cerrar tutorial">
                    <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </button>
            </div>
        </div>
    );
};
