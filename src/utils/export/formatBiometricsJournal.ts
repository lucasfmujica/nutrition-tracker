import { OuraEntry, Profile, StepsEntry, WeightEntry } from '../../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../dateUtils';
import { capitalizeFirst, formatFullDate, formatTimestamp } from './exportHelpers';

interface BiometricsData {
    weightHistory: WeightEntry[];
    stepsLog: StepsEntry[];
    ouraLog: OuraEntry[];
    profile: Profile;
    language: string;
}

const pad = (str: string, len: number): string => str.padEnd(len);
const NO_DATA = '---';

/**
 * Generate human-readable Biometrics Report
 * Shows weight, steps, and Oura Ring data in columnar format
 * 30-day range for better trend visibility
 *
 * @param {BiometricsData} data - Export data
 * @returns {string} Text formatted biometrics report
 */
export const generateBiometricsJournal = ({
    weightHistory,
    stepsLog,
    ouraLog,
    profile,
    language,
}: BiometricsData): string => {
    const lang = language || 'es';
    const today = getArgentinaDateString();
    const daysBack = 30;
    const startDate = addDaysToDate(today, -(daysBack - 1));

    const dates: string[] = [];
    for (let i = 0; i < daysBack; i++) {
        dates.push(addDaysToDate(startDate, i));
    }

    const l = lang === 'en'
        ? {
            header: 'BIOMETRICS REPORT',
            name: 'Name',
            period: 'Period',
            generated: 'Generated',
            date: 'DATE',
            weight: 'WEIGHT',
            steps: 'STEPS',
            sleep: 'SLEEP',
            readiness: 'READY',
            hrv: 'HRV',
            restHr: 'RHR',
            sleepDetails: 'SLEEP DETAILS',
            hours: 'HOURS',
            deep: 'DEEP',
            rem: 'REM',
            bedtime: 'BED',
            wake: 'WAKE',
            notes: 'NOTES',
            noData: 'No data for the selected period',
            timezone: 'Times in Argentina timezone',
            defaultUser: 'User',
        }
        : {
            header: 'REPORTE DE BIOMÉTRICOS',
            name: 'Nombre',
            period: 'Período',
            generated: 'Generado',
            date: 'FECHA',
            weight: 'PESO',
            steps: 'PASOS',
            sleep: 'SUEÑO',
            readiness: 'READY',
            hrv: 'HRV',
            restHr: 'FCR',
            sleepDetails: 'DETALLE DE SUEÑO',
            hours: 'HORAS',
            deep: 'DEEP',
            rem: 'REM',
            bedtime: 'DORMIR',
            wake: 'DESP',
            notes: 'NOTAS',
            noData: 'Sin datos para el período seleccionado',
            timezone: 'Horarios en zona Argentina',
            defaultUser: 'Usuario',
        };

    // Build lookup maps for O(1) access
    const weightMap = new Map(weightHistory.map((w) => [w.date, w.weight]));
    const stepsMap = new Map(stepsLog.map((s) => [s.date, s.steps]));
    const ouraMap = new Map(ouraLog.map((o) => [o.date, o]));

    let report = '';

    // ===== HEADER =====
    report += '═══════════════════════════════════════════════════════════════════════\n';
    report += `                    ${l.header}\n`;
    report += '═══════════════════════════════════════════════════════════════════════\n\n';
    report += `${l.name}: ${profile?.name || l.defaultUser}\n`;
    report += `${l.period}: ${capitalizeFirst(formatFullDate(startDate, lang))} → ${capitalizeFirst(formatFullDate(today, lang))}\n`;
    report += `${l.generated}: ${formatTimestamp(new Date(), lang)}\n\n`;

    // ===== TABLE 1: Overview =====
    const cols1 = [
        { key: 'date', label: l.date, width: 12 },
        { key: 'weight', label: l.weight, width: 8 },
        { key: 'steps', label: l.steps, width: 8 },
        { key: 'sleep', label: l.sleep, width: 7 },
        { key: 'readiness', label: l.readiness, width: 7 },
        { key: 'hrv', label: l.hrv, width: 6 },
        { key: 'restHr', label: l.restHr, width: 6 },
    ];

    // Header row
    report += cols1.map((c) => pad(c.label, c.width)).join('| ') + '\n';
    report += cols1.map((c) => '-'.repeat(c.width)).join('+-') + '\n';

    dates.forEach((date) => {
        const w = weightMap.get(date);
        const s = stepsMap.get(date);
        const o = ouraMap.get(date);

        const row = [
            pad(date, cols1[0].width),
            pad(w !== undefined ? `${w} kg` : NO_DATA, cols1[1].width),
            pad(s !== undefined ? s.toLocaleString() : NO_DATA, cols1[2].width),
            pad(o?.sleepScore !== null && o?.sleepScore !== undefined ? `${o.sleepScore}` : NO_DATA, cols1[3].width),
            pad(o?.readinessScore !== null && o?.readinessScore !== undefined ? `${o.readinessScore}` : NO_DATA, cols1[4].width),
            pad(o?.hrv !== null && o?.hrv !== undefined ? `${o.hrv}` : NO_DATA, cols1[5].width),
            pad(o?.restingHr !== null && o?.restingHr !== undefined ? `${o.restingHr}` : NO_DATA, cols1[6].width),
        ];
        report += row.join('| ') + '\n';
    });

    report += '\n';

    // ===== TABLE 2: Sleep Details =====
    const hasOuraData = ouraLog.length > 0;
    if (hasOuraData) {
        report += '═══════════════════════════════════════════════════════════════════════\n';
        report += `                    ${l.sleepDetails}\n`;
        report += '═══════════════════════════════════════════════════════════════════════\n\n';

        const cols2 = [
            { key: 'date', label: l.date, width: 12 },
            { key: 'hours', label: l.hours, width: 7 },
            { key: 'deep', label: l.deep, width: 7 },
            { key: 'rem', label: l.rem, width: 7 },
            { key: 'bedtime', label: l.bedtime, width: 8 },
            { key: 'wake', label: l.wake, width: 8 },
        ];

        report += cols2.map((c) => pad(c.label, c.width)).join('| ') + '\n';
        report += cols2.map((c) => '-'.repeat(c.width)).join('+-') + '\n';

        dates.forEach((date) => {
            const o = ouraMap.get(date);
            if (!o) {
                report += pad(date, cols2[0].width) + '| ' + cols2.slice(1).map((c) => pad(NO_DATA, c.width)).join('| ') + '\n';
                return;
            }

            const deepStr = o.deepSleepMins !== null && o.deepSleepMins !== undefined
                ? `${Math.floor(o.deepSleepMins / 60)}h${(o.deepSleepMins % 60).toString().padStart(2, '0')}m`
                : NO_DATA;
            const remStr = o.remSleepMins !== null && o.remSleepMins !== undefined
                ? `${Math.floor(o.remSleepMins / 60)}h${(o.remSleepMins % 60).toString().padStart(2, '0')}m`
                : NO_DATA;
            const hoursStr = o.sleepHours !== null && o.sleepHours !== undefined
                ? `${o.sleepHours.toFixed(1)}h`
                : NO_DATA;

            const row = [
                pad(date, cols2[0].width),
                pad(hoursStr, cols2[1].width),
                pad(deepStr, cols2[2].width),
                pad(remStr, cols2[3].width),
                pad(o.bedtime || NO_DATA, cols2[4].width),
                pad(o.wakeTime || NO_DATA, cols2[5].width),
            ];
            report += row.join('| ') + '\n';
        });

        report += '\n';
    }

    // ===== FOOTER =====
    report += '═══════════════════════════════════════════════════════════════════════\n';
    report += `${l.notes}:\n`;
    report += `- ${l.timezone}\n`;
    report += `- "${NO_DATA}" = ${l.noData}\n`;
    report += '═══════════════════════════════════════════════════════════════════════\n';

    return report;
};
