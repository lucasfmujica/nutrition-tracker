import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CustomTargets,
    FoodEntry,
    Macros,
    OuraEntry,
    Profile,
    StepsEntry,
    WeightAnalytics,
    WeightEntry,
    Workout,
} from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';
import {
    downloadBackup,
    downloadFile,
    generateBiometricsJournal,
    generateClaudeReport,
    generateFoodJournal,
    parseBackupFile,
} from '../utils/exportUtils';

export interface TrackerData {
    profile: Profile;
    setProfile: (p: Profile) => void;
    customTargets: CustomTargets;
    setCustomTargets: (t: CustomTargets) => void;
    weightHistory: WeightEntry[];
    saveWeightHistory: (w: WeightEntry[]) => void;
    foodLog: FoodEntry[];
    saveFoodLog: (f: FoodEntry[]) => void;
    workoutLog: Workout[];
    saveWorkoutLog: (w: Workout[]) => void;
    stepsLog: StepsEntry[];
    saveStepsLog: (s: StepsEntry[]) => void;
    ouraLog: OuraEntry[];
    saveOuraLog: (o: OuraEntry[]) => void;
    getMostRecentWeight: () => WeightEntry | null;
    getTotalsForDate: (date: string) => Macros;
    getTargetsForDate: (date: string) => CustomTargets | null;
    getStepsForDate: (date: string) => number;
    getWorkoutsForDate: (date: string) => Workout[];
}

export interface UseExportReturn {
    exportBackup: () => void;
    importBackup: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
    exportForNutritionist: () => void;
    exportForClaude: () => void;
    exportForBiometrics: () => void;
}

export const useExport = (
    trackerData: TrackerData,
    analyticsObject: any,
    weightAnalytics: WeightAnalytics,
): UseExportReturn => {
    const { t, i18n } = useTranslation();

    const {
        profile,
        setProfile,
        customTargets,
        setCustomTargets,
        weightHistory,
        saveWeightHistory,
        foodLog,
        saveFoodLog,
        workoutLog,
        saveWorkoutLog,
        stepsLog,
        saveStepsLog,
        ouraLog,
        saveOuraLog,
        getMostRecentWeight,
        getTotalsForDate,
        getTargetsForDate,
        getStepsForDate,
        getWorkoutsForDate,
    } = trackerData;

    const exportBackup = () => {
        try {
            downloadBackup({
                profile,
                customTargets,
                weightHistory,
                foodLog,
                workoutLog,
                stepsLog,
                ouraLog,
            });
        } catch (err) {
            console.error(`[Export ${new Date().toISOString()}] Error exporting backup:`, err);
            alert(t('errors.exportBackup'));
        }
    };

    const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const data = await parseBackupFile(file);

            if (data.profile) setProfile(data.profile);
            if (data.customTargets) setCustomTargets(data.customTargets);
            if (data.weightHistory) saveWeightHistory(data.weightHistory);
            if (data.foodLog) saveFoodLog(data.foodLog);
            if (data.workoutLog) saveWorkoutLog(data.workoutLog);
            if (data.stepsLog) saveStepsLog(data.stepsLog);
            if (data.ouraLog) saveOuraLog(data.ouraLog);

            alert(`✓ ${t('export.backupRestored')}`);
        } catch (err) {
            console.error(`[Export ${new Date().toISOString()}] Error importing backup:`, err);
            alert(t('errors.importBackup'));
        }
        event.target.value = '';
    };

    const exportForNutritionist = () => {
        try {
            const journal = generateFoodJournal({
                foodLog,
                workoutLog,
                profile,
                language: i18n.language,
            });
            const filename = i18n.language === 'en'
                ? `food-journal-${getArgentinaDateString()}.txt`
                : `diario-alimentacion-${getArgentinaDateString()}.txt`;
            downloadFile(journal, filename);
            alert(`✓ ${t('export.journalExported')}`);
        } catch (err) {
            console.error(`[Export ${new Date().toISOString()}] Error exporting food journal:`, err);
            alert(t('errors.exportJournal'));
        }
    };

    const exportForBiometrics = () => {
        try {
            const report = generateBiometricsJournal({
                weightHistory,
                stepsLog,
                ouraLog,
                profile,
                language: i18n.language,
            });
            const filename = i18n.language === 'en'
                ? `biometrics-${getArgentinaDateString()}.txt`
                : `biometricos-${getArgentinaDateString()}.txt`;
            downloadFile(report, filename);
            alert(`✓ ${t('export.biometricsExported')}`);
        } catch (err) {
            console.error(`[Export ${new Date().toISOString()}] Error exporting biometrics:`, err);
            alert(t('errors.exportBiometrics'));
        }
    };

    const exportForClaude = () => {
        try {
            const report = generateClaudeReport({
                profile,
                weightAnalytics,
                foodLog,
                workoutLog,
                ouraLog,
                customTargets,
                getTotalsForDate,
                getTargetsForDate: (date: string) =>
                    getTargetsForDate(date) || customTargets,
                getMostRecentWeight,
                getStepsForDate,
            });

            const today = getArgentinaDateString();

            navigator.clipboard
                .writeText(report)
                .then(() => {
                    alert(`✓ ${t('export.clipboardCopied')}`);
                })
                .catch(() => {
                    const filename = `export-claude-${today}.md`;
                    downloadFile(
                        report,
                        filename,
                        'text/markdown;charset=utf-8',
                    );
                    alert(`📄 ${t('export.fileDownloaded', { filename })}`);
                });
        } catch (err) {
            console.error(`[Export ${new Date().toISOString()}] Error exporting for Claude:`, err);
            alert(t('errors.exportJournal'));
        }
    };

    return {
        exportBackup,
        importBackup,
        exportForNutritionist,
        exportForClaude,
        exportForBiometrics,
    };
};
