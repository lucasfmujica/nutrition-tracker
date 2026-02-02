/**
 * ProgressAnalyticsView - Measurement analytics with correlations and predictions
 * Sprint 2: Main analytics orchestrator
 */

import { AlertCircle, BarChart3, Loader2, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';
import { useBodyMeasurements } from '../../hooks/useBodyMeasurements';
import { useProgressPhotos } from '../../hooks/useProgressPhotos';
import {
    calculateLinearRegression,
    groupMeasurementsByWeight,
    predictMeasurement,
    type DataPoint,
} from '../../utils/analyticsUtils';
import { CorrelationChart } from './CorrelationChart';
import { PredictionCard } from './PredictionCard';

interface ProgressAnalyticsViewProps {
    userId: string | null;
    currentWeight?: number;
    targetWeight?: number;
}

export const ProgressAnalyticsView: React.FC<ProgressAnalyticsViewProps> = ({
    userId,
    currentWeight,
    targetWeight,
}) => {
    const { photos, isLoading: photosLoading } = useProgressPhotos({ userId });
    const { measurements, isLoading: measurementsLoading } = useBodyMeasurements({
        userId,
    });

    const isLoading = photosLoading || measurementsLoading;

    // Extract weight data from photos
    const weightData = useMemo(() => {
        return photos
            .filter((p) => p.weight !== undefined)
            .map((p) => ({ date: p.date, weight: p.weight! }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [photos]);

    // Prepare correlation data
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

    // Calculate predictions for waist (most common measurement)
    const waistPredictions = useMemo(() => {
        if (waistData.length < 3 || !currentWeight || !targetWeight) return null;

        const regression = calculateLinearRegression(waistData);
        if (!regression) return null;

        // Predict at target weight
        const targetPrediction = predictMeasurement(
            targetWeight,
            regression,
            waistData,
        );

        // Predict 4 weeks out (assuming -0.5kg/week)
        const fourWeekWeight = currentWeight - 2; // 4 weeks * 0.5kg
        const fourWeekPrediction = predictMeasurement(
            fourWeekWeight,
            regression,
            waistData,
        );

        // Predict 8 weeks out
        const eightWeekWeight = currentWeight - 4; // 8 weeks * 0.5kg
        const eightWeekPrediction = predictMeasurement(
            eightWeekWeight,
            regression,
            waistData,
        );

        const currentWaist = waistData[waistData.length - 1]?.y || 0;

        return {
            current: currentWaist,
            fourWeek: fourWeekPrediction,
            eightWeek: eightWeekPrediction,
            target: targetPrediction,
        };
    }, [waistData, currentWeight, targetWeight]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-purple-500" />
            </div>
        );
    }

    // Empty state - need measurements and weight data
    if (measurements.length === 0 || weightData.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 size={28} className="text-purple-400" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">
                    Sin datos para analizar
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    Necesitás medidas corporales y fotos con peso para ver análisis.
                </p>
                <div className="text-xs text-slate-400 space-y-1">
                    <p>• Subí fotos de progreso con tu peso</p>
                    <p>
                        • Registrá medidas corporales (cintura, grasa corporal, etc.)
                    </p>
                    <p>• Necesitás al menos 3 mediciones para ver correlaciones</p>
                </div>
            </div>
        );
    }

    // Empty state - need at least 3 measurements with different weights
    if (
        waistData.length < 3 &&
        bodyFatData.length < 3 &&
        chestData.length < 3 &&
        hipsData.length < 3
    ) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 size={28} className="text-purple-400" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">
                    Datos insuficientes
                </h3>
                <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
                    Necesitás al menos{' '}
                    <strong>3 mediciones con diferentes pesos</strong> para calcular
                    correlaciones y predicciones.
                </p>
                <div className="bg-blue-50 rounded-xl p-4 max-w-md mx-auto">
                    <p className="text-xs text-blue-700 leading-relaxed">
                        💡 <strong>Tip:</strong> Registrá tus medidas cada semana
                        mientras tu peso cambia. Por ejemplo: Semana 1 (105kg),
                        Semana 2 (104kg), Semana 3 (103kg). Así podremos predecir
                        cómo cambiarán tus medidas a medida que alcanzás tu meta.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <TrendingUp size={24} className="text-purple-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 mb-1">
                            Análisis Predictivo
                        </h2>
                        <p className="text-sm text-slate-600">
                            Correlaciones y predicciones basadas en{' '}
                            {weightData.length} mediciones
                        </p>
                    </div>
                </div>
            </div>

            {/* Predictions Section */}
            {waistPredictions && (
                <div>
                    <h3 className="font-bold text-slate-900 mb-3">
                        Predicciones de Cintura
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PredictionCard
                            title="4 Semanas"
                            currentValue={waistPredictions.current}
                            predictedValue={waistPredictions.fourWeek.predictedValue}
                            confidenceInterval={
                                waistPredictions.fourWeek.confidenceInterval
                            }
                            weeks={4}
                            unit="cm"
                            trend={waistPredictions.fourWeek.trend}
                        />
                        <PredictionCard
                            title="8 Semanas"
                            currentValue={waistPredictions.current}
                            predictedValue={
                                waistPredictions.eightWeek.predictedValue
                            }
                            confidenceInterval={
                                waistPredictions.eightWeek.confidenceInterval
                            }
                            weeks={8}
                            unit="cm"
                            trend={waistPredictions.eightWeek.trend}
                        />
                    </div>
                </div>
            )}

            {/* Correlation Charts */}
            <div>
                <h3 className="font-bold text-slate-900 mb-3">Correlaciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {waistData.length >= 3 && (
                        <CorrelationChart
                            dataPoints={waistData}
                            xLabel="Peso (kg)"
                            yLabel="Cintura (cm)"
                            title="Peso vs Cintura"
                        />
                    )}
                    {bodyFatData.length >= 3 && (
                        <CorrelationChart
                            dataPoints={bodyFatData}
                            xLabel="Peso (kg)"
                            yLabel="Grasa Corporal (%)"
                            title="Peso vs Grasa Corporal"
                        />
                    )}
                    {chestData.length >= 3 && (
                        <CorrelationChart
                            dataPoints={chestData}
                            xLabel="Peso (kg)"
                            yLabel="Pecho (cm)"
                            title="Peso vs Pecho"
                        />
                    )}
                    {hipsData.length >= 3 && (
                        <CorrelationChart
                            dataPoints={hipsData}
                            xLabel="Peso (kg)"
                            yLabel="Caderas (cm)"
                            title="Peso vs Caderas"
                        />
                    )}
                </div>
            </div>

            {/* Info Footer */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-2">
                    <AlertCircle
                        size={16}
                        className="text-blue-600 mt-0.5 flex-shrink-0"
                    />
                    <div className="text-xs text-blue-700">
                        <p className="font-bold mb-1">Sobre las predicciones</p>
                        <p>
                            Las predicciones se basan en regresión lineal de tus
                            datos históricos. Asumen una pérdida de peso constante de
                            ~0.5kg/semana. Los resultados reales pueden variar según
                            tu adherencia y metabolismo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
