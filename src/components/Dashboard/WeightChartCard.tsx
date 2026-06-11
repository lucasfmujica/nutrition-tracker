import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useIsMobile } from '../../hooks/useIsMobile';
import { WeightEntry } from '../../types/domain';

interface WeightChartCardProps {
    data: WeightEntry[];
    currentWeight: number;
    targetWeight: number;
    weeklyTrend?: number | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface p-3 rounded-xl shadow-xl border border-border">
                <p className="text-text-tertiary text-xs font-semibold mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm font-bold text-text-primary">
                            {entry.value} {entry.name}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const WeightChartCard: React.FC<WeightChartCardProps> = ({
    data = [],
    currentWeight,
    weeklyTrend,
}) => {
    const { t, i18n } = useTranslation();
    const isMobile = useIsMobile();
    const isImperial = i18n.language.startsWith('en');
    const unitLabel = isImperial ? 'lbs' : 'kg';
    const weightMultiplier = isImperial ? 2.20462 : 1;

    // Format data for chart - Show last 14 days for more context
    const chartData = [...data]
        .filter((entry) => {
            const today = new Date();
            const entryDate = new Date(entry.date + 'T12:00:00');
            const diffDays =
                (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays <= 14;
        })
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => {
            const [day, month] = entry.date.split('-').reverse().slice(0, 2);
            return {
                date: `${day}/${month}`,
                weight: parseFloat((entry.weight * weightMultiplier).toFixed(1)), // Convert for chart
            };
        });

    // If no recent data, fallback to last 7 entries
    const finalChartData =
        chartData.length >= 2
            ? chartData
            : [...data]
                  .slice(0, 7)
                  .reverse()
                  .map((entry) => {
                      const [day, month] = entry.date
                          .split('-')
                          .reverse()
                          .slice(0, 2);
                      return {
                          date: `${day}/${month}`,
                          weight: parseFloat(
                              (entry.weight * weightMultiplier).toFixed(1),
                          ),
                      };
                  });

    // Use passed trend if available, otherwise calculate 14-day trend
    let displayTrend = weeklyTrend;
    if (displayTrend === undefined || displayTrend === null) {
        if (data.length >= 2) {
            const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
            const newest = sorted[sorted.length - 1];

            // Look for an entry approx 14 days ago, or just the oldest in the set
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            const relevantEntries = sorted.filter(
                (e) => new Date(e.date + 'T12:00:00') >= fourteenDaysAgo,
            );

            if (relevantEntries.length >= 2) {
                const oldestInWindow = relevantEntries[0];
                const daysDiff =
                    (new Date(newest.date + 'T12:00:00').getTime() -
                        new Date(oldestInWindow.date + 'T12:00:00').getTime()) /
                    (1000 * 60 * 60 * 24);
                displayTrend =
                    daysDiff > 0
                        ? ((newest.weight - oldestInWindow.weight) / daysDiff) * 7
                        : 0;
            } else {
                // Fallback to total change (less ideal but better than 0)
                const oldestTotal = sorted[0];
                const daysDiffTotal =
                    (new Date(newest.date + 'T12:00:00').getTime() -
                        new Date(oldestTotal.date + 'T12:00:00').getTime()) /
                    (1000 * 60 * 60 * 24);
                displayTrend =
                    daysDiffTotal > 0
                        ? ((newest.weight - oldestTotal.weight) / daysDiffTotal) * 7
                        : 0;
            }
        } else {
            displayTrend = 0;
        }
    }

    const isLoss = (displayTrend || 0) <= 0;
    const absTrend = Math.abs((displayTrend || 0) * weightMultiplier).toFixed(1);
    const displayCurrentWeight = (currentWeight * weightMultiplier).toFixed(1);

    return (
        <div className="bg-surface p-5 sm:p-8 rounded-[2.5rem] shadow-xl border border-border mb-6 group transition-all duration-300">
            <div className="flex justify-between items-start mb-6 sm:mb-8 gap-4 w-full">
                <div className="min-w-0 flex-1">
                    <h3 className="text-text-primary font-bold text-lg truncate w-full">
                        {t('dashboard.weightChart.title')}
                    </h3>
                    <p className="text-xs text-text-tertiary font-medium truncate w-full">
                        {finalChartData.length}{' '}
                        {t('dashboard.weightChart.recentRecords')}
                    </p>
                </div>
                <div className="text-right flex-shrink-0">
                    <span className="block text-2xl font-bold text-text-primary whitespace-nowrap">
                        {displayCurrentWeight}{' '}
                        <span className="text-sm font-normal text-text-tertiary">
                            {unitLabel}
                        </span>
                    </span>
                    <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLoss ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {displayTrend && displayTrend > 0 ? '+' : ''}
                        {displayTrend !== null ? absTrend : '0.0'} {unitLabel}/sem
                    </span>
                </div>
            </div>

            {finalChartData.length > 0 ? (
                <div className="h-48 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                        <AreaChart
                            data={finalChartData}
                            margin={{ top: 5, right: 4, left: 4, bottom: 0 }}>
                            <defs>
                                <linearGradient
                                    id="colorWeight"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="#0066EE"
                                        stopOpacity={0.2}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#0066EE"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fontSize: isMobile ? 9 : 10,
                                    fill: '#9CA3AF',
                                }}
                                dy={10}
                                interval="preserveStartEnd"
                                minTickGap={isMobile ? 24 : 12}
                            />
                            <YAxis
                                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                                hide={true}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                trigger={isMobile ? 'click' : 'hover'}
                                cursor={{
                                    stroke: '#0066EE',
                                    strokeWidth: 1,
                                    strokeDasharray: '4 4',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="weight"
                                name={unitLabel}
                                stroke="#0066EE"
                                strokeWidth={3}
                                strokeLinecap="round"
                                fillOpacity={1}
                                fill="url(#colorWeight)"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-48 w-full flex items-center justify-center text-text-tertiary text-sm bg-background rounded-xl border border-dashed border-border">
                    <p>{t('dashboard.weightChart.noData')}</p>
                </div>
            )}
        </div>
    );
};
