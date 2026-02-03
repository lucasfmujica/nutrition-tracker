import { Check, Copy, UserPlus, X } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <UserPlus size={20} className="text-primary" />
                        </div>
                        <h2 className="font-bold text-lg text-slate-900">
                            {t('social.addFriend.title')}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {/* Your Friend Code */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('social.addFriend.yourCode')}
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-center">
                                <span className="font-mono font-black text-xl text-slate-800 tracking-wider">
                                    {userFriendCode || '--------'}
                                </span>
                            </div>
                            <button
                                onClick={handleCopy}
                                disabled={!userFriendCode}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                    copied
                                        ? 'bg-green-500 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}>
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center">
                            {t('social.addFriend.shareTip')}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 bg-white text-sm text-slate-400">
                                {t('social.addFriend.childTip')}
                            </span>
                        </div>
                    </div>

                    {/* Enter Friend Code */}
                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('social.addFriend.friendCode')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={friendCode}
                                onChange={(e) => {
                                    setFriendCode(e.target.value.toUpperCase());
                                    setError(null);
                                }}
                                placeholder={t('social.addFriend.placeholder')}
                                maxLength={8}
                                className="flex-1 bg-slate-100 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-center font-mono font-bold text-lg uppercase tracking-wider placeholder-slate-300 outline-none transition-all"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <p className="text-sm text-red-500 mt-2 text-center">
                                {error}
                            </p>
                        )}

                        {/* Success Message */}
                        {success && (
                            <p className="text-sm text-green-600 mt-2 text-center">
                                {t('social.addFriend.sent')}
                            </p>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || friendCode.length < 8}
                            className={`w-full mt-4 py-3 rounded-xl font-bold text-white transition-all ${
                                loading || friendCode.length < 8
                                    ? 'bg-slate-300 cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98]'
                            }`}>
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {t('social.addFriend.sending')}
                                </span>
                            ) : (
                                t('social.addFriend.send')
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
