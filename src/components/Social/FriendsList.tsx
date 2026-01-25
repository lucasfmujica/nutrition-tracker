import { Users } from 'lucide-react';
import React from 'react';
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
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                        <Users size={20} className="text-cyan-500" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900">Amigos</h2>
                        <p className="text-xs text-slate-500">
                            {friends.length} {friends.length === 1 ? 'amigo' : 'amigos'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Friends List */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : friends.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Sin amigos aún"
                    description="Agrega amigos para ver sus progresos y competir en el leaderboard"
                    actionLabel="Agregar amigo"
                    onAction={onAddFriend}
                />
            ) : (
                <div className="space-y-2">
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
