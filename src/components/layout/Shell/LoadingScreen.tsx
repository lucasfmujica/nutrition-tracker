import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LOADING_MESSAGES = [
    'Sincronizando con tu anillo Oura...',
    'Calculando tu pronóstico de rendimiento...',
    'Ajustando metas para Buenos Aires...',
    'Preparando tu dashboard personalizado...',
    'Cargando datos de nutrición...',
];

interface LoadingScreenProps {
    message?: string | null;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = null }) => {
    const { t } = useTranslation();
    const LOADING_MESSAGES = [
        t('auth.loading'),
        t('layout.loading'),
        t('layout.syncStatus') + '...',
        t('dashboard.predictive.calibrating.title') + '...',
    ];
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        // Only rotate messages if no custom message provided
        if (message) return;

        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2000); // Change message every 2 seconds

        return () => clearInterval(interval);
    }, [message]);

    const displayMessage = message || LOADING_MESSAGES[currentMessageIndex];

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
            <div className="text-center px-6 flex flex-col items-center">
                {/* Logo/Branding */}
                <div className="mb-8 flex flex-col items-center gap-4">
                    <div className="relative">
                        <svg
                            viewBox="0 0 32 32"
                            className="w-24 h-24 flex-shrink-0 animate-pulse">
                            <defs>
                                <linearGradient
                                    id="loadingGrad"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%">
                                    <stop
                                        offset="0%"
                                        style={{ stopColor: '#2563EB' }}
                                    />
                                    <stop
                                        offset="100%"
                                        style={{ stopColor: '#0891B2' }}
                                    />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="16"
                                cy="16"
                                r="15"
                                fill="#F8FAFC"
                                stroke="url(#loadingGrad)"
                                strokeWidth="1.5"
                            />
                            <path
                                d="M10 7 L10 21 L19 21 L19 18 L13 18 L13 7 Z"
                                fill="url(#loadingGrad)"
                            />
                            <path
                                d="M18 7 L14 15 L17 15 L15 25 L23 14 L19 14 L22 7 Z"
                                fill="url(#loadingGrad)"
                                opacity="0.9"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black text-text-primary tracking-tighter">
                        LUKEN<span className="text-blue-600">FIT</span>
                    </h1>
                </div>

                {/* Loading Bar */}
                <div className="w-64 mx-auto mb-6 h-1.5 bg-surface-lighter rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 splash-loading-bar rounded-full" />
                </div>

                {/* Dynamic Message */}
                <div className="text-text-tertiary text-sm font-medium animate-fade-in uppercase tracking-wide">
                    {displayMessage}
                </div>
            </div>
        </div>
    );
};
