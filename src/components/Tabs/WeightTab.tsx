import { Scale } from 'lucide-react';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { useWeightForm } from '../../hooks/ui/useWeightForm';
import { Profile, WeightEntry, WeightProjection } from '../../types/domain';
import {
    convertWeightForDisplay,
    getWeightInputStep,
    getWeightUnit,
} from '../../utils/unitUtils';
import { WeightLineChart } from '../Charts/WeightLineChart';
import { EmptyState } from '../UI/EmptyState';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

interface WeightTabProps {
    // Data
    weightHistory: WeightEntry[];
    profile: Profile;
    getMostRecentWeight: (history: WeightEntry[]) => WeightEntry | null;
    getWeightChartData: any[];
    weightProjection: WeightProjection;
    // Editing
    editingWeightId: string | null;
    setEditingWeightId: (id: string | null) => void;
    editingWeightValue: string;
    setEditingWeightValue: (value: string) => void;
    startEditWeight: (id: string) => void;
    saveEditWeight: () => void;
    cancelEditWeight: () => void;
    // Delete
    confirmDelete: (type: string, id: string, name: string) => void;
    // Utilities
    formatTime: (timestamp: number | null) => string;
}

/**
 * WeightTab - Weight tracking and history
 */
export const WeightTab: React.FC<WeightTabProps> = ({
    weightHistory,
    profile,
    getMostRecentWeight,
    getWeightChartData,
    weightProjection,
    editingWeightId,
    editingWeightValue,
    setEditingWeightValue,
    startEditWeight,
    saveEditWeight,
    cancelEditWeight,
    confirmDelete,
    formatTime,
}) => {
    const { t } = useTranslation();
    const { weight, setWeight, time, setTime, date, setDate, error, handleSubmit } =
        useWeightForm() as any;

    const { unitSystem, isLoading } = useTracker();
    const weightInputRef = useRef<HTMLInputElement>(null);

    const currentWeight =
        getMostRecentWeight(weightHistory)?.weight || profile.currentWeight;

    // Convert for display
    const displayCurrentWeight = convertWeightForDisplay(
        currentWeight,
        unitSystem,
    ).toFixed(1);
    const displayTargetWeight = convertWeightForDisplay(
        profile.targetWeight,
        unitSystem,
    ).toFixed(1);
    const remainingVal = currentWeight - profile.targetWeight;
    const displayRemaining = Math.abs(
        convertWeightForDisplay(remainingVal, unitSystem),
    ).toFixed(1);

    // Determine sign for remaining (though remainingVal is raw diff, prompt used absolute in logic)
    // The original logic was: const remaining = (currentWeight - profile.targetWeight).toFixed(1);
    // If negative, it implies "gain needed"? Usually "Faltan" implies distance.

    const unitLabel = getWeightUnit(unitSystem);

    return (
        <div className="w-full space-y-6">
            <div className="mb-2 px-1">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t('weight.title')}
                </h1>
                <p className="text-sm text-text-tertiary">{t('weight.subtitle')}</p>
            </div>

            {/* Entry Form */}
            <div className="bg-surface rounded-card p-6 border border-border shadow-card">
                <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-control bg-primary-soft text-primary flex items-center justify-center">
                        ⚖️
                    </span>
                    {t('weight.newEntry')}
                </h2>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <div className="w-full sm:flex-1 sm:min-w-[140px]">
                            <LukenFitDatePicker
                                selectedDate={date}
                                onChange={setDate}
                                label={t('weight.date')}
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:flex-[1.5]">
                            <input
                                ref={weightInputRef}
                                type="number"
                                step={getWeightInputStep(unitSystem)}
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder={
                                    unitSystem === 'imperial' ? '186.0' : '84.5'
                                }
                                className="flex-1 bg-surface border border-border rounded-control px-4 py-3 text-lg min-w-0 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                            <span className="flex items-center text-text-tertiary text-sm font-medium">
                                {unitLabel}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="flex-1 bg-surface border border-border rounded-control px-4 py-3 text-sm min-w-0 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!weight}
                            className="bg-primary hover:bg-primary-dark active:bg-primary-dark disabled:opacity-50 px-6 py-3 rounded-control font-bold text-white shadow-glow transition-all min-h-[44px]">
                            {t('weight.save')}
                        </button>
                    </div>
                </div>
                {error && <p className="text-danger text-sm mt-2 px-1">{error}</p>}
            </div>

            {/* Progress Summary */}
            <div className="bg-surface rounded-card p-5 border border-border shadow-card">
                <h2 className="text-sm font-bold text-text-primary mb-4">
                    {t('weight.progress')}
                </h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-background rounded-control">
                        <div className="text-xl font-bold text-text-primary">
                            {displayCurrentWeight}
                        </div>
                        <div className="text-xs text-text-tertiary font-medium mt-1">
                            {t('weight.current')} ({unitLabel})
                        </div>
                    </div>
                    <div className="p-3 bg-background rounded-control">
                        <div className="text-xl font-bold text-primary">
                            {displayTargetWeight}
                        </div>
                        <div className="text-xs text-text-tertiary font-medium mt-1">
                            {t('weight.target')}
                        </div>
                    </div>
                    <div className="p-3 bg-background rounded-control">
                        <div className="text-xl font-bold text-warning">
                            {displayRemaining}
                        </div>
                        <div className="text-xs text-text-tertiary font-medium mt-1">
                            {t('weight.remaining')}
                        </div>
                    </div>
                </div>
            </div>

            {getWeightChartData && getWeightChartData.length > 1 && (
                <WeightLineChart
                    data={getWeightChartData}
                    targetWeight={profile.targetWeight}
                />
            )}

            {/* Projection */}
            {weightProjection && (
                <div className="bg-surface rounded-card p-5 border border-border shadow-card">
                    <h2 className="text-sm font-bold text-text-primary mb-4">
                        {t('weight.projection')}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-background rounded-control">
                            <div className="text-xl font-bold text-text-primary">
                                {weightProjection.adjustedTrend !== null &&
                                weightProjection.adjustedTrend !== undefined &&
                                Number.isFinite(weightProjection.adjustedTrend) ? (
                                    <>
                                        {weightProjection.adjustedTrend > 0
                                            ? '+'
                                            : ''}
                                        {convertWeightForDisplay(
                                            weightProjection.adjustedTrend,
                                            unitSystem,
                                        ).toFixed(1)}
                                    </>
                                ) : (
                                    '—'
                                )}{' '}
                                <span className="text-xs font-normal text-text-tertiary">
                                    {unitLabel}
                                </span>
                            </div>
                            <div className="text-xs text-text-tertiary font-medium mt-1">
                                {t('weight.perWeek')}
                            </div>
                        </div>
                        <div className="text-center p-3 bg-background rounded-control">
                            <div className="text-xl font-bold text-primary">
                                {weightProjection.weeksToGoal
                                    ? `${weightProjection.weeksToGoal} ${t('units.weeks', { defaultValue: 'sem' })}`
                                    : '-'}
                            </div>
                            <div className="text-xs text-text-tertiary font-medium mt-1">
                                {t('weight.toGo')}
                            </div>
                        </div>
                    </div>

                    {weightProjection.formattedGoalDate && (
                        <div className="text-center p-2 bg-primary-soft rounded-control mb-3">
                            <span className="text-sm text-text-tertiary">
                                {t('weight.estimatedDate')}:{' '}
                            </span>
                            <span className="text-sm font-bold text-primary">
                                {weightProjection.formattedGoalDate}
                            </span>
                        </div>
                    )}

                    {weightProjection.coachMessage && (
                        <div className="p-3 rounded-control bg-primary-soft border border-primary/20">
                            <p className="text-sm text-primary flex items-center justify-center gap-2">
                                <span className="text-lg">
                                    {(weightProjection.coachMessage as any).emoji}
                                </span>
                                {(weightProjection.coachMessage as any).text}
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-text-tertiary mt-3 text-center">
                        {t('weight.trendDisclaimer')}
                    </p>
                </div>
            )}

            {/* Empty state when no weight entries exist */}
            {!isLoading && weightHistory.length === 0 && (
                <div className="bg-surface rounded-card border border-border shadow-card">
                    <EmptyState
                        icon={Scale}
                        title={t('weight.empty.title')}
                        description={t('weight.empty.description')}
                        actionLabel={t('weight.empty.cta')}
                        onAction={() => {
                            weightInputRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                            });
                            weightInputRef.current?.focus();
                        }}
                    />
                </div>
            )}

            {/* Weight History */}
            {weightHistory.length > 0 && (
                <div className="bg-surface rounded-card p-6 border border-border shadow-card">
                    <h2 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-widest">
                        {t('weight.history')}
                    </h2>
                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {weightHistory.map((entry, idx) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between py-4 border-b border-border last:border-0 group">
                                <div className="flex flex-col">
                                    <span className="text-text-primary font-bold">
                                        {entry.date}
                                    </span>
                                    {entry.timestamp && (
                                        <span className="text-xs text-text-tertiary font-medium">
                                            {formatTime(entry.timestamp)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-6">
                                    {editingWeightId === entry.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={editingWeightValue}
                                                onChange={(e) =>
                                                    setEditingWeightValue(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-24 bg-background border border-border rounded-control px-3 py-2 text-lg font-bold focus:border-primary outline-none transition-all"
                                            />
                                            <button
                                                onClick={saveEditWeight}
                                                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                                                ✓
                                            </button>
                                            <button
                                                onClick={cancelEditWeight}
                                                className="w-8 h-8 rounded-full bg-surface-lighter text-text-tertiary flex items-center justify-center">
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="text-right flex flex-col items-end">
                                                <span className="font-black text-xl text-text-primary">
                                                    {convertWeightForDisplay(
                                                        entry.weight,
                                                        unitSystem,
                                                    ).toFixed(1)}
                                                    <span className="text-xs font-medium text-text-tertiary ml-1">
                                                        {unitLabel}
                                                    </span>
                                                </span>
                                                {idx < weightHistory.length - 1 && (
                                                    <span
                                                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${entry.weight < weightHistory[idx + 1].weight ? 'bg-primary-soft text-primary' : entry.weight > weightHistory[idx + 1].weight ? 'bg-danger-soft text-danger' : 'bg-background text-text-tertiary'}`}>
                                                        {entry.weight <
                                                        weightHistory[idx + 1].weight
                                                            ? '↓'
                                                            : entry.weight >
                                                                weightHistory[
                                                                    idx + 1
                                                                ].weight
                                                              ? '↑'
                                                              : '='}
                                                        {Math.abs(
                                                            convertWeightForDisplay(
                                                                entry.weight -
                                                                    weightHistory[
                                                                        idx + 1
                                                                    ].weight,
                                                                unitSystem,
                                                            ),
                                                        ).toFixed(1)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() =>
                                                        startEditWeight(entry.id)
                                                    }
                                                    className="w-10 h-10 flex items-center justify-center text-text-tertiary hover:text-primary hover:bg-primary-soft rounded-control transition-all">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        confirmDelete(
                                                            'weight',
                                                            entry.id,
                                                            `${convertWeightForDisplay(entry.weight, unitSystem).toFixed(1)} ${unitLabel} (${entry.date})`,
                                                        )
                                                    }
                                                    className="w-10 h-10 flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-danger-soft rounded-control transition-all">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
