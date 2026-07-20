import { Check, Swords, X } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChallengeMetric, Friend } from '../../types/domain';
import { UserAvatar } from './UserAvatar';

interface CreateChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    friends: Friend[];
    onCreate: (params: {
        title: string;
        metric: ChallengeMetric;
        durationDays: number;
        friendUserIds: string[];
        goalValue?: number | null;
    }) => Promise<{ success: boolean; error?: string }>;
}

const METRICS: ChallengeMetric[] = [
    'steps',
    'protein',
    'workouts',
    'water',
    'logging_streak',
];
const DURATIONS = [7, 14, 30];

/**
 * CreateChallengeModal - Title, metric, duration (7/14/30 days),
 * optional goal value, and friend invitations from the friends list.
 */
export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
    isOpen,
    onClose,
    friends,
    onCreate,
}) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [metric, setMetric] = useState<ChallengeMetric>('steps');
    const [duration, setDuration] = useState(7);
    const [goalValue, setGoalValue] = useState('');
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const toggleFriend = (userId: string) => {
        setSelectedFriends((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
    };

    const handleClose = () => {
        setTitle('');
        setMetric('steps');
        setDuration(7);
        setGoalValue('');
        setSelectedFriends([]);
        setError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || selectedFriends.length === 0) return;
        setLoading(true);
        setError(null);
        const result = await onCreate({
            title: title.trim(),
            metric,
            durationDays: duration,
            friendUserIds: selectedFriends,
            goalValue: goalValue ? Number(goalValue) : null,
        });
        setLoading(false);
        if (result.success) {
            handleClose();
        } else {
            setError(result.error || t('social.challenges.createError'));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="relative bg-surface rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Swords size={20} className="text-primary" />
                        </div>
                        <h2 className="font-bold text-lg text-text-primary">
                            {t('social.challenges.createTitle')}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-surface-lighter flex items-center justify-center text-text-tertiary transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            {t('social.challenges.titleLabel')}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('social.challenges.titlePlaceholder')}
                            maxLength={60}
                            className="w-full bg-surface-lighter rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    {/* Metric */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            {t('social.challenges.metricLabel')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {METRICS.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMetric(m)}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                                        metric === m
                                            ? 'bg-primary text-white'
                                            : 'bg-surface-lighter text-text-secondary hover:bg-border'
                                    }`}>
                                    {t(`social.challenges.metrics.${m}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            {t('social.challenges.durationLabel')}
                        </label>
                        <div className="flex gap-2">
                            {DURATIONS.map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDuration(d)}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                                        duration === d
                                            ? 'bg-primary text-white'
                                            : 'bg-surface-lighter text-text-secondary hover:bg-border'
                                    }`}>
                                    {t('social.challenges.days', { count: d })}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optional goal */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            {t('social.challenges.goalLabel')}
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={goalValue}
                            onChange={(e) => setGoalValue(e.target.value)}
                            placeholder={t('social.challenges.goalPlaceholder')}
                            className="w-full bg-surface-lighter rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Friends */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            {t('social.challenges.inviteLabel')}
                        </label>
                        {friends.length === 0 ? (
                            <p className="text-sm text-text-tertiary">
                                {t('social.challenges.noFriendsToInvite')}
                            </p>
                        ) : (
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {friends.map((f) => {
                                    const selected = selectedFriends.includes(
                                        f.odId,
                                    );
                                    return (
                                        <button
                                            key={f.odId}
                                            type="button"
                                            onClick={() => toggleFriend(f.odId)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                                selected
                                                    ? 'bg-primary/10 ring-1 ring-primary'
                                                    : 'bg-surface-lighter hover:bg-border'
                                            }`}>
                                            <UserAvatar
                                                src={f.avatar}
                                                name={f.name}
                                                className="w-8 h-8"
                                                textSize="text-xs"
                                            />
                                            <span className="flex-1 text-left text-sm font-medium text-text-primary truncate">
                                                {f.name}
                                            </span>
                                            {selected && (
                                                <Check
                                                    size={16}
                                                    className="text-primary"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-danger font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            !title.trim() ||
                            selectedFriends.length === 0
                        }
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100">
                        {loading
                            ? t('social.challenges.creating')
                            : t('social.challenges.create')}
                    </button>
                </form>
            </div>
        </div>
    );
};
