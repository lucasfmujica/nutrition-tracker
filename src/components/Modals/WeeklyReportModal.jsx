import html2canvas from 'html2canvas';
import { Download, Loader2, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { WeeklyReportCard } from '../Dashboard/WeeklyReportCard';

/**
 * WeeklyReportModal - Modal for displaying and downloading the weekly report card
 *
 * Uses html2canvas to convert the WeeklyReportCard into a downloadable PNG image.
 * Follows the modal pattern from MondayBriefingModal.
 */
export const WeeklyReportModal = ({
  isOpen,
  onClose,
  stats,
  isLoading,
  error
}) => {
  const cardRef = useRef(null);
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
        logging: false
      });

      const link = document.createElement('a');
      link.download = `LukenFit-Semana-${stats?.weekRange?.replace(/ /g, '-') || 'Reporte'}.png`;
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container - No scroll, centered */}
      <div className="relative z-10 animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content Container */}
        <div className="flex flex-col items-center gap-4">
          {/* Loading State */}
          {isLoading && (
            <div
              className="bg-white rounded-3xl flex items-center justify-center shadow-2xl"
              style={{ width: '22rem', height: '28rem' }}
            >
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Generando reporte...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div
              className="bg-white rounded-3xl flex items-center justify-center shadow-2xl"
              style={{ width: '22rem', height: '28rem' }}
            >
              <div className="text-center px-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-gray-900 font-medium mb-2">Error al cargar</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Card Display */}
          {stats && !isLoading && !error && (
            <>
              <WeeklyReportCard
                ref={cardRef}
                workouts={stats.workouts}
                proteinAdherence={stats.proteinAdherence}
                weightDelta={stats.weightDelta}
                weekRange={stats.weekRange}
              />

              {/* Download Button - Matches card width */}
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                style={{ width: '22rem' }}
                className="py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-300/40 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Descargar Imagen
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
