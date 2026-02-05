/**
 * ProgressTimeline - Chronological photo timeline with context cards
 * Features month grouping, horizontal scroll, and contextual measurement data
 */

import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { Activity, Calendar, Ruler, Scale, X } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BodyMeasurement, ProgressPhoto } from '../../types/domain';
import { getAngleBadge, groupPhotosByMonth } from '../../utils/progressUtils';

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
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;

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
        element?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'start',
        });
        setActiveMonth(monthKey);
    };

    return (
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Calendar size={20} className="text-blue-500" />
                </div>
                <h3 className="font-bold text-lg">{t('progress.timeline.title')}</h3>
            </div>

            {/* Month Tabs (Horizontal Scroll) */}
            {groupedPhotos.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {groupedPhotos.map(({ month }) => (
                        <button
                            key={month}
                            onClick={() => scrollToMonth(month)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                                activeMonth === month
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-surface-lighter text-text-secondary hover:bg-surface-lighter'
                            }`}>
                            {format(parseISO(`${month}-01`), 'MMM yyyy', {
                                locale: dateLocale,
                            })}
                        </button>
                    ))}
                </div>
            )}

            {/* Timeline Scroll Container */}
            <div
                ref={scrollRef}
                className="overflow-x-auto space-x-4 flex pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide">
                {groupedPhotos.map(({ month, monthLabel, photos: monthPhotos }) => (
                    <div
                        key={month}
                        id={`month-${month}`}
                        className="snap-start flex-shrink-0">
                        <p className="text-xs text-text-tertiary font-bold mb-2">
                            {format(parseISO(`${month}-01`), 'MMMM yyyy', {
                                locale: dateLocale,
                            })}
                        </p>
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
                                        }`}>
                                        <img
                                            src={
                                                photo.thumbnailUrl || photo.photoUrl
                                            }
                                            className="w-full h-full object-cover"
                                            alt={`Photo ${photo.date}`}
                                        />
                                        {/* Date Label */}
                                        <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm rounded text-white text-[10px] font-bold text-center py-0.5">
                                            {format(parseISO(photo.date), 'd MMM', {
                                                locale: dateLocale,
                                            })}
                                        </div>
                                        {/* Angle Badge */}
                                        {photo.angle && (
                                            <div className="absolute top-1 right-1 bg-surface/90 rounded px-1.5 py-0.5 text-[8px] font-bold text-text-secondary">
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
                            <p className="text-sm text-text-tertiary font-medium">
                                {format(
                                    parseISO(selectedPhoto.date),
                                    i18n.language === 'es'
                                        ? "d 'de' MMMM, yyyy"
                                        : 'MMMM d, yyyy',
                                    {
                                        locale: dateLocale,
                                    },
                                )}
                            </p>
                            <h4 className="text-lg font-bold text-text-primary">
                                {t('progress.timeline.context')}
                            </h4>
                        </div>
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="text-text-tertiary hover:text-text-secondary">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Weight */}
                        {selectedPhoto.weight && (
                            <div className="bg-surface rounded-lg p-3 border border-border">
                                <p className="text-xs text-text-tertiary font-medium flex items-center gap-1">
                                    <Scale size={12} />
                                    {t('progress.photos.weight')}
                                </p>
                                <p className="text-xl font-bold text-text-primary">
                                    {selectedPhoto.weight} kg
                                </p>
                            </div>
                        )}

                        {/* Waist Measurement */}
                        {photoContext?.measurement?.waist && (
                            <div className="bg-surface rounded-lg p-3 border border-border">
                                <p className="text-xs text-text-tertiary font-medium flex items-center gap-1">
                                    <Ruler size={12} />
                                    {t('progress.measurements.waist')}
                                </p>
                                <p className="text-xl font-bold text-text-primary">
                                    {photoContext.measurement.waist} cm
                                </p>
                            </div>
                        )}

                        {/* Body Fat % */}
                        {photoContext?.measurement?.bodyFatPercent && (
                            <div className="bg-surface rounded-lg p-3 border border-border">
                                <p className="text-xs text-text-tertiary font-medium flex items-center gap-1">
                                    <Activity size={12} />
                                    {t('progress.measurements.bodyFat')}
                                </p>
                                <p className="text-xl font-bold text-text-primary">
                                    {photoContext.measurement.bodyFatPercent}%
                                </p>
                            </div>
                        )}

                        {/* Chest Measurement */}
                        {photoContext?.measurement?.chest && (
                            <div className="bg-surface rounded-lg p-3 border border-border">
                                <p className="text-xs text-text-tertiary font-medium flex items-center gap-1">
                                    <Ruler size={12} />
                                    {t('progress.measurements.chest')}
                                </p>
                                <p className="text-xl font-bold text-text-primary">
                                    {photoContext.measurement.chest} cm
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {selectedPhoto.notes && (
                        <div className="mt-3 bg-surface rounded-lg p-3 border border-border">
                            <p className="text-xs text-text-tertiary font-medium mb-1">
                                {t('progress.photos.notes')}
                            </p>
                            <p className="text-sm text-text-secondary">
                                {selectedPhoto.notes}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
