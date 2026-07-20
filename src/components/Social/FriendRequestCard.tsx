import { Check, X } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FriendRequest } from '../../types/domain';

import { UserAvatar } from './UserAvatar';

interface FriendRequestCardProps {
    request: FriendRequest;
    onAccept: (requestId: string) => void;
    onReject: (requestId: string) => void;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
    request,
    onAccept,
    onReject,
}) => {
    const { t, i18n } = useTranslation();

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t('social.requests.today');
        if (diffDays === 1) return t('social.requests.yesterday');
        if (diffDays < 7) return t('social.requests.daysAgo', { count: diffDays });
        return date.toLocaleDateString(i18n.language, {
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
            {/* Avatar */}
            <UserAvatar
                src={request.fromAvatar}
                name={request.fromName}
                className="w-11 h-11"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary truncate">
                    {request.fromName}
                </p>
                <p className="text-xs text-text-tertiary">
                    {t('social.requests.sent', {
                        time: formatDate(request.createdAt),
                    })}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onReject(request.id)}
                    className="w-9 h-9 rounded-full bg-surface-lighter hover:bg-danger-soft text-text-tertiary hover:text-danger flex items-center justify-center transition-all active:scale-95">
                    <X size={18} />
                </button>
                <button
                    onClick={() => onAccept(request.id)}
                    className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-primary/20">
                    <Check size={18} />
                </button>
            </div>
        </div>
    );
};
