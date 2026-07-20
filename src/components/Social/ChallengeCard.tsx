import { Calendar, Check, Crown, Trophy, X } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FriendChallenge } from '../../types/domain';
import { UserAvatar } from './UserAvatar';

interface ChallengeCardProps {
    challenge: FriendChallenge;
    onRespond: (participantId: string, accept: boolean) => void;
}

const METRIC_UNITS: Record<string, string> = {
    steps: '',
    protein: 'g',
    workouts: '',
    water: 'ml',
    logging_streak: '',
};

/**
 * ChallengeCard - One friend challenge with per-participant progress bars,
 * days remaining, pending invite actions and finished state with winner.
 */
export const ChallengeCard: React.FC<ChallengeCardProps> = ({
    challenge,
    onRespond,
}) => {
    const { t } = useTranslation();
    const { metric, goalValue, participants, myParticipation } = challenge;

    const accepted = participants
        .filter((p) => p.status === 'accepted')
        .sort((a, b) => b.progress - a.progress);
    const invitedCount = participants.filter(
        (p) => p.status === 'invited',
    ).length;
    const maxProgress = Math.max(
        goalValue || 0,
        ...accepted.map((p) => p.progress),
        1,
    );
    const winner =
        challenge.isFinished && accepted.length > 0 ? accepted[0] : null;
    const unit = METRIC_UNITS[metric] || '';
    const isInvited = myParticipation?.status === 'invited';

    return (
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="font-bold text-text-primary truncate">
                        {challenge.title}
                    </h3>
                    <p className="text-xs text-text-tertiary font-medium">
                        {t(`social.challenges.metrics.${metric}`)}
                        {goalValue
                            ? ` · ${t('social.challenges.goal')}: ${goalValue}${unit}`
                            : ''}
                    </p>
                </div>
                {challenge.isFinished ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-warning-soft text-warning flex-shrink-0">
                        <Trophy size={12} />
                        {t('social.challenges.finished')}
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-success-soft dark:bg-success/15 text-success dark:text-success flex-shrink-0">
                        <Calendar size={12} />
                        {t('social.challenges.daysLeft', {
                            count: challenge.daysRemaining,
                        })}
                    </span>
                )}
            </div>

            {/* Winner banner (finished) */}
            {winner && (
                <div className="flex items-center gap-2 bg-warning-soft dark:bg-warning/10 border border-warning/20 rounded-xl px-3 py-2">
                    <Crown size={16} className="text-warning flex-shrink-0" />
                    <span className="text-sm font-bold text-text-primary truncate">
                        {t('social.challenges.winner', { name: winner.name })}
                    </span>
                </div>
            )}

            {/* Per-participant progress */}
            <div className="space-y-2">
                {accepted.map((p) => {
                    const pct = Math.min((p.progress / maxProgress) * 100, 100);
                    return (
                        <div key={p.id} className="flex items-center gap-2">
                            <UserAvatar
                                src={p.avatar}
                                name={p.name}
                                className="w-7 h-7"
                                textSize="text-[10px]"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-0.5">
                                    <span className="text-xs font-medium text-text-tertiary truncate">
                                        {p.name}
                                    </span>
                                    <span className="text-xs font-bold text-text-secondary">
                                        {p.progress}
                                        {unit}
                                    </span>
                                </div>
                                <div className="w-full bg-progress-track rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
                {invitedCount > 0 && !challenge.isFinished && (
                    <p className="text-[11px] text-text-tertiary font-medium">
                        {t('social.challenges.pendingInvites', {
                            count: invitedCount,
                        })}
                    </p>
                )}
            </div>

            {/* Invite actions */}
            {isInvited && myParticipation && (
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={() => onRespond(myParticipation.id, true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors active:scale-95">
                        <Check size={16} />
                        {t('social.challenges.accept')}
                    </button>
                    <button
                        onClick={() => onRespond(myParticipation.id, false)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface-lighter text-text-secondary rounded-xl font-bold text-sm hover:bg-border transition-colors active:scale-95">
                        <X size={16} />
                        {t('social.challenges.decline')}
                    </button>
                </div>
            )}
        </div>
    );
};
