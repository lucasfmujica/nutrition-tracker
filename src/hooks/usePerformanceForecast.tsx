import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { OuraEntry, Workout } from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

interface PerformanceForecast {
    status: string;
    forecastCode: string;
    title: string;
    copy: string;
    icon: string;
    ui?: {
        gradient: string;
        textColor: string;
    };
    metrics: {
        readiness3d?: string;
        readiness7d?: string;
        sleep3d?: string;
        sleep7d?: string;
        readinessTrend?: string;
        sleepTrend?: string;
        todayReadiness?: number;
        todaySleep?: number;
        volume48h?: number;
    };
}

/**
 * usePerformanceForecast - Predicts tomorrow's training capacity.
 */
export const usePerformanceForecast = (
    ouraLog: OuraEntry[],
    workoutLog: Workout[],
    referenceDate: string | null = null,
): PerformanceForecast => {
    const { t } = useTranslation();

    return useMemo(() => {
        // 0. Base Guards
        if (!ouraLog || ouraLog.length < 3) {
            return {
                status: t('dashboard.forecast.calculation.calculating'),
                forecastCode: 'insufficient_data',
                title: t('dashboard.forecast.calculation.gathering'),
                copy: t('dashboard.forecast.calculation.needOura'),
                icon: 'loading',
                metrics: {},
            };
        }

        const today = referenceDate || getArgentinaDateString();

        // 1. Calculate Averages (Readiness & Sleep)
        const getAvgMetrics = (daysBack: number) => {
            let readinessSum = 0;
            let sleepSum = 0;
            let count = 0;

            for (let i = 0; i < daysBack; i++) {
                const targetDate = addDaysToDate(today, -i);
                const entry = ouraLog.find((e) => e.date === targetDate);
                if (entry) {
                    const readiness = entry.readinessScore || 0;
                    const sleep = entry.sleepScore || 0;
                    if (readiness > 0) {
                        readinessSum += readiness;
                        sleepSum += sleep;
                        count++;
                    }
                }
            }
            return count > 0
                ? {
                      readiness: readinessSum / count,
                      sleep: sleepSum / count,
                      count,
                  }
                : null;
        };

        const avg3d = getAvgMetrics(3);
        const avg7d = getAvgMetrics(7);

        if (!avg3d || !avg7d || avg7d.count < 5) {
            return {
                status: t('dashboard.forecast.calculation.calculating'),
                forecastCode: 'insufficient_data',
                title: t('dashboard.forecast.calculation.analyzing'),
                copy: t('dashboard.forecast.calculation.moreData'),
                icon: 'cloud',
                metrics: {},
            };
        }

        // 2. Trend Analysis with PERCENTAGE thresholds
        const readinessTrendPct =
            ((avg3d.readiness - avg7d.readiness) / avg7d.readiness) * 100;
        const sleepTrendPct = ((avg3d.sleep - avg7d.sleep) / avg7d.sleep) * 100;

        // Get today's actual scores for context
        const todayEntry = ouraLog.find((e) => e.date === today);
        const todayReadiness = todayEntry?.readinessScore || avg3d.readiness;
        const todaySleep = todayEntry?.sleepScore || avg3d.sleep;

        // 3. Volume Analysis (Last 48h)
        const getDailyVolume = (date: string) => {
            if (!workoutLog) return 0;
            const entries = workoutLog.filter((w) => w.date === date);
            return entries.reduce((total, w) => {
                const volume = Number(String(w.volume).replace(',', '.')) || 0;
                return total + volume;
            }, 0);
        };

        const volume48h =
            getDailyVolume(today) + getDailyVolume(addDaysToDate(today, -1));
        const isHighVolume = volume48h > 10000;

        // 4. Decision Logic with MORE STATES
        let status = 'Normal';
        let forecastCode = 'steady';
        let icon = 'cloud-sun';
        let gradient = 'from-blue-50 to-indigo-50';
        let textColor = 'text-blue-700';

        // PEAK: Both metrics trending up significantly (>3%)
        if (readinessTrendPct > 3 && sleepTrendPct > 2) {
            status = 'Peak';
            icon = 'sun';
            forecastCode = 'peak';
            gradient = 'from-amber-50 to-orange-100';
            textColor = 'text-amber-700';
        }
        // GOOD: Readiness stable/up, decent sleep
        else if (
            readinessTrendPct >= 0 &&
            todayReadiness >= 75 &&
            todaySleep >= 70
        ) {
            status = 'Good';
            icon = 'cloud-sun';
            forecastCode = 'good';
            gradient = 'from-green-50 to-emerald-50';
            textColor = 'text-green-700';
        }
        // CAUTION: Declining trends but not critical
        else if (readinessTrendPct < -3 || sleepTrendPct < -5) {
            status = 'Caution';
            icon = 'cloud';
            forecastCode = 'caution';
            gradient = 'from-yellow-50 to-amber-50';
            textColor = 'text-yellow-700';
        }
        // RECOVERY: Both metrics clearly declining
        else if (readinessTrendPct < -5 && sleepTrendPct < -3) {
            status = 'Recovery';
            icon = 'cloud-rain';
            forecastCode = 'recovery';
            gradient = 'from-slate-100 to-gray-200';
            textColor = 'text-slate-700';
        }
        // REST PRIORITY: High recent volume with declining metrics
        else if (isHighVolume && (readinessTrendPct < 0 || todayReadiness < 70)) {
            status = 'Rest Priority';
            icon = 'battery-charging';
            forecastCode = 'rest_volume';
            gradient = 'from-purple-50 to-pink-50';
            textColor = 'text-purple-700';
        }
        // LOW SLEEP: Today's sleep was particularly poor
        else if (todaySleep < 60) {
            status = 'Sleep Focus';
            icon = 'moon';
            forecastCode = 'sleep_focus';
            gradient = 'from-indigo-50 to-purple-50';
            textColor = 'text-indigo-700';
        }

        return {
            status,
            forecastCode,
            title: t(`dashboard.forecast.${forecastCode}.title`),
            copy: t(`dashboard.forecast.${forecastCode}.copy`),
            icon,
            ui: {
                gradient,
                textColor,
            },
            metrics: {
                readiness3d: avg3d.readiness.toFixed(0),
                readiness7d: avg7d.readiness.toFixed(0),
                sleep3d: avg3d.sleep.toFixed(0),
                sleep7d: avg7d.sleep.toFixed(0),
                readinessTrend: readinessTrendPct.toFixed(1),
                sleepTrend: sleepTrendPct.toFixed(1),
                todayReadiness,
                todaySleep,
                volume48h,
            },
        };
    }, [ouraLog, workoutLog, referenceDate]);
};
