import React from 'react';
import { useTranslation } from 'react-i18next';
import { StepsEntry } from '../../types/domain';
import { SimpleBarChart } from '../Charts/SimpleBarChart';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

interface StepsTabProps {
    stepsDate: string;
    setStepsDate: (date: string) => void;
    newSteps: string;
    setNewSteps: (steps: string) => void;
    addStepsEntry: () => void;
    weeklyData: any[];
    stepsLog: StepsEntry[];
    stepGoal: number;
}

/**
 * StepsTab - Steps tracking and history
 */
export const StepsTab: React.FC<StepsTabProps> = ({
    stepsDate,
    setStepsDate,
    newSteps,
    setNewSteps,
    addStepsEntry,
    weeklyData,
    stepsLog,
    stepGoal,
}) => {
    const { t } = useTranslation();

    return (
        <div className="w-full space-y-6">
            <div className="mb-2 px-1">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t('steps.title')}
                </h1>
                <p className="text-sm text-text-tertiary">{t('steps.subtitle')}</p>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
                <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        👟
                    </span>
                    {t('steps.addSteps')}
                </h2>
                <div className="mb-3">
                    <LukenFitDatePicker
                        selectedDate={stepsDate}
                        onChange={setStepsDate}
                        label={t('weight.date')}
                    />
                </div>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={newSteps}
                        onChange={(e) => setNewSteps(e.target.value)}
                        placeholder={t('steps.stepsPlaceholder')}
                        className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-lg font-black focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder-text-tertiary"
                    />
                    <button
                        onClick={addStepsEntry}
                        className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-orange-500/20 transition-all">
                        {t('steps.save')}
                    </button>
                </div>
            </div>

            <SimpleBarChart
                data={weeklyData}
                dataKey="steps"
                target={stepGoal}
                color="bg-cyan-500"
                label={t('steps.chartLabel')}
            />

            {stepsLog.length > 0 && (
                <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
                    <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                            📊
                        </span>
                        {t('steps.history')}
                    </h2>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {stepsLog.slice(0, 14).map((entry, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-text-tertiary font-medium">
                                        {entry.date}
                                    </span>
                                    {entry.source === 'oura' && (
                                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[9px] font-bold">
                                            OURA
                                        </span>
                                    )}
                                    {entry.source === 'ios-health' && (
                                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold">
                                            iOS
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`font-black text-base ${entry.steps >= stepGoal ? 'text-cyan-600' : 'text-text-tertiary'}`}>
                                    {entry.steps.toLocaleString()}
                                    <span className="text-[10px] font-bold ml-1 text-text-tertiary uppercase">
                                        {t('steps.unit')}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
