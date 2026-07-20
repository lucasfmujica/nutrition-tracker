import { FileImage } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface WeeklyReportCTAProps {
    onClick: () => void;
}

/** CTA de reporte semanal: banner oscuro full-width del bento grid. */
export const WeeklyReportCTA: React.FC<WeeklyReportCTAProps> = ({ onClick }) => {
    const { t } = useTranslation();
    return (
        <button
            onClick={onClick}
            className="w-full py-5 bg-text-primary text-background rounded-card font-bold shadow-float hover:shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-4 group border border-border">
            <div className="w-10 h-10 rounded-control bg-background/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileImage className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl tracking-tight uppercase font-satoshi">
                {t('dashboard.generateWeeklyReport')}
            </span>
        </button>
    );
};
