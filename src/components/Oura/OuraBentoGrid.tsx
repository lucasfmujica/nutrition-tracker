import { Activity, Flame, Footprints, Heart, Moon, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface OuraData {
    date: string;
    readinessScore?: number;
    sleepScore?: number;
    activityScore?: number;
    hrv?: number;
    restingHr?: number;
    sleepHours?: number;
    deepSleepMins?: number;
    remSleepMins?: number;
    steps?: number;
    active_calories?: number;
}

interface OuraBentoGridProps {
    data: OuraData | null;
    stepGoal?: number;
}

export const OuraBentoGrid: React.FC<OuraBentoGridProps> = ({
    data,
    stepGoal = 10000,
}) => {
    const { t } = useTranslation();

    if (!data) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    📭
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-1">
                    {t('oura.setup.noData')}
                </h3>
                <p className="text-gray-500 text-sm">{t('oura.setup.syncPrompt')}</p>
            </div>
        );
    }

    const {
        readinessScore,
        sleepScore,
        activityScore,
        hrv,
        restingHr,
        sleepHours,
        deepSleepMins,
        remSleepMins,
        steps,
    } = data;

    const getScoreColor = (score?: number) => {
        if (!score) return 'text-gray-400';
        if (score >= 85) return 'text-green-500';
        if (score >= 70) return 'text-amber-500';
        return 'text-red-500';
    };

    const formatMins = (mins?: number) => {
        if (!mins) return '--';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <div className="space-y-4">
            {/* Hero Card: Readiness */}
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 rounded-full mix-blend-overlay filter blur-2xl opacity-20 -ml-10 -mb-10"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                <Zap className="w-5 h-5 text-yellow-300" />
                            </div>
                            <span className="font-bold text-sm tracking-wide text-indigo-100">
                                {t('oura.metrics.readiness').toUpperCase()}
                            </span>
                        </div>
                        {readinessScore !== undefined && readinessScore >= 85 && (
                            <span className="px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-[10px] font-bold uppercase tracking-wider">
                                {t('oura.metrics.ideal')}
                            </span>
                        )}
                    </div>

                    <div className="flex items-end gap-1 mb-8">
                        <span className="text-6xl font-bold tracking-tighter">
                            {readinessScore || '--'}
                        </span>
                        <span className="text-lg text-indigo-300 mb-2">/100</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                                <Heart className="w-3.5 h-3.5 text-rose-400" />
                                <span className="text-xs text-indigo-200">HRV</span>
                            </div>
                            <span className="text-xl font-bold">{hrv || '--'}</span>
                            <span className="text-[10px] text-indigo-300 ml-1">
                                ms
                            </span>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity className="w-3.5 h-3.5 text-rose-400" />
                                <span className="text-xs text-indigo-200">
                                    {t('oura.metrics.restingHR')}
                                </span>
                            </div>
                            <span className="text-xl font-bold">
                                {restingHr || '--'}
                            </span>
                            <span className="text-[10px] text-indigo-300 ml-1">
                                bpm
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 opacity-80" />

                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Moon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm text-gray-700">
                                {t('oura.metrics.sleep').toUpperCase()}
                            </span>
                        </div>
                        <span
                            className={`text-xl font-bold ${getScoreColor(sleepScore)}`}>
                            {sleepScore || '--'}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-bold text-gray-900">
                            {sleepHours || '--'}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                            {t('oura.metrics.hours')}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>{' '}
                                {t('oura.metrics.deep')}
                            </span>
                            <span className="font-bold text-gray-900">
                                {formatMins(deepSleepMins)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>{' '}
                                {t('oura.metrics.rem')}
                            </span>
                            <span className="font-bold text-gray-900">
                                {formatMins(remSleepMins)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-colors">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-500 opacity-80" />

                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Flame className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm text-gray-700">
                                {t('oura.metrics.activity').toUpperCase()}
                            </span>
                        </div>
                        <span
                            className={`text-xl font-bold ${getScoreColor(activityScore)}`}>
                            {activityScore || '--'}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Footprints className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                    {t('oura.metrics.steps')}
                                </span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                                {steps ? steps.toLocaleString() : '--'}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                            <div
                                className="bg-orange-500 h-1.5 rounded-full"
                                style={{
                                    width: `${Math.min(100, ((steps || 0) / stepGoal) * 100)}%`,
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 text-right">
                            {t('oura.metrics.target')}: {stepGoal.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
