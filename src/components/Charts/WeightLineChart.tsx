import React from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    TooltipProps,
    XAxis,
    YAxis,
} from 'recharts';

/**
 * WeightLineChart - Recharts implementation
 * Light Mode, Premium Aesthetic
 */

interface WeightDataPoint {
    dayLabel: string;
    weight: number;
    avg7d: number;
    avg30d: number;
}

interface WeightLineChartProps {
    data: WeightDataPoint[];
    targetWeight: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    const { t } = useTranslation();
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface p-4 rounded-xl shadow-xl border border-border">
                <p className="text-text-tertiary text-xs font-semibold mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div
                        key={index}
                        className="flex items-center gap-2 mb-1 last:mb-0">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm font-bold text-text-secondary">
                            {entry.name}: {entry.value} kg
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const WeightLineChart: React.FC<WeightLineChartProps> = ({
    data,
    targetWeight,
}) => {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    if (!data || data.length === 0) return null;

    // Calculate domain for better visualization
    const weights = data.map((d) => d.weight);
    const minWeight = Math.min(...weights, targetWeight) - 1;
    const maxWeight = Math.max(...weights, targetWeight) + 1;

    return (
        <div className="bg-surface rounded-2xl p-4 sm:p-6 border border-border shadow-sm w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">
                        {t('charts.weight.title')}
                    </h3>
                    <p className="text-xs text-text-tertiary font-medium">
                        {t('charts.weight.trend')}
                    </p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 sm:gap-4 text-[10px] sm:text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-text-secondary font-medium">
                            {t('navigation.weight')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="text-text-secondary font-medium">
                            {t('charts.weight.average')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                        <span className="text-text-secondary font-medium">
                            {t('charts.weight.average30d')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-0.5 border-t border-dashed border-emerald-400"></span>
                        <span className="text-text-secondary font-medium">
                            {t('charts.weight.goal')} ({targetWeight})
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-[200px] sm:h-[250px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: isMobile ? 4 : 10,
                            left: isMobile ? -24 : -20,
                            bottom: 0,
                        }}>
                        <defs>
                            <linearGradient
                                id="colorWeight"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="#6366f1"
                                    stopOpacity={0.2}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#6366f1"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f3f4f6"
                        />

                        <XAxis
                            dataKey="dayLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: isMobile ? 9 : 11 }}
                            dy={10}
                            interval="preserveStartEnd"
                            minTickGap={isMobile ? 24 : 12}
                        />

                        <YAxis
                            domain={[minWeight, maxWeight]}
                            hide={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: isMobile ? 9 : 11 }}
                            tickCount={isMobile ? 4 : 5}
                            width={isMobile ? 32 : 40}
                        />

                        <Tooltip
                            content={<CustomTooltip />}
                            trigger={isMobile ? 'click' : 'hover'}
                        />

                        <ReferenceLine
                            y={targetWeight}
                            stroke="#10b981"
                            strokeDasharray="4 4"
                            strokeOpacity={0.6}
                        />

                        <Area
                            type="monotone"
                            dataKey="weight"
                            name={t('navigation.weight')}
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorWeight)"
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                        />

                        <Line
                            type="monotone"
                            dataKey="avg7d"
                            name={t('charts.weight.average')}
                            stroke="#fbbf24"
                            strokeWidth={2}
                            dot={false}
                            activeDot={false}
                            opacity={0.8}
                        />

                        <Line
                            type="monotone"
                            dataKey="avg30d"
                            name={t('charts.weight.average30d')}
                            stroke="#ec4899"
                            strokeWidth={2}
                            dot={false}
                            activeDot={false}
                            opacity={0.8}
                            strokeDasharray="4 4"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
