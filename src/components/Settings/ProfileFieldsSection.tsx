import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { CustomTargets, Profile, WeightEntry } from '../../types/domain';
import {
    convertWeightForDisplay,
    getWeightUnit,
    parseWeightToKg,
} from '../../utils/unitUtils';

interface ProfileFieldsSectionProps {
    profile: Profile;
    customTargets: CustomTargets;
    updateConfig: (profile: Profile, targets: CustomTargets) => void;
    weightHistory: WeightEntry[];
}

/**
 * ProfileFieldsSection - Physical stats form (name, weights, height, step goal, age).
 * Rendered inside the profile card in ConfigTab.
 */
export const ProfileFieldsSection: React.FC<ProfileFieldsSectionProps> = ({
    profile,
    customTargets,
    updateConfig,
    weightHistory,
}) => {
    const { t } = useTranslation();
    const { unitSystem } = useTracker();

    const unitLabel = getWeightUnit(unitSystem);

    return (
        <>
            <h2 className="text-xs font-black text-text-tertiary mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                {t('config.section_profile')}
            </h2>
            <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                        {t('config.name')}
                    </label>
                    <input
                        type="text"
                        value={profile.name || ''}
                        onChange={(e) =>
                            updateConfig(
                                { ...profile, name: e.target.value },
                                customTargets,
                            )
                        }
                        className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-lg font-bold text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder={t('config.name_placeholder')}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                        {weightHistory && weightHistory.length > 0
                            ? `${t('config.startWeight')} (${unitLabel})`
                            : `${t('config.currentWeight')} (${unitLabel})`}
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        value={convertWeightForDisplay(
                            profile.currentWeight,
                            unitSystem,
                        ).toFixed(1)}
                        onChange={(e) =>
                            updateConfig(
                                {
                                    ...profile,
                                    currentWeight: parseWeightToKg(
                                        e.target.value,
                                        unitSystem,
                                    ),
                                },
                                customTargets,
                            )
                        }
                        className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-lg font-bold text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                        {t('config.targetWeight')} ({unitLabel})
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        value={convertWeightForDisplay(
                            profile.targetWeight,
                            unitSystem,
                        ).toFixed(1)}
                        onChange={(e) =>
                            updateConfig(
                                {
                                    ...profile,
                                    targetWeight: parseWeightToKg(
                                        e.target.value,
                                        unitSystem,
                                    ),
                                },
                                customTargets,
                            )
                        }
                        className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-lg font-bold text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                        {t('config.height')} (cm)
                    </label>
                    <input
                        type="number"
                        value={profile.height}
                        onChange={(e) =>
                            updateConfig(
                                {
                                    ...profile,
                                    height: parseInt(e.target.value) || 0,
                                },
                                customTargets,
                            )
                        }
                        className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-lg font-bold text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                        {t('config.stepGoal')}
                    </label>
                    <input
                        type="number"
                        value={profile.stepGoal || 8000}
                        onChange={(e) =>
                            updateConfig(
                                {
                                    ...profile,
                                    stepGoal: parseInt(e.target.value) || 0,
                                },
                                customTargets,
                            )
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-lg font-bold text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                        {t('config.age')}
                    </label>
                    <input
                        type="number"
                        value={profile.age}
                        onChange={(e) =>
                            updateConfig(
                                {
                                    ...profile,
                                    age: parseInt(e.target.value) || 0,
                                },
                                customTargets,
                            )
                        }
                        className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-lg font-bold text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                </div>
            </div>
        </>
    );
};
