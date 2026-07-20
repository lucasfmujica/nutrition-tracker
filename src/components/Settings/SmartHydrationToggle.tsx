import React from 'react';
import { useTranslation } from 'react-i18next';
import { CustomTargets, Profile } from '../../types/domain';

interface SmartHydrationToggleProps {
    profile: Profile;
    customTargets: CustomTargets;
    updateConfig: (profile: Profile, targets: CustomTargets) => void;
}

/**
 * SmartHydrationToggle - Card with the smart hydration on/off switch.
 */
export const SmartHydrationToggle: React.FC<SmartHydrationToggleProps> = ({
    profile,
    customTargets,
    updateConfig,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-soft rounded-full -mr-12 -mt-12 opacity-50" />
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <h2 className="text-xs font-black text-primary mb-1 uppercase tracking-[0.2em] flex items-center gap-2">
                        💧 {t('config.smartHydration.title')}
                    </h2>
                    <p className="text-sm text-text-tertiary max-w-md">
                        {t('config.smartHydration.subtitle')}
                    </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        role="switch"
                        checked={profile.smartHydration ?? true}
                        onChange={(e) =>
                            updateConfig(
                                {
                                    ...profile,
                                    smartHydration: e.target.checked,
                                },
                                customTargets,
                            )
                        }
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-lighter peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>
        </div>
    );
};
