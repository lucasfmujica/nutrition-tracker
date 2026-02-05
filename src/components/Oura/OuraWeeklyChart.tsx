import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { OuraEntry } from '../../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../../utils/dateUtils';

interface OuraWeeklyChartProps {
    ouraLog: OuraEntry[];
}

/**
 * OuraWeeklyChart - A beautiful visual chart of Oura metrics over the last 7 days
 */
export const OuraWeeklyChart: React.FC<OuraWeeklyChartProps> = ({ ouraLog }) => {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        const today = getArgentinaDateString();
        const days: string[] = [];
        for (let i = 7; i >= 1; i--) {
            days.push(addDaysToDate(today, -i));
        }

        return days.map((date) => {
            const entry = ouraLog.find((e) => e.date === date);

            // Format date for X-axis (e.g., "Mon 03")
            const d = new Date(date + 'T12:00:00');
            const dayLabel = d
                .toLocaleDateString(
                    t('common.locale') === 'es' ? 'es-AR' : 'en-US',
                    {
                        weekday: 'short',
                    },
                )
                .split(' ')[0]
                .replace('.', ''); // Remove dot for Spanish
            const dayNum = d.getDate();

            return {
                name: `${dayLabel} ${dayNum}`,
                readiness: entry?.readinessScore || null,
                sleep: entry?.sleepScore || null,
                activity: entry?.activityScore || null,
                hrv: entry?.hrv || null,
                rhr: entry?.restingHr || null,
            };
        });
    }, [ouraLog, t]);

    const hasData = chartData.some((d) => d.readiness || d.sleep || d.activity);

    if (!hasData) return null;

    return (
        <div className="bg-surface rounded-2xl p-4 md:p-6 border border-border shadow-sm space-y-4">
            <div>
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                        📈
                    </span>
                    {t('oura.weeklyChart.title')}
                </h2>
                <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mt-1 ml-10">
                    {t('oura.weeklyChart.subtitle')}
                </p>
            </div>

            <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient
                                id="colorReadiness"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="#8B5CF6"
                                    stopOpacity={0.1}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#8B5CF6"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                            <linearGradient
                                id="colorSleep"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="#3B82F6"
                                    stopOpacity={0.1}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#3B82F6"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                            <linearGradient
                                id="colorActivity"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="#10B981"
                                    stopOpacity={0.1}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#10B981"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#F1F5F9"
                        />

                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 500 }}
                            dy={10}
                        />

                        <YAxis yAxisId="scores" domain={[0, 100]} hide={true} />

                        <YAxis yAxisId="metrics" orientation="right" hide={true} />

                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                fontSize: '11px',
                                fontWeight: 'bold',
                            }}
                            cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                        />

                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                paddingBottom: '20px',
                            }}
                        />

                        {/* Scores as Areas */}
                        <Area
                            yAxisId="scores"
                            type="monotone"
                            dataKey="readiness"
                            name={t('oura.metrics.readiness')}
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorReadiness)"
                            animationDuration={1500}
                        />
                        <Area
                            yAxisId="scores"
                            type="monotone"
                            dataKey="sleep"
                            name={t('oura.metrics.sleep')}
                            stroke="#3B82F6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorSleep)"
                            animationDuration={1500}
                        />
                        <Area
                            yAxisId="scores"
                            type="monotone"
                            dataKey="activity"
                            name={t('oura.metrics.activity')}
                            stroke="#10B981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorActivity)"
                            animationDuration={1500}
                        />

                        {/* HRV and RHR as Lines */}
                        <Line
                            yAxisId="metrics"
                            type="monotone"
                            dataKey="hrv"
                            name={t('oura.metrics.hrv')}
                            stroke="#F59E0B"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                        <Line
                            yAxisId="metrics"
                            type="monotone"
                            dataKey="rhr"
                            name={t('oura.metrics.restingHR')}
                            stroke="#EF4444"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ r: 3, fill: '#EF4444', strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
