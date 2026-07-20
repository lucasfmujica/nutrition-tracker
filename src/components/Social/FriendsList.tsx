import { Users } from 'lucide-react';
import React from 'react';
import { SkeletonRow } from '../UI/Skeleton';
import { useTranslation } from 'react-i18next';
import { Friend } from '../../types/domain';
import { EmptyState } from './EmptyState';
import { FriendCard } from './FriendCard';

interface FriendsListProps {
    friends: Friend[];
    onRemoveFriend: (friendshipId: string) => void;
    onAddFriend: () => void;
    loading?: boolean;
}

export const FriendsList: React.FC<FriendsListProps> = ({
    friends,
    onRemoveFriend,
    onAddFriend,
    loading = false,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-info-soft flex items-center justify-center border border-info/20">
                        <Users size={20} className="text-info" />
                    </div>
                    <div>
                        <h2 className="font-bold text-text-primary text-lg">
                            {t('social.friends.title')}
                        </h2>
                        <p className="text-xs text-text-tertiary font-medium">
                            {t('social.friends.count', { count: friends.length })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Friends List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <SkeletonRow key={i} />
                    ))}
                </div>
            ) : friends.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={t('social.friends.noFriends')}
                    description={t('social.friends.noFriendsDesc')}
                    actionLabel={t('social.friends.addFriend')}
                    onAction={onAddFriend}
                />
            ) : (
                <div className="space-y-3">
                    {friends.map((friend) => (
                        <FriendCard
                            key={friend.id}
                            friend={friend}
                            onRemove={onRemoveFriend}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
