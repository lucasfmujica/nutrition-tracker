/**
 * Analytics Utilities - Linear regression and prediction engine
 * For Progress Intelligence System Sprint 2
 */

import type { BodyMeasurement } from '../types/domain';

export interface DataPoint {
    x: number; // Weight (kg)
    y: number; // Measurement value
    date: string;
}

export interface RegressionResult {
    slope: number;
    intercept: number;
    rSquared: number;
    equation: string;
}

export interface PredictionResult {
    predictedValue: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Calculate linear regression using least squares method
 * @returns Regression line parameters and R² correlation coefficient
 */
export function calculateLinearRegression(
    dataPoints: DataPoint[],
): RegressionResult | null {
    if (dataPoints.length < 2) return null;

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumY2 = dataPoints.reduce((sum, p) => sum + p.y * p.y, 0);

    const meanX = sumX / n;
    const meanY = sumY / n;

    // Calculate slope (m) and intercept (b) for y = mx + b
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = meanY - slope * meanX;

    // Calculate R² (coefficient of determination)
    const ssTotal = sumY2 - (sumY * sumY) / n;
    const ssResidual = dataPoints.reduce((sum, p) => {
        const predicted = slope * p.x + intercept;
        return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const rSquared = 1 - ssResidual / ssTotal;

    return {
        slope,
        intercept,
        rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp to [0, 1]
        equation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
    };
}

/**
 * Calculate Pearson correlation coefficient
 * @returns Correlation value between -1 and 1
 */
export function calculateCorrelation(dataPoints: DataPoint[]): number {
    if (dataPoints.length < 2) return 0;

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumY2 = dataPoints.reduce((sum, p) => sum + p.y * p.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
        (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );

    if (denominator === 0) return 0;

    return numerator / denominator;
}

/**
 * Predict measurement value based on target weight
 * @param targetWeight - Weight to predict measurement for
 * @param regression - Regression parameters from calculateLinearRegression
 * @param dataPoints - Original data points for confidence interval
 */
export function predictMeasurement(
    targetWeight: number,
    regression: RegressionResult,
    dataPoints: DataPoint[],
): PredictionResult {
    const predictedValue = regression.slope * targetWeight + regression.intercept;

    // Calculate standard error for confidence interval
    const n = dataPoints.length;
    const residuals = dataPoints.map((p) => {
        const predicted = regression.slope * p.x + regression.intercept;
        return p.y - predicted;
    });
    const standardError = Math.sqrt(
        residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2),
    );

    // 95% confidence interval (±1.96 standard errors)
    const margin = 1.96 * standardError;

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(regression.slope) > 0.1) {
        trend = regression.slope > 0 ? 'increasing' : 'decreasing';
    }

    return {
        predictedValue,
        confidenceInterval: {
            lower: predictedValue - margin,
            upper: predictedValue + margin,
        },
        trend,
    };
}

/**
 * Get confidence interval for prediction
 * @returns Lower and upper bounds for 95% confidence
 */
export function getConfidenceInterval(
    dataPoints: DataPoint[],
    regression: RegressionResult,
): { lower: number; upper: number } {
    if (dataPoints.length < 3) {
        return { lower: 0, upper: 0 };
    }

    const n = dataPoints.length;
    const residuals = dataPoints.map((p) => {
        const predicted = regression.slope * p.x + regression.intercept;
        return p.y - predicted;
    });

    const standardError = Math.sqrt(
        residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2),
    );

    // 95% confidence interval
    const margin = 1.96 * standardError;

    return {
        lower: margin,
        upper: margin,
    };
}

/**
 * Group measurements by weight for correlation analysis
 * Combines weight entries with body measurements on the same date
 */
export function groupMeasurementsByWeight(
    weights: Array<{ date: string; weight: number }>,
    measurements: BodyMeasurement[],
    measurementKey: keyof BodyMeasurement,
): DataPoint[] {
    const dataPoints: DataPoint[] = [];

    for (const weightEntry of weights) {
        const measurement = measurements.find((m) => m.date === weightEntry.date);
        if (measurement && measurement[measurementKey] !== undefined) {
            const value = measurement[measurementKey];
            if (typeof value === 'number') {
                dataPoints.push({
                    x: weightEntry.weight,
                    y: value,
                    date: weightEntry.date,
                });
            }
        }
    }

    return dataPoints.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Format correlation strength for display
 */
export function formatCorrelationStrength(rSquared: number): string {
    if (rSquared >= 0.8) return 'Muy fuerte';
    if (rSquared >= 0.6) return 'Fuerte';
    if (rSquared >= 0.4) return 'Moderada';
    if (rSquared >= 0.2) return 'Débil';
    return 'Muy débil';
}

/**
 * Predict measurement for future weeks
 * @param currentWeight - Current weight
 * @param targetWeightChange - Expected weight change per week (kg)
 * @param weeks - Number of weeks to predict
 * @param regression - Regression parameters
 */
export function predictFutureWeeks(
    currentWeight: number,
    targetWeightChange: number,
    weeks: number,
    regression: RegressionResult,
    dataPoints: DataPoint[],
): Array<{
    week: number;
    weight: number;
    measurement: number;
    confidence: { lower: number; upper: number };
}> {
    const predictions = [];

    for (let week = 1; week <= weeks; week++) {
        const futureWeight = currentWeight + targetWeightChange * week;
        const prediction = predictMeasurement(futureWeight, regression, dataPoints);

        predictions.push({
            week,
            weight: futureWeight,
            measurement: prediction.predictedValue,
            confidence: prediction.confidenceInterval,
        });
    }

    return predictions;
}
