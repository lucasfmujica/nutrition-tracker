import {
    Activity,
    ArrowRight,
    CheckCircle,
    Target,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CustomTargets } from '../../types/domain';
import { Button } from '../UI/Button';
import { ModalShell } from '../UI/ModalShell';

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
        <ModalShell
            open
            onClose={onDismiss}
            title={t('modals.mondayBriefing.title')}
            subtitle={t('modals.mondayBriefing.subtitle')}
            size="md"
            footer={
                <div className="space-y-3">
                    {actionType !== 'maintain' && (
                        <Button
                            fullWidth
                            onClick={onAccept}
                            icon={<Target className="w-5 h-5" />}
                            className="!bg-oura hover:!opacity-90 !shadow-float">
                            {t('modals.mondayBriefing.accept')}
                        </Button>
                    )}

                    <Button
                        fullWidth
                        variant={actionType === 'maintain' ? 'primary' : 'secondary'}
                        onClick={onDismiss}>
                        {actionType === 'maintain'
                            ? t('modals.mondayBriefing.continue')
                            : t('modals.mondayBriefing.maintain')}
                    </Button>
                </div>
            }>
            {/* 1. Status Badge */}
            <div
                className={`flex flex-col items-center p-4 rounded-card border ${getStatusColor()} bg-surface shadow-card mb-6`}>
                <div className="mb-2 p-3 bg-surface rounded-full shadow-card">
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
                <div className="bg-background p-3 rounded-control border border-border text-center">
                    <span className="text-xs text-text-tertiary block mb-1">
                        {t('modals.mondayBriefing.currentTempo')}
                    </span>
                    <span
                        className={`text-lg font-bold tabular-nums ${currentTrend < 0 ? 'text-success' : 'text-warning'}`}>
                        {currentTrend ? `${currentTrend.toFixed(2)}` : '0'}{' '}
                        <span className="text-xs text-text-tertiary">kg/sem</span>
                    </span>
                </div>
                <div className="bg-background p-3 rounded-control border border-border text-center">
                    <span className="text-xs text-text-tertiary block mb-1">
                        {t('modals.mondayBriefing.adherence')}
                    </span>
                    <span
                        className={`text-lg font-bold tabular-nums ${weeklyAdherence > 80 ? 'text-success' : 'text-warning'}`}>
                        {weeklyAdherence}%
                    </span>
                </div>
            </div>

            {/* 3. Proposed Adjustments */}
            {actionType !== 'maintain' ? (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-text-primary">
                            {t('modals.mondayBriefing.proposal')}
                        </h4>
                        <span className="text-xs bg-oura-soft text-oura px-2 py-1 rounded-control font-medium">
                            Auto-Pilot
                        </span>
                    </div>

                    <div className="bg-oura-soft rounded-control p-4 border border-oura/20 mb-3">
                        <div className="flex items-center justify-between">
                            {/* Old */}
                            <div className="text-center opacity-60">
                                <span className="block text-xs text-text-tertiary uppercase">
                                    Actual
                                </span>
                                <span className="block text-lg font-bold text-text-secondary tabular-nums">
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
                                <span className="block text-2xl font-bold text-oura tabular-nums">
                                    {newCalories}
                                </span>
                                <span className="text-xs text-oura">kcal</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-text-secondary bg-background p-3 rounded-control border border-border flex gap-2">
                        <Activity className="w-4 h-4 text-oura mt-0.5 shrink-0" />
                        {reasoning}
                    </p>
                </div>
            ) : (
                <div className="bg-success-soft p-4 rounded-control border border-success/20 text-center">
                    <p className="text-success font-medium mb-1">
                        {t('modals.mondayBriefing.noChanges')}
                    </p>
                    <p className="text-sm text-success">
                        {t('modals.mondayBriefing.noChangesDesc')}
                    </p>
                </div>
            )}
        </ModalShell>
    );
};
