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
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    if (!proposal) return null;

    const { status, severity, message } = proposal.analysis;
    const { calories: newCalories, reasoning, actionType } = proposal;

    const getStatusIcon = () => {
        switch (status) {
            case 'onTrack':
                return <CheckCircle className="w-8 h-8 text-success" />;
            case 'fast':
                return <TrendingDown className="w-8 h-8 text-danger" />;
            case 'slow':
                return <Activity className="w-8 h-8 text-warning" />;
            case 'gaining':
                return <TrendingUp className="w-8 h-8 text-warning" />;
            default:
                return <Activity className="w-8 h-8 text-text-tertiary" />;
        }
    };

    const getStatusColor = () => {
        switch (severity) {
            case 'success':
                return 'bg-success/10 border-success/20 text-success';
            case 'warning':
                return 'bg-warning/10 border-warning/20 text-warning';
            case 'danger':
                return 'bg-danger/10 border-danger/20 text-danger';
            default:
                return 'bg-surface-lighter border-border text-text-secondary';
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
            <div className="relative w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh] animate-slide-up sm:animate-fade-in-up transition-all duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-oura to-oura p-6 text-white text-center pb-12">
                    <h2 className="text-2xl font-bold mb-1">
                        {t('modals.mondayBriefing.title')}
                    </h2>
                    <p className="text-white/80 text-sm">
                        {t('modals.mondayBriefing.subtitle')}
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
                        className={`flex flex-col items-center p-4 rounded-2xl border ${getStatusColor()} bg-surface shadow-lg mb-6`}>
                        <div className="mb-2 p-3 bg-surface rounded-full shadow-sm">
                            {getStatusIcon()}
                        </div>
                        <h3 className="font-bold text-lg mb-1">
                            {status === 'onTrack'
                                ? t('modals.mondayBriefing.excellent')
                                : status === 'fast'
                                  ? t('modals.mondayBriefing.warning')
                                  : t('modals.mondayBriefing.adjustment')}
                        </h3>
                        <p className="text-sm text-center opacity-90">{message}</p>
                    </div>

                    {/* 2. Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-background p-3 rounded-xl border border-border text-center">
                            <span className="text-xs text-text-tertiary block mb-1">
                                {t('modals.mondayBriefing.currentTempo')}
                            </span>
                            <span
                                className={`text-lg font-bold ${currentTrend < 0 ? 'text-success' : 'text-warning'}`}>
                                {currentTrend ? `${currentTrend.toFixed(2)}` : '0'}{' '}
                                <span className="text-xs text-text-tertiary">kg/sem</span>
                            </span>
                        </div>
                        <div className="bg-background p-3 rounded-xl border border-border text-center">
                            <span className="text-xs text-text-tertiary block mb-1">
                                {t('modals.mondayBriefing.adherence')}
                            </span>
                            <span
                                className={`text-lg font-bold ${weeklyAdherence > 80 ? 'text-success' : 'text-warning'}`}>
                                {weeklyAdherence}%
                            </span>
                        </div>
                    </div>

                    {/* 3. Proposed Adjustments */}
                    {actionType !== 'maintain' ? (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-text-primary">
                                    {t('modals.mondayBriefing.proposal')}
                                </h4>
                                <span className="text-xs bg-oura-soft text-oura px-2 py-1 rounded-lg font-medium">
                                    Auto-Pilot
                                </span>
                            </div>

                            <div className="bg-oura-soft rounded-xl p-4 border border-oura/20 mb-3">
                                <div className="flex items-center justify-between">
                                    {/* Old */}
                                    <div className="text-center opacity-60">
                                        <span className="block text-xs text-text-tertiary uppercase">
                                            Actual
                                        </span>
                                        <span className="block text-lg font-bold text-text-secondary">
                                            {currentTargets.calories}
                                        </span>
                                        <span className="text-xs text-text-tertiary">
                                            kcal
                                        </span>
                                    </div>

                                    <ArrowRight className="text-oura" />

                                    {/* New */}
                                    <div className="text-center">
                                        <span className="block text-xs text-oura uppercase font-bold">
                                            Nuevo
                                        </span>
                                        <span className="block text-2xl font-bold text-oura">
                                            {newCalories}
                                        </span>
                                        <span className="text-xs text-oura">
                                            kcal
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-text-secondary bg-background p-3 rounded-lg border border-border flex gap-2">
                                <Activity className="w-4 h-4 text-oura mt-0.5 shrink-0" />
                                {reasoning}
                            </p>
                        </div>
                    ) : (
                        <div className="mb-6 bg-success-soft p-4 rounded-xl border border-success/20 text-center">
                            <p className="text-success font-medium mb-1">
                                {t('modals.mondayBriefing.noChanges')}
                            </p>
                            <p className="text-sm text-success">
                                {t('modals.mondayBriefing.noChangesDesc')}
                            </p>
                        </div>
                    )}

                    {/* 4. Action Buttons */}
                    <div className="space-y-3">
                        {actionType !== 'maintain' && (
                            <button
                                onClick={onAccept}
                                className="w-full bg-gradient-to-r from-oura to-oura text-white py-3.5 rounded-xl font-bold shadow-lg shadow-purple-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <Target className="w-5 h-5" />
                                {t('modals.mondayBriefing.accept')}
                            </button>
                        )}

                        <button
                            onClick={onDismiss}
                            className={`w-full py-3.5 rounded-xl font-bold transition-all ${
                                actionType === 'maintain'
                                    ? 'bg-gray-900 text-white shadow-lg'
                                    : 'bg-surface border border-border text-text-secondary hover:bg-background'
                            }`}>
                            {actionType === 'maintain'
                                ? t('modals.mondayBriefing.continue')
                                : t('modals.mondayBriefing.maintain')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
