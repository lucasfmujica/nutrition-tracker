import React from 'react';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { WeightEntry } from '../../types/domain';

interface WeightChartCardProps {
    data: WeightEntry[];
    currentWeight: number;
    targetWeight: number;
    weeklyTrend?: number | null;
}

export const WeightChartCard: React.FC<WeightChartCardProps> = ({
    data = [],
    currentWeight,
    weeklyTrend,
}) => {
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
                weight: entry.weight,
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
                          weight: entry.weight,
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
    const absTrend = Math.abs(displayTrend || 0).toFixed(1);

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 mb-6">
            <div className="flex justify-between items-start mb-6 gap-2 w-full">
                <div className="min-w-0 flex-1">
                    <h3 className="text-gray-900 font-bold text-lg truncate w-full">
                        Peso Corporal
                    </h3>
                    <p className="text-xs text-gray-400 font-medium truncate w-full">
                        {finalChartData.length} registros recientes
                    </p>
                </div>
                <div className="text-right flex-shrink-0">
                    <span className="block text-2xl font-bold text-gray-900 whitespace-nowrap">
                        {currentWeight}{' '}
                        <span className="text-sm font-normal text-gray-400">kg</span>
                    </span>
                    <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLoss ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {displayTrend && displayTrend > 0 ? '+' : ''}
                        {displayTrend !== null ? absTrend : '0.0'} kg/sem
                    </span>
                </div>
            </div>

            {finalChartData.length > 0 ? (
                <div className="h-48 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                        <AreaChart data={finalChartData}>
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
                                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                dy={10}
                            />
                            <YAxis
                                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                                hide={true}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                }}
                                itemStyle={{ color: '#0066EE', fontWeight: 'bold' }}
                                cursor={{
                                    stroke: '#0066EE',
                                    strokeWidth: 1,
                                    strokeDasharray: '4 4',
                                }}
                                formatter={(value: any) => [`${value} kg`, 'Peso']}
                            />
                            <Area
                                type="monotone"
                                dataKey="weight"
                                name="Peso"
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
                <div className="h-48 w-full flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p>No hay datos suficientes para mostrar el gráfico</p>
                </div>
            )}
        </div>
    );
};
