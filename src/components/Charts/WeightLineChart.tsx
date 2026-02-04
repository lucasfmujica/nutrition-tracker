import React from 'react';
import { useTranslation } from 'react-i18next';
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
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 ring-1 ring-gray-50">
                <p className="text-gray-500 text-xs font-semibold mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div
                        key={index}
                        className="flex items-center gap-2 mb-1 last:mb-0">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm font-bold text-gray-700">
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
    if (!data || data.length === 0) return null;

    // Calculate domain for better visualization
    const weights = data.map((d) => d.weight);
    const minWeight = Math.min(...weights, targetWeight) - 1;
    const maxWeight = Math.max(...weights, targetWeight) + 1;

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-[350px] w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">
                        {t('charts.weight.title')}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                        {t('charts.weight.trend')}
                    </p>
                </div>

                {/* Legend */}
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-gray-600 font-medium">
                            {t('navigation.weight')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="text-gray-600 font-medium">
                            {t('charts.weight.average')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                        <span className="text-gray-600 font-medium">
                            {t('charts.weight.average30d')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-0.5 border-t border-dashed border-emerald-400"></span>
                        <span className="text-gray-600 font-medium">
                            {t('charts.weight.goal')} ({targetWeight})
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            dy={10}
                            interval="preserveStartEnd"
                        />

                        <YAxis
                            domain={[minWeight, maxWeight]}
                            hide={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                        />

                        <Tooltip content={<CustomTooltip />} />

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
