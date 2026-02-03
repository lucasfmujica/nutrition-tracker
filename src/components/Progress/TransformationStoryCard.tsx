/**
 * TransformationStoryCard - Shareable transformation card with before/after photos
 * Sprint 3: Social Sharing & Transformation Posts
 */

import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import { Calendar, Download, Ruler, Share2, TrendingDown } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProgressPhoto } from '../../types/domain';
import { calculatePhotoStats } from '../../utils/progressUtils';

interface TransformationStoryCardProps {
    beforePhoto: ProgressPhoto;
    afterPhoto: ProgressPhoto;
    caption: string;
    measurements?: {
        waistChange?: number;
        bodyFatChange?: number;
    };
    onShare?: () => void;
}

export const TransformationStoryCard: React.FC<TransformationStoryCardProps> = ({
    beforePhoto,
    afterPhoto,
    caption,
    measurements,
    onShare,
}) => {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;

    const cardRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const stats = calculatePhotoStats(beforePhoto, afterPhoto);

    const handleExport = async () => {
        if (!cardRef.current) return;

        setIsExporting(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                logging: false,
            });

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) return;

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `transformacion-${afterPhoto.date}.png`;
                link.click();
                URL.revokeObjectURL(url);
            });
        } catch (error) {
            console.error('Error exporting transformation card:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleWebShare = async () => {
        if (!cardRef.current) return;

        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                const file = new File(
                    [blob],
                    `transformacion-${afterPhoto.date}.png`,
                    {
                        type: 'image/png',
                    },
                );

                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Mi Transformación',
                        text: caption,
                        files: [file],
                    });
                } else {
                    // Fallback: just download
                    handleExport();
                }
            });
        } catch (error) {
            console.error('Error sharing transformation card:', error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Transformation Card - Exportable */}
            <div
                ref={cardRef}
                className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                {/* Header */}
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">
                        {t('progress.story.title')}
                    </h2>
                    <p className="text-sm text-slate-600">
                        {format(parseISO(beforePhoto.date), 'd MMM yyyy', {
                            locale: dateLocale,
                        })}{' '}
                        -{' '}
                        {format(parseISO(afterPhoto.date), 'd MMM yyyy', {
                            locale: dateLocale,
                        })}
                    </p>
                </div>

                {/* Before/After Photos */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Before */}
                    <div className="relative">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-200">
                            <img
                                src={beforePhoto.photoUrl}
                                alt={t('progress.comparison.before')}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute top-2 left-2 bg-slate-900/80 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {t('progress.comparison.before')}
                        </div>
                        {beforePhoto.weight && (
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-900">
                                {beforePhoto.weight.toFixed(1)} kg
                            </div>
                        )}
                    </div>

                    {/* After */}
                    <div className="relative">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-200">
                            <img
                                src={afterPhoto.photoUrl}
                                alt={t('progress.comparison.after')}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute top-2 left-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {t('progress.comparison.after')}
                        </div>
                        {afterPhoto.weight && (
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-900">
                                {afterPhoto.weight.toFixed(1)} kg
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Weight Change */}
                    {stats.hasWeightData && (
                        <div className="bg-white rounded-xl p-3 text-center">
                            <TrendingDown
                                size={20}
                                className="text-green-600 mx-auto mb-1"
                            />
                            <p className="text-lg font-bold text-slate-900">
                                {Math.abs(stats.weightChange).toFixed(1)} kg
                            </p>
                            <p className="text-xs text-slate-500">
                                {t('progress.share.lost')}
                            </p>
                        </div>
                    )}

                    {/* Duration */}
                    <div className="bg-white rounded-xl p-3 text-center">
                        <Calendar
                            size={20}
                            className="text-purple-600 mx-auto mb-1"
                        />
                        <p className="text-lg font-bold text-slate-900">
                            {Math.floor(stats.daysDuration / 7)}
                        </p>
                        <p className="text-xs text-slate-500">
                            {t('progress.share.weeks')}
                        </p>
                    </div>

                    {/* Waist Change */}
                    {measurements?.waistChange && (
                        <div className="bg-white rounded-xl p-3 text-center">
                            <Ruler
                                size={20}
                                className="text-blue-600 mx-auto mb-1"
                            />
                            <p className="text-lg font-bold text-slate-900">
                                {Math.abs(measurements.waistChange).toFixed(1)} cm
                            </p>
                            <p className="text-xs text-slate-500">
                                {t('progress.share.waist')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Caption */}
                <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-slate-900 leading-relaxed">
                        {caption}
                    </p>
                </div>

                {/* Branding */}
                <div className="text-center mt-4">
                    <p className="text-xs text-slate-400 font-mono">
                        {t('progress.share.createdWith')}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-purple-200 text-purple-600 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors disabled:opacity-50">
                    <Download size={18} />
                    {isExporting
                        ? t('progress.share.exporting')
                        : t('progress.share.download')}
                </button>
                <button
                    onClick={onShare || handleWebShare}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
                    <Share2 size={18} />
                    {t('progress.share.social')}
                </button>
            </div>
        </div>
    );
};
