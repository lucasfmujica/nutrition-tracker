import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLogin } from './AuthLogin';
import { AuthRegister } from './AuthRegister';
import { AuthResetPassword } from './AuthResetPassword';

interface AuthUIProps {
    onAuth: {
        signIn: (email: string, password: string) => Promise<any>;
        signUp: (email: string, password: string) => Promise<any>;
        signInWithGoogle: () => Promise<any>;
        resetPassword: (email: string) => Promise<any>;
        continueOffline: () => void;
    };
    error?: string | null;
    isSupabaseConfigured: boolean;
    loading: boolean;
}

/**
 * Authentication UI Component - LukenFit
 * Light Theme Design
 */
export const AuthUI: React.FC<AuthUIProps> = ({
    onAuth,
    error: externalError,
    isSupabaseConfigured,
    loading: externalLoading,
}) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [internalLoading, setInternalLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Combined loading state
    const loading = internalLoading || externalLoading || googleLoading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setInternalLoading(true);

        try {
            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    setError(t('auth.errors.passwordMismatch'));
                    setInternalLoading(false);
                    return;
                }
                if (password.length < 6) {
                    setError(t('auth.errors.passwordLength'));
                    setInternalLoading(false);
                    return;
                }
                const result = await onAuth.signUp(email, password);
                if (result?.error) {
                    let errorMsg = result.error.message || t('auth.errors.unknown');
                    if (errorMsg.includes('already registered'))
                        errorMsg = t('auth.errors.emailRegistered');
                    else if (errorMsg.includes('valid email'))
                        errorMsg = t('auth.errors.invalidEmail');
                    else if (errorMsg.includes('Password'))
                        errorMsg = t('auth.errors.passwordLength');
                    else if (errorMsg.includes('Database error'))
                        errorMsg = t('auth.errors.serverError');
                    setError(errorMsg);
                } else if (result?.needsConfirmation) {
                    setMessage(t('auth.success.accountCreated'));
                    setMode('login');
                    setPassword('');
                    setConfirmPassword('');
                } else {
                    setMessage(t('auth.success.accountCreatedRedirect'));
                }
            } else if (mode === 'reset') {
                const result = await onAuth.resetPassword(email);
                if (result?.error) {
                    setError(result.error.message || t('auth.errors.unknown'));
                } else {
                    setMessage(t('auth.success.resetEmailSent'));
                }
            } else {
                // LOGIN
                const result = await onAuth.signIn(email, password);
                if (result?.error) {
                    let errorMsg = result.error.message || t('auth.errors.unknown');
                    if (errorMsg.includes('Invalid login'))
                        errorMsg = t('auth.errors.invalidLogin');
                    else if (errorMsg.includes('Email not confirmed'))
                        errorMsg = t('auth.errors.emailNotConfirmed');
                    setError(errorMsg);
                }
            }
        } catch (err) {
            console.error('[Auth] Error:', err);
            setError(t('auth.errors.connection'));
        } finally {
            setInternalLoading(false);
        }
    };

    const handleContinueOffline = () => {
        onAuth.continueOffline();
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setMessage('');
        setGoogleLoading(true);

        try {
            const result = await onAuth.signInWithGoogle();
            if (result?.error) {
                setError(result.error.message || t('auth.errors.googleError'));
                setGoogleLoading(false);
            }
        } catch (err) {
            console.error('[Auth] Google sign-in error:', err);
            setError(t('auth.errors.googleError'));
            setGoogleLoading(false);
        }
    };

    // LukenFit Logo
    const LukenFitLogo = () => (
        <div className="mx-auto mb-6 relative flex flex-col items-center gap-3">
            <svg viewBox="0 0 32 32" className="w-20 h-20">
                <defs>
                    <linearGradient
                        id="authLogoGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%">
                        <stop offset="0%" style={{ stopColor: '#2563EB' }} />
                        <stop offset="100%" style={{ stopColor: '#0891B2' }} />
                    </linearGradient>
                </defs>
                <circle
                    cx="16"
                    cy="16"
                    r="15"
                    fill="#F8FAFC"
                    stroke="url(#authLogoGrad)"
                    strokeWidth="1.5"
                />
                <path
                    d="M10 7 L10 21 L19 21 L19 18 L13 18 L13 7 Z"
                    fill="url(#authLogoGrad)"
                />
                <path
                    d="M18 7 L14 15 L17 15 L15 25 L23 14 L19 14 L22 7 Z"
                    fill="url(#authLogoGrad)"
                    opacity="0.9"
                />
            </svg>
            <h1 className="text-2xl font-black text-text-primary tracking-tighter">
                LUKEN<span className="text-blue-600">FIT</span>
            </h1>
        </div>
    );

    const containerClasses =
        'min-h-screen bg-background flex items-center justify-center p-4';
    const cardClasses =
        'bg-surface rounded-3xl p-8 max-w-md w-full border border-border shadow-card';

    if (!isSupabaseConfigured) {
        return (
            <div className={containerClasses}>
                <div className={cardClasses}>
                    <div className="text-center mb-6">
                        <LukenFitLogo />
                        <p className="text-text-tertiary mt-2">
                            {t('auth.offline.title')}
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                        <p className="text-amber-700 text-sm">
                            {t('auth.offline.warning')}
                        </p>
                    </div>

                    <button
                        onClick={handleContinueOffline}
                        className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg">
                        {t('auth.offline.button')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <div className={cardClasses}>
                {mode === 'login' && (
                    <AuthLogin
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        onSubmit={handleSubmit}
                        loading={loading}
                        setMode={setMode}
                        error={error || (externalError as string)}
                        message={message}
                        handleGoogleSignIn={handleGoogleSignIn}
                        handleContinueOffline={handleContinueOffline}
                        LukenFitLogo={LukenFitLogo}
                    />
                )}
                {mode === 'signup' && (
                    <AuthRegister
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        confirmPassword={confirmPassword}
                        setConfirmPassword={setConfirmPassword}
                        onSubmit={handleSubmit}
                        loading={loading}
                        setMode={setMode}
                        error={error || (externalError as string)}
                        message={message}
                        handleGoogleSignIn={handleGoogleSignIn}
                        handleContinueOffline={handleContinueOffline}
                        LukenFitLogo={LukenFitLogo}
                    />
                )}
                {mode === 'reset' && (
                    <AuthResetPassword
                        email={email}
                        setEmail={setEmail}
                        onSubmit={handleSubmit}
                        loading={loading}
                        setMode={setMode}
                        error={error || (externalError as string)}
                        message={message}
                        handleContinueOffline={handleContinueOffline}
                        LukenFitLogo={LukenFitLogo}
                    />
                )}
            </div>
        </div>
    );
};
