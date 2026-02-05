import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * SimpleBarChart - Simple bar chart for weekly data
 * Displays bars for each day with target line
 */

interface SimpleBarData {
    day: string;
    completed?: boolean;
    [key: string]: string | number | boolean | undefined;
}

interface SimpleBarChartProps {
    data: SimpleBarData[];
    dataKey: string;
    target: number;
    color: string;
    label: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
    data,
    dataKey,
    target,
    color,
    label,
}) => {
    const { t } = useTranslation();
    const maxVal =
        Math.max(...data.map((d) => (d[dataKey] as number) || 0), target) * 1.1 ||
        target * 1.1;
    return (
        <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    {label}
                </span>
                <span className="text-xs font-bold text-text-tertiary">
                    {t('dashboard.summary.target')}: {target}
                </span>
            </div>
            <div className="flex items-end justify-between h-20 gap-1">
                {data.map((d, i) => {
                    const value = (d[dataKey] as number) || 0;
                    return (
                        <div
                            key={i}
                            className="flex flex-col items-center flex-1 min-w-0">
                            <div
                                className="w-full bg-background rounded-t-lg relative group"
                                style={{ height: '56px' }}>
                                <div
                                    className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${color} ${value > target ? 'opacity-80' : ''}`}
                                    style={{
                                        height: `${Math.min((value / maxVal) * 100, 100)}%`,
                                    }}>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none transition-opacity font-bold z-10 whitespace-nowrap">
                                        {value.toLocaleString()}
                                    </div>
                                </div>
                                <div
                                    className="absolute w-full border-t border-dashed border-border"
                                    style={{ bottom: `${(target / maxVal) * 100}%` }}
                                />
                                {d.completed && (
                                    <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 text-[10px] bg-surface rounded-full shadow-sm w-4 h-4 flex items-center justify-center">
                                        ✓
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] font-bold text-text-tertiary mt-1.5 uppercase">
                                {d.day}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
