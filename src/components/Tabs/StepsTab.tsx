import { Footprints } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { StepsEntry } from '../../types/domain';
import { SimpleBarChart } from '../Charts/SimpleBarChart';
import { EmptyState } from '../UI/EmptyState';
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
    const { isLoading } = useTracker();

    return (
        <div className="w-full space-y-6">
            <div className="mb-2 px-1">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t('steps.title')}
                </h1>
                <p className="text-sm text-text-tertiary">{t('steps.subtitle')}</p>
            </div>

            <div className="bg-surface rounded-card p-6 border border-border shadow-card">
                <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-control bg-info-soft text-info flex items-center justify-center">
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
                        className="flex-1 bg-background border border-border rounded-control px-4 py-3 text-lg font-black focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-text-tertiary"
                    />
                    <button
                        onClick={addStepsEntry}
                        className="bg-primary hover:bg-primary-dark active:bg-primary-dark px-8 py-3 rounded-control font-bold text-white shadow-glow transition-all min-h-[44px]">
                        {t('steps.save')}
                    </button>
                </div>
            </div>

            <SimpleBarChart
                data={weeklyData}
                dataKey="steps"
                target={stepGoal}
                color="bg-info"
                label={t('steps.chartLabel')}
            />

            {!isLoading && stepsLog.length === 0 && (
                <div className="bg-surface rounded-card border border-border shadow-card">
                    <EmptyState
                        icon={Footprints}
                        title={t('steps.empty.title')}
                        description={t('steps.empty.description')}
                    />
                </div>
            )}

            {stepsLog.length > 0 && (
                <div className="bg-surface rounded-card p-6 border border-border shadow-card">
                    <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-control bg-primary-soft text-primary flex items-center justify-center text-xs">
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
                                        <span className="px-1.5 py-0.5 rounded bg-oura-soft text-oura text-[9px] font-bold">
                                            OURA
                                        </span>
                                    )}
                                    {entry.source === 'ios-health' && (
                                        <span className="px-1.5 py-0.5 rounded bg-primary-soft text-primary text-[9px] font-bold">
                                            iOS
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`font-black text-base ${entry.steps >= stepGoal ? 'text-info' : 'text-text-tertiary'}`}>
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
