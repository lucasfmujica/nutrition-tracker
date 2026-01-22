import { ChangeEvent } from 'react';
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
}

export const useExport = (
    trackerData: TrackerData,
    analyticsObject: any,
    weightAnalytics: WeightAnalytics,
): UseExportReturn => {
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
        // helpers needed for reports
        getMostRecentWeight,
        getTotalsForDate,
        getTargetsForDate,
        getStepsForDate,
        getWorkoutsForDate,
    } = trackerData;

    // Export all data as JSON backup
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
            console.error('Error exporting backup:', err);
            alert('Error al exportar backup');
        }
    };

    // Import backup from JSON file
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

            alert('Backup restaurado correctamente!');
        } catch (err) {
            console.error('Error importing backup:', err);
            alert('Error al importar backup: archivo inválido');
        }
        event.target.value = ''; // Reset input
    };

    // Export Food Journal for nutritionist (human-readable format)
    const exportForNutritionist = () => {
        try {
            const journal = generateFoodJournal({
                foodLog,
                workoutLog,
                profile,
            });
            downloadFile(
                journal,
                `diario-alimentacion-${getArgentinaDateString()}.txt`,
            );
            alert('✓ Diario exportado correctamente!');
        } catch (err) {
            console.error('Error exporting food journal:', err);
            alert('Error al generar el diario');
        }
    };

    // Export structured Markdown report for Claude AI
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

            // Try to copy to clipboard first
            navigator.clipboard
                .writeText(report)
                .then(() => {
                    alert(
                        '✓ Copiado al portapapeles!\n\nPegalo en el chat con Claude para análisis completo.',
                    );
                })
                .catch(() => {
                    // Fallback: download as markdown file
                    downloadFile(
                        report,
                        `export-claude-${today}.md`,
                        'text/markdown;charset=utf-8',
                    );
                    alert(
                        '📄 Archivo descargado como export-claude-' + today + '.md',
                    );
                });
        } catch (err) {
            console.error('Error exporting for Claude:', err);
            alert('Error al generar el reporte para Claude');
        }
    };

    return {
        exportBackup,
        importBackup,
        exportForNutritionist,
        exportForClaude,
    };
};
