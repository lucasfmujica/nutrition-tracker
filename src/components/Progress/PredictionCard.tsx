/**
 * PredictionCard - Display measurement predictions for future weeks
 * Sprint 2: Measurement Analytics
 */

import { Calendar, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

interface PredictionCardProps {
    title: string;
    currentValue: number;
    predictedValue: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    weeks: number;
    unit: string;
    trend: 'increasing' | 'decreasing' | 'stable';
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
    title,
    currentValue,
    predictedValue,
    confidenceInterval,
    weeks,
    unit,
    trend,
}) => {
    const change = predictedValue - currentValue;
    const changePercent = ((change / currentValue) * 100).toFixed(1);

    const trendIcon =
        trend === 'increasing'
            ? TrendingUp
            : trend === 'decreasing'
              ? TrendingDown
              : Minus;

    const trendColor =
        trend === 'increasing'
            ? 'text-fat bg-fat-soft'
            : trend === 'decreasing'
              ? 'text-success bg-success-soft'
              : 'text-text-tertiary bg-background';

    const trendLabel =
        trend === 'increasing'
            ? 'Aumento'
            : trend === 'decreasing'
              ? 'Reducción'
              : 'Estable';

    return (
        <div className="bg-surface rounded-2xl p-6 border border-border">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-bold text-text-primary mb-1">{title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                        <Calendar size={12} />
                        <span>Predicción a {weeks} semanas</span>
                    </div>
                </div>
                <div className={`p-2 rounded-lg ${trendColor}`}>
                    {React.createElement(trendIcon, { size: 20 })}
                </div>
            </div>

            {/* Current Value */}
            <div className="mb-4">
                <p className="text-xs text-text-tertiary mb-1">Valor actual</p>
                <p className="text-2xl font-bold text-text-primary">
                    {currentValue.toFixed(1)} {unit}
                </p>
            </div>

            {/* Predicted Value */}
            <div className="bg-oura-soft rounded-xl p-4 mb-4">
                <p className="text-xs text-oura font-bold mb-1">Predicción</p>
                <p className="text-3xl font-bold text-oura mb-2">
                    {predictedValue.toFixed(1)} {unit}
                </p>
                <div className="flex items-center gap-2">
                    <span
                        className={`text-sm font-bold ${
                            change > 0
                                ? 'text-fat'
                                : change < 0
                                  ? 'text-success'
                                  : 'text-text-secondary'
                        }`}>
                        {change > 0 ? '+' : ''}
                        {change.toFixed(1)} {unit}
                    </span>
                    <span className="text-xs text-text-tertiary">
                        ({parseFloat(changePercent) > 0 ? '+' : ''}
                        {changePercent}%)
                    </span>
                </div>
            </div>

            {/* Confidence Interval */}
            <div className="space-y-2">
                <p className="text-xs text-text-tertiary font-bold">
                    Rango de confianza (95%)
                </p>
                <div className="flex items-center justify-between text-sm">
                    <div>
                        <p className="text-xs text-text-tertiary">Mínimo</p>
                        <p className="font-bold text-text-secondary">
                            {confidenceInterval.lower.toFixed(1)} {unit}
                        </p>
                    </div>
                    <div className="flex-1 mx-3">
                        <div className="h-2 bg-gradient-to-r from-oura/30 via-oura to-oura/30 rounded-full" />
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-text-tertiary">Máximo</p>
                        <p className="font-bold text-text-secondary">
                            {confidenceInterval.upper.toFixed(1)} {unit}
                        </p>
                    </div>
                </div>
            </div>

            {/* Trend Badge */}
            <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-2">
                    <div
                        className={`px-3 py-1.5 rounded-full text-xs font-bold ${trendColor}`}>
                        {trendLabel}
                    </div>
                </div>
            </div>
        </div>
    );
};
