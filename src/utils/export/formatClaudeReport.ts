import {
    CustomTargets,
    FoodEntry,
    OuraEntry,
    Profile,
    StepsEntry,
    WeightAnalytics,
    Workout,
} from '../../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../dateUtils';
import { formatArgentinaTimestamp } from './exportHelpers';

interface Totals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

interface ReportData {
    profile: Profile;
    weightAnalytics: WeightAnalytics | null; // Allow null as per code
    foodLog: FoodEntry[];
    workoutLog: Workout[];
    ouraLog: OuraEntry[];
    customTargets: CustomTargets;
    getTotalsForDate: (date: string) => Totals;
    getTargetsForDate: (date: string) => CustomTargets;
    getMostRecentWeight: () => { weight: number; date: string } | null | undefined;
    getStepsForDate: (date: string) => number;
}

/**
 * Generate structured Markdown report for Claude AI
 * Optimized for LLM consumption with intelligence metrics
 *
 * @param {Object} data - Export data containing profile, analytics, logs, etc.
 * @returns {string} Markdown formatted report
 */
export const generateClaudeReport = ({
    profile,
    weightAnalytics,
    foodLog,
    workoutLog,
    ouraLog,
    customTargets,
    getTotalsForDate,
    getTargetsForDate,
    getMostRecentWeight,
    getStepsForDate,
}: ReportData): string => {
    const today = getArgentinaDateString();
    const daysBack = 7;
    const startDate = addDaysToDate(today, -(daysBack - 1));

    // Generate dates array
    const dates: string[] = [];
    for (let i = 0; i < daysBack; i++) {
        dates.push(addDaysToDate(startDate, i));
    }

    // Current status
    const currentWeightEntry = getMostRecentWeight();
    const currentWeight = currentWeightEntry?.weight || profile.currentWeight;

    let report = '';

    // ===== HEADER SECTION =====
    report += '# LukenFit Health & Fitness Report\n\n';
    report += `**Generated**: ${formatArgentinaTimestamp(new Date())}\n`;
    report += `**User**: ${profile?.name || 'Lucas Mujica'}\n`;
    report += `**Current Status**: ${currentWeight} kg → Goal: ${profile.targetWeight} kg (${profile.height} cm tall, ${profile.age} years)\n\n`;
    report += '---\n\n';

    // ===== INTELLIGENCE ENGINE METRICS =====
    report += '## 🤖 Intelligence Engine Metrics\n\n';

    if (weightAnalytics) {
        const { currentTrend, weeklyAdherence, estimatedGoalDate, remainingWeight } =
            weightAnalytics;

        if (currentTrend !== null && currentTrend !== undefined) {
            const trendText =
                currentTrend < 0
                    ? 'weight loss'
                    : currentTrend > 0
                      ? 'weight gain'
                      : 'stable';
            report += `- **Current Trend**: ${currentTrend.toFixed(2)} kg/week (${trendText})\n`;
        } else {
            report += `- **Current Trend**: Insufficient data (need 2+ weight entries in last 14 days)\n`;
        }

        report += `- **Weekly Adherence**: ${weeklyAdherence}% (calorie & protein targets)\n`;

        // Check strictness for string comparison
        if (estimatedGoalDate && estimatedGoalDate !== 'Meta alcanzada! 🎉') {
            const goalDate = new Date(estimatedGoalDate + 'T12:00:00');
            const daysToGoal = Math.round(
                (goalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
            );
            report += `- **Estimated Goal Date**: ${goalDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })} (${daysToGoal} days remaining)\n`;
        } else if (estimatedGoalDate === 'Meta alcanzada! 🎉') {
            report += `- **Goal Status**: ✅ Goal achieved!\n`;
        } else {
            report += `- **Estimated Goal Date**: Cannot project (not in weight loss trend)\n`;
        }

        report += `- **Remaining Weight**: ${remainingWeight.toFixed(1)} kg\n`;
    } else {
        report += `- **Intelligence Metrics**: Not available (weightAnalytics not provided)\n`;
    }

    report += '\n---\n\n';

    // ===== NUTRITION TARGETS =====
    report += '## 🎯 Daily Nutrition Targets\n\n';
    report += `**Rest Day**: ${customTargets.calories} kcal | ${customTargets.protein}g protein | ${customTargets.carbs}g carbs | ${customTargets.fat}g fat | ${customTargets.fiber}g fiber\n`;
    report += `**Training Day**: ${customTargets.calories + customTargets.trainingDayCaloriesBonus} kcal | ${customTargets.protein}g protein | ${customTargets.trainingDayCarbs}g carbs | ${customTargets.fat}g fat\n\n`;
    report += '---\n\n';

    // ===== LAST 7 DAYS DETAILED BREAKDOWN =====
    report += '## 📊 Last 7 Days - Detailed Breakdown\n\n';
    report +=
        '| Date | Calories (C/T) | Protein | Carbs | Fat | Oura Sleep | Workouts |\n';
    report +=
        '|------|----------------|---------|-------|-----|------------|----------|\n';

    dates.forEach((date) => {
        const totals = getTotalsForDate(date);
        const targets = getTargetsForDate(date);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const steps = getStepsForDate(date);
        const workouts = workoutLog.filter((w) => w.date === date);
        const oura = ouraLog.find((o) => o.date === date);

        const calStatus =
            Math.abs(totals.calories - targets.calories) <= 150
                ? '✓'
                : totals.calories > targets.calories
                  ? '↑'
                  : '↓';
        const protStatus = totals.protein >= targets.protein * 0.9 ? '✓' : '↓';

        const caloriesStr = `${totals.calories}/${targets.calories} ${calStatus}`;
        const proteinStr = `${totals.protein}g ${protStatus}`;
        const ouraStr = oura ? `${oura.sleepScore || 'N/D'}/100` : 'N/D';
        const workoutStr =
            workouts.length > 0
                ? workouts.map((w) => `${w.type} (${w.duration}min)`).join(', ')
                : 'Rest';

        report += `| ${date} | ${caloriesStr} | ${proteinStr} | ${totals.carbs}g | ${totals.fat}g | ${ouraStr} | ${workoutStr} |\n`;
    });

    report += '\n---\n\n';

    // ===== WORKOUTS THIS WEEK =====
    const recentWorkouts = workoutLog
        .filter((w) => w.date >= startDate && w.date <= today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (recentWorkouts.length > 0) {
        report += '## 💪 Workouts This Week\n\n';
        recentWorkouts.forEach((w) => {
            const dayName = new Date(w.date + 'T12:00:00').toLocaleDateString(
                'es-AR',
                { weekday: 'long' },
            );
            const typeMap: Record<string, string> = {
                gym: 'Gym',
                tennis: 'Tennis',
                cardio: 'Cardio',
                other: 'Other',
            };
            report += `**${dayName}**: ${typeMap[w.type] || w.type} - ${w.name} (${w.duration}min`;
            if (w.volume) report += `, ${w.volume.toLocaleString()}kg total volume`;
            if (w.calories) report += `, ${w.calories} kcal burned`;
            report += ')\n';

            if (w.exercises && w.exercises.length > 0) {
                w.exercises.slice(0, 5).forEach((ex) => {
                    report += `  - ${ex.name}: ${ex.sets}x${ex.reps}@${ex.weight}kg\n`;
                });
                if (w.exercises.length > 5) {
                    report += `  - ... and ${w.exercises.length - 5} more exercises\n`;
                }
            }
            report += '\n';
        });
        report += '---\n\n';
    }

    // ===== FOOTER =====
    report += '## 📝 Notes for Analysis\n\n';
    report += '- All timestamps use **America/Argentina/Buenos_Aires** timezone\n';
    report += '- Calorie targets adjust automatically on training days\n';
    report += '- ✓ = on target, ↑ = over target, ↓ = under target\n';
    report += '- Sleep scores from Oura Ring (0-100 scale)\n\n';
    report += '---\n\n';
    report +=
        '*This report is optimized for AI consumption. Paste into Claude for personalized coaching insights.*\n';

    return report;
};
