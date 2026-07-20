import { useTranslation } from 'react-i18next';
export interface AdherenceData {
    score: number;
    calOkDays: number;
    protOkDays: number;
    stepsOkDays: number;
    daysTracked: number;
}

interface AdherenceCardProps {
    data: AdherenceData;
    label: string;
}

/**
 * AdherenceCard - Weekly adherence score display
 */
export const AdherenceCard: React.FC<AdherenceCardProps> = ({ data, label }) => {
    const { t } = useTranslation();
    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-primary';
        if (score >= 6) return 'text-warning';
        return 'text-danger';
    };

    return (
        <div className="bg-surface rounded-control p-3 border border-border">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-text-tertiary">{label}</h4>
                <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>
                    {data.score}/10
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                    <div className="text-primary font-bold">
                        {data.calOkDays}/{data.daysTracked}
                    </div>
                    <div className="text-text-tertiary">
                        {t('dashboard.adherence.calOk')}
                    </div>
                </div>
                <div>
                    <div className="text-protein font-bold">
                        {data.protOkDays}/{data.daysTracked}
                    </div>
                    <div className="text-text-tertiary">
                        {t('dashboard.adherence.protOk')}
                    </div>
                </div>
                <div>
                    <div className="text-info font-bold">
                        {data.stepsOkDays}/{data.daysTracked}
                    </div>
                    <div className="text-text-tertiary">
                        {t('dashboard.adherence.stepsOk')}
                    </div>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
