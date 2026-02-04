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
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-bold text-lg">
                    {t('dashboard.trainingWidget.title')}
                </h3>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {t('dashboard.trainingWidget.activity')}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 shadow-sm relative overflow-hidden group hover:bg-amber-100/50 transition-colors">
                    <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Dumbbell size={24} className="text-amber-500" />
                    </div>
                    <div className="text-[10px] text-amber-700 font-bold mt-1 uppercase">
                        {t('dashboard.trainingWidget.gym')}
                    </div>
                    <div className="text-2xl font-black text-amber-900 leading-none mt-1">
                        {gymCount}
                    </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 shadow-sm relative overflow-hidden group hover:bg-blue-100/50 transition-colors">
                    <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Clock size={24} className="text-blue-500" />
                    </div>
                    <div className="text-[10px] text-blue-700 font-bold mt-1 uppercase">
                        {t('units.min')}
                    </div>
                    <div className="text-2xl font-black text-blue-900 leading-none mt-1">
                        {minutes}
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-2 border border-slate-100">
                <p className="text-[10px] text-slate-500 italic">
                    {t('dashboard.trainingWidget.keepMoving')}
                </p>
            </div>

            {analysis && analysis.length > 0 && (
                <div className="space-y-2 pt-4 mt-4 border-t border-gray-50">
                    {analysis.map((line: string, i: number) => (
                        <div
                            key={i}
                            className="flex items-start gap-2 text-xs text-gray-600">
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
