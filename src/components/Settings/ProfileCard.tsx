import React from 'react';
import { useTranslation } from 'react-i18next';
import { CustomTargets, Profile, WeightEntry } from '../../types/domain';
import { PreferencesSection } from './PreferencesSection';
import { ProfileFieldsSection } from './ProfileFieldsSection';

interface ProfileCardProps {
    profile: Profile;
    customTargets: CustomTargets;
    updateConfig: (profile: Profile, targets: CustomTargets) => void;
    weightHistory: WeightEntry[];
}

/**
 * ProfileCard - Avatar + name + plan header, avatar selection, preferences,
 * URL avatar override and physical stats form.
 */
export const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    customTargets,
    updateConfig,
    weightHistory,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent-blue flex items-center justify-center text-white font-bold text-2xl shadow-glow">
                    {profile.avatar && profile.avatar.length <= 4
                        ? profile.avatar
                        : profile.name?.substring(0, 1) || 'L'}
                </div>
                <div>
                    <h3 className="text-xl font-black text-text-primary leading-tight">
                        {profile.name || t('config.defaultUserName')}
                    </h3>
                    <p className="text-sm text-text-tertiary font-medium">
                        {t('config.premiumStatus')}
                    </p>
                </div>
            </div>

            {/* Avatar Selection */}
            <div className="mb-8">
                <label className="block text-xs font-black text-text-tertiary uppercase tracking-[0.2em] mb-3">
                    {t('config.avatar')}
                </label>
                <div className="grid grid-cols-8 gap-2">
                    {[
                        '💪',
                        '🏋️',
                        '🏃',
                        '🚴',
                        '⚡',
                        '🔥',
                        '🎯',
                        '🏆',
                        '⭐',
                        '💎',
                        '🦾',
                        '🧠',
                        '❤️',
                        '♟️',
                        '👑',
                        '♞',
                    ].map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() =>
                                updateConfig(
                                    { ...profile, avatar: emoji },
                                    customTargets,
                                )
                            }
                            className={`w-full aspect-square rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                                profile.avatar === emoji
                                    ? 'bg-primary-soft ring-2 ring-primary shadow-lg'
                                    : 'bg-background hover:bg-surface-lighter'
                            }`}>
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Preferences Section: Unit System & Language */}
            <PreferencesSection />

            {/* URL Avatar Override */}
            <div className="mb-8">
                <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                    {t('config.custom_image')}
                </label>
                <input
                    type="text"
                    value={
                        profile.avatar && profile.avatar.length > 4
                            ? profile.avatar
                            : ''
                    }
                    onChange={(e) =>
                        updateConfig(
                            { ...profile, avatar: e.target.value },
                            customTargets,
                        )
                    }
                    placeholder={t('config.custom_image_placeholder')}
                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
                <p className="text-[10px] text-text-tertiary mt-2 px-1">
                    {t('config.custom_image_help')}
                </p>
            </div>

            <ProfileFieldsSection
                profile={profile}
                customTargets={customTargets}
                updateConfig={updateConfig}
                weightHistory={weightHistory}
            />
        </div>
    );
};
