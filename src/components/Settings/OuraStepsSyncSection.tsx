import React from 'react';
import { useTranslation } from 'react-i18next';
import { CustomTargets, Profile } from '../../types/domain';

interface OuraStepsSyncSectionProps {
    profile: Profile;
    customTargets: CustomTargets;
    updateConfig: (profile: Profile, targets: CustomTargets) => void;
}

/**
 * OuraStepsSyncSection - Oura steps auto-sync settings card.
 * Only rendered when the profile has an Oura Ring enabled.
 */
export const OuraStepsSyncSection: React.FC<OuraStepsSyncSectionProps> = ({
    profile,
    customTargets,
    updateConfig,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-oura-soft text-oura flex items-center justify-center">
                    👟
                </span>
                {t('config.stepsTracking.title')}
            </h2>
            <p className="text-xs text-text-tertiary mb-4">
                {t('config.stepsTracking.subtitle')}
            </p>

            <label className="flex items-center justify-between p-3 bg-background rounded-lg mb-2 cursor-pointer hover:bg-surface-lighter transition-colors">
                <div>
                    <span className="text-sm font-medium block mb-1">
                        {t('config.stepsTracking.autoSync')}
                    </span>
                    <p className="text-xs text-text-tertiary">
                        {t('config.stepsTracking.autoSyncDesc')}
                    </p>
                </div>
                <input
                    type="checkbox"
                    role="switch"
                    checked={profile.stepsAutoSync ?? false}
                    onChange={(e) =>
                        updateConfig(
                            {
                                ...profile,
                                stepsAutoSync: e.target.checked,
                            },
                            customTargets,
                        )
                    }
                    className="w-12 h-6 appearance-none bg-muted rounded-full relative cursor-pointer transition-colors checked:bg-oura before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-surface before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
                />
            </label>

            {!profile.stepsAutoSync && (
                <div className="text-xs text-text-secondary bg-primary-soft p-3 rounded-lg flex items-start gap-2">
                    <span className="text-primary shrink-0">ℹ️</span>
                    <span>{t('config.stepsTracking.manualMode')}</span>
                </div>
            )}

            {profile.stepsAutoSync && (
                <div className="text-xs text-success bg-success-soft p-3 rounded-lg flex items-start gap-2">
                    <span className="shrink-0">✅</span>
                    <span>{t('config.stepsTracking.autoMode')}</span>
                </div>
            )}
        </div>
    );
};
