import { Check, Copy, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../UI/Button';
import { Input } from '../UI/FormField';
import { ModalShell } from '../UI/ModalShell';

interface AddFriendModalProps {
    isOpen: boolean;
    onClose: () => void;
    userFriendCode: string | null;
    onSendRequest: (code: string) => Promise<{ success: boolean; error?: string }>;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
    isOpen,
    onClose,
    userFriendCode,
    onSendRequest,
}) => {
    const { t } = useTranslation();
    const [friendCode, setFriendCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleCopy = async () => {
        if (!userFriendCode) return;
        try {
            await navigator.clipboard.writeText(userFriendCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendCode.trim()) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        const result = await onSendRequest(friendCode.trim().toUpperCase());

        setLoading(false);

        if (result.success) {
            setSuccess(true);
            setFriendCode('');
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 1500);
        } else {
            setError(result.error || t('social.addFriend.error'));
        }
    };

    const handleClose = () => {
        setFriendCode('');
        setError(null);
        setSuccess(false);
        onClose();
    };

    return (
        <ModalShell
            open={isOpen}
            onClose={handleClose}
            title={t('social.addFriend.title')}
            icon={<UserPlus size={20} />}
            size="sm"
            footer={
                <Button
                    type="submit"
                    form="add-friend-form"
                    fullWidth
                    loading={loading}
                    disabled={loading || friendCode.length < 8}>
                    {loading
                        ? t('social.addFriend.sending')
                        : t('social.addFriend.send')}
                </Button>
            }>
            <div className="space-y-5">
                {/* Your Friend Code */}
                <div>
                    <span className="block text-overline uppercase text-text-tertiary mb-1.5">
                        {t('social.addFriend.yourCode')}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-lighter rounded-control px-4 py-3 text-center">
                            <span className="font-mono font-black text-xl text-text-primary tracking-wider">
                                {userFriendCode || '--------'}
                            </span>
                        </div>
                        <button
                            onClick={handleCopy}
                            disabled={!userFriendCode}
                            className={`w-12 h-12 rounded-control flex items-center justify-center transition-all ${
                                copied
                                    ? 'bg-success text-white'
                                    : 'bg-surface-lighter hover:bg-surface-lighter text-text-secondary'
                            }`}>
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                    <p className="text-caption text-text-tertiary mt-2 text-center">
                        {t('social.addFriend.shareTip')}
                    </p>
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-3 bg-surface-elevated text-caption text-text-tertiary">
                            {t('social.addFriend.childTip')}
                        </span>
                    </div>
                </div>

                {/* Enter Friend Code */}
                <form id="add-friend-form" onSubmit={handleSubmit}>
                    <Input
                        type="text"
                        label={t('social.addFriend.friendCode')}
                        value={friendCode}
                        onChange={(e) => {
                            setFriendCode(e.target.value.toUpperCase());
                            setError(null);
                        }}
                        placeholder={t('social.addFriend.placeholder')}
                        maxLength={8}
                        error={error ?? undefined}
                        className="text-center font-mono font-bold text-lg uppercase tracking-wider"
                    />

                    {/* Success Message */}
                    {success && (
                        <p className="text-caption text-success mt-2 text-center">
                            {t('social.addFriend.sent')}
                        </p>
                    )}
                </form>
            </div>
        </ModalShell>
    );
};
