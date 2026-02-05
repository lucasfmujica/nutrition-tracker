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
        <div className="bg-surface p-8 rounded-[2.5rem] shadow-xl border border-border w-full group transition-all duration-300 hover:border-amber-100 dark:hover:border-amber-800">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/40 rounded-xl">
                        <Dumbbell className="text-amber-500 dark:text-amber-400 w-5 h-5 transition-transform group-hover:rotate-12" />
                    </div>
                    <h3 className="text-text-primary font-bold text-xl tracking-tight">
                        {t('dashboard.trainingWidget.title')}
                    </h3>
                </div>
                <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.15em] border border-amber-200/50 dark:border-amber-700/50">
                    {t('dashboard.trainingWidget.activity')}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 border border-amber-100 dark:border-amber-800 shadow-sm relative overflow-hidden group hover:bg-amber-100/50 dark:hover:bg-amber-800/40 transition-colors">
                    <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Dumbbell size={24} className="text-amber-500 dark:text-amber-400" />
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-1 uppercase">
                        {t('dashboard.trainingWidget.gym')}
                    </div>
                    <div className="text-2xl font-black text-amber-900 dark:text-amber-300 leading-none mt-1">
                        {gymCount}
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 border border-blue-100 dark:border-blue-800 shadow-sm relative overflow-hidden group hover:bg-blue-100/50 dark:hover:bg-blue-800/40 transition-colors">
                    <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Clock size={24} className="text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold mt-1 uppercase">
                        {t('units.min')}
                    </div>
                    <div className="text-2xl font-black text-blue-900 dark:text-blue-300 leading-none mt-1">
                        {minutes}
                    </div>
                </div>
            </div>

            <div className="bg-background rounded-lg p-2 flex items-center gap-2 border border-border">
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
                                className="text-amber-500 mt-0.5 flex-shrink-0"
                            />
                            <span>{line}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
