import { getArgentinaDateString } from './dateUtils';
export { formatArgentinaTimestamp, sanitizeForExport } from './export/exportHelpers';
export { generateClaudeReport } from './export/formatClaudeReport';
export { generateFoodJournal } from './export/formatNutriJournal';
export { generateBiometricsJournal } from './export/formatBiometricsJournal';

/**
 * EXPORT UTILITIES - Orchestrator Module
 *
 * This file serves as a thin entry point for all export operations.
 * Core formatting logic is delegated to specialized modules in ./export/
 *
 * Architecture:
 * - formatClaudeReport.js → AI-readable Markdown
 * - formatNutriJournal.js → Human-readable Food Journal
 * - exportHelpers.js → Shared utilities (sanitize, timezone, etc.)
 */

/**
 * Triggers a file download in the browser
 *
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 * @param {string} type - MIME type (default text/plain)
 */
export const downloadFile = (
    content: string,
    filename: string,
    type: string = 'text/plain;charset=utf-8',
): void => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Generates and downloads the backup JSON file
 *
 * @param {Object} data - All application data to backup
 */
export const downloadBackup = (data: Record<string, any>): void => {
    const backup = {
        exportDate: new Date().toISOString(),
        exportTimezone: 'America/Argentina/Buenos_Aires',
        version: 'v7',
        ...data,
    };

    const filename = `lucas-tracker-backup-${getArgentinaDateString()}.json`;
    downloadFile(JSON.stringify(backup, null, 2), filename, 'application/json');
};

/**
 * Reads and parses a backup JSON file
 *
 * @param {File} file - The file object from input
 * @returns {Promise<Object>} Attributes from the backup
 */
export const parseBackupFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    const data = JSON.parse(result);
                    resolve(data);
                } else {
                    reject(new Error('Invalid file content'));
                }
            } catch (err) {
                reject(new Error('Invalid JSON format'));
            }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsText(file);
    });
};
