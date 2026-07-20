import React from 'react';
import { useTranslation } from 'react-i18next';

interface AuthLoginProps {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    setMode: (mode: 'login' | 'signup' | 'reset') => void;
    error?: string | null;
    message?: string | null;
    handleGoogleSignIn: () => void;
    handleContinueOffline: () => void;
    LukenFitLogo: React.FC;
}

export const AuthLogin: React.FC<AuthLoginProps> = ({
    email,
    setEmail,
    password,
    setPassword,
    onSubmit,
    loading,
    setMode,
    error,
    message,
    handleGoogleSignIn,
    handleContinueOffline,
    LukenFitLogo,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <div className="text-center mb-8">
                <LukenFitLogo />
                <p className="text-text-tertiary text-sm mt-2">
                    {t('auth.login.subtitle')}
                </p>
            </div>

            {error && (
                <div className="bg-danger-soft border border-danger/20 rounded-xl p-4 mb-6">
                    <p className="text-danger text-sm font-medium">{error}</p>
                </div>
            )}
            {message && (
                <div className="bg-primary-soft border border-primary/20 rounded-xl p-4 mb-6">
                    <p className="text-primary text-sm font-medium">{message}</p>
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-text-secondary text-xs font-bold mb-2 uppercase tracking-wide">
                        {t('auth.login.email')}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                        placeholder="tu@email.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-text-secondary text-xs font-bold mb-2 uppercase tracking-wide">
                        {t('auth.login.password')}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-primary to-accent-blue text-white font-bold rounded-xl hover:shadow-glow active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg
                                className="animate-spin h-5 w-5"
                                viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            {t('auth.loading')}
                        </span>
                    ) : (
                        t('auth.login.submit')
                    )}
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                    <span className="px-4 bg-surface text-text-tertiary font-bold">
                        {t('common.or')}
                    </span>
                </div>
            </div>

            <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 bg-surface text-text-secondary font-bold rounded-xl hover:bg-background transition-all border-2 border-border hover:border-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                {t('auth.login.continueGoogle')}
            </button>

            <div className="mt-8 space-y-4 text-center">
                <button
                    onClick={() => {
                        setMode('reset');
                    }}
                    className="text-text-tertiary hover:text-primary text-sm font-medium transition-colors">
                    {t('auth.login.forgotPassword')}
                </button>
                <div className="text-text-secondary text-sm bg-background p-3 rounded-xl border border-border">
                    {t('auth.login.noAccount')}{' '}
                    <button
                        onClick={() => {
                            setMode('signup');
                        }}
                        className="text-primary hover:text-primary font-bold transition-colors ml-1">
                        {t('auth.login.signUp')}
                    </button>
                </div>
            </div>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                    <span className="px-4 bg-surface text-text-tertiary font-bold">
                        {t('auth.login.continueGuest')}
                    </span>
                </div>
            </div>

            <button
                onClick={handleContinueOffline}
                className="w-full py-3.5 bg-surface text-text-secondary font-bold rounded-xl hover:bg-background transition-all border-2 border-dashed border-border hover:border-border">
                {t('auth.login.guestButton')}
            </button>
        </>
    );
};
