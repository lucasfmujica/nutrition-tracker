/**
 * PhotoSelectionModal - Photo picker for comparison slider
 */

import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { Check, X } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PhotoAngle, ProgressPhoto } from '../../types/domain';
import { formatAngleLabel, getAngleBadge } from '../../utils/progressUtils';

interface PhotoSelectionModalProps {
    photos: ProgressPhoto[];
    onSelect: (photo: ProgressPhoto) => void;
    onClose: () => void;
    currentPhotoId?: string;
    title?: string;
}

export const PhotoSelectionModal: React.FC<PhotoSelectionModalProps> = ({
    photos,
    onSelect,
    onClose,
    currentPhotoId,
    title,
}) => {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;
    const modalTitle = title || t('progress.photoSelection.title');

    const [filterAngle, setFilterAngle] = useState<PhotoAngle | 'all'>('all');

    // Filter photos by angle
    const filteredPhotos =
        filterAngle === 'all'
            ? photos
            : photos.filter((p) => p.angle === filterAngle);

    const handleSelect = (photo: ProgressPhoto) => {
        onSelect(photo);
        // Vibrate on selection (mobile)
        if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}>
            <div
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                        {modalTitle}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                        <X size={18} />
                    </button>
                </div>

                {/* Angle Filter */}
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <FilterButton
                            label={t('progress.photoSelection.all')}
                            isActive={filterAngle === 'all'}
                            onClick={() => setFilterAngle('all')}
                        />
                        <FilterButton
                            label={t('progress.angles.front')}
                            isActive={filterAngle === 'front'}
                            onClick={() => setFilterAngle('front')}
                        />
                        <FilterButton
                            label={t('progress.angles.side')}
                            isActive={filterAngle === 'side'}
                            onClick={() => setFilterAngle('side')}
                        />
                        <FilterButton
                            label={t('progress.angles.back')}
                            isActive={filterAngle === 'back'}
                            onClick={() => setFilterAngle('back')}
                        />
                        <FilterButton
                            label={t('progress.angles.other')}
                            isActive={filterAngle === 'other'}
                            onClick={() => setFilterAngle('other')}
                        />
                    </div>
                </div>

                {/* Photo Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredPhotos.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-400">
                                {t('progress.photos.noPhotos')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {filteredPhotos.map((photo) => {
                                const isSelected = photo.id === currentPhotoId;
                                return (
                                    <button
                                        key={photo.id}
                                        onClick={() => handleSelect(photo)}
                                        className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                                            isSelected
                                                ? 'ring-4 ring-purple-500 scale-95'
                                                : 'hover:ring-2 hover:ring-purple-300'
                                        }`}>
                                        <img
                                            src={
                                                photo.thumbnailUrl || photo.photoUrl
                                            }
                                            alt={`Foto ${photo.date}`}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Selected Indicator */}
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                                    <Check
                                                        size={24}
                                                        className="text-white"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Date Label */}
                                        <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm rounded text-white text-[10px] font-bold text-center py-1">
                                            {format(parseISO(photo.date), 'd MMM', {
                                                locale: dateLocale,
                                            })}
                                        </div>

                                        {/* Angle Badge */}
                                        {photo.angle && (
                                            <div className="absolute top-1 right-1 bg-white/90 rounded px-1.5 py-0.5 text-[8px] font-bold text-slate-600">
                                                {getAngleBadge(photo.angle)}
                                            </div>
                                        )}

                                        {/* Weight Badge */}
                                        {photo.weight && (
                                            <div className="absolute top-1 left-1 bg-white/90 rounded px-1.5 py-0.5 text-[8px] font-bold text-slate-600">
                                                {photo.weight}kg
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Component
const FilterButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
            isActive
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
        }`}>
        {label}
    </button>
);
