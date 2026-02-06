import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MealTimeStats } from '../../hooks/useMealTimeStats';

interface MealTimeStatsCardProps {
    stats: MealTimeStats;
}

const MEAL_ICONS: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    snack: '🍵',
    dinner: '🌙',
};

const MEAL_KEYS: Array<'breakfast' | 'lunch' | 'snack' | 'dinner'> = [
    'breakfast',
    'lunch',
    'dinner',
    'snack',
];

/**
 * MealTimeStatsCard - Shows average meal times (collapsible)
 * Collapsed by default, shows one-line summary
 * Expanded shows grid with icons, names, avg times, and sample sizes
 */
export const MealTimeStatsCard: React.FC<MealTimeStatsCardProps> = ({ stats }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    if (!stats.hasData) {
        return (
            <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 text-text-tertiary">
                    <Clock size={14} />
                    <span className="text-xs">{t('diary.mealTimeStats.noData')}</span>
                </div>
            </div>
        );
    }

    // Build summary string for collapsed view
    const summaryParts = MEAL_KEYS
        .map((key) => stats[key]?.avgTime)
        .filter(Boolean);
    const summaryStr = summaryParts.join(' | ');

    return (
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
            {/* Header (always visible, clickable) */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between min-h-[44px]"
            >
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-text-secondary" />
                    <span className="text-xs font-bold text-text-primary">
                        {t('diary.mealTimeStats.title')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!expanded && (
                        <span className="text-xs text-text-tertiary font-mono">
                            {summaryStr}
                        </span>
                    )}
                    {expanded ? (
                        <ChevronUp size={16} className="text-text-tertiary" />
                    ) : (
                        <ChevronDown size={16} className="text-text-tertiary" />
                    )}
                </div>
            </button>

            {/* Expanded content */}
            {expanded && (
                <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-text-tertiary mb-3">
                        {t('diary.mealTimeStats.subtitle')}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {MEAL_KEYS.map((key) => {
                            const stat = stats[key];
                            if (!stat) return null;

                            return (
                                <div
                                    key={key}
                                    className="flex items-center gap-2 bg-background rounded-xl p-3"
                                >
                                    <span className="text-lg">{MEAL_ICONS[key]}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-text-primary">
                                            {t(`mealTypes.${key}`)}
                                        </p>
                                        <p className="text-sm font-mono text-text-secondary">
                                            {stat.avgTime}
                                        </p>
                                        <p className="text-[10px] text-text-tertiary">
                                            {t('diary.mealTimeStats.basedOn', {
                                                count: stat.count,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
