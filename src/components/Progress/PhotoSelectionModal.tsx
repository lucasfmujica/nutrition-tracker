/**
 * PhotoSelectionModal - Photo picker for comparison slider
 */

import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { Check } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PhotoAngle, ProgressPhoto } from '../../types/domain';
import { getAngleBadge } from '../../utils/progressUtils';
import { ModalShell } from '../UI/ModalShell';

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
        <ModalShell open onClose={onClose} title={modalTitle} size="lg">
            {/* Angle Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
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

            {/* Photo Grid */}
            {filteredPhotos.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-text-tertiary">
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
                                className={`relative aspect-square rounded-control overflow-hidden transition-all ${
                                    isSelected
                                        ? 'ring-4 ring-oura scale-95'
                                        : 'hover:ring-2 hover:ring-oura/40'
                                }`}>
                                <img
                                    src={photo.thumbnailUrl || photo.photoUrl}
                                    alt={`Foto ${photo.date}`}
                                    className="w-full h-full object-cover"
                                />

                                {/* Selected Indicator */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-oura/20 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-oura rounded-full flex items-center justify-center shadow-float">
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
                                    <div className="absolute top-1 right-1 bg-surface/90 rounded px-1.5 py-0.5 text-[8px] font-bold text-text-secondary">
                                        {getAngleBadge(photo.angle)}
                                    </div>
                                )}

                                {/* Weight Badge */}
                                {photo.weight && (
                                    <div className="absolute top-1 left-1 bg-surface/90 rounded px-1.5 py-0.5 text-[8px] font-bold text-text-secondary">
                                        {photo.weight}kg
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </ModalShell>
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
        className={`px-3 py-1.5 rounded-control text-xs font-bold whitespace-nowrap transition-colors ${
            isActive
                ? 'bg-oura-soft text-oura border-2 border-oura'
                : 'bg-surface text-text-secondary border-2 border-border hover:border-border'
        }`}>
        {label}
    </button>
);
