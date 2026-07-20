import React from 'react';
import { useTranslation } from 'react-i18next';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';
import { SafetyNetToggle } from './SafetyNetToggle';

interface DashboardHeaderProps {
    dashboardDate: string;
    setDashboardDate: (date: string) => void;
    safetyNetActive: boolean;
    onToggleSafetyNet: () => void;
    statusMessage: string;
}

/** Header del Dashboard: título + toggle Safety Net + date picker. */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    dashboardDate,
    setDashboardDate,
    safetyNetActive,
    onToggleSafetyNet,
    statusMessage,
}) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1 mb-8">
            <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight uppercase font-satoshi">
                    {t('dashboard.title')}
                </h1>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <p className="text-overline uppercase text-text-tertiary tracking-[0.2em] font-bold">
                        {t('dashboard.subtitle')}
                    </p>
                </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row md:items-center gap-3 self-stretch md:self-auto">
                <div className="flex-1 md:flex-none">
                    <SafetyNetToggle
                        isActive={safetyNetActive}
                        onToggle={onToggleSafetyNet}
                        statusMessage={statusMessage}
                    />
                </div>
                <div className="flex-1 md:min-w-[220px]">
                    <LukenFitDatePicker
                        selectedDate={dashboardDate}
                        onChange={setDashboardDate}
                        label={t('weight.date')}
                    />
                </div>
            </div>
        </div>
    );
};
