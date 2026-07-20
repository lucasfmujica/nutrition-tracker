import React from 'react';
import { useTranslation } from 'react-i18next';
import { CustomTargets, Profile } from '../../types/domain';

interface MacroTargetsSectionProps {
    profile: Profile;
    customTargets: CustomTargets;
    updateConfig: (profile: Profile, targets: CustomTargets) => void;
}

/**
 * MacroTargetsSection - Manual macro inputs: rest day targets and
 * training day bonus cards.
 */
export const MacroTargetsSection: React.FC<MacroTargetsSectionProps> = ({
    profile,
    customTargets,
    updateConfig,
}) => {
    const { t } = useTranslation();

    return (
        <>
            {/* Rest Day Targets */}
            <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm">
                <h2 className="text-xs font-black text-text-tertiary mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                    {t('config.targets.title')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                            {t('config.targets.calories')}
                        </label>
                        <input
                            type="number"
                            value={customTargets.calories}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    calories: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-lg font-black text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1 text-success">
                            {t('config.targets.protein')}
                        </label>
                        <input
                            type="number"
                            value={customTargets.protein}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    protein: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-success-soft border border-success/20 rounded-control px-4 py-3.5 text-lg font-black text-text-primary focus:border-success outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1 text-warning dark:text-warning">
                            {t('config.targets.carbs')}
                        </label>
                        <input
                            type="number"
                            value={customTargets.carbs}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    carbs: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-warning-soft border border-warning/20 rounded-control px-4 py-3.5 text-lg font-black text-text-primary focus:border-warning outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1 text-danger">
                            {t('config.targets.fat')}
                        </label>
                        <input
                            type="number"
                            value={customTargets.fat}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    fat: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-danger-soft border border-danger/20 rounded-control px-4 py-3.5 text-lg font-black text-text-primary focus:border-danger outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                            {t('config.targets.fiber')}
                        </label>
                        <input
                            type="number"
                            value={customTargets.fiber}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    fiber: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-lg font-black text-text-primary focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Training Day Bonus */}
            <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-warning-soft rounded-full -mr-12 -mt-12 opacity-50" />
                <h2 className="text-xs font-black text-text-tertiary mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                    {t('config.trainingBonus.title')}
                </h2>
                <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                            {t('config.trainingBonus.calories')}
                        </label>
                        <input
                            type="number"
                            value={customTargets.trainingDayCaloriesBonus}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    trainingDayCaloriesBonus:
                                        parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-warning-soft border border-warning/20 rounded-control px-4 py-3.5 text-lg font-black text-text-primary focus:border-warning outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                            {t('config.trainingBonus.carbs')}
                        </label>
                        <input
                            type="number"
                            value={customTargets.trainingDayCarbs}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    trainingDayCarbs: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-warning-soft border border-warning/20 rounded-control px-4 py-3.5 text-lg font-black text-text-primary focus:border-warning outline-none transition-all"
                        />
                    </div>
                </div>
                <p className="text-xs text-warning mt-4 font-bold bg-warning-soft inline-block px-3 py-1 rounded-full border border-warning/20">
                    {t('config.trainingBonus.summary', {
                        calories:
                            customTargets.calories +
                            (customTargets.trainingDayCaloriesBonus || 0),
                        carbs: customTargets.trainingDayCarbs,
                    })}
                </p>
            </div>
        </>
    );
};
