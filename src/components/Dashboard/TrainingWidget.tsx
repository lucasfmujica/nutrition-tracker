import { Clock, Dumbbell, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface TrainingWidgetProps {
    gymCount: number;
    tennisCount: number;
    totalDuration: number;
    analysis?: string[];
}

export const TrainingWidget: React.FC<TrainingWidgetProps> = ({
    gymCount,
    totalDuration: minutes,
    analysis = [],
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-surface p-8 rounded-card shadow-card border border-border w-full group transition-all duration-300 hover:border-warning/30">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning-soft rounded-control">
                        <Dumbbell className="text-warning w-5 h-5 transition-transform group-hover:rotate-12" />
                    </div>
                    <h3 className="text-text-primary font-bold text-xl tracking-tight">
                        {t('dashboard.trainingWidget.title')}
                    </h3>
                </div>
                <span className="bg-warning-soft text-warning text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.15em] border border-warning/30">
                    {t('dashboard.trainingWidget.activity')}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-warning-soft rounded-control p-3 border border-warning/20 shadow-sm relative overflow-hidden group hover:bg-warning/20 transition-colors">
                    <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Dumbbell size={24} className="text-warning" />
                    </div>
                    <div className="text-[10px] text-warning font-bold mt-1 uppercase">
                        {t('dashboard.trainingWidget.gym')}
                    </div>
                    <div className="text-2xl font-black text-text-primary leading-none mt-1">
                        {gymCount}
                    </div>
                </div>

                <div className="bg-primary-soft rounded-control p-3 border border-primary/20 shadow-sm relative overflow-hidden group hover:bg-primary/20 transition-colors">
                    <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Clock size={24} className="text-primary" />
                    </div>
                    <div className="text-[10px] text-primary font-bold mt-1 uppercase">
                        {t('units.min')}
                    </div>
                    <div className="text-2xl font-black text-text-primary leading-none mt-1">
                        {minutes}
                    </div>
                </div>
            </div>

            <div className="bg-background rounded-control p-2 flex items-center gap-2 border border-border">
                <p className="text-[10px] text-text-tertiary italic">
                    {t('dashboard.trainingWidget.keepMoving')}
                </p>
            </div>

            {analysis && analysis.length > 0 && (
                <div className="space-y-2 pt-4 mt-4 border-t border-border">
                    {analysis.map((line: string, i: number) => (
                        <div
                            key={i}
                            className="flex items-start gap-2 text-xs text-text-secondary">
                            <Zap
                                size={12}
                                className="text-warning mt-0.5 flex-shrink-0"
                            />
                            <span>{line}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
