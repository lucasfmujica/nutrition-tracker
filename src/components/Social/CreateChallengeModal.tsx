import { Check, Swords } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChallengeMetric, Friend } from '../../types/domain';
import { Button } from '../UI/Button';
import { Input } from '../UI/FormField';
import { ModalShell } from '../UI/ModalShell';
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
        <ModalShell
            open={isOpen}
            onClose={handleClose}
            title={t('social.challenges.createTitle')}
            icon={<Swords size={20} />}
            size="sm"
            footer={
                <Button
                    type="submit"
                    form="create-challenge-form"
                    fullWidth
                    loading={loading}
                    disabled={
                        loading || !title.trim() || selectedFriends.length === 0
                    }>
                    {loading
                        ? t('social.challenges.creating')
                        : t('social.challenges.create')}
                </Button>
            }>
            <form
                id="create-challenge-form"
                onSubmit={handleSubmit}
                className="space-y-4">
                {/* Title */}
                <Input
                    type="text"
                    label={t('social.challenges.titleLabel')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('social.challenges.titlePlaceholder')}
                    maxLength={60}
                    required
                />

                {/* Metric */}
                <div>
                    <span className="block text-overline uppercase text-text-tertiary mb-1.5">
                        {t('social.challenges.metricLabel')}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                        {METRICS.map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMetric(m)}
                                className={`px-3 py-2 rounded-control text-sm font-bold transition-colors ${
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
                    <span className="block text-overline uppercase text-text-tertiary mb-1.5">
                        {t('social.challenges.durationLabel')}
                    </span>
                    <div className="flex gap-2">
                        {DURATIONS.map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setDuration(d)}
                                className={`flex-1 px-3 py-2 rounded-control text-sm font-bold transition-colors ${
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
                <Input
                    type="number"
                    min="1"
                    label={t('social.challenges.goalLabel')}
                    value={goalValue}
                    onChange={(e) => setGoalValue(e.target.value)}
                    placeholder={t('social.challenges.goalPlaceholder')}
                />

                {/* Friends */}
                <div>
                    <span className="block text-overline uppercase text-text-tertiary mb-1.5">
                        {t('social.challenges.inviteLabel')}
                    </span>
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
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-control transition-colors ${
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
            </form>
        </ModalShell>
    );
};
