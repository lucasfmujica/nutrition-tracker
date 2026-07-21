import html2canvas from 'html2canvas';
import { Download, Loader2, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WeeklyReportCard } from '../Dashboard/WeeklyReportCard';
import { Button } from '../UI/Button';
import { ModalShell } from '../UI/ModalShell';
import { devLog } from '../../utils/devLog';

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

            devLog('[WeeklyReportModal] Image downloaded successfully');
        } catch (err) {
            console.error('[WeeklyReportModal] Download error:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            title={t('modals.weeklyReport.title')}
            size="md"
            footer={
                stats && !isLoading && !error ? (
                    <Button
                        fullWidth
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="!bg-gradient-to-r !from-primary !to-oura hover:!shadow-glow">
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
                    </Button>
                ) : undefined
            }>
            <div className="flex flex-col items-center gap-4">
                {/* Loading State */}
                {isLoading && (
                    <div
                        className="bg-surface rounded-card flex items-center justify-center shadow-card max-w-full"
                        style={{ width: '22rem', height: '28rem' }}>
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                            <p className="text-text-tertiary">
                                {t('modals.weeklyReport.generatingStatus')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div
                        className="bg-surface rounded-card flex items-center justify-center shadow-card max-w-full"
                        style={{ width: '22rem', height: '28rem' }}>
                        <div className="text-center px-8">
                            <div className="w-16 h-16 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="w-8 h-8 text-danger" />
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
                )}
            </div>
        </ModalShell>
    );
};
