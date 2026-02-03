/**
 * ProgressTimelineView - Wrapper for ProgressTimeline with data fetching
 */

import { AlertCircle, ImageIcon, Loader2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useBodyMeasurements } from '../../hooks/useBodyMeasurements';
import { useProgressPhotos } from '../../hooks/useProgressPhotos';
import { ProgressTimeline } from './ProgressTimeline';

interface ProgressTimelineViewProps {
    userId: string | null;
}

export const ProgressTimelineView: React.FC<ProgressTimelineViewProps> = ({
    userId,
}) => {
    const { t } = useTranslation();
    const {
        photos,
        isLoading: photosLoading,
        error: photosError,
    } = useProgressPhotos({ userId });
    const { measurements, isLoading: measurementsLoading } = useBodyMeasurements({
        userId,
    });

    const isLoading = photosLoading || measurementsLoading;

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-purple-500" />
            </div>
        );
    }

    // Error state
    if (photosError) {
        return (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {photosError}
            </div>
        );
    }

    // Empty state
    if (photos.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon size={28} className="text-purple-400" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">
                    {t('progress.photos.noPhotos')}
                </h3>
                <p className="text-sm text-slate-500">
                    {t('progress.timeline.noPhotosDesc')}
                </p>
            </div>
        );
    }

    return <ProgressTimeline photos={photos} measurements={measurements} />;
};
