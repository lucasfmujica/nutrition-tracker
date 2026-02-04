import React from 'react';
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

    const { unitSystem } = useTracker();

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
                <h1 className="text-2xl font-bold text-gray-900">
                    {t('weight.title')}
                </h1>
                <p className="text-sm text-gray-500">{t('weight.subtitle')}</p>
            </div>

            {/* Entry Form */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
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
                                type="number"
                                step={getWeightInputStep(unitSystem)}
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder={
                                    unitSystem === 'imperial' ? '186.0' : '84.5'
                                }
                                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg min-w-0 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                            <span className="flex items-center text-gray-500 text-sm font-medium">
                                {unitLabel}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm min-w-0 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!weight}
                            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 transition-all">
                            {t('weight.save')}
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-2 px-1">{error}</p>}
            </div>

            {/* Progress Summary */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4">
                    {t('weight.progress')}
                </h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-xl font-bold text-gray-900">
                            {displayCurrentWeight}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">
                            {t('weight.current')} ({unitLabel})
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-xl font-bold text-blue-600">
                            {displayTargetWeight}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">
                            {t('weight.target')}
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-xl font-bold text-amber-500">
                            {displayRemaining}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">
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
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">
                        {t('weight.projection')}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <div className="text-xl font-bold text-gray-900">
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
                                <span className="text-xs font-normal text-gray-500">
                                    {unitLabel}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 font-medium mt-1">
                                {t('weight.perWeek')}
                            </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <div className="text-xl font-bold text-blue-600">
                                {weightProjection.weeksToGoal
                                    ? `${weightProjection.weeksToGoal} ${t('units.weeks', { defaultValue: 'sem' })}`
                                    : '-'}
                            </div>
                            <div className="text-xs text-gray-400 font-medium mt-1">
                                {t('weight.toGo')}
                            </div>
                        </div>
                    </div>

                    {weightProjection.formattedGoalDate && (
                        <div className="text-center p-2 bg-blue-900/20 rounded mb-3">
                            <span className="text-sm text-gray-300">
                                {t('weight.estimatedDate')}:{' '}
                            </span>
                            <span className="text-sm font-bold text-blue-400">
                                {weightProjection.formattedGoalDate}
                            </span>
                        </div>
                    )}

                    {weightProjection.coachMessage && (
                        <div className="p-3 rounded bg-blue-50 border border-blue-100">
                            <p className="text-sm text-blue-800 flex items-center justify-center gap-2">
                                <span className="text-lg">
                                    {(weightProjection.coachMessage as any).emoji}
                                </span>
                                {(weightProjection.coachMessage as any).text}
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-gray-500 mt-3 text-center">
                        {t('weight.trendDisclaimer')}
                    </p>
                </div>
            )}

            {/* Weight History */}
            {weightHistory.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">
                        {t('weight.history')}
                    </h2>
                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {weightHistory.map((entry, idx) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group">
                                <div className="flex flex-col">
                                    <span className="text-gray-900 font-bold">
                                        {entry.date}
                                    </span>
                                    {entry.timestamp && (
                                        <span className="text-xs text-gray-400 font-medium">
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
                                                className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-lg font-bold focus:border-blue-500 outline-none transition-all"
                                            />
                                            <button
                                                onClick={saveEditWeight}
                                                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                                ✓
                                            </button>
                                            <button
                                                onClick={cancelEditWeight}
                                                className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="text-right flex flex-col items-end">
                                                <span className="font-black text-xl text-gray-900">
                                                    {convertWeightForDisplay(
                                                        entry.weight,
                                                        unitSystem,
                                                    ).toFixed(1)}
                                                    <span className="text-xs font-medium text-gray-400 ml-1">
                                                        {unitLabel}
                                                    </span>
                                                </span>
                                                {idx < weightHistory.length - 1 && (
                                                    <span
                                                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${entry.weight < weightHistory[idx + 1].weight ? 'bg-blue-50 text-blue-600' : entry.weight > weightHistory[idx + 1].weight ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
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

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() =>
                                                        startEditWeight(entry.id)
                                                    }
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
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
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
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
