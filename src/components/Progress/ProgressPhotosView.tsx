/**
 * ProgressPhotosView - Photo gallery and upload interface
 */

import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import {
    AlertCircle,
    Camera,
    Image as ImageIcon,
    Loader2,
    Trash2,
    X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgressPhotos } from '../../hooks/useProgressPhotos';
import type { PhotoAngle, ProgressPhoto } from '../../types/domain';
import { getArgentinaDateString } from '../../utils/dateUtils';
import { formatAngleLabel, getAngleBadge } from '../../utils/progressUtils';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

interface ProgressPhotosViewProps {
    userId: string | null;
}

export const ProgressPhotosView: React.FC<ProgressPhotosViewProps> = ({
    userId,
}) => {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;

    const { photos, isLoading, isUploading, error, uploadPhoto, deletePhoto } =
        useProgressPhotos({ userId });

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
        if (confirm(t('progress.photos.deleteConfirm'))) {
            await deletePhoto(photo.id);
            setSelectedPhoto(null);
        }
    };

    // Group photos by month
    const photosByMonth = photos.reduce(
        (acc, photo) => {
            const monthKey = photo.date.substring(0, 7); // YYYY-MM
            if (!acc[monthKey]) acc[monthKey] = [];
            acc[monthKey].push(photo);
            return acc;
        },
        {} as Record<string, ProgressPhoto[]>,
    );

    return (
        <div className="space-y-4">
            {/* Upload Button */}
            <button
                onClick={() => setShowUploadForm(true)}
                className="w-full py-4 bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98]">
                <Camera size={20} />
                {t('progress.photos.addPhoto')}
            </button>

            {/* Upload Form Modal */}
            {showUploadForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface rounded-3xl p-6 w-full max-w-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-text-primary">
                                {t('progress.photos.newPhoto')}
                            </h3>
                            <button
                                onClick={() => setShowUploadForm(false)}
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
                                    selectedDate={uploadDate}
                                    onChange={setUploadDate}
                                    label=""
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-1.5">
                                    {t('progress.photos.angle')}
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(
                                        [
                                            'front',
                                            'side',
                                            'back',
                                            'other',
                                        ] as PhotoAngle[]
                                    ).map((angle) => (
                                        <button
                                            key={angle}
                                            onClick={() => setUploadAngle(angle)}
                                            className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                                                uploadAngle === angle
                                                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                                                    : 'bg-surface-lighter text-text-secondary border-2 border-transparent'
                                            }`}>
                                            {formatAngleLabel(angle)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-1.5">
                                    {t('progress.photos.notes')}
                                </label>
                                <input
                                    type="text"
                                    value={uploadNotes}
                                    onChange={(e) => setUploadNotes(e.target.value)}
                                    placeholder={t(
                                        'progress.photos.notesPlaceholder',
                                    )}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm"
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
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-surface-lighter text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                {isUploading ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                        {t('progress.photos.uploading')}
                                    </>
                                ) : (
                                    <>
                                        <Camera size={18} />
                                        {t('progress.photos.selectPhoto')}
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
                <div className="bg-surface rounded-2xl p-8 text-center border border-border">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon size={28} className="text-purple-400" />
                    </div>
                    <h3 className="font-bold text-text-primary mb-1">
                        {t('progress.photos.noPhotos')}
                    </h3>
                    <p className="text-sm text-text-tertiary">
                        {t('progress.photos.noPhotosDesc')}
                    </p>
                </div>
            )}

            {/* Photo Grid by Month */}
            {Object.entries(photosByMonth).map(([monthKey, monthPhotos]) => (
                <div key={monthKey} className="space-y-3">
                    <h3 className="text-sm font-bold text-text-tertiary uppercase">
                        {format(parseISO(monthKey + '-01'), 'MMMM yyyy', {
                            locale: dateLocale,
                        })}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {monthPhotos.map((photo) => (
                            <button
                                key={photo.id}
                                onClick={() => setSelectedPhoto(photo)}
                                className="aspect-square rounded-xl overflow-hidden bg-surface-lighter relative group">
                                <img
                                    src={photo.thumbnailUrl || photo.photoUrl}
                                    alt={`Progreso ${photo.date}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                    <p className="text-white text-xs font-medium">
                                        {format(parseISO(photo.date), 'd', {
                                            locale: dateLocale,
                                        })}
                                    </p>
                                </div>
                                {photo.angle && (
                                    <span className="absolute top-1 right-1 bg-surface/90 text-[10px] font-bold px-1.5 py-0.5 rounded text-text-secondary uppercase">
                                        {getAngleBadge(photo.angle)}
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
                    onClick={() => setSelectedPhoto(null)}>
                    <div
                        className="bg-surface rounded-3xl overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}>
                        <img
                            src={selectedPhoto.photoUrl}
                            alt={`Progreso ${selectedPhoto.date}`}
                            className="w-full"
                        />
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-text-primary">
                                        {format(
                                            parseISO(selectedPhoto.date),
                                            'd MMMM yyyy',
                                            { locale: dateLocale },
                                        )}
                                    </p>
                                    {selectedPhoto.angle && (
                                        <p className="text-sm text-text-tertiary capitalize">
                                            {t('progress.photos.view')}:{' '}
                                            {formatAngleLabel(selectedPhoto.angle)}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(selectedPhoto)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            {selectedPhoto.notes && (
                                <p className="text-sm text-text-secondary bg-background px-3 py-2 rounded-lg">
                                    {selectedPhoto.notes}
                                </p>
                            )}
                            {selectedPhoto.weight && (
                                <p className="text-sm text-text-tertiary">
                                    {t('progress.photos.weight')}:{' '}
                                    <span className="font-bold text-text-primary">
                                        {selectedPhoto.weight} kg
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
