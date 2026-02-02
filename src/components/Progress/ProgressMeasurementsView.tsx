/**
 * ProgressMeasurementsView - Body measurements tracking interface
 */

import React, { useState } from 'react';
import {
    Ruler,
    X,
    Trash2,
    TrendingDown,
    TrendingUp,
    Minus,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { useBodyMeasurements } from '../../hooks/useBodyMeasurements';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';
import { getArgentinaDateString } from '../../utils/dateUtils';
import type { BodyMeasurement } from '../../types/domain';

interface ProgressMeasurementsViewProps {
    userId: string | null;
}

export const ProgressMeasurementsView: React.FC<ProgressMeasurementsViewProps> = ({ userId }) => {
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
        if (confirm('¿Eliminar esta medición?')) {
            await deleteMeasurement(id);
        }
    };

    // Compare with previous measurement
    const getChange = (
        current: number | undefined,
        fieldName: keyof BodyMeasurement
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
                className="w-full py-4 bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98]"
            >
                <Ruler size={20} />
                Nueva Medición
            </button>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm mb-20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Nueva Medición</h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                                    Fecha
                                </label>
                                <LukenFitDatePicker
                                    selectedDate={formDate}
                                    onChange={setFormDate}
                                    label=""
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <MeasurementInput
                                    label="Pecho"
                                    value={formData.chest}
                                    onChange={(v) => setFormData({ ...formData, chest: v })}
                                />
                                <MeasurementInput
                                    label="Cintura"
                                    value={formData.waist}
                                    onChange={(v) => setFormData({ ...formData, waist: v })}
                                />
                                <MeasurementInput
                                    label="Cadera"
                                    value={formData.hips}
                                    onChange={(v) => setFormData({ ...formData, hips: v })}
                                />
                                <MeasurementInput
                                    label="Bíceps (izq)"
                                    value={formData.bicepsLeft}
                                    onChange={(v) => setFormData({ ...formData, bicepsLeft: v })}
                                />
                                <MeasurementInput
                                    label="Bíceps (der)"
                                    value={formData.bicepsRight}
                                    onChange={(v) => setFormData({ ...formData, bicepsRight: v })}
                                />
                                <MeasurementInput
                                    label="Muslo (izq)"
                                    value={formData.thighLeft}
                                    onChange={(v) => setFormData({ ...formData, thighLeft: v })}
                                />
                                <MeasurementInput
                                    label="Muslo (der)"
                                    value={formData.thighRight}
                                    onChange={(v) => setFormData({ ...formData, thighRight: v })}
                                />
                                <MeasurementInput
                                    label="% Grasa"
                                    value={formData.bodyFatPercent}
                                    onChange={(v) => setFormData({ ...formData, bodyFatPercent: v })}
                                    unit="%"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar Medidas'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-purple-500" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && measurements.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ruler size={28} className="text-purple-400" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Sin medidas aún</h3>
                    <p className="text-sm text-slate-500">
                        Registrá tus medidas corporales para trackear tu progreso más allá del peso.
                    </p>
                </div>
            )}

            {/* Latest Measurement Card */}
            {latestMeasurement && (
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-bold text-slate-900">Última Medición</h3>
                            <p className="text-xs text-slate-500">
                                {new Date(latestMeasurement.date + 'T12:00:00').toLocaleDateString('es-AR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                        <button
                            onClick={() => handleDelete(latestMeasurement.id)}
                            className="text-slate-400 hover:text-red-500 p-2"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <MeasurementRow
                            label="Pecho"
                            value={latestMeasurement.chest}
                            fieldName="chest"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label="Cintura"
                            value={latestMeasurement.waist}
                            fieldName="waist"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label="Cadera"
                            value={latestMeasurement.hips}
                            fieldName="hips"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label="Bíceps (izq)"
                            value={latestMeasurement.bicepsLeft}
                            fieldName="bicepsLeft"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label="Bíceps (der)"
                            value={latestMeasurement.bicepsRight}
                            fieldName="bicepsRight"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label="Muslo (izq)"
                            value={latestMeasurement.thighLeft}
                            fieldName="thighLeft"
                            getChange={getChange}
                        />
                        <MeasurementRow
                            label="Muslo (der)"
                            value={latestMeasurement.thighRight}
                            fieldName="thighRight"
                            getChange={getChange}
                        />
                        {latestMeasurement.bodyFatPercent && (
                            <MeasurementRow
                                label="% Grasa"
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
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-900">Historial</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {measurements.slice(1).map((m) => (
                            <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900 text-sm">
                                        {new Date(m.date + 'T12:00:00').toLocaleDateString('es-AR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {m.waist && `Cintura: ${m.waist}cm`}
                                        {m.waist && m.chest && ' · '}
                                        {m.chest && `Pecho: ${m.chest}cm`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(m.id)}
                                    className="text-slate-400 hover:text-red-500 p-2"
                                >
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
        fieldName: keyof BodyMeasurement
    ) => { value: number; direction: 'up' | 'down' | 'same' } | null;
}> = ({ label, value, fieldName, unit = 'cm', getChange }) => {
    const change = getChange(value, fieldName);

    return (
        <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-600">{label}</span>
            <div className="flex items-center gap-2">
                {value !== undefined ? (
                    <>
                        <span className="font-bold text-slate-900">
                            {value} {unit}
                        </span>
                        {change && (
                            <span
                                className={`flex items-center text-xs ${
                                    change.direction === 'down'
                                        ? 'text-emerald-600'
                                        : change.direction === 'up'
                                        ? 'text-red-500'
                                        : 'text-slate-400'
                                }`}
                            >
                                {change.direction === 'down' && <TrendingDown size={12} />}
                                {change.direction === 'up' && <TrendingUp size={12} />}
                                {change.direction === 'same' && <Minus size={12} />}
                                {change.value > 0 && ` ${change.value}`}
                            </span>
                        )}
                    </>
                ) : (
                    <span className="text-slate-300">—</span>
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
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            {label}
        </label>
        <div className="relative">
            <input
                type="number"
                step="0.1"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="—"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center font-bold pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                {unit}
            </span>
        </div>
    </div>
);
