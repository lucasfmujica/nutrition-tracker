import { FoodEntry, Profile, Workout } from '../../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../dateUtils';
import {
    capitalizeFirst,
    formatArgentinaTimestamp,
    formatFullDateSpanish,
    getTrainingContext,
} from './exportHelpers';

interface JournalData {
    foodLog: FoodEntry[];
    workoutLog: Workout[];
    profile: Profile;
}

/**
 * Generate human-readable Food Journal for nutritionists
 * Designed to be read in 30 seconds with clear daily summaries
 *
 * @param {Object} data - Export data containing food log, workouts, profile
 * @returns {string} Text formatted food journal
 */
export const generateFoodJournal = ({
    foodLog,
    workoutLog,
    profile,
}: JournalData): string => {
    const today = getArgentinaDateString();
    const daysBack = 14; // Last 2 weeks
    const startDate = addDaysToDate(today, -(daysBack - 1));

    // Generate dates array
    const dates: string[] = [];
    for (let i = 0; i < daysBack; i++) {
        dates.push(addDaysToDate(startDate, i));
    }

    let journal = '';

    // ===== HEADER =====
    journal += '═══════════════════════════════════════════════════════════════\n';
    journal += '                    DIARIO DE ALIMENTACIÓN\n';
    journal += '═══════════════════════════════════════════════════════════════\n\n';
    journal += `Nombre: ${profile?.name || 'Usuario'}\n`;
    journal += `Período: ${capitalizeFirst(formatFullDateSpanish(startDate))} → ${capitalizeFirst(formatFullDateSpanish(today))}\n`;
    journal += `Generado: ${formatArgentinaTimestamp(new Date())}\n\n`;

    // ===== DAILY ENTRIES =====
    dates.forEach((date) => {
        const foods = foodLog
            .filter((f) => f.date === date)
            .sort((a, b) => {
                // Sort by time if available, otherwise by meal order
                if (a.time && b.time) return a.time.localeCompare(b.time);
                const mealOrder: Record<string, number> = {
                    breakfast: 1,
                    lunch: 2,
                    snack: 3,
                    dinner: 4,
                    other: 5,
                };
                return (mealOrder[a.meal] || 99) - (mealOrder[b.meal] || 99);
            });

        // Get training context for this day
        const trainingContext = getTrainingContext(workoutLog, date);

        // Format date header
        const dateHeader = capitalizeFirst(formatFullDateSpanish(date));

        journal +=
            '═══════════════════════════════════════════════════════════════\n';
        journal += `${dateHeader}\n`;
        journal += `${trainingContext}\n`;
        journal +=
            '───────────────────────────────────────────────────────────────\n';

        if (foods.length === 0) {
            journal += 'Sin registro.\n\n';
        } else {
            // List each food entry
            foods.forEach((f) => {
                const timeStr = f.time ? `[${f.time}]` : `[${f.meal}]`;
                const nameStr = f.name;
                const descStr = f.description ? ` - ${f.description}` : '';
                const macrosStr = `${f.calories || 0} kcal | ${f.protein || 0}g prot`;

                journal += `${timeStr} ${nameStr}${descStr}\n`;
                journal += `       ${macrosStr}\n`;
            });

            journal += '\n';

            // Daily summary
            const totalCalories = foods.reduce(
                (sum, f) => sum + (f.calories || 0),
                0,
            );
            const totalProtein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);

            journal += `TOTAL: ${totalCalories.toLocaleString()} kcal | ${totalProtein}g proteína\n`;
        }

        journal += '\n';
    });

    // ===== FOOTER =====
    journal += '═══════════════════════════════════════════════════════════════\n';
    journal += 'NOTAS:\n';
    journal +=
        '- Horarios en zona horaria de Argentina (America/Argentina/Buenos_Aires)\n';
    journal += '- 🏋️ Gimnasio | 🎾 Tenis | 🏠 Descanso\n';
    journal += '- Los totales son específicos para cada día\n';
    journal += '═══════════════════════════════════════════════════════════════\n';

    return journal;
};
