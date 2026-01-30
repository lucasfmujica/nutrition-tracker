/**
 * ProgressTab - Progress photos and body measurements tracking
 * Combines photo gallery, measurement history, and comparison tools
 */

import React, { useState, useRef } from 'react';
import {
    Camera,
    Ruler,
    Plus,
    X,
    Trash2,
    ChevronDown,
    Image as ImageIcon,
    TrendingDown,
    TrendingUp,
    Minus,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { useTracker } from '../../context/TrackerContext';
import { useProgressPhotos } from '../../hooks/useProgressPhotos';
import { useBodyMeasurements } from '../../hooks/useBodyMeasurements';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';
import { getArgentinaDateString } from '../../utils/dateUtils';
import type { ProgressPhoto, BodyMeasurement, PhotoAngle } from '../../types/domain';

type TabMode = 'photos' | 'measurements';

export const ProgressTab: React.FC = () => {
    const { profile } = useTracker() as any;
    const userId = profile?.userId || null;

    const [activeMode, setActiveMode] = useState<TabMode>('photos');

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Progreso</h1>
                    <p className="text-sm text-gray-500">Fotos y medidas corporales</p>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                    onClick={() => setActiveMode('photos')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                        activeMode === 'photos'
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Camera size={18} />
                    Fotos
                </button>
                <button
                    onClick={() => setActiveMode('measurements')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                        activeMode === 'measurements'
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Ruler size={18} />
                    Medidas
                </button>
            </div>

            {/* Content */}
            {activeMode === 'photos' ? (
                <PhotosSection userId={userId} />
            ) : (
                <MeasurementsSection userId={userId} />
            )}
        </div>
    );
};

// =====================================================
// PHOTOS SECTION
// =====================================================

const PhotosSection: React.FC<{ userId: string | null }> = ({ userId }) => {
    const {
        photos,
        isLoading,
        isUploading,
        error,
        uploadPhoto,
        deletePhoto,
    } = useProgressPhotos({ userId });

    const [showUploadForm, setShowUploadForm] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
    const [uploadDate, setUploadDate] = useState(getArgentinaDateString());
    const [uploadAngle, setUploadAngle] = useState<PhotoAngle>('front');
    const [uploadNotes, setUploadNotes] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const result = await uploadPhoto(file, {
            date: uploadDate,
            angle: uploadAngle,
            notes: uploadNotes || undefined,
        });

        if (result) {
            setShowUploadForm(false);
            setUploadNotes('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (photo: ProgressPhoto) => {
        if (confirm('¿Eliminar esta foto?')) {
            await deletePhoto(photo.id);
            setSelectedPhoto(null);
        }
    };

    // Group photos by month
    const photosByMonth = photos.reduce((acc, photo) => {
        const monthKey = photo.date.substring(0, 7); // YYYY-MM
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(photo);
        return acc;
    }, {} as Record<string, ProgressPhoto[]>);

    return (
        <div className="space-y-4">
            {/* Upload Button */}
            <button
                onClick={() => setShowUploadForm(true)}
                className="w-full py-4 bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98]"
            >
                <Camera size={20} />
                Subir Foto de Progreso
            </button>

            {/* Upload Form Modal */}
            {showUploadForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Nueva Foto</h3>
                            <button
                                onClick={() => setShowUploadForm(false)}
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
                                    selectedDate={uploadDate}
                                    onChange={setUploadDate}
                                    label=""
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                                    Ángulo
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['front', 'side', 'back', 'other'] as PhotoAngle[]).map((angle) => (
                                        <button
                                            key={angle}
                                            onClick={() => setUploadAngle(angle)}
                                            className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                                                uploadAngle === angle
                                                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                                                    : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                                            }`}
                                        >
                                            {angle === 'front' && 'Frente'}
                                            {angle === 'side' && 'Lado'}
                                            {angle === 'back' && 'Espalda'}
                                            {angle === 'other' && 'Otro'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                                    Notas (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={uploadNotes}
                                    onChange={(e) => setUploadNotes(e.target.value)}
                                    placeholder="Ej: Después de 4 semanas"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                                />
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Camera size={18} />
                                        Seleccionar Foto
                                    </>
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
            {!isLoading && photos.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon size={28} className="text-purple-400" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Sin fotos aún</h3>
                    <p className="text-sm text-slate-500">
                        Subí tu primera foto de progreso para comenzar a trackear tu transformación.
                    </p>
                </div>
            )}

            {/* Photo Grid by Month */}
            {Object.entries(photosByMonth).map(([monthKey, monthPhotos]) => (
                <div key={monthKey} className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-500 uppercase">
                        {new Date(monthKey + '-01').toLocaleDateString('es-AR', {
                            month: 'long',
                            year: 'numeric',
                        })}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {monthPhotos.map((photo) => (
                            <button
                                key={photo.id}
                                onClick={() => setSelectedPhoto(photo)}
                                className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group"
                            >
                                <img
                                    src={photo.thumbnailUrl || photo.photoUrl}
                                    alt={`Progreso ${photo.date}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                    <p className="text-white text-xs font-medium">
                                        {new Date(photo.date + 'T12:00:00').toLocaleDateString('es-AR', {
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                {photo.angle && (
                                    <span className="absolute top-1 right-1 bg-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded text-slate-600 uppercase">
                                        {photo.angle === 'front' && 'F'}
                                        {photo.angle === 'side' && 'L'}
                                        {photo.angle === 'back' && 'E'}
                                        {photo.angle === 'other' && 'O'}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* Photo Detail Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div
                        className="bg-white rounded-3xl overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedPhoto.photoUrl}
                            alt={`Progreso ${selectedPhoto.date}`}
                            className="w-full"
                        />
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900">
                                        {new Date(selectedPhoto.date + 'T12:00:00').toLocaleDateString('es-AR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                    {selectedPhoto.angle && (
                                        <p className="text-sm text-slate-500 capitalize">
                                            Vista: {selectedPhoto.angle === 'front' && 'Frente'}
                                            {selectedPhoto.angle === 'side' && 'Lado'}
                                            {selectedPhoto.angle === 'back' && 'Espalda'}
                                            {selectedPhoto.angle === 'other' && 'Otro'}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(selectedPhoto)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            {selectedPhoto.notes && (
                                <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                                    {selectedPhoto.notes}
                                </p>
                            )}
                            {selectedPhoto.weight && (
                                <p className="text-sm text-slate-500">
                                    Peso: <span className="font-bold text-slate-900">{selectedPhoto.weight} kg</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// =====================================================
// MEASUREMENTS SECTION
// =====================================================

const MeasurementsSection: React.FC<{ userId: string | null }> = ({ userId }) => {
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
    const getChange = (current: number | undefined, fieldName: keyof BodyMeasurement): { value: number; direction: 'up' | 'down' | 'same' } | null => {
        if (current === undefined || measurements.length < 2) return null;

        const previous = measurements[1]?.[fieldName] as number | undefined;
        if (previous === undefined) return null;

        const diff = current - previous;
        return {
            value: Math.abs(diff),
            direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
        };
    };

    const MeasurementRow: React.FC<{
        label: string;
        value: number | undefined;
        fieldName: keyof BodyMeasurement;
        unit?: string;
    }> = ({ label, value, fieldName, unit = 'cm' }) => {
        const change = getChange(value, fieldName);

        return (
            <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{label}</span>
                <div className="flex items-center gap-2">
                    {value !== undefined ? (
                        <>
                            <span className="font-bold text-slate-900">{value} {unit}</span>
                            {change && (
                                <span className={`flex items-center text-xs ${
                                    change.direction === 'down'
                                        ? 'text-emerald-600'
                                        : change.direction === 'up'
                                            ? 'text-red-500'
                                            : 'text-slate-400'
                                }`}>
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
                        <MeasurementRow label="Pecho" value={latestMeasurement.chest} fieldName="chest" />
                        <MeasurementRow label="Cintura" value={latestMeasurement.waist} fieldName="waist" />
                        <MeasurementRow label="Cadera" value={latestMeasurement.hips} fieldName="hips" />
                        <MeasurementRow label="Bíceps (izq)" value={latestMeasurement.bicepsLeft} fieldName="bicepsLeft" />
                        <MeasurementRow label="Bíceps (der)" value={latestMeasurement.bicepsRight} fieldName="bicepsRight" />
                        <MeasurementRow label="Muslo (izq)" value={latestMeasurement.thighLeft} fieldName="thighLeft" />
                        <MeasurementRow label="Muslo (der)" value={latestMeasurement.thighRight} fieldName="thighRight" />
                        {latestMeasurement.bodyFatPercent && (
                            <MeasurementRow label="% Grasa" value={latestMeasurement.bodyFatPercent} fieldName="bodyFatPercent" unit="%" />
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

// Measurement input component
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
