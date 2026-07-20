import {
    AlertCircle,
    Check,
    ExternalLink,
    Eye,
    EyeOff,
    Loader2,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    isOuraOAuthAvailable,
    isOuraOAuthConnected,
    startOuraOAuth,
} from '../../utils/ouraOAuth';

interface OuraTokenSetupProps {
    hasOuraRing: boolean;
    currentToken?: string;
    /** Supabase user id — used to look up per-user OAuth tokens */
    userId?: string;
    onSaveToken: (token: string) => Promise<void>;
    onToggleOura: (enabled: boolean) => Promise<void>;
}

export const OuraTokenSetup: React.FC<OuraTokenSetupProps> = ({
    hasOuraRing,
    currentToken,
    userId,
    onSaveToken,
    onToggleOura,
}) => {
    const { t } = useTranslation();
    const [showToken, setShowToken] = useState(false);
    const [token, setToken] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
        'idle',
    );

    const oauthAvailable = isOuraOAuthAvailable();
    const oauthConnected = isOuraOAuthConnected(userId);
    const hasToken = !!currentToken;
    const maskedToken = currentToken
        ? `${currentToken.substring(0, 8)}...${currentToken.substring(currentToken.length - 4)}`
        : null;

    const handleSaveToken = async () => {
        if (!token.trim()) return;

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            await onSaveToken(token.trim());
            setSaveStatus('success');
            setToken('');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('[OuraSetup] Error saving token:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async () => {
        try {
            await onToggleOura(!hasOuraRing);
        } catch (err) {
            console.error('[OuraSetup] Error toggling Oura:', err);
        }
    };

    return (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">💍</span>
                        <div>
                            <h3 className="font-semibold text-text-primary">
                                {t('oura.title')}
                            </h3>
                            <p className="text-xs text-text-tertiary">
                                {t('oura.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={handleToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            hasOuraRing ? 'bg-accent' : 'bg-surface-lighter'
                        }`}>
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform shadow-sm ${
                                hasOuraRing ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Content - Only show if Oura is enabled */}
            {hasOuraRing && (
                <div className="p-4 space-y-4">
                    {/* Current Token Status / Warning */}
                    {hasToken ? (
                        <div className="flex items-center gap-2 p-3 bg-success-soft border border-success/20 rounded-xl">
                            <Check className="w-4 h-4 text-success" />
                            <span className="text-sm text-success font-medium">
                                {t('oura.setup.configured')}
                            </span>
                            <span className="text-xs text-success font-mono ml-auto">
                                {maskedToken}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 p-3 bg-warning-soft border border-warning/20 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                            <div>
                                <p className="text-sm text-warning font-bold">
                                    {t('oura.setup.notConfigured')}
                                </p>
                                <p className="text-xs text-text-secondary">
                                    {t('oura.setup.notConfiguredDesc')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* OAuth Connect (recommended) */}
                    {oauthAvailable && (
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    try {
                                        startOuraOAuth();
                                    } catch (err) {
                                        console.error(
                                            '[OuraSetup] Error starting OAuth flow:',
                                            err,
                                        );
                                    }
                                }}
                                className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 active:scale-[0.98]">
                                <ExternalLink className="w-4 h-4" />
                                {oauthConnected || hasToken
                                    ? t('oura.oauth.reconnect')
                                    : t('oura.oauth.connect')}
                            </button>
                            <p className="text-xs text-text-tertiary text-center">
                                {t('oura.oauth.description')}
                            </p>
                        </div>
                    )}

                    {/* Manual token (advanced fallback) */}
                    <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-text-tertiary hover:text-text-secondary select-none">
                            {t('oura.oauth.manualAdvanced')}
                        </summary>
                        <div className="mt-3 space-y-4">
                    {/* Instructions */}
                    <div className="text-sm text-text-secondary space-y-3">
                        <div className="p-3 bg-background rounded-xl border border-border">
                            <p className="font-bold text-text-primary mb-1">
                                {t('oura.setup.howTo')}
                            </p>
                            <ol className="list-decimal list-inside space-y-1.5 text-xs text-text-secondary">
                                <li>
                                    {t('oura.setup.step1')}{' '}
                                    <a
                                        href="https://cloud.ouraring.com/personal-access-tokens"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                                        Oura Cloud
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </li>
                                <li>{t('oura.setup.step2')}</li>
                                <li>{t('oura.setup.step3')}</li>
                                <li>{t('oura.setup.step4')}</li>
                            </ol>
                        </div>
                    </div>

                    {/* Token Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">
                            {hasToken ? t('oura.setup.save') : t('oura.setup.token')}
                        </label>
                        <div className="relative">
                            <input
                                type={showToken ? 'text' : 'password'}
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder={t('oura.setup.tokenPlaceholder')}
                                className="w-full px-4 py-3 pr-20 border border-border rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-tertiary hover:text-text-secondary">
                                {showToken ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveToken}
                        disabled={!token.trim() || isSaving}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            !token.trim() || isSaving
                                ? 'bg-surface-lighter text-text-tertiary cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
                        }`}>
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('oura.setup.saving')}
                            </>
                        ) : saveStatus === 'success' ? (
                            <>
                                <Check className="w-4 h-4" />
                                {t('oura.setup.successSaving')}
                            </>
                        ) : saveStatus === 'error' ? (
                            <>
                                <AlertCircle className="w-4 h-4" />
                                {t('oura.setup.errorSaving')}
                            </>
                        ) : (
                            t('oura.setup.save')
                        )}
                    </button>

                    {/* Privacy Note */}
                    <p className="text-xs text-text-tertiary text-center">
                        {t('oura.setup.privacy')}
                    </p>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};
