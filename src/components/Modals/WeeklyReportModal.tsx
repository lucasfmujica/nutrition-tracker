import html2canvas from 'html2canvas';
import { Download, Loader2, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WeeklyReportCard } from '../Dashboard/WeeklyReportCard';

interface WeeklyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: any;
    isLoading: boolean;
    error?: string | null;
}

/**
 * WeeklyReportModal - Modal for displaying and downloading the weekly report card
 *
 * Uses html2canvas to convert the WeeklyReportCard into a downloadable PNG image.
 * Follows the modal pattern from MondayBriefingModal.
 */
export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
    isOpen,
    onClose,
    stats,
    isLoading,
    error,
}) => {
    const { t } = useTranslation();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!cardRef.current) return;

        setIsDownloading(true);

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
            });

            const link = document.createElement('a');
            link.download = `LukenFit-Week-${stats?.weekRange?.replace(/ /g, '-') || 'Report'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            console.log('[WeeklyReportModal] Image downloaded successfully');
        } catch (err) {
            console.error('[WeeklyReportModal] Download error:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 pt-8">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Container - Always visible at top with padding */}
            <div className="relative z-10 animate-fade-in-up">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 z-20 w-10 h-10 bg-surface rounded-full shadow-lg flex items-center justify-center hover:bg-background transition-colors">
                    <X className="w-5 h-5 text-text-tertiary" />
                </button>

                {/* Content Container */}
                <div className="flex flex-col items-center gap-4">
                    {/* Loading State */}
                    {isLoading && (
                        <div
                            className="bg-surface rounded-3xl flex items-center justify-center shadow-2xl"
                            style={{ width: '22rem', height: '28rem' }}>
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                                <p className="text-text-tertiary">
                                    {t('modals.weeklyReport.generatingStatus')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div
                            className="bg-surface rounded-3xl flex items-center justify-center shadow-2xl"
                            style={{ width: '22rem', height: '28rem' }}>
                            <div className="text-center px-8">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X className="w-8 h-8 text-red-500" />
                                </div>
                                <p className="text-text-primary font-medium mb-2">
                                    {t('modals.weeklyReport.errorTitle')}
                                </p>
                                <p className="text-text-tertiary text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Card Display */}
                    {stats && !isLoading && !error && (
                        <>
                            <WeeklyReportCard
                                ref={cardRef}
                                workouts={stats.workouts}
                                gymCount={stats.gymCount}
                                tennisCount={stats.tennisCount}
                                proteinAvg={stats.proteinAvg}
                                avgDeficit={stats.avgDeficit}
                                consistencyStreak={stats.consistencyStreak}
                                daysTracked={stats.daysTracked}
                                weightDelta={stats.weightDelta}
                                totalLost={stats.totalLost}
                                percentToGoal={stats.percentToGoal}
                                currentWeight={stats.currentWeight}
                                weekRange={stats.weekRange}
                            />

                            {/* Download Button - Matches card width */}
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                style={{ width: '24rem' }}
                                className="py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-300/40 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2">
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {t('modals.weeklyReport.downloading')}
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        {t('modals.weeklyReport.downloadButton')}
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
