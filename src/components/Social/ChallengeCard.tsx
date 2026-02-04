import { ArrowRight, Calendar, Target, Trophy, Users } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Challenge } from '../../types/domain';
import { UserAvatar } from './UserAvatar';

interface ChallengeCardProps {
    challenge: Challenge;
    onJoin: (id: string) => void;
    onViewDetails: (id: string) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
    challenge,
    onJoin,
    onViewDetails,
}) => {
    const { t } = useTranslation();
    const { title, description, target, unit, participants, bgImage, endDate } =
        challenge as any; // Using any for rough prototyping if fields missmatch, but adhering to domain

    // Mock progress for the current user (in real app, passed via props or context)
    const userProgress = 65; // Percentage

    return (
        <div
            onClick={() => onViewDetails(challenge.id)}
            className="min-w-[280px] w-[280px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-shrink-0 cursor-pointer hover:shadow-md transition-all group">
            {/* Image Header */}
            <div className="h-28 bg-slate-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                {bgImage ? (
                    <img
                        src={bgImage}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Trophy className="text-white/20" size={48} />
                    </div>
                )}

                <div className="absolute bottom-3 left-3 z-20">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 mb-1">
                        <Target size={10} />
                        {target} {unit}
                    </span>
                    <h3 className="text-white font-bold text-lg leading-tight shadow-black/50 drop-shadow-md">
                        {title}
                    </h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>
                            {participants.length}{' '}
                            {t('social.challenges.participants')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(endDate).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Participants Avatars */}
                <div className="flex items-center -space-x-2">
                    {participants.slice(0, 4).map((p: any, i: number) => (
                        <div key={i} className="ring-2 ring-white rounded-full">
                            <UserAvatar
                                src={p.avatar}
                                name={p.name}
                                className="w-7 h-7"
                                textSize="text-[8px]"
                            />
                        </div>
                    ))}
                    {participants.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-[10px] text-slate-500 font-bold">
                            +{participants.length - 4}
                        </div>
                    )}
                </div>

                {/* Action / Progress */}
                {/* If joined, show progress bar. If not, show button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onJoin(challenge.id);
                    }}
                    className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    {t('social.challenges.join')} <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};
