/**
 * CorrelationChart - Scatter plot with linear regression for measurement correlations
 * Sprint 2: Measurement Analytics
 */

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    calculateLinearRegression,
    formatCorrelationStrength,
    type DataPoint,
} from '../../utils/analyticsUtils';

interface CorrelationChartProps {
    dataPoints: DataPoint[];
    xLabel: string;
    yLabel: string;
    title: string;
}

export const CorrelationChart: React.FC<CorrelationChartProps> = ({
    dataPoints,
    xLabel,
    yLabel,
    title,
}) => {
    const regression = useMemo(() => {
        return calculateLinearRegression(dataPoints);
    }, [dataPoints]);

    const trendLineData = useMemo(() => {
        if (!regression || dataPoints.length === 0) return [];

        const minX = Math.min(...dataPoints.map((p) => p.x));
        const maxX = Math.max(...dataPoints.map((p) => p.x));

        return [
            { x: minX, y: regression.slope * minX + regression.intercept },
            { x: maxX, y: regression.slope * maxX + regression.intercept },
        ];
    }, [regression, dataPoints]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload[0]) return null;

        const data = payload[0].payload;
        return (
            <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">{data.date}</p>
                <p className="text-sm font-bold text-slate-900">
                    {xLabel}: {data.x.toFixed(1)} kg
                </p>
                <p className="text-sm font-bold text-purple-600">
                    {yLabel}: {data.y.toFixed(1)}
                </p>
            </div>
        );
    };

    // Empty state
    if (dataPoints.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-slate-400">Sin datos suficientes</p>
                </div>
            </div>
        );
    }

    // Need at least 3 points for meaningful correlation
    if (dataPoints.length < 3) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-slate-400">
                        Necesitás al menos 3 mediciones para ver correlación
                    </p>
                </div>
            </div>
        );
    }

    const correlationStrength = regression
        ? formatCorrelationStrength(regression.rSquared)
        : '';
    const trendIcon =
        regression && regression.slope > 0.1
            ? TrendingUp
            : regression && regression.slope < -0.1
              ? TrendingDown
              : Minus;

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                    <p className="text-xs text-slate-500">
                        {dataPoints.length} mediciones
                    </p>
                </div>
                {regression && (
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end mb-1">
                            {React.createElement(trendIcon, {
                                size: 16,
                                className:
                                    regression.slope > 0.1
                                        ? 'text-orange-500'
                                        : regression.slope < -0.1
                                          ? 'text-green-500'
                                          : 'text-slate-400',
                            })}
                            <span className="text-sm font-bold text-slate-900">
                                R² = {regression.rSquared.toFixed(2)}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            {correlationStrength}
                        </p>
                    </div>
                )}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={250}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        type="number"
                        dataKey="x"
                        name={xLabel}
                        label={{
                            value: xLabel,
                            position: 'insideBottom',
                            offset: -10,
                            style: { fontSize: 12, fill: '#64748b' },
                        }}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name={yLabel}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Scatter points */}
                    <Scatter
                        data={dataPoints}
                        fill="#9333ea"
                        fillOpacity={0.6}
                        r={6}
                    />

                    {/* Trend line */}
                    {regression && trendLineData.length > 0 && (
                        <Scatter
                            data={trendLineData}
                            fill="none"
                            line={{
                                stroke: '#9333ea',
                                strokeWidth: 2,
                                strokeDasharray: '5 5',
                            }}
                        />
                    )}
                </ScatterChart>
            </ResponsiveContainer>

            {/* Equation */}
            {regression && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 text-center font-mono">
                        {regression.equation}
                    </p>
                </div>
            )}
        </div>
    );
};
