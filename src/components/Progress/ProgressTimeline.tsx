/**
 * ProgressTimeline - Chronological photo timeline with context cards
 * Features month grouping, horizontal scroll, and contextual measurement data
 */

import React, { useState, useRef, useMemo } from 'react';
import { Calendar, X, Scale, Ruler, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { groupPhotosByMonth, getAngleBadge } from '../../utils/progressUtils';
import type { ProgressPhoto, BodyMeasurement } from '../../types/domain';

interface ProgressTimelineProps {
    photos: ProgressPhoto[];
    measurements: BodyMeasurement[];
    onPhotoSelect?: (photo: ProgressPhoto) => void;
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
    photos,
    measurements,
    onPhotoSelect,
}) => {
    const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
    const [activeMonth, setActiveMonth] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const groupedPhotos = useMemo(() => groupPhotosByMonth(photos), [photos]);

    // Fetch context data for selected photo
    const photoContext = useMemo(() => {
        if (!selectedPhoto) return null;

        // Find measurement for that date
        const measurement = measurements.find((m) => m.date === selectedPhoto.date);

        return {
            measurement,
        };
    }, [selectedPhoto, measurements]);

    const handlePhotoClick = (photo: ProgressPhoto) => {
        setSelectedPhoto(photo);
        if (onPhotoSelect) {
            onPhotoSelect(photo);
        }
        // Vibrate on mobile
        if (window.navigator.vibrate) {
            window.navigator.vibrate(30);
        }
    };

    const scrollToMonth = (monthKey: string) => {
        const element = document.getElementById(`month-${monthKey}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        setActiveMonth(monthKey);
    };

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Calendar size={20} className="text-blue-500" />
                </div>
                <h3 className="font-bold text-lg">Línea de Tiempo</h3>
            </div>

            {/* Month Tabs (Horizontal Scroll) */}
            {groupedPhotos.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {groupedPhotos.map(({ month, monthLabel }) => (
                        <button
                            key={month}
                            onClick={() => scrollToMonth(month)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                                activeMonth === month
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {monthLabel}
                        </button>
                    ))}
                </div>
            )}

            {/* Timeline Scroll Container */}
            <div
                ref={scrollRef}
                className="overflow-x-auto space-x-4 flex pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide"
            >
                {groupedPhotos.map(({ month, monthLabel, photos: monthPhotos }) => (
                    <div key={month} id={`month-${month}`} className="snap-start flex-shrink-0">
                        <p className="text-xs text-slate-400 font-bold mb-2">{monthLabel}</p>
                        <div className="flex gap-3">
                            {monthPhotos.map((photo) => {
                                const isSelected = selectedPhoto?.id === photo.id;
                                return (
                                    <button
                                        key={photo.id}
                                        onClick={() => handlePhotoClick(photo)}
                                        className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden transition-all duration-200 ${
                                            isSelected
                                                ? 'ring-4 ring-blue-500 scale-105 shadow-lg'
                                                : 'hover:ring-2 hover:ring-blue-300 shadow-sm'
                                        }`}
                                    >
                                        <img
                                            src={photo.thumbnailUrl || photo.photoUrl}
                                            className="w-full h-full object-cover"
                                            alt={`Photo ${photo.date}`}
                                        />
                                        {/* Date Label */}
                                        <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm rounded text-white text-[10px] font-bold text-center py-0.5">
                                            {format(parseISO(photo.date), 'd MMM', { locale: es })}
                                        </div>
                                        {/* Angle Badge */}
                                        {photo.angle && (
                                            <div className="absolute top-1 right-1 bg-white/90 rounded px-1.5 py-0.5 text-[8px] font-bold text-slate-600">
                                                {getAngleBadge(photo.angle)}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Context Card */}
            {selectedPhoto && (
                <div className="mt-5 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">
                                {format(parseISO(selectedPhoto.date), "d 'de' MMMM, yyyy", {
                                    locale: es,
                                })}
                            </p>
                            <h4 className="text-lg font-bold text-slate-900">
                                Contexto del Progreso
                            </h4>
                        </div>
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Weight */}
                        {selectedPhoto.weight && (
                            <div className="bg-white rounded-lg p-3 border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Scale size={12} />
                                    Peso
                                </p>
                                <p className="text-xl font-bold text-slate-900">
                                    {selectedPhoto.weight} kg
                                </p>
                            </div>
                        )}

                        {/* Waist Measurement */}
                        {photoContext?.measurement?.waist && (
                            <div className="bg-white rounded-lg p-3 border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Ruler size={12} />
                                    Cintura
                                </p>
                                <p className="text-xl font-bold text-slate-900">
                                    {photoContext.measurement.waist} cm
                                </p>
                            </div>
                        )}

                        {/* Body Fat % */}
                        {photoContext?.measurement?.bodyFatPercent && (
                            <div className="bg-white rounded-lg p-3 border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Activity size={12} />
                                    Grasa Corporal
                                </p>
                                <p className="text-xl font-bold text-slate-900">
                                    {photoContext.measurement.bodyFatPercent}%
                                </p>
                            </div>
                        )}

                        {/* Chest Measurement */}
                        {photoContext?.measurement?.chest && (
                            <div className="bg-white rounded-lg p-3 border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Ruler size={12} />
                                    Pecho
                                </p>
                                <p className="text-xl font-bold text-slate-900">
                                    {photoContext.measurement.chest} cm
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {selectedPhoto.notes && (
                        <div className="mt-3 bg-white rounded-lg p-3 border border-slate-100">
                            <p className="text-xs text-slate-500 font-medium mb-1">Notas</p>
                            <p className="text-sm text-slate-700">{selectedPhoto.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
