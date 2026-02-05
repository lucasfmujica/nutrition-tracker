/**
 * BodyMeasurementAnalytics - Correlation charts and waist predictions
 * Extracted from ProgressAnalyticsView to keep files under 300 lines.
 */

import { AlertCircle } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    calculateLinearRegression,
    groupMeasurementsByWeight,
    predictMeasurement,
    type DataPoint,
} from '../../utils/analyticsUtils';
import { CorrelationChart } from './CorrelationChart';
import { PredictionCard } from './PredictionCard';

interface BodyMeasurementAnalyticsProps {
    weightData: { date: string; weight: number }[];
    measurements: any[];
    currentWeight?: number;
    targetWeight?: number;
}

export const BodyMeasurementAnalytics: React.FC<BodyMeasurementAnalyticsProps> = ({
    weightData,
    measurements,
    currentWeight,
    targetWeight,
}) => {
    const { t } = useTranslation();

    const waistData = useMemo(
        () => groupMeasurementsByWeight(weightData, measurements, 'waist'),
        [weightData, measurements],
    );

    const bodyFatData = useMemo(
        () => groupMeasurementsByWeight(weightData, measurements, 'bodyFatPercent'),
        [weightData, measurements],
    );

    const chestData = useMemo(
        () => groupMeasurementsByWeight(weightData, measurements, 'chest'),
        [weightData, measurements],
    );

    const hipsData = useMemo(
        () => groupMeasurementsByWeight(weightData, measurements, 'hips'),
        [weightData, measurements],
    );

    const waistPredictions = useMemo(() => {
        if (waistData.length < 3 || !currentWeight || !targetWeight) return null;

        const regression = calculateLinearRegression(waistData);
        if (!regression) return null;

        const targetPrediction = predictMeasurement(targetWeight, regression, waistData);
        const fourWeekWeight = currentWeight - 2;
        const fourWeekPrediction = predictMeasurement(fourWeekWeight, regression, waistData);
        const eightWeekWeight = currentWeight - 4;
        const eightWeekPrediction = predictMeasurement(eightWeekWeight, regression, waistData);
        const currentWaist = waistData[waistData.length - 1]?.y || 0;

        return {
            current: currentWaist,
            fourWeek: fourWeekPrediction,
            eightWeek: eightWeekPrediction,
            target: targetPrediction,
        };
    }, [waistData, currentWeight, targetWeight]);

    const hasCorrelationData =
        waistData.length >= 3 || bodyFatData.length >= 3 ||
        chestData.length >= 3 || hipsData.length >= 3;

    if (!hasCorrelationData) return null;

    return (
        <>
            {/* Predictions Section */}
            {waistPredictions && (
                <div>
                    <h3 className="font-bold text-text-primary mb-3">
                        {t('progress.analytics.waistPredictions')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PredictionCard
                            title={t('progress.analytics.weeks', { count: 4 })}
                            currentValue={waistPredictions.current}
                            predictedValue={waistPredictions.fourWeek.predictedValue}
                            confidenceInterval={waistPredictions.fourWeek.confidenceInterval}
                            weeks={4}
                            unit="cm"
                            trend={waistPredictions.fourWeek.trend}
                        />
                        <PredictionCard
                            title={t('progress.analytics.weeks', { count: 8 })}
                            currentValue={waistPredictions.current}
                            predictedValue={waistPredictions.eightWeek.predictedValue}
                            confidenceInterval={waistPredictions.eightWeek.confidenceInterval}
                            weeks={8}
                            unit="cm"
                            trend={waistPredictions.eightWeek.trend}
                        />
                    </div>
                </div>
            )}

            {/* Correlation Charts */}
            <div>
                <h3 className="font-bold text-text-primary mb-3">
                    {t('progress.analytics.correlations')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {waistData.length >= 3 && (
                        <CorrelationChart
                            dataPoints={waistData}
                            xLabel={`${t('progress.photos.weight')} (kg)`}
                            yLabel={`${t('progress.measurements.waist')} (cm)`}
                            title={`${t('progress.photos.weight')} vs ${t('progress.measurements.waist')}`}
                        />
                    )}
                    {bodyFatData.length >= 3 && (
                        <CorrelationChart
                            dataPoints={bodyFatData}
                            xLabel={`${t('progress.photos.weight')} (kg)`}
                            yLabel={`${t('progress.measurements.bodyFat')}`}
                            title={`${t('progress.photos.weight')} vs ${t('progress.measurements.bodyFat')}`}
                        />
                    )}
                    {chestData.length >= 3 && (
                        <CorrelationChart
                            dataPoints={chestData}
                            xLabel={`${t('progress.photos.weight')} (kg)`}
                            yLabel={`${t('progress.measurements.chest')} (cm)`}
                            title={`${t('progress.photos.weight')} vs ${t('progress.measurements.chest')}`}
                        />
                    )}
                    {hipsData.length >= 3 && (
                        <CorrelationChart
                            dataPoints={hipsData}
                            xLabel={`${t('progress.photos.weight')} (kg)`}
                            yLabel={`${t('progress.measurements.hips')} (cm)`}
                            title={`${t('progress.photos.weight')} vs ${t('progress.measurements.hips')}`}
                        />
                    )}
                </div>
            </div>

            {/* Info Footer */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700">
                        <p className="font-bold mb-1">
                            {t('progress.analytics.aboutPredictions')}
                        </p>
                        <p>{t('progress.analytics.aboutPredictionsDesc')}</p>
                    </div>
                </div>
            </div>
        </>
    );
};
