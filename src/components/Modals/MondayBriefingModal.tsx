import {
    Activity,
    ArrowRight,
    CheckCircle,
    Target,
    TrendingDown,
    TrendingUp,
    X,
} from 'lucide-react';
import React from 'react';
import { CustomTargets } from '../../types/domain';

interface MondayBriefingModalProps {
    onAccept: () => void;
    onDismiss: () => void;
    currentWeight: number;
    currentTrend: number;
    weeklyAdherence: number;
    currentTargets: CustomTargets;
    proposal: {
        analysis: {
            status: 'onTrack' | 'fast' | 'slow' | 'gaining';
            severity: 'success' | 'warning' | 'danger';
            message: string;
        };
        calories: number;
        steps: number;
        reasoning: string;
        actionType: 'increase' | 'decrease' | 'maintain';
    } | null;
}

export const MondayBriefingModal: React.FC<MondayBriefingModalProps> = ({
    onAccept,
    onDismiss,
    currentTrend,
    weeklyAdherence,
    proposal,
    currentTargets,
}) => {
    if (!proposal) return null;

    const { status, severity, message } = proposal.analysis;
    const { calories: newCalories, reasoning, actionType } = proposal;

    const getStatusIcon = () => {
        switch (status) {
            case 'onTrack':
                return <CheckCircle className="w-8 h-8 text-green-500" />;
            case 'fast':
                return <TrendingDown className="w-8 h-8 text-red-500" />;
            case 'slow':
                return <Activity className="w-8 h-8 text-amber-500" />;
            case 'gaining':
                return <TrendingUp className="w-8 h-8 text-amber-500" />;
            default:
                return <Activity className="w-8 h-8 text-gray-500" />;
        }
    };

    const getStatusColor = () => {
        switch (severity) {
            case 'success':
                return 'bg-green-500/10 border-green-200 text-green-700';
            case 'warning':
                return 'bg-amber-500/10 border-amber-200 text-amber-700';
            case 'danger':
                return 'bg-red-500/10 border-red-200 text-red-700';
            default:
                return 'bg-gray-100 border-gray-200 text-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ease-in-out"
                onClick={onDismiss}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh] animate-slide-up sm:animate-fade-in-up transition-all duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center pb-12">
                    <h2 className="text-2xl font-bold mb-1">Informe Semanal</h2>
                    <p className="text-purple-100 text-sm">
                        Resumen de tu progreso y ajustes
                    </p>
                    <button
                        onClick={onDismiss}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Container - Floats up into header */}
                <div className="px-6 pb-6 -mt-8 overflow-y-auto">
                    {/* 1. Status Badge */}
                    <div
                        className={`flex flex-col items-center p-4 rounded-2xl border ${getStatusColor()} bg-white shadow-lg mb-6`}>
                        <div className="mb-2 p-3 bg-white rounded-full shadow-sm">
                            {getStatusIcon()}
                        </div>
                        <h3 className="font-bold text-lg mb-1">
                            {status === 'onTrack'
                                ? '¡Excelente Trabajo!'
                                : status === 'fast'
                                  ? '¡Cuidado! Vas muy rápido'
                                  : 'Ajuste Necesario'}
                        </h3>
                        <p className="text-sm text-center opacity-90">{message}</p>
                    </div>

                    {/* 2. Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                            <span className="text-xs text-gray-500 block mb-1">
                                Ritmo Actual
                            </span>
                            <span
                                className={`text-lg font-bold ${currentTrend < 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                {currentTrend ? `${currentTrend.toFixed(2)}` : '0'}{' '}
                                <span className="text-xs text-gray-400">kg/sem</span>
                            </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                            <span className="text-xs text-gray-500 block mb-1">
                                Adherencia
                            </span>
                            <span
                                className={`text-lg font-bold ${weeklyAdherence > 80 ? 'text-green-600' : 'text-amber-600'}`}>
                                {weeklyAdherence}%
                            </span>
                        </div>
                    </div>

                    {/* 3. Proposed Adjustments */}
                    {actionType !== 'maintain' ? (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-800">
                                    Propuesta de Nuevos Objetivos
                                </h4>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-medium">
                                    Auto-Pilot
                                </span>
                            </div>

                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 mb-3">
                                <div className="flex items-center justify-between">
                                    {/* Old */}
                                    <div className="text-center opacity-60">
                                        <span className="block text-xs text-gray-500 uppercase">
                                            Actual
                                        </span>
                                        <span className="block text-lg font-bold text-gray-700">
                                            {currentTargets.calories}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            kcal
                                        </span>
                                    </div>

                                    <ArrowRight className="text-purple-400" />

                                    {/* New */}
                                    <div className="text-center">
                                        <span className="block text-xs text-purple-600 uppercase font-bold">
                                            Nuevo
                                        </span>
                                        <span className="block text-2xl font-bold text-purple-600">
                                            {newCalories}
                                        </span>
                                        <span className="text-xs text-purple-400">
                                            kcal
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 flex gap-2">
                                <Activity className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                                {reasoning}
                            </p>
                        </div>
                    ) : (
                        <div className="mb-6 bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                            <p className="text-green-800 font-medium mb-1">
                                Sin cambios necesarios
                            </p>
                            <p className="text-sm text-green-600">
                                Sigue así, tus objetivos actuales están funcionando
                                perfectamente.
                            </p>
                        </div>
                    )}

                    {/* 4. Action Buttons */}
                    <div className="space-y-3">
                        {actionType !== 'maintain' && (
                            <button
                                onClick={onAccept}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-purple-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <Target className="w-5 h-5" />
                                Aceptar Nuevos Objetivos
                            </button>
                        )}

                        <button
                            onClick={onDismiss}
                            className={`w-full py-3.5 rounded-xl font-bold transition-all ${
                                actionType === 'maintain'
                                    ? 'bg-gray-900 text-white shadow-lg'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}>
                            {actionType === 'maintain'
                                ? 'Continuar Así'
                                : 'Mantener Actuales'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
