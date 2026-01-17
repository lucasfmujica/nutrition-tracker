import { ARGENTINA_TZ, getArgentinaDateString } from './dateUtils';
import { formatArgentinaTimestamp } from './export/exportHelpers';
import { generateClaudeReport } from './export/formatClaudeReport';
import { generateFoodJournal } from './export/formatNutriJournal';

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
export const downloadFile = (content, filename, type = 'text/plain;charset=utf-8') => {
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
export const downloadBackup = (data) => {
  const backup = {
    exportDate: new Date().toISOString(),
    exportTimezone: 'America/Argentina/Buenos_Aires',
    version: 'v7',
    ...data
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
export const parseBackupFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

/**
 * Re-export report generators for use in hooks
 * These are the main export formats
 */
export { formatArgentinaTimestamp, sanitizeForExport } from './export/exportHelpers';
export { generateClaudeReport } from './export/formatClaudeReport';
export { generateFoodJournal } from './export/formatNutriJournal';
