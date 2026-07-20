import { AlertCircle, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { OuraEntry, Profile } from '../../types/domain';
import { getArgentinaDateString } from '../../utils/dateUtils';
import { OuraBentoGrid, OuraData } from '../Oura/OuraBentoGrid';
import { OuraWeeklyChart } from '../Oura/OuraWeeklyChart';
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

    // --- SLEEP SCHEDULE CALCULATION ---
    const sleepSchedule = React.useMemo(() => {
        if (!ouraLog.length) return null;

        // Last 30 days
        const sorted = [...ouraLog]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 30);
        const bedtimes = sorted.map((e) => e.bedtime).filter(Boolean) as string[];
        const wakeTimes = sorted.map((e) => e.wakeTime).filter(Boolean) as string[];

        if (!bedtimes.length || !wakeTimes.length) return null;

        // Helper: Convert time string to minutes from noon (to handle midnight crossing)
        // 12:00 -> 0, 18:00 -> 360, 00:00 -> 720, 06:00 -> 1080
        const timeToMins = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            let mins = h * 60 + m;
            // Shift so noon is 0, to make midnight (which is average center roughly) continuous
            // e.g. 23:00 (1380) -> 1380 - 720 = 660
            // 01:00 (60) -> 60 + 1440 - 720 = 780
            if (h < 12) mins += 24 * 60; // Next day
            return mins - 12 * 60; // Normalize to noon
        };

        const minsToTime = (mins: number) => {
            // Restore from noon offset
            let m = Math.round(mins) + 12 * 60;
            if (m >= 24 * 60) m -= 24 * 60;
            const h = Math.floor(m / 60);
            const mn = m % 60;
            return `${h.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`;
        };

        const avgBedtimeMins =
            bedtimes.reduce((acc, t) => acc + timeToMins(t), 0) / bedtimes.length;

        // Wake times usually don't cross midnight in weird ways relative to morning
        // But let's use standard minutes for wake time (simple average usually works for 6am-10am)
        const simpleTimeToMins = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const avgWakeMins =
            wakeTimes.reduce((acc, t) => acc + simpleTimeToMins(t), 0) /
            wakeTimes.length;
        const simpleMinsToTime = (mins: number) => {
            const h = Math.floor(mins / 60);
            const m = Math.round(mins % 60);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };

        return {
            avgBedtime: minsToTime(avgBedtimeMins),
            avgWakeTime: simpleMinsToTime(avgWakeMins),
        };
    }, [ouraLog]);

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="px-1 text-center md:text-left">
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 justify-center md:justify-start">
                        {t('oura.title')}
                        <span className="px-2 py-0.5 rounded-full bg-oura-soft text-oura text-[10px] font-bold uppercase tracking-wider">
                            Sync V2
                        </span>
                    </h1>
                    <p className="text-sm text-text-tertiary">{t('oura.subtitle')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-surface p-1.5 rounded-control border border-border shadow-card mx-auto md:mx-0">
                    <div className="w-full md:w-[260px]">
                        <LukenFitDatePicker
                            selectedDate={selectedDate}
                            onChange={setSelectedDate}
                            label={t('common.date')}
                        />
                    </div>

                    <div className="w-px h-8 bg-surface-lighter mx-1 hidden sm:block" />

                    <div className="flex items-center gap-2 pr-2 ml-auto sm:ml-0">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] mobile-label text-text-tertiary font-bold uppercase tracking-wider">
                                {t('oura.setup.lastSync')}
                            </p>
                            <p className="text-xs font-bold text-text-secondary">
                                {lastSyncTime || '--:--'}
                            </p>
                        </div>
                        <button
                            onClick={() => syncOuraData(true)}
                            disabled={isSyncing || !hasToken}
                            className={`p-2 rounded-control transition-all ${
                                isSyncing
                                    ? 'bg-oura-soft text-oura'
                                    : !hasToken
                                      ? 'bg-background text-text-tertiary cursor-not-allowed'
                                      : 'bg-background text-text-tertiary hover:bg-oura-soft hover:text-oura'
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
                <div className="bg-warning-soft border border-warning/20 rounded-card p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-warning/15 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">
                            {t('oura.setup.notConfigured')}
                        </h3>
                        <p className="text-sm text-text-secondary max-w-md mx-auto mt-1">
                            {t('oura.setup.notConfiguredDesc')}
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveTab('config')}
                        className="px-6 py-2.5 bg-warning text-white rounded-control font-bold text-sm hover:bg-warning/90 transition-colors shadow-card active:scale-95">
                        {t('oura.setup.title')}
                    </button>
                </div>
            )}

            {hasToken && (
                <>
                    {sleepSchedule && (
                        <div className="bg-surface rounded-card p-5 border border-oura/20 shadow-card flex flex-col md:flex-row gap-4 md:items-center justify-between">
                            <div>
                                <h3 className="text-text-primary font-bold flex items-center gap-2">
                                    <span className="text-xl">💤</span>{' '}
                                    {t('oura.schedule.title')}
                                </h3>
                                <p className="text-xs text-text-tertiary mt-1">
                                    {t('oura.schedule.basedOn')}
                                </p>
                            </div>
                            <div className="flex gap-4 md:gap-8">
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider mb-1">
                                        {t('oura.schedule.bedtime')}
                                    </p>
                                    <p className="text-2xl font-black text-oura">
                                        {sleepSchedule.avgBedtime}
                                    </p>
                                </div>
                                <div className="w-px bg-surface-lighter h-10 self-center hidden md:block"></div>
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider mb-1">
                                        {t('oura.schedule.wakeTime')}
                                    </p>
                                    <p className="text-2xl font-black text-oura">
                                        {sleepSchedule.avgWakeTime}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <OuraBentoGrid
                        data={dailyData}
                        stepGoal={profile?.stepGoal || 8000}
                    />

                    <OuraWeeklyView ouraLog={ouraLog} stepsLog={stepsLog || []} />

                    <OuraWeeklyChart ouraLog={ouraLog} />
                </>
            )}

            {isSyncing && (
                <div className="text-center text-xs text-oura font-medium animate-pulse">
                    {t('oura.setup.syncing')}
                </div>
            )}
        </div>
    );
};
