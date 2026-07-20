import { Shield } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface SafetyNetToggleProps {
    isActive: boolean;
    onToggle: () => void;
    statusMessage?: string;
}

/**
 * SafetyNetToggle - Premium toggle for Modo Escudo (Safety Net)
 */
export const SafetyNetToggle: React.FC<SafetyNetToggleProps> = ({
    isActive,
    onToggle,
}) => {
    const { t } = useTranslation();
    return (
        <button
            onClick={onToggle}
            className={`
        relative flex items-center justify-center lg:justify-start gap-3 px-4 py-3 lg:py-2 rounded-control
        transition-all duration-300 ease-out w-full lg:w-auto
        min-h-[44px]
        ${
            isActive
                ? 'bg-gradient-to-r from-primary to-accent-blue text-white shadow-glow'
                : 'bg-surface text-text-secondary border border-border hover:border-primary/40 shadow-sm'
        }
      `}
            title={
                isActive
                    ? t('dashboard.safetyNet.deactivate')
                    : t('dashboard.safetyNet.activate')
            }>
            {/* Shield Icon */}
            <Shield
                className={`
          w-5 h-5 transition-all duration-300 flex-shrink-0
          ${isActive ? 'text-white' : 'text-text-tertiary'}
        `}
                fill={isActive ? 'currentColor' : 'none'}
            />

            {/* Label (Always visible now) */}
            <div className="flex flex-col items-start text-left">
                <span
                    className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-text-primary'}`}>
                    {t('dashboard.safetyNet.title')}
                </span>
                <span
                    className={`text-[10px] uppercase tracking-wide font-medium ${isActive ? 'text-white/80' : 'text-text-tertiary'}`}>
                    {isActive
                        ? t('dashboard.safetyNet.on')
                        : t('dashboard.safetyNet.off')}
                </span>
            </div>

            {/* Active Glow Effect */}
            {isActive && (
                <div className="absolute inset-0 rounded-control bg-gradient-to-r from-primary to-accent-blue opacity-20 blur-md -z-10 animate-pulse" />
            )}
        </button>
    );
};
