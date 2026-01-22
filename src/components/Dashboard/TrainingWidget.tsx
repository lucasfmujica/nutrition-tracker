import { Clock, Dumbbell, Target, Zap } from 'lucide-react';
import React from 'react';

interface TrainingWidgetProps {
    gymCount: number;
    tennisCount: number;
    totalDuration: number;
    analysis?: string[];
}

export const TrainingWidget: React.FC<TrainingWidgetProps> = ({
    gymCount,
    tennisCount,
    totalDuration,
    analysis = [],
}) => {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-900 font-bold text-lg">
                    Entrenamiento Semanal
                </h3>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Actividad
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100/50">
                    <div className="flex justify-center mb-1">
                        <Dumbbell size={18} className="text-amber-600" />
                    </div>
                    <div className="text-xl font-black text-gray-900 leading-none">
                        {gymCount}
                    </div>
                    <div className="text-[10px] text-amber-700 font-bold mt-1 uppercase">
                        Gym
                    </div>
                </div>

                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100/50">
                    <div className="flex justify-center mb-1">
                        <Target size={18} className="text-green-600" />
                    </div>
                    <div className="text-xl font-black text-gray-900 leading-none">
                        {tennisCount}
                    </div>
                    <div className="text-[10px] text-green-700 font-bold mt-1 uppercase">
                        Tenis
                    </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100/50">
                    <div className="flex justify-center mb-1">
                        <Clock size={18} className="text-blue-600" />
                    </div>
                    <div className="text-xl font-black text-gray-900 leading-none">
                        {totalDuration}'
                    </div>
                    <div className="text-[10px] text-blue-700 font-bold mt-1 uppercase">
                        Min
                    </div>
                </div>
            </div>

            {analysis && analysis.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-50">
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
