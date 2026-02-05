import { Plus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Challenge } from '../../types/domain';
import { ChallengeCard } from './ChallengeCard';

interface ChallengesSectionProps {
    challenges: Challenge[];
    onJoinChallenge: (id: string) => void;
    onViewChallengeDetails: (id: string) => void;
}

export const ChallengesSection: React.FC<ChallengesSectionProps> = ({
    challenges,
    onJoinChallenge,
    onViewChallengeDetails,
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-lg font-bold text-text-primary leading-tight">
                        {t('social.challenges.title')}
                    </h2>
                    <p className="text-xs text-text-tertiary font-medium">
                        {t('social.challenges.subtitle')}
                    </p>
                </div>
                {/* Optional: Add Challenge Button */}
                {/* <button className="p-2 bg-surface-lighter rounded-lg text-text-secondary hover:bg-surface-lighter transition-colors">
                    <Plus size={18} />
                </button> */}
            </div>

            <div className="flex overflow-x-auto pb-4 gap-4 px-1 -mx-1 snap-x hide-scrollbar">
                {challenges.map((challenge) => (
                    <div key={challenge.id} className="snap-center">
                        <ChallengeCard
                            challenge={challenge}
                            onJoin={onJoinChallenge}
                            onViewDetails={onViewChallengeDetails}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
