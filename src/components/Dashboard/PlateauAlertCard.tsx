import { AlertTriangle, RefreshCw, TrendingDown } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface PlateauAction {
    type: 'refeed' | 'deficit';
    calories: number;
    duration: number;
}

export interface PlateauOption {
    id: string;
    label: string;
    description: string;
    action: PlateauAction;
}

export interface PlateauSuggestion {
    type: string;
    message: string;
    options: PlateauOption[];
}

export interface PlateauData {
    isInPlateau: boolean;
    plateauWeeks: number;
    suggestion: PlateauSuggestion | null;
    suggestedAction: string | null;
    weeklyAverages: { week1: number | null; week2: number | null };
    variance: number | null;
}

interface PlateauAlertCardProps {
    plateauData: PlateauData | null;
    onApplyAction?: (action: PlateauAction) => void;
}

/**
 * PlateauAlertCard - Alert UI for weight plateau detection
 */
export const PlateauAlertCard: React.FC<PlateauAlertCardProps> = ({
    plateauData,
    onApplyAction,
}) => {
    const { t } = useTranslation();
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    if (!plateauData?.isInPlateau || !plateauData?.suggestion) {
        return null;
    }

    const { suggestion } = plateauData;

    const handleApply = (option: PlateauOption) => {
        setSelectedOption(option.id);
        if (onApplyAction) {
            onApplyAction(option.action);
        }
    };

    return (
        <div className="bg-warning-soft rounded-card border border-warning/30 p-6 shadow-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-warning/20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-warning/20 rounded-control flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-text-primary">
                        {t('dashboard.plateau.detected')}
                    </h3>
                    <p className="text-xs text-warning mt-0.5">
                        {suggestion.message || t('dashboard.plateau.suggestion')}
                    </p>
                </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
                {suggestion.options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleApply(option)}
                        disabled={selectedOption !== null}
                        className={`w-full flex items-center gap-3 p-3 rounded-control border transition-all text-left ${
                            selectedOption === option.id
                                ? 'bg-warning border-warning text-white'
                                : selectedOption !== null
                                  ? 'bg-background border-border text-text-tertiary cursor-not-allowed'
                                  : 'bg-surface border-warning/30 hover:border-warning/60 hover:shadow-sm'
                        }`}>
                        <div
                            className={`flex items-center justify-center w-8 h-8 rounded-control ${
                                selectedOption === option.id
                                    ? 'bg-white/20'
                                    : 'bg-warning-soft'
                            }`}>
                            {option.id === 'refeed' ? (
                                <RefreshCw
                                    className={`w-4 h-4 ${
                                        selectedOption === option.id
                                            ? 'text-white'
                                            : 'text-warning'
                                    }`}
                                />
                            ) : (
                                <TrendingDown
                                    className={`w-4 h-4 ${
                                        selectedOption === option.id
                                            ? 'text-white'
                                            : 'text-warning'
                                    }`}
                                />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span
                                className={`block text-sm font-semibold ${
                                    selectedOption === option.id
                                        ? 'text-white'
                                        : 'text-text-primary'
                                }`}>
                                {option.label}
                            </span>
                            <span
                                className={`block text-xs truncate ${
                                    selectedOption === option.id
                                        ? 'text-white/80'
                                        : 'text-warning'
                                }`}>
                                {option.description}
                            </span>
                        </div>
                        {selectedOption === option.id && (
                            <span className="text-xs font-bold text-white/80 ml-auto flex-shrink-0 whitespace-nowrap">
                                {t('dashboard.plateau.applied')} ✓
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Info */}
            <p className="text-[10px] text-warning/70 mt-3 text-center">
                {t('dashboard.plateau.basedOn')}
            </p>
        </div>
    );
};
