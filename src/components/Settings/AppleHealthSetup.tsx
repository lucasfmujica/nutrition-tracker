import {
    Activity,
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    Heart,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

interface AppleHealthSetupProps {
    userId: string;
}

const CopyRow: React.FC<{ label: string; value: string; mask?: boolean }> = ({
    label,
    value,
    mask,
}) => {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('[AppleHealth] Copy failed:', err);
        }
    };
    const shown = mask ? `${value.substring(0, 8)}…` : value;
    return (
        <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-xl">
            <span className="text-xs text-text-tertiary shrink-0">{label}</span>
            <code className="text-xs font-mono text-text-secondary flex-1 truncate">
                {shown}
            </code>
            <button
                onClick={copy}
                className="p-1.5 hover:bg-surface-lighter rounded-lg transition-colors"
                title={label}>
                {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                ) : (
                    <Copy className="w-4 h-4 text-text-tertiary" />
                )}
            </button>
        </div>
    );
};

/**
 * AppleHealthSetup — Config section to connect Apple Health via an iOS Shortcut.
 * Shows endpoint URL + sync key + user ID ready to copy, last received sync
 * (latest steps_log entry with source 'ios-health' as proxy), and step-by-step
 * instructions to build a daily Personal Automation in the Shortcuts app.
 */
export const AppleHealthSetup: React.FC<AppleHealthSetupProps> = ({
    userId,
}) => {
    const { t } = useTranslation();
    const [showInstructions, setShowInstructions] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [syncToken, setSyncToken] = useState<string | null>(null);
    const [tokenError, setTokenError] = useState(false);

    const endpointUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/api/sync-health`
            : '/api/sync-health';

    useEffect(() => {
        if (!userId || !supabase) return;
        let cancelled = false;
        (async () => {
            try {
                setTokenError(false);
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                const accessToken = session?.access_token;
                if (!accessToken) throw new Error('Missing session');
                const response = await fetch('/api/sync-health-token', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (!response.ok) throw new Error('Token request failed');
                const body = (await response.json()) as { token?: string };
                if (!body.token) throw new Error('Missing sync token');
                if (!cancelled) setSyncToken(body.token);
            } catch (err) {
                console.error('[AppleHealth] Token load failed:', err);
                if (!cancelled) setTokenError(true);
            }

            const { data, error } = await supabase
                .from('steps_log')
                .select('date')
                .eq('user_id', userId)
                .eq('source', 'ios-health')
                .order('date', { ascending: false })
                .limit(1);
            if (error) {
                console.warn('[AppleHealth] Last sync lookup failed:', error);
            } else if (!cancelled && data?.length) {
                setLastSync(data[0].date);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const exampleBody = `{
  "syncToken": "<SYNC_TOKEN>",
  "date": "2026-06-11",
  "metrics": {
    "steps": 8421,
    "weight": 78.4,
    "sleep": { "hours": 7.5 },
    "workouts": [
      { "name": "Functional Strength Training",
        "type": "gym", "duration": 45, "calories": 320 }
    ]
  }
}`;

    const steps: string[] = t('settings.appleHealth.steps', {
        returnObjects: true,
        defaultValue: [],
    }) as string[];

    return (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">
                            {t('settings.appleHealth.title')}
                        </h3>
                        <p className="text-xs text-text-tertiary">
                            {t('settings.appleHealth.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* Last sync status */}
                <div className="flex items-center gap-2 text-xs p-3 rounded-xl bg-background border border-border">
                    <Activity className="w-4 h-4 text-rose-500 shrink-0" />
                    {lastSync ? (
                        <span className="text-text-secondary">
                            {t('settings.appleHealth.lastSync')}{' '}
                            <strong>{lastSync}</strong>
                        </span>
                    ) : (
                        <span className="text-text-tertiary">
                            {t('settings.appleHealth.noSync')}
                        </span>
                    )}
                </div>

                {/* Credentials to copy */}
                <CopyRow
                    label={t('settings.appleHealth.endpoint')}
                    value={endpointUrl}
                />
                {syncToken ? (
                    <CopyRow
                        label={t('settings.appleHealth.syncToken')}
                        value={syncToken}
                        mask
                    />
                ) : (
                    <p className="text-xs text-text-tertiary bg-background border border-dashed border-border rounded-xl p-3">
                        {tokenError
                            ? t('settings.appleHealth.tokenError')
                            : t('common.loading')}
                    </p>
                )}

                {/* Instructions toggle */}
                <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="w-full flex items-center justify-between p-3 bg-background hover:bg-surface-lighter border border-border rounded-xl transition-colors">
                    <span className="text-sm font-medium text-text-primary">
                        {t('settings.appleHealth.howTo')}
                    </span>
                    {showInstructions ? (
                        <ChevronUp className="w-4 h-4 text-text-tertiary" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-text-tertiary" />
                    )}
                </button>

                {showInstructions && (
                    <div className="space-y-3">
                        <ol className="space-y-2 text-xs text-text-secondary list-none">
                            {steps.map((step, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="w-5 h-5 shrink-0 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-[10px]">
                                        {i + 1}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                        <div>
                            <p className="text-xs font-medium text-text-primary mb-1">
                                {t('settings.appleHealth.bodyExample')}
                            </p>
                            <pre className="text-[10px] font-mono bg-background border border-border rounded-xl p-3 overflow-x-auto text-text-secondary whitespace-pre">
                                {exampleBody}
                            </pre>
                        </div>
                        <p className="text-xs text-text-tertiary bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl">
                            {t('settings.appleHealth.dedupeNote')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
