import { Info, Microscope, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis,
} from 'recharts';
import { useIsMobile } from '../../hooks/useIsMobile';

interface CorrelationDataPoint {
    x: number;
    y: number;
    date: string;
}

interface ScatterCardProps {
    title: string;
    subtitle: string;
    data: CorrelationDataPoint[];
    xLabel: string;
    yLabel: string;
    color: string;
    chartId:
        | 'fuelVsPerf'
        | 'recoveryCost'
        | 'willpower'
        | 'metabolic'
        | 'activitySleep'
        | 'hydrationCardio';
}

const ScatterCard: React.FC<ScatterCardProps> = ({
    title,
    subtitle,
    data,
    xLabel,
    yLabel,
    color,
    chartId,
}) => {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    // Calculate simple linear regression for the trend line
    const calculateTrendLine = () => {
        if (data.length < 2) return [];
        const n = data.length;
        const sumX = data.reduce((acc, p) => acc + p.x, 0);
        const sumY = data.reduce((acc, p) => acc + p.y, 0);
        const sumXY = data.reduce((acc, p) => acc + p.x * p.y, 0);
        const sumX2 = data.reduce((acc, p) => acc + p.x * p.x, 0);

        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const b = (sumY - m * sumX) / n;

        // Get min and max X for the line
        const minX = Math.min(...data.map((p) => p.x));
        const maxX = Math.max(...data.map((p) => p.x));

        return [
            { x: minX, trend: m * minX + b },
            { x: maxX, trend: m * maxX + b },
        ];
    };

    // Calculate Pearson Correlation Coefficient (r)
    const calculateR = () => {
        if (data.length < 3) return null;
        const n = data.length;
        let sumX = 0,
            sumY = 0,
            sumX2 = 0,
            sumY2 = 0,
            sumXY = 0;

        data.forEach((p) => {
            sumX += p.x;
            sumY += p.y;
            sumX2 += p.x * p.x;
            sumY2 += p.y * p.y;
            sumXY += p.x * p.y;
        });

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt(
            (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
        );

        if (denominator === 0) return 0;
        return numerator / denominator;
    };

    const trendLine = calculateTrendLine();
    const rValue = calculateR();

    const getCorrelationStrength = (r: number) => {
        const absR = Math.abs(r);
        if (absR > 0.7)
            return {
                label: t('dashboard.correlation.strength.strong'),
                color: 'text-success',
            };
        if (absR > 0.4)
            return {
                label: t('dashboard.correlation.strength.moderate'),
                color: 'text-primary',
            };
        if (absR > 0.2)
            return {
                label: t('dashboard.correlation.strength.weak'),
                color: 'text-warning',
            };
        return {
            label: t('dashboard.correlation.strength.noise'),
            color: 'text-text-tertiary',
        };
    };

    const strength = rValue !== null ? getCorrelationStrength(rValue) : null;

    const getInterpretation = () => {
        if (rValue === null || data.length < 5)
            return t(
                `dashboard.correlation.charts.interpretations.${chartId}.neutral`,
            );

        const isPositive =
            chartId === 'willpower' || chartId === 'metabolic'
                ? rValue < -0.3
                : rValue > 0.3;
        // Note: For willpower (Readiness vs Calories) and metabolic (Calories vs Weight Delta),
        // a negative correlation is often the "desired" direction for weight loss, so we handle these specifically if needed.
        // For now, let's just stick to the translation keys.

        if (isPositive)
            return t(
                `dashboard.correlation.charts.interpretations.${chartId}.positive`,
            );
        return t(`dashboard.correlation.charts.interpretations.${chartId}.negative`);
    };

    const interpretation = getInterpretation();

    return (
        <div className="bg-surface/80 backdrop-blur-md rounded-card p-4 sm:p-6 border border-border shadow-card min-w-0 w-full lg:min-w-[340px] flex-1 group transition-all hover:shadow-float hover:-translate-y-1">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-text-primary tracking-tight">
                            {title}
                        </h3>
                        {strength && (
                            <span
                                className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-background ${strength.color} border border-border`}>
                                {strength.label}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest opacity-70">
                        {subtitle}
                    </p>
                </div>
                {rValue !== null && (
                    <div className="text-right">
                        <div className="text-xs font-black text-text-tertiary">
                            r ={' '}
                            <span className="text-text-primary">
                                {rValue.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-48 w-full relative">
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                            margin={{
                                top: 10,
                                right: isMobile ? 8 : 30,
                                bottom: 20,
                                left: isMobile ? -24 : -20,
                            }}>
                            <CartesianGrid
                                strokeDasharray="4 4"
                                vertical={false}
                                stroke="var(--color-border)"
                            />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name={xLabel}
                                tick={{
                                    fontSize: 9,
                                    fill: 'var(--color-text-tertiary)',
                                    fontWeight: 600,
                                }}
                                tickLine={false}
                                axisLine={false}
                                tickCount={isMobile ? 5 : undefined}
                                domain={['auto', 'auto']}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name={yLabel}
                                tick={{
                                    fontSize: 9,
                                    fill: 'var(--color-text-tertiary)',
                                    fontWeight: 600,
                                }}
                                tickLine={false}
                                axisLine={false}
                                tickCount={isMobile ? 4 : undefined}
                                domain={['auto', 'auto']}
                            />
                            <ZAxis type="number" range={[100, 100]} />
                            <Tooltip
                                trigger={isMobile ? 'click' : 'hover'}
                                cursor={{
                                    strokeDasharray: '3 3',
                                    stroke: 'var(--color-border)',
                                    strokeWidth: 1,
                                }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-surface-elevated/95 backdrop-blur-md border border-border p-3 rounded-control shadow-float text-[10px] text-text-primary animate-in fade-in zoom-in duration-200">
                                                <p className="font-black text-text-tertiary mb-2 border-b border-border pb-2 flex justify-between items-center gap-4">
                                                    <span>
                                                        {payload[0].payload.date}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 rounded bg-surface-lighter text-text-tertiary">
                                                        Log
                                                    </span>
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between gap-6">
                                                        <span className="text-text-tertiary font-medium">
                                                            {xLabel}
                                                        </span>
                                                        <span className="font-black text-text-primary">
                                                            {payload[0].value}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between gap-6">
                                                        <span className="text-text-tertiary font-medium">
                                                            {yLabel}
                                                        </span>
                                                        <span className="font-black text-text-primary">
                                                            {payload[1].value}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            {/* Trend Line - Glow Effect */}
                            <Line
                                data={trendLine}
                                type="monotone"
                                dataKey="trend"
                                stroke={color}
                                strokeWidth={3}
                                dot={false}
                                activeDot={false}
                                className="opacity-10"
                            />
                            <Line
                                data={trendLine}
                                type="monotone"
                                dataKey="trend"
                                stroke={color}
                                strokeWidth={1.5}
                                strokeDasharray="6 4"
                                dot={false}
                                activeDot={false}
                                className="opacity-50"
                            />
                            <Scatter
                                name={title}
                                data={data}
                                fill={color}
                                animationDuration={1500}
                                animationEasing="ease-out"
                                className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center text-text-tertiary h-full gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center opacity-50">
                            <span className="text-xs">?</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest">
                            {t('dashboard.correlation.noData')}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[11px] leading-relaxed text-text-secondary font-medium italic">
                    {interpretation}
                </p>
            </div>
        </div>
    );
};

export interface CorrelationAnalytics {
    fuelData: CorrelationDataPoint[];
    recoveryData: CorrelationDataPoint[];
    disciplineData: CorrelationDataPoint[];
    metabolicData: CorrelationDataPoint[];
    activitySleepData: CorrelationDataPoint[];
    hydrationCardioData: CorrelationDataPoint[];
}

interface CorrelationSectionProps {
    analytics: CorrelationAnalytics;
}

export const CorrelationSection: React.FC<CorrelationSectionProps> = ({
    analytics,
}) => {
    const { t } = useTranslation();
    const {
        fuelData,
        recoveryData,
        disciplineData,
        metabolicData,
        activitySleepData,
        hydrationCardioData,
    } = analytics;
    const [showLabsInfo, setShowLabsInfo] = useState(false);

    // Only render if we have enough data points to show a trend
    if (fuelData.length < 3 && recoveryData.length < 3 && disciplineData.length < 3)
        return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary-soft rounded-control">
                        <Microscope size={18} className="text-primary" />
                    </div>
                    <h2 className="text-lg font-black text-text-primary tracking-tight">
                        {t('dashboard.correlation.labsTitle')}
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning-soft text-warning uppercase tracking-wider">
                            {t('common.beta', { defaultValue: 'Beta' })}
                        </span>
                    </h2>
                </div>
                <button
                    onClick={() => setShowLabsInfo(!showLabsInfo)}
                    className="p-2 text-text-tertiary hover:text-primary transition-colors rounded-control hover:bg-primary-soft">
                    <Info size={20} />
                </button>
            </div>

            {showLabsInfo && (
                <div className="bg-primary text-white rounded-card p-5 mb-6 animate-in slide-in-from-top-4 duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Microscope size={80} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 relative z-10">
                        {t('dashboard.correlation.whatIs')}
                    </h3>
                    <p className="text-xs text-white/90 leading-relaxed mb-4 relative z-10 max-w-md">
                        {t('dashboard.correlation.explanation')}
                    </p>
                    <ul className="text-[10px] space-y-2 relative z-10">
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-surface rounded-full mt-1 shrink-0"></span>
                            <span>{t('dashboard.correlation.points.fuel')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-surface rounded-full mt-1 shrink-0"></span>
                            <span>{t('dashboard.correlation.points.recovery')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-surface rounded-full mt-1 shrink-0"></span>
                            <span>
                                {t('dashboard.correlation.points.discipline')}
                            </span>
                        </li>
                    </ul>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {fuelData.length > 2 && (
                    <ScatterCard
                        title={t('dashboard.correlation.charts.fuelVsPerf')}
                        subtitle={t('dashboard.correlation.charts.fuelSubtitle')}
                        data={fuelData}
                        xLabel={t('dashboard.correlation.charts.xCarbs')}
                        yLabel={t('dashboard.correlation.charts.yDuration')}
                        color="var(--color-danger)" // Red for Fuel/Fire
                        chartId="fuelVsPerf"
                    />
                )}

                {recoveryData.length > 2 && (
                    <ScatterCard
                        title={t('dashboard.correlation.charts.recoveryCost')}
                        subtitle={t('dashboard.correlation.charts.recoverySubtitle')}
                        data={recoveryData}
                        xLabel={t('dashboard.correlation.charts.yDuration')} // Swapped x/y intent in original?
                        yLabel={t('dashboard.correlation.charts.yDeepSleep')}
                        color="var(--color-oura)" // Violet for Sleep (Oura data)
                        chartId="recoveryCost"
                    />
                )}

                {disciplineData.length > 2 && (
                    <ScatterCard
                        title={t('dashboard.correlation.charts.willpower')}
                        subtitle={t(
                            'dashboard.correlation.charts.willpowerSubtitle',
                        )}
                        data={disciplineData}
                        xLabel={t('dashboard.correlation.charts.xReadiness')}
                        yLabel={t('dashboard.correlation.charts.yCalories')}
                        color="var(--color-success)" // Green for Health
                        chartId="willpower"
                    />
                )}

                {metabolicData && metabolicData.length > 2 && (
                    <ScatterCard
                        title={t('dashboard.correlation.charts.metabolic')}
                        subtitle={t(
                            'dashboard.correlation.charts.metabolicSubtitle',
                        )}
                        data={metabolicData}
                        xLabel={t('dashboard.correlation.charts.xAvgCalories')}
                        yLabel={t('dashboard.correlation.charts.yWeightDelta')}
                        color="var(--color-warning)" // Amber for Metabolism
                        chartId="metabolic"
                    />
                )}

                {activitySleepData && activitySleepData.length > 2 && (
                    <ScatterCard
                        title={t('dashboard.correlation.charts.activitySleep')}
                        subtitle={t(
                            'dashboard.correlation.charts.activitySleepSubtitle',
                        )}
                        data={activitySleepData}
                        xLabel={t('dashboard.correlation.charts.xSteps')}
                        yLabel={t('dashboard.correlation.charts.ySleepScore')}
                        color="var(--color-info)" // Cyan for Energy/Sleep
                        chartId="activitySleep"
                    />
                )}

                {hydrationCardioData && hydrationCardioData.length > 2 && (
                    <ScatterCard
                        title={t('dashboard.correlation.charts.hydrationCardio')}
                        subtitle={t(
                            'dashboard.correlation.charts.hydrationCardioSubtitle',
                        )}
                        data={hydrationCardioData}
                        xLabel={t('dashboard.correlation.charts.xWater')}
                        yLabel={t('dashboard.correlation.charts.yHRV')}
                        color="var(--color-primary)" // Blue for Water
                        chartId="hydrationCardio"
                    />
                )}
            </div>
            {fuelData.length <= 10 && (
                <div className="flex items-center gap-2 text-[10px] bg-background text-text-tertiary p-3 rounded-control border border-border italic">
                    <Info size={12} />
                    {t('dashboard.correlation.footer')}
                </div>
            )}
        </div>
    );
};
