import React, { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import {
    CustomTargets,
    FoodEntry,
    Profile,
    StepsEntry,
    WeightEntry,
    Workout,
} from '../../types/domain';

import { useTheme } from '../../context/ThemeContext';
import { calculateMacros } from '../../utils/macroCalculator';
import {
    convertWeightForDisplay,
    getWeightUnit,
    parseWeightToKg,
} from '../../utils/unitUtils';
import { DietaryPreferences } from '../Settings/DietaryPreferences';
import { AppleHealthSetup } from '../Settings/AppleHealthSetup';
import { IOSShortcutQR } from '../Settings/iOSShortcutQR';
import { NotificationSettings } from '../Settings/NotificationSettings';
import { OuraTokenSetup } from '../Settings/OuraTokenSetup';

interface ConfigTabProps {
    // Profile
    profile: Profile;
    customTargets: CustomTargets;
    updateConfig: (profile: Profile, targets: CustomTargets) => void;
    // Data counts for stats
    weightHistory: WeightEntry[];
    foodLog: FoodEntry[];
    workoutLog: Workout[];
    stepsLog: StepsEntry[];
    // Export functions
    exportForClaude: () => void;
    exportForNutritionist: () => void;
    exportBackup: () => void;
    importBackup: (e: ChangeEvent<HTMLInputElement>) => void;
    exportForBiometrics: () => void;
    // User ID for iOS Shortcuts
    userId?: string;
}

/**
 * ConfigTab - Configuration and settings
 * Displays profile settings, avatar selection, targets, and export options
 */
export const ConfigTab: React.FC<ConfigTabProps> = ({
    // Profile
    profile,
    customTargets,
    updateConfig,
    // Data counts for stats
    weightHistory,
    foodLog,
    workoutLog,
    stepsLog,
    // Export functions
    exportForClaude,
    exportForNutritionist,
    exportBackup,
    importBackup,
    exportForBiometrics,
    // User ID
    userId,
}) => {
    const { t, i18n } = useTranslation();
    const { unitSystem, updateUnitSystem } = useTracker();
    const { theme, setTheme } = useTheme();
    const [isRecalculating, setIsRecalculating] = useState(false);

    const unitLabel = getWeightUnit(unitSystem);

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
        <div className="w-full max-w-none space-y-6">
            <div className="mb-2 px-1">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t('config.title')}
                </h1>
                <p className="text-sm text-text-tertiary">{t('config.subtitle')}</p>
            </div>

            {/* Profile Card */}
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
                <div className="mb-8">
                    <h2 className="text-xs font-black text-text-tertiary mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                        {t('config.preferences.title')}
                    </h2>

                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                        {t('config.preferences.unitSystem')}
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateUnitSystem('metric')}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                unitSystem === 'metric'
                                    ? 'bg-primary text-white shadow-glow'
                                    : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                            }`}>
                            {t('config.preferences.metric')}
                        </button>
                        <button
                            onClick={() => updateUnitSystem('imperial')}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                unitSystem === 'imperial'
                                    ? 'bg-primary text-white shadow-glow'
                                    : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                            }`}>
                            {t('config.preferences.imperial')}
                        </button>
                    </div>

                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1 mt-4">
                        {t('config.preferences.language')}
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => i18n.changeLanguage('es')}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                i18n.language === 'es'
                                    ? 'bg-primary text-white shadow-glow'
                                    : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                            }`}>
                            {t('config.preferences.spanish')}
                        </button>
                        <button
                            onClick={() => i18n.changeLanguage('en')}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                i18n.language === 'en'
                                    ? 'bg-primary text-white shadow-glow'
                                    : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                            }`}>
                            {t('config.preferences.english')}
                        </button>
                    </div>

                    {/* Preferences Section: Appearance */}
                    <div className="mb-8">
                        <h2 className="text-xs font-black text-text-tertiary mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                            {t('config.preferences.appearance')}
                        </h2>

                        <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                            {t('config.preferences.theme')}
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                    theme === 'light'
                                        ? 'bg-primary text-white shadow-glow'
                                        : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                                }`}>
                                {t('config.preferences.light')}
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                    theme === 'dark'
                                        ? 'bg-primary text-white shadow-glow'
                                        : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                                }`}>
                                {t('config.preferences.dark')}
                            </button>
                            <button
                                onClick={() => setTheme('system')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                    theme === 'system'
                                        ? 'bg-primary text-white shadow-glow'
                                        : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                                }`}>
                                {t('config.preferences.system')}
                            </button>
                        </div>
                    </div>
                </div>

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
            </div>

            {/* Auto-Calculate Section */}
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

            {/* Dietary Preferences (AI meal plan / AI Chef) */}
            <DietaryPreferences />

            {/* Smart Hydration Setting */}
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

            {/* Notifications */}
            <NotificationSettings />

            {/* Oura Ring Integration */}
            <OuraTokenSetup
                hasOuraRing={profile.hasOuraRing ?? false}
                currentToken={profile.ouraPersonalToken}
                userId={profile.userId}
                onSaveToken={async (token) => {
                    await updateConfig(
                        { ...profile, ouraPersonalToken: token },
                        customTargets,
                    );
                }}
                onToggleOura={async (enabled) => {
                    await updateConfig(
                        { ...profile, hasOuraRing: enabled },
                        customTargets,
                    );
                }}
            />

            {/* Oura Steps Auto-Sync Settings */}
            {profile.hasOuraRing && (
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
            )}

            {/* iOS Shortcuts QR Code */}
            {userId && (
                <IOSShortcutQR
                    userId={userId}
                    onConfigured={() =>
                        updateConfig(
                            { ...profile, iosShortcutsConfigured: true },
                            customTargets,
                        )
                    }
                />
            )}

            {/* Apple Health Integration */}
            {userId && <AppleHealthSetup userId={userId} />}

            {/* Sync Status */}
            <div className="bg-primary-soft border border-primary/20 border-dashed rounded-2xl p-4 flex items-center justify-between">
                <p className="text-xs text-primary font-bold">{t('config.sync')}</p>
                <div className="flex gap-1">
                    <div
                        className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: '0ms' }}
                    />
                    <div
                        className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: '150ms' }}
                    />
                    <div
                        className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: '300ms' }}
                    />
                </div>
            </div>

            {/* Export Section */}
            <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
                <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-surface-lighter text-text-secondary flex items-center justify-center">
                        📤
                    </span>
                    {t('config.export.title')}
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={exportForClaude}
                        className="bg-info-soft hover:bg-info/20 text-info py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        🤖 {t('config.export.claude')}
                    </button>
                    <button
                        onClick={exportForNutritionist}
                        className="bg-danger-soft hover:bg-danger/20 text-danger py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        🩺 {t('config.export.nutritionist')}
                    </button>
                    <button
                        onClick={exportForBiometrics}
                        className="bg-success-soft hover:bg-success/20 text-success py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        📊 {t('config.export.biometrics')}
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                    <button
                        onClick={exportBackup}
                        className="bg-warning-soft hover:bg-warning/20 text-warning py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        📤 {t('config.export.backup')}
                    </button>
                    <label className="bg-background hover:bg-surface-lighter text-text-secondary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        📥 {t('config.export.import')}
                        <input
                            type="file"
                            accept=".json"
                            onChange={importBackup}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-background rounded-xl">
                        <div className="text-sm font-bold text-text-primary">
                            {weightHistory.length}
                        </div>
                        <div className="text-xs text-text-tertiary font-medium">Peso</div>
                    </div>
                    <div className="p-2 bg-background rounded-xl">
                        <div className="text-sm font-bold text-text-primary">
                            {foodLog.length}
                        </div>
                        <div className="text-xs text-text-tertiary font-medium">
                            Comidas
                        </div>
                    </div>
                    <div className="p-2 bg-background rounded-xl">
                        <div className="text-sm font-bold text-text-primary">
                            {workoutLog.length}
                        </div>
                        <div className="text-xs text-text-tertiary font-medium">
                            Entrenos
                        </div>
                    </div>
                    <div className="p-2 bg-background rounded-xl">
                        <div className="text-sm font-bold text-text-primary">
                            {stepsLog.length}
                        </div>
                        <div className="text-xs text-text-tertiary font-medium">
                            Pasos
                        </div>
                    </div>
                </div>

                <p className="text-xs text-text-tertiary mt-4 text-center">
                    {t('config.export.warning')}
                </p>
            </div>
        </div>
    );
};
