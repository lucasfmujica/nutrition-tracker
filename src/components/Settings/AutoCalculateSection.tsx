import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomTargets, Profile } from '../../types/domain';
import { calculateMacros } from '../../utils/macroCalculator';

interface AutoCalculateSectionProps {
    profile: Profile;
    customTargets: CustomTargets;
    updateConfig: (profile: Profile, targets: CustomTargets) => void;
}

/**
 * AutoCalculateSection - Gender/training/goal/activity inputs and the
 * automatic macro recalculation button.
 */
export const AutoCalculateSection: React.FC<AutoCalculateSectionProps> = ({
    profile,
    customTargets,
    updateConfig,
}) => {
    const { t } = useTranslation();
    const [isRecalculating, setIsRecalculating] = useState(false);

    const handleAutoRecalculate = async () => {
        setIsRecalculating(true);

        try {
            // Map goal from 'cut'/'maintain'/'bulk' to 'lose'/'maintain'/'gain'
            const goalMap = {
                cut: 'lose',
                maintain: 'maintain',
                bulk: 'gain',
            } as const;

            // Map activityLevel to trainingDaysPerWeek (approximation)
            const activityToDays = {
                sedentary: 1,
                light: 2,
                moderate: 4,
                active: 6,
                very_active: 7,
            } as const;

            // Use the user's real training frequency so this recalculation stays
            // consistent with the onboarding calculation. Fall back to the stored
            // activityLevel, then to a moderate default, if it isn't set.
            const trainingDays =
                profile.trainingDaysPerWeek ??
                activityToDays[profile.activityLevel] ??
                4;

            const macros = calculateMacros({
                weight: profile.currentWeight,
                height: profile.height,
                age: profile.age,
                gender: profile.gender || 'male', // Now populated from DB; fallback only for legacy profiles
                trainingDaysPerWeek: trainingDays,
                primaryGoal: goalMap[profile.goal],
            });

            const newTargets: CustomTargets = {
                ...customTargets,
                calories: macros.calories,
                protein: macros.protein,
                carbs: macros.carbs,
                fat: macros.fat,
            };

            await updateConfig(profile, newTargets);
        } catch (err) {
            console.error('[ConfigTab] Error recalculating macros:', err);
        } finally {
            setIsRecalculating(false);
        }
    };

    return (
        <div className="bg-oura-soft rounded-card p-6 border border-oura/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-oura/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-oura/10 rounded-full -ml-12 -mb-12" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xs font-black text-oura mb-1 uppercase tracking-[0.2em] flex items-center gap-2">
                            🧮 {t('config.autoCalculate.title')}
                        </h2>
                        <p className="text-xs text-text-secondary">
                            {t('config.autoCalculate.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                            {t('config.gender')}
                        </label>
                        <select
                            value={profile.gender || 'male'}
                            onChange={(e) =>
                                updateConfig(
                                    {
                                        ...profile,
                                        gender: e.target.value as
                                            | 'male'
                                            | 'female',
                                    },
                                    customTargets,
                                )
                            }
                            className="w-full bg-background border border-oura/20 rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-oura focus:ring-4 focus:ring-oura/10 outline-none transition-all">
                            <option value="male">
                                {t('config.options.gender.male')}
                            </option>
                            <option value="female">
                                {t('config.options.gender.female')}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                            {t('config.trainingDays')}
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="7"
                            value={
                                profile.trainingDaysPerWeek ??
                                ({
                                    sedentary: 1,
                                    light: 2,
                                    moderate: 4,
                                    active: 6,
                                    very_active: 7,
                                }[profile.activityLevel] ||
                                    4)
                            }
                            onChange={(e) =>
                                updateConfig(
                                    {
                                        ...profile,
                                        trainingDaysPerWeek:
                                            parseInt(e.target.value) || 0,
                                    },
                                    customTargets,
                                )
                            }
                            className="w-full bg-background border border-oura/20 rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-oura focus:ring-4 focus:ring-oura/10 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                            {t('config.goal')}
                        </label>
                        <select
                            value={profile.goal || 'cut'}
                            onChange={(e) =>
                                updateConfig(
                                    {
                                        ...profile,
                                        goal: e.target.value as
                                            | 'cut'
                                            | 'maintain'
                                            | 'bulk',
                                    },
                                    customTargets,
                                )
                            }
                            className="w-full bg-background border border-oura/20 rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-oura focus:ring-4 focus:ring-oura/10 outline-none transition-all">
                            <option value="cut">
                                {t('config.options.goal.cut')}
                            </option>
                            <option value="maintain">
                                {t('config.options.goal.maintain')}
                            </option>
                            <option value="bulk">
                                {t('config.options.goal.bulk')}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                            {t('config.activityLevel')}
                        </label>
                        <select
                            value={profile.activityLevel || 'moderate'}
                            onChange={(e) =>
                                updateConfig(
                                    {
                                        ...profile,
                                        activityLevel: e.target.value as
                                            | 'sedentary'
                                            | 'light'
                                            | 'moderate'
                                            | 'active'
                                            | 'very_active',
                                    },
                                    customTargets,
                                )
                            }
                            className="w-full bg-background border border-oura/20 rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-oura focus:ring-4 focus:ring-oura/10 outline-none transition-all">
                            <option value="sedentary">
                                {t('config.options.activityLevel.sedentary')}
                            </option>
                            <option value="light">
                                {t('config.options.activityLevel.light')}
                            </option>
                            <option value="moderate">
                                {t('config.options.activityLevel.moderate')}
                            </option>
                            <option value="active">
                                {t('config.options.activityLevel.active')}
                            </option>
                            <option value="very_active">
                                {t('config.options.activityLevel.very_active')}
                            </option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleAutoRecalculate}
                    disabled={isRecalculating}
                    className="w-full bg-oura hover:opacity-90 text-white py-4 rounded-control font-bold text-sm shadow-float active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isRecalculating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t('config.autoCalculate.loading')}
                        </>
                    ) : (
                        <>{t('config.autoCalculate.button')}</>
                    )}
                </button>

                <div className="mt-4 p-3 bg-surface/60 border border-oura/20 rounded-xl">
                    <div className="mt-4 p-3 bg-surface/60 border border-oura/20 rounded-xl">
                        <p className="text-xs text-text-secondary font-medium leading-relaxed">
                            {t('config.autoCalculate.explanation')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
