/**
 * ProgressComparisonView - Before/after photo comparison interface
 */

import { AlertCircle, ImageIcon, Loader2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useProgressPhotos } from '../../hooks/useProgressPhotos';
import type { ProgressPhoto } from '../../types/domain';
import { getBaselinePhoto, getLatestPhoto } from '../../utils/progressUtils';
import { PhotoComparisonSlider } from './PhotoComparisonSlider';
import { PhotoSelectionModal } from './PhotoSelectionModal';
import { ShareModal } from './ShareModal';

interface ProgressComparisonViewProps {
    userId: string | null;
}

export const ProgressComparisonView: React.FC<ProgressComparisonViewProps> = ({
    userId,
}) => {
    const { photos, isLoading, error } = useProgressPhotos({ userId });

    // Auto-select first vs latest photo
    const defaultBefore = useMemo(() => getBaselinePhoto(photos), [photos]);
    const defaultAfter = useMemo(() => getLatestPhoto(photos), [photos]);

    const [selectedBefore, setSelectedBefore] = useState<ProgressPhoto | null>(
        defaultBefore,
    );
    const [selectedAfter, setSelectedAfter] = useState<ProgressPhoto | null>(
        defaultAfter,
    );
    const [selectionMode, setSelectionMode] = useState<'before' | 'after' | null>(
        null,
    );
    const [showShareModal, setShowShareModal] = useState(false);

    // Update selections when photos load
    React.useEffect(() => {
        if (defaultBefore && !selectedBefore) {
            setSelectedBefore(defaultBefore);
        }
        if (defaultAfter && !selectedAfter) {
            setSelectedAfter(defaultAfter);
        }
    }, [defaultBefore, defaultAfter]);

    const handlePhotoSelect = (photo: ProgressPhoto) => {
        if (selectionMode === 'before') {
            setSelectedBefore(photo);
        } else if (selectionMode === 'after') {
            setSelectedAfter(photo);
        }
        setSelectionMode(null);
    };

    const handlePhotoChange = (type: 'before' | 'after') => {
        setSelectionMode(type);
    };

    const handleShare = () => {
        setShowShareModal(true);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-oura" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-danger-soft text-danger px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
            </div>
        );
    }

    // Empty state - need at least 1 photo
    if (photos.length === 0) {
        return (
            <div className="bg-surface rounded-2xl p-8 text-center border border-border">
                <div className="w-16 h-16 bg-oura-soft rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon size={28} className="text-oura" />
                </div>
                <h3 className="font-bold text-text-primary mb-1">
                    Sin fotos para comparar
                </h3>
                <p className="text-sm text-text-tertiary">
                    Subí al menos 2 fotos de progreso para usar la comparación.
                </p>
            </div>
        );
    }

    // Need at least 2 photos
    if (photos.length < 2) {
        return (
            <div className="bg-surface rounded-2xl p-8 text-center border border-border">
                <div className="w-16 h-16 bg-oura-soft rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon size={28} className="text-oura" />
                </div>
                <h3 className="font-bold text-text-primary mb-1">
                    Necesitás más fotos
                </h3>
                <p className="text-sm text-text-tertiary mb-4">
                    Subí al menos una foto más para comparar tu progreso.
                </p>
                <p className="text-xs text-text-tertiary">
                    Tenés {photos.length} foto. Necesitás al menos 2.
                </p>
            </div>
        );
    }

    // Show comparison slider
    return (
        <div className="space-y-4">
            {selectedBefore && selectedAfter ? (
                <PhotoComparisonSlider
                    beforePhoto={selectedBefore}
                    afterPhoto={selectedAfter}
                    onPhotoChange={handlePhotoChange}
                    onShare={handleShare}
                />
            ) : (
                <div className="bg-surface rounded-2xl p-8 text-center border border-border">
                    <p className="text-text-tertiary">Seleccioná fotos para comparar</p>
                </div>
            )}

            {/* Photo Selection Modal */}
            {selectionMode && (
                <PhotoSelectionModal
                    photos={photos}
                    onSelect={handlePhotoSelect}
                    onClose={() => setSelectionMode(null)}
                    currentPhotoId={
                        selectionMode === 'before'
                            ? selectedBefore?.id
                            : selectedAfter?.id
                    }
                    title={
                        selectionMode === 'before' ? 'Foto Antes' : 'Foto Después'
                    }
                />
            )}

            {/* Share Modal */}
            {showShareModal && selectedBefore && selectedAfter && (
                <ShareModal
                    beforePhoto={selectedBefore}
                    afterPhoto={selectedAfter}
                    goal="cut"
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};
