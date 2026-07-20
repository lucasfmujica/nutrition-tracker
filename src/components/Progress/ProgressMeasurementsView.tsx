/**
 * ProgressMeasurementsView - Body measurements tracking interface
 */

import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import {
    AlertCircle,
    Loader2,
    Minus,
    Ruler,
    Trash2,
    TrendingDown,
    TrendingUp,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBodyMeasurements } from '../../hooks/useBodyMeasurements';
import type { BodyMeasurement } from '../../types/domain';
import { getArgentinaDateString } from '../../utils/dateUtils';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

interface ProgressMeasurementsViewProps {
    userId: string | null;
}

export const ProgressMeasurementsView: React.FC<ProgressMeasurementsViewProps> = ({
    userId,
}) => {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;

    const {
        measurements,
        isLoading,
        error,
        latestMeasurement,
        saveMeasurement,
        deleteMeasurement,
    } = useBodyMeasurements({ userId });

    const [showForm, setShowForm] = useState(false);
    const [formDate, setFormDate] = useState(getArgentinaDateString());
    const [formData, setFormData] = useState<Partial<BodyMeasurement>>({});
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveMeasurement({ ...formData, date: formDate });
        setIsSaving(false);

        if (result) {
            setShowForm(false);
            setFormData({});
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(t('progress.measurements.deleteConfirm'))) {
            await deleteMeasurement(id);
        }
    };

    // Compare with previous measurement
    const getChange = (
        current: number | undefined,
        fieldName: keyof BodyMeasurement,
    ): { value: number; direction: 'up' | 'down' | 'same' } | null => {
        if (current === undefined || measurements.length < 2) return null;

        const previous = measurements[1]?.[fieldName] as number | undefined;
        if (previous === undefined) return null;

        const diff = current - previous;
        return {
            value: Math.abs(diff),
            direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
        };
    };

    return (
        <div className="space-y-4">
            {/* Add Button */}
            <button
                onClick={() => setShowForm(true)}
                className="w-full py-4 bg-oura hover:opacity-90 text-white font-bold rounded-card flex items-center justify-center gap-2 shadow-float transition-all active:scale-[0.98]">
                <Ruler size={20} />
                {t('progress.measurements.newMeasurement')}
            </button>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
                    <div className="bg-surface rounded-3xl p-6 w-full max-w-sm mb-20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-text-primary">
                                {t('progress.measurements.newMeasurement')}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-lighter text-text-tertiary">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-1.5">
                                    {t('progress.photos.date')}
                                </label>
                                <LukenFitDatePicker
                                    selectedDate={formDate}
                                    onChange={setFormDate}
                                    label=""
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <MeasurementInput
                                    label={t('progress.measurements.chest')}
                                    value={formData.chest}
                                    onChange={(v) =>
                                        setFormData({ ...formData, chest: v })
                                    }
                                />
                                <MeasurementInput
                                    label={t('progress.measurements.waist')}
                                    value={formData.waist}
                                    onChange={(v) =>
                                        setFormData({ ...formData, waist: v })
                                    }
                                />
                                <MeasurementInput
                                    label={t('progress.measurements.hips')}
                                    value={formData.hips}
                                    onChange={(v) =>
                                        setFormData({ ...formData, hips: v })
                                    }
                                />
                                <MeasurementInput
                                    label={t('progress.measurements.bicepsLeft')}
                                    value={formData.bicepsLeft}
                                    onChange={(v) =>
                                        setFormData({ ...formData, bicepsLeft: v })
                                    }
                                />
                                <MeasurementInput
                                    label={t('progress.measurements.bicepsRight')}
                                    value={formData.bicepsRight}
                                    onChange={(v) =>
                                        setFormData({ ...formData, bicepsRight: v })
                                    }
                                />
                                <MeasurementInput
                                    label={t('progress.measurements.thighLeft')}
                                    value={formData.thighLeft}
                                    onChange={(v) =>
                                        setFormData({ ...formData, thighLeft: v })
                                    }
                                />
                                <MeasurementInput
                                    label={t('progress.measurements.thighRight')}
                                    value={formData.thighRight}
                                    onChange={(v) =>
                                        setFormData({ ...formData, thighRight: v })
                                    }
                                />
                                <MeasurementInput
                                    label={t('progress.measurements.bodyFat')}
                                    value={formData.bodyFatPercent}
                                    onChange={(v) =>
                                        setFormData({
                                            ...formData,
                                            bodyFatPercent: v,
                                        })
                                    }
                                    unit="%"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-4 bg-oura hover:bg-oura disabled:bg-surface-lighter text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                {isSaving ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                        {t('progress.measurements.saving')}
                                    </>
                                ) : (
                                    t('progress.measurements.save')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-danger-soft text-danger px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-oura" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && measurements.length === 0 && (
                <div className="bg-surface rounded-2xl p-8 text-center border border-border">
                    <div className="w-16 h-16 bg-oura-soft rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ruler size={28} className="text-oura" />
                    </div>
                    <h3 className="font-bold text-text-primary mb-1">
                        {t('progress.measurements.noMeasurementsTitle')}
                    </h3>
                    <p className="text-sm text-text-tertiary">
                        {t('progress.measurements.noMeasurementsDesc')}
                    </p>
                </div>
            )}

            {/* Latest Measurement Card */}
            {latestMeasurement && (
                <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-bold text-text-primary">
                                {t('progress.measurements.latestMeasurement')}
                            </h3>
                            <p className="text-xs text-text-tertiary">
                                {format(
                                    parseISO(latestMeasurement.date),
                                    'd MMMM yyyy',
                                    { locale: dateLocale },
                                )}
                            </p>
                        </div>
                        <button
                            onClick={() => handleDelete(latestMeasurement.id)}
                            className="text-text-tertiary hover:text-danger p-2">
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <MeasurementRow
                            label={t('progress.measurements.chest')}
                            value={latestMeasurement.chest}
                            fieldName="chest"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label={t('progress.measurements.waist')}
                            value={latestMeasurement.waist}
                            fieldName="waist"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label={t('progress.measurements.hips')}
                            value={latestMeasurement.hips}
                            fieldName="hips"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label={t('progress.measurements.bicepsLeft')}
                            value={latestMeasurement.bicepsLeft}
                            fieldName="bicepsLeft"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label={t('progress.measurements.bicepsRight')}
                            value={latestMeasurement.bicepsRight}
                            fieldName="bicepsRight"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label={t('progress.measurements.thighLeft')}
                            value={latestMeasurement.thighLeft}
                            fieldName="thighLeft"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label={t('progress.measurements.thighRight')}
                            value={latestMeasurement.thighRight}
                            fieldName="thighRight"
                            getChange={getChange}
                        />
                        {latestMeasurement.bodyFatPercent && (
                            <MeasurementRow
                                label={t('progress.measurements.bodyFat')}
                                value={latestMeasurement.bodyFatPercent}
                                fieldName="bodyFatPercent"
                                unit="%"
                                getChange={getChange}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Measurement History */}
            {measurements.length > 1 && (
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-background">
                        <h3 className="font-bold text-text-primary">
                            {t('progress.measurements.history')}
                        </h3>
                    </div>
                    <div className="divide-y divide-border">
                        {measurements.slice(1).map((m) => (
                            <div
                                key={m.id}
                                className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-text-primary text-sm">
                                        {format(parseISO(m.date), 'd MMM yyyy', {
                                            locale: dateLocale,
                                        })}
                                    </p>
                                    <p className="text-xs text-text-tertiary">
                                        {m.waist &&
                                            `${t('progress.measurements.waist')}: ${m.waist}cm`}
                                        {m.waist && m.chest && ' · '}
                                        {m.chest &&
                                            `${t('progress.measurements.chest')}: ${m.chest}cm`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(m.id)}
                                    className="text-text-tertiary hover:text-danger p-2">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Components

const MeasurementRow: React.FC<{
    label: string;
    value: number | undefined;
    fieldName: keyof BodyMeasurement;
    unit?: string;
    getChange: (
        current: number | undefined,
        fieldName: keyof BodyMeasurement,
    ) => { value: number; direction: 'up' | 'down' | 'same' } | null;
}> = ({ label, value, fieldName, unit = 'cm', getChange }) => {
    const change = getChange(value, fieldName);

    return (
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="text-sm text-text-secondary">{label}</span>
            <div className="flex items-center gap-2">
                {value !== undefined ? (
                    <>
                        <span className="font-bold text-text-primary">
                            {value} {unit}
                        </span>
                        {change && (
                            <span
                                className={`flex items-center text-xs ${
                                    change.direction === 'down'
                                        ? 'text-success'
                                        : change.direction === 'up'
                                          ? 'text-danger'
                                          : 'text-text-tertiary'
                                }`}>
                                {change.direction === 'down' && (
                                    <TrendingDown size={12} />
                                )}
                                {change.direction === 'up' && (
                                    <TrendingUp size={12} />
                                )}
                                {change.direction === 'same' && <Minus size={12} />}
                                {change.value > 0 && ` ${change.value}`}
                            </span>
                        )}
                    </>
                ) : (
                    <span className="text-text-tertiary">—</span>
                )}
            </div>
        </div>
    );
};

const MeasurementInput: React.FC<{
    label: string;
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    unit?: string;
}> = ({ label, value, onChange, unit = 'cm' }) => (
    <div>
        <label className="block text-[10px] font-bold text-text-tertiary uppercase mb-1">
            {label}
        </label>
        <div className="relative">
            <input
                type="number"
                step="0.1"
                value={value ?? ''}
                onChange={(e) =>
                    onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="—"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-center font-bold pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">
                {unit}
            </span>
        </div>
    </div>
);
