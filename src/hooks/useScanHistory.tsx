import { useCallback, useEffect, useState } from 'react';
import Dexie, { Table } from 'dexie';
import { devLog } from '../utils/devLog';
import { createThumbnail } from '../utils/imageValidation';

export interface ScanHistoryEntry {
    id?: number;
    timestamp: number;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    thumbnail: string; // Base64 data URL
    confidence?: number;
    ingredients?: string[];
}

/**
 * IndexedDB database for scan history
 */
class ScanHistoryDB extends Dexie {
    scanHistory!: Table<ScanHistoryEntry, number>;

    constructor() {
        super('ScanHistoryDB');
        this.version(1).stores({
            scanHistory: '++id, timestamp',
        });
    }
}

const db = new ScanHistoryDB();
const MAX_HISTORY_SIZE = 10;

/**
 * useScanHistory - Manage AI scan history in IndexedDB
 *
 * Features:
 * - Save last 10 scans with thumbnails
 * - Load scan history on mount
 * - Clear history
 * - Auto-cleanup (keeps only latest 10)
 *
 * @returns Hook with history state and management functions
 */
export const useScanHistory = () => {
    const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Load scan history from IndexedDB
     */
    const loadHistory = useCallback(async () => {
        try {
            const timestamp = new Date().toISOString();
            devLog(`[ScanHistory ${timestamp}] Loading history...`);

            const entries = await db.scanHistory
                .orderBy('timestamp')
                .reverse()
                .limit(MAX_HISTORY_SIZE)
                .toArray();

            devLog(`[ScanHistory ${timestamp}] ✓ Loaded ${entries.length} entries`);
            setHistory(entries);
        } catch (err) {
            console.error(`[ScanHistory ${new Date().toISOString()}] ✗ Error loading history:`, err);
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Save a new scan to history
     * @param imageFile - Original image file (for thumbnail generation)
     * @param scanResult - AI scan result data
     */
    const saveScanToHistory = useCallback(
        async (
            imageFile: File,
            scanResult: {
                foodName: string;
                calories: number;
                protein: number;
                carbs: number;
                fat: number;
                confidence?: number;
                ingredients?: string[];
            }
        ) => {
            try {
                const timestamp = Date.now();
                const timestampISO = new Date().toISOString();

                devLog(`[ScanHistory ${timestampISO}] Saving scan: ${scanResult.foodName}`);

                // Create thumbnail
                const thumbnail = await createThumbnail(imageFile, 100);

                // Create entry
                const entry: ScanHistoryEntry = {
                    timestamp,
                    foodName: scanResult.foodName,
                    calories: scanResult.calories,
                    protein: scanResult.protein,
                    carbs: scanResult.carbs,
                    fat: scanResult.fat,
                    thumbnail,
                    confidence: scanResult.confidence,
                    ingredients: scanResult.ingredients,
                };

                // Save to IndexedDB
                await db.scanHistory.add(entry);

                // Cleanup: Keep only last 10 entries
                const allEntries = await db.scanHistory.orderBy('timestamp').reverse().toArray();
                if (allEntries.length > MAX_HISTORY_SIZE) {
                    const entriesToDelete = allEntries.slice(MAX_HISTORY_SIZE);
                    const idsToDelete = entriesToDelete.map((e) => e.id!);
                    await db.scanHistory.bulkDelete(idsToDelete);
                    devLog(
                        `[ScanHistory ${timestampISO}] 🗑️ Cleaned up ${idsToDelete.length} old entries`
                    );
                }

                // Reload history
                await loadHistory();

                devLog(`[ScanHistory ${timestampISO}] ✓ Scan saved successfully`);
            } catch (err) {
                console.error(
                    `[ScanHistory ${new Date().toISOString()}] ✗ Error saving scan:`,
                    err
                );
                throw err;
            }
        },
        [loadHistory]
    );

    /**
     * Clear all scan history
     */
    const clearHistory = useCallback(async () => {
        try {
            const timestamp = new Date().toISOString();
            devLog(`[ScanHistory ${timestamp}] Clearing all history...`);

            await db.scanHistory.clear();
            setHistory([]);

            devLog(`[ScanHistory ${timestamp}] ✓ History cleared`);
            return true;
        } catch (err) {
            console.error(`[ScanHistory ${new Date().toISOString()}] ✗ Error clearing history:`, err);
            return false;
        }
    }, []);

    /**
     * Get a specific scan by ID
     */
    const getScanById = useCallback(async (id: number): Promise<ScanHistoryEntry | undefined> => {
        try {
            return await db.scanHistory.get(id);
        } catch (err) {
            console.error(`[ScanHistory ${new Date().toISOString()}] ✗ Error getting scan:`, err);
            return undefined;
        }
    }, []);

    // Load history on mount
    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    return {
        history,
        isLoading,
        loadHistory,
        saveScanToHistory,
        clearHistory,
        getScanById,
    };
};
