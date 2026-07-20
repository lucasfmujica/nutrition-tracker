import {
    Clock,
    Drumstick,
    LucideIcon,
    Plus,
    ScanBarcode,
    Search,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

interface DiaryHeaderProps {
    selectedFoodDate: string;
    setSelectedFoodDate: (date: string) => void;
    onOpenHistory: () => void;
    onOpenSearch: () => void;
    onOpenBarcode: () => void;
    onOpenScan: () => void;
    onAddManual: () => void;
}

interface QuickAction {
    icon: LucideIcon;
    titleKey: string;
    onClick: () => void;
    classes: string;
}

/** Header del Diario: título + quick actions (44px) + date picker. */
export const DiaryHeader: React.FC<DiaryHeaderProps> = ({
    selectedFoodDate,
    setSelectedFoodDate,
    onOpenHistory,
    onOpenSearch,
    onOpenBarcode,
    onOpenScan,
    onAddManual,
}) => {
    const { t } = useTranslation();

    const quickActions: QuickAction[] = [
        {
            icon: Clock,
            titleKey: 'diary.quickActions.history',
            onClick: onOpenHistory,
            classes: 'bg-oura-soft text-oura hover:bg-oura/20',
        },
        {
            icon: Search,
            titleKey: 'diary.quickActions.search',
            onClick: onOpenSearch,
            classes: 'bg-primary-soft text-primary hover:bg-primary/20',
        },
        {
            icon: ScanBarcode,
            titleKey: 'diary.quickActions.barcode',
            onClick: onOpenBarcode,
            classes: 'bg-success-soft text-success hover:bg-success/20',
        },
        {
            icon: Drumstick,
            titleKey: 'diary.quickActions.camera',
            onClick: onOpenScan,
            classes: 'bg-info-soft text-info hover:bg-info/20',
        },
        {
            icon: Plus,
            titleKey: 'diary.quickActions.manual',
            onClick: onAddManual,
            classes:
                'bg-surface-lighter text-text-secondary hover:bg-progress-track',
        },
    ];

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4 flex-wrap">
                <div>
                    <h1 className="text-title text-text-primary">
                        {t('diary.title')}
                    </h1>
                    <p className="text-sm text-text-tertiary">
                        {t('diary.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {quickActions.map(({ icon: Icon, titleKey, onClick, classes }) => (
                        <button
                            key={titleKey}
                            onClick={onClick}
                            className={`w-11 h-11 flex items-center justify-center rounded-control transition-colors active:scale-95 ${classes}`}
                            title={t(titleKey)}>
                            <Icon size={20} />
                        </button>
                    ))}
                </div>
            </div>
            <div className="w-full md:w-auto hidden md:block">
                <LukenFitDatePicker
                    selectedDate={selectedFoodDate}
                    onChange={setSelectedFoodDate}
                    label={t('weight.date')}
                />
            </div>
        </div>
    );
};
