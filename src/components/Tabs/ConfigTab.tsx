import React, { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CustomTargets,
    FoodEntry,
    Profile,
    StepsEntry,
    WeightEntry,
    Workout,
} from '../../types/domain';

import { DietaryPreferences } from '../Settings/DietaryPreferences';
import { AppleHealthSetup } from '../Settings/AppleHealthSetup';
import { IOSShortcutQR } from '../Settings/iOSShortcutQR';
import { NotificationSettings } from '../Settings/NotificationSettings';
import { OuraTokenSetup } from '../Settings/OuraTokenSetup';
import { ProfileCard } from '../Settings/ProfileCard';
import { AutoCalculateSection } from '../Settings/AutoCalculateSection';
import { MacroTargetsSection } from '../Settings/MacroTargetsSection';
import { SmartHydrationToggle } from '../Settings/SmartHydrationToggle';
import { OuraStepsSyncSection } from '../Settings/OuraStepsSyncSection';
import { DataExportSection } from '../Settings/DataExportSection';

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
 * Thin orchestrator that renders the settings sections in order:
 * profile card, auto-calculate, macro targets, integrations and export.
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
    const { t } = useTranslation();

    return (
        <div className="w-full max-w-none space-y-6">
            <div className="mb-2 px-1">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t('config.title')}
                </h1>
                <p className="text-sm text-text-tertiary">{t('config.subtitle')}</p>
            </div>

            {/* Profile Card */}
            <ProfileCard
                profile={profile}
                customTargets={customTargets}
                updateConfig={updateConfig}
                weightHistory={weightHistory}
            />

            {/* Auto-Calculate Section */}
            <AutoCalculateSection
                profile={profile}
                customTargets={customTargets}
                updateConfig={updateConfig}
            />

            {/* Rest Day Targets + Training Day Bonus */}
            <MacroTargetsSection
                profile={profile}
                customTargets={customTargets}
                updateConfig={updateConfig}
            />

            {/* Dietary Preferences (AI meal plan / AI Chef) */}
            <DietaryPreferences />

            {/* Smart Hydration Setting */}
            <SmartHydrationToggle
                profile={profile}
                customTargets={customTargets}
                updateConfig={updateConfig}
            />

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
                <OuraStepsSyncSection
                    profile={profile}
                    customTargets={customTargets}
                    updateConfig={updateConfig}
                />
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
            <DataExportSection
                weightHistory={weightHistory}
                foodLog={foodLog}
                workoutLog={workoutLog}
                stepsLog={stepsLog}
                exportForClaude={exportForClaude}
                exportForNutritionist={exportForNutritionist}
                exportBackup={exportBackup}
                importBackup={importBackup}
                exportForBiometrics={exportForBiometrics}
            />
        </div>
    );
};
