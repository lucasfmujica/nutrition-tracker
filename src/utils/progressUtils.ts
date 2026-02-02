/**
 * Progress utilities - Helper functions for progress photos and measurements
 */

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProgressPhoto, BodyMeasurement } from '../types/domain';

/**
 * Group photos by month (YYYY-MM)
 * @returns Array of month groups, sorted newest first
 */
export function groupPhotosByMonth(photos: ProgressPhoto[]): Array<{
    month: string;
    monthLabel: string;
    photos: ProgressPhoto[];
}> {
    const grouped = photos.reduce((acc, photo) => {
        const monthKey = photo.date.substring(0, 7); // YYYY-MM
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(photo);
        return acc;
    }, {} as Record<string, ProgressPhoto[]>);

    return Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a)) // Newest first
        .map(([month, photos]) => ({
            month,
            monthLabel: format(parseISO(`${month}-01`), 'MMM yyyy', { locale: es }),
            photos: photos.sort((a, b) => b.date.localeCompare(a.date)), // Newest first within month
        }));
}

/**
 * Calculate stats between two photos
 */
export function calculatePhotoStats(
    beforePhoto: ProgressPhoto,
    afterPhoto: ProgressPhoto
): {
    weightChange: number;
    daysDuration: number;
    hasWeightData: boolean;
} {
    const weightChange = (afterPhoto.weight || 0) - (beforePhoto.weight || 0);
    const beforeDate = parseISO(beforePhoto.date);
    const afterDate = parseISO(afterPhoto.date);
    const daysDuration = Math.abs(
        Math.floor((afterDate.getTime() - beforeDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
        weightChange,
        daysDuration,
        hasWeightData: !!(beforePhoto.weight && afterPhoto.weight),
    };
}

/**
 * Get the baseline (first) photo for comparisons
 */
export function getBaselinePhoto(photos: ProgressPhoto[]): ProgressPhoto | null {
    if (photos.length === 0) return null;
    return photos.reduce((oldest, photo) =>
        photo.date < oldest.date ? photo : oldest
    );
}

/**
 * Get the latest photo for comparisons
 */
export function getLatestPhoto(photos: ProgressPhoto[]): ProgressPhoto | null {
    if (photos.length === 0) return null;
    return photos.reduce((newest, photo) =>
        photo.date > newest.date ? photo : newest
    );
}

/**
 * Format angle label for display
 */
export function formatAngleLabel(angle: string | undefined): string {
    if (!angle) return '';

    const labels: Record<string, string> = {
        front: 'Frente',
        side: 'Lado',
        back: 'Espalda',
        other: 'Otro',
    };

    return labels[angle] || angle;
}

/**
 * Get angle badge letter
 */
export function getAngleBadge(angle: string | undefined): string {
    if (!angle) return '';

    const badges: Record<string, string> = {
        front: 'F',
        side: 'L',
        back: 'E',
        other: 'O',
    };

    return badges[angle] || '';
}
