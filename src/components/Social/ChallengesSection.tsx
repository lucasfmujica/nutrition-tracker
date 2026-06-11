import { Plus, Swords } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChallenges } from '../../hooks/useChallenges';
import { Friend } from '../../types/domain';
import { EmptyState } from '../UI/EmptyState';
import { ChallengeCard } from './ChallengeCard';
import { CreateChallengeModal } from './CreateChallengeModal';

interface ChallengesSectionProps {
    friends: Friend[];
}

/**
 * ChallengesSection - Self-contained "Challenges" section for the Social tab.
 * Shows pending invites, active challenges with per-participant progress,
 * finished challenges with winner, and a create-challenge modal.
 */
export const ChallengesSection: React.FC<ChallengesSectionProps> = ({
    friends,
}) => {
    const { t } = useTranslation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const {
        challenges,
        pendingInvites,
        challengesLoading,
        createChallenge,
        respondToInvite,
    } = useChallenges();

    const active = challenges.filter(
        (c) =>
            !c.isFinished &&
            c.myParticipation?.status !== 'invited' &&
            c.myParticipation?.status !== 'declined',
    );
    const finished = challenges.filter(
        (c) => c.isFinished && c.myParticipation?.status === 'accepted',
    );

    return (
        <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center text-primary">
                        <Swords size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary leading-tight">
                            {t('social.challenges.title')}
                        </h2>
                        <p className="text-xs text-text-tertiary font-medium">
                            {t('social.challenges.subtitle')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-bold px-3 py-2 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 active:scale-95">
                    <Plus size={16} />
                    <span className="hidden sm:inline">
                        {t('social.challenges.create')}
                    </span>
                </button>
            </div>

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-text-tertiary px-1">
                        {t('social.challenges.invitations')}
                    </h3>
                    {pendingInvites.map((c) => (
                        <ChallengeCard
                            key={c.id}
                            challenge={c}
                            onRespond={respondToInvite}
                        />
                    ))}
                </div>
            )}

            {/* Active challenges */}
            {active.length > 0 && (
                <div className="space-y-2">
                    {pendingInvites.length > 0 && (
                        <h3 className="text-xs font-bold uppercase tracking-wide text-text-tertiary px-1">
                            {t('social.challenges.active')}
                        </h3>
                    )}
                    {active.map((c) => (
                        <ChallengeCard
                            key={c.id}
                            challenge={c}
                            onRespond={respondToInvite}
                        />
                    ))}
                </div>
            )}

            {/* Finished challenges */}
            {finished.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-text-tertiary px-1">
                        {t('social.challenges.finishedSection')}
                    </h3>
                    {finished.map((c) => (
                        <ChallengeCard
                            key={c.id}
                            challenge={c}
                            onRespond={respondToInvite}
                        />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!challengesLoading &&
                active.length === 0 &&
                pendingInvites.length === 0 &&
                finished.length === 0 && (
                    <EmptyState
                        icon={Swords}
                        title={t('social.challenges.empty')}
                        description={t('social.challenges.emptyDesc')}
                        actionLabel={t('social.challenges.create')}
                        onAction={() => setShowCreateModal(true)}
                    />
                )}

            <CreateChallengeModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                friends={friends}
                onCreate={createChallenge}
            />
        </div>
    );
};
