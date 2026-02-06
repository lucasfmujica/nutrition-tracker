import { FoodEntry, Profile, Workout } from '../../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../dateUtils';
import {
    capitalizeFirst,
    formatFullDate,
    formatTimestamp,
    getTrainingContext,
} from './exportHelpers';

interface JournalData {
    foodLog: FoodEntry[];
    workoutLog: Workout[];
    profile: Profile;
    language: string;
}

/**
 * Generate human-readable Food Journal for nutritionists
 * Designed to be read in 30 seconds with clear daily summaries
 * Supports ES/EN language output with full macro breakdown
 *
 * @param {Object} data - Export data containing food log, workouts, profile, language
 * @returns {string} Text formatted food journal
 */
export const generateFoodJournal = ({
    foodLog,
    workoutLog,
    profile,
    language,
}: JournalData): string => {
    const lang = language || 'es';
    const today = getArgentinaDateString();
    const daysBack = 14;
    const startDate = addDaysToDate(today, -(daysBack - 1));

    const dates: string[] = [];
    for (let i = 0; i < daysBack; i++) {
        dates.push(addDaysToDate(startDate, i));
    }

    const l = lang === 'en'
        ? {
            header: 'FOOD JOURNAL',
            name: 'Name',
            period: 'Period',
            generated: 'Generated',
            noEntries: 'No entries.',
            total: 'TOTAL',
            notes: 'NOTES',
            timezone: 'Times in Argentina timezone (America/Argentina/Buenos_Aires)',
            dailyTotals: 'Totals are specific to each day',
            macroLegend: 'P = Protein | C = Carbs | F = Fat | Fib = Fiber',
            defaultUser: 'User',
        }
        : {
            header: 'DIARIO DE ALIMENTACIÓN',
            name: 'Nombre',
            period: 'Período',
            generated: 'Generado',
            noEntries: 'Sin registro.',
            total: 'TOTAL',
            notes: 'NOTAS',
            timezone: 'Horarios en zona horaria de Argentina (America/Argentina/Buenos_Aires)',
            dailyTotals: 'Los totales son específicos para cada día',
            macroLegend: 'P = Proteína | C = Carbos | G = Grasas | F = Fibra',
            defaultUser: 'Usuario',
        };

    let journal = '';

    // ===== HEADER =====
    journal += '═══════════════════════════════════════════════════════════════\n';
    journal += `                    ${l.header}\n`;
    journal += '═══════════════════════════════════════════════════════════════\n\n';
    journal += `${l.name}: ${profile?.name || l.defaultUser}\n`;
    journal += `${l.period}: ${capitalizeFirst(formatFullDate(startDate, lang))} → ${capitalizeFirst(formatFullDate(today, lang))}\n`;
    journal += `${l.generated}: ${formatTimestamp(new Date(), lang)}\n\n`;

    // ===== DAILY ENTRIES =====
    dates.forEach((date) => {
        const foods = foodLog
            .filter((f) => f.date === date)
            .sort((a, b) => {
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

        const trainingContext = getTrainingContext(workoutLog, date, lang);
        const dateHeader = capitalizeFirst(formatFullDate(date, lang));

        journal +=
            '═══════════════════════════════════════════════════════════════\n';
        journal += `${dateHeader}\n`;
        journal += `${trainingContext}\n`;
        journal +=
            '───────────────────────────────────────────────────────────────\n';

        if (foods.length === 0) {
            journal += `${l.noEntries}\n\n`;
        } else {
            foods.forEach((f) => {
                const timeStr = f.time ? `[${f.time}]` : `[${f.meal}]`;
                const nameStr = f.name;
                const descStr = f.description ? ` - ${f.description}` : '';
                const macrosStr = `${f.calories || 0} kcal | P: ${f.protein || 0}g | C: ${f.carbs || 0}g | F: ${f.fat || 0}g | Fib: ${f.fiber || 0}g`;

                journal += `${timeStr} ${nameStr}${descStr}\n`;
                journal += `       ${macrosStr}\n`;
            });

            journal += '\n';

            const totalCalories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
            const totalProtein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
            const totalCarbs = foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
            const totalFat = foods.reduce((sum, f) => sum + (f.fat || 0), 0);
            const totalFiber = foods.reduce((sum, f) => sum + (f.fiber || 0), 0);

            journal += `${l.total}: ${totalCalories.toLocaleString()} kcal | P: ${totalProtein}g | C: ${totalCarbs}g | F: ${totalFat}g | Fib: ${totalFiber}g\n`;
        }

        journal += '\n';
    });

    // ===== FOOTER =====
    journal += '═══════════════════════════════════════════════════════════════\n';
    journal += `${l.notes}:\n`;
    journal += `- ${l.timezone}\n`;
    journal += lang === 'en'
        ? '- 🏋️ Gym | 🎾 Tennis | 🏃 Cardio | 🏠 Rest\n'
        : '- 🏋️ Gimnasio | 🎾 Tenis | 🏃 Cardio | 🏠 Descanso\n';
    journal += `- ${l.dailyTotals}\n`;
    journal += `- ${l.macroLegend}\n`;
    journal += '═══════════════════════════════════════════════════════════════\n';

    return journal;
};
