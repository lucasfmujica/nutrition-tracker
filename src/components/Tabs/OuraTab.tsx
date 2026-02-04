import { AlertCircle, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { OuraEntry, Profile } from '../../types/domain';
import { getArgentinaDateString } from '../../utils/dateUtils';
import { OuraBentoGrid, OuraData } from '../Oura/OuraBentoGrid';
import { OuraWeeklyView } from '../Oura/OuraWeeklyView';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

interface OuraTabProps {
    ouraLog: OuraEntry[];
}

/**
 * OuraTab - Automated Oura Ring Dashboard
 */
export const OuraTab: React.FC<OuraTabProps> = ({ ouraLog = [] }) => {
    const { t } = useTranslation();
    const {
        syncOuraData,
        isSyncing,
        syncStatus,
        getStepsForDate,
        profile,
        setActiveTab,
        stepsLog,
    } = useTracker() as any;
    const [selectedDate, setSelectedDate] = useState(getArgentinaDateString());
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

    const dailyOuraData = ouraLog.find((e) => e.date === selectedDate);
    const steps = getStepsForDate(selectedDate);

    const hasToken = !!profile?.ouraPersonalToken;

    const dailyData = dailyOuraData
        ? ({
              ...dailyOuraData,
              readinessScore: dailyOuraData.readinessScore ?? undefined,
              sleepScore: dailyOuraData.sleepScore ?? undefined,
              activityScore: dailyOuraData.activityScore ?? undefined,
              hrv: dailyOuraData.hrv ?? undefined,
              restingHr: dailyOuraData.restingHr ?? undefined,
              sleepHours: dailyOuraData.sleepHours ?? undefined,
              deepSleepMins: dailyOuraData.deepSleepMins ?? undefined,
              remSleepMins: dailyOuraData.remSleepMins ?? undefined,
              steps,
          } as OuraData)
        : null;

    useEffect(() => {
        const rawTime = localStorage.getItem('oura_last_sync');
        if (rawTime) {
            const date = new Date(parseInt(rawTime));
            setLastSyncTime(
                date.toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            );
        }
    }, [syncStatus]);

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="px-1 text-center md:text-left">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center md:justify-start">
                        {t('oura.title')}
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
                            Sync V2
                        </span>
                    </h1>
                    <p className="text-sm text-gray-500">{t('oura.subtitle')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm mx-auto md:mx-0">
                    <div className="w-full md:w-[260px]">
                        <LukenFitDatePicker
                            selectedDate={selectedDate}
                            onChange={setSelectedDate}
                            label={t('common.date')}
                        />
                    </div>

                    <div className="w-px h-8 bg-gray-100 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-2 pr-2 ml-auto sm:ml-0">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] mobile-label text-gray-400 font-bold uppercase tracking-wider">
                                {t('oura.setup.lastSync')}
                            </p>
                            <p className="text-xs font-bold text-gray-700">
                                {lastSyncTime || '--:--'}
                            </p>
                        </div>
                        <button
                            onClick={() => syncOuraData(true)}
                            disabled={isSyncing || !hasToken}
                            className={`p-2 rounded-lg transition-all ${
                                isSyncing
                                    ? 'bg-purple-50 text-purple-500'
                                    : !hasToken
                                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                      : 'bg-gray-50 text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                            }`}
                            title={
                                !hasToken
                                    ? t('oura.setup.notConfiguredDesc')
                                    : t('oura.sync')
                            }>
                            <RefreshCw
                                className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {!hasToken && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">
                            {t('oura.setup.notConfigured')}
                        </h3>
                        <p className="text-sm text-amber-700 max-w-md mx-auto mt-1">
                            {t('oura.setup.notConfiguredDesc')}
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveTab('config')}
                        className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors shadow-sm active:scale-95">
                        {t('oura.setup.title')}
                    </button>
                </div>
            )}

            {hasToken && (
                <>
                    <OuraBentoGrid
                        data={dailyData}
                        stepGoal={profile?.stepGoal || 8000}
                    />

                    <OuraWeeklyView ouraLog={ouraLog} stepsLog={stepsLog || []} />
                </>
            )}

            {isSyncing && (
                <div className="text-center text-xs text-purple-500 font-medium animate-pulse">
                    {t('oura.setup.syncing')}
                </div>
            )}
        </div>
    );
};
