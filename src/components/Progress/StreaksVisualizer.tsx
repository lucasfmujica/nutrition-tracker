/**
 * StreaksVisualizer Component
 * Shows protein streak badge and mini calendar
 * Confetti animation for streaks > 30 days
 */

import { Calendar, Flame, Trophy } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addDaysToDate, getArgentinaDateString } from '../../utils/dateUtils';

interface StreaksVisualizerProps {
    streakData: {
        currentStreak: number;
        longestStreak: number;
        streakDates: string[];
    };
}

/**
 * Confetti component (simple CSS animation)
 */
const Confetti: React.FC = () => {
    const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiPieces.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-confetti"
                    style={{
                        left: `${piece.left}%`,
                        animationDelay: `${piece.delay}s`,
                        animationDuration: `${piece.duration}s`,
                    }}
                />
            ))}
            <style>{`
                @keyframes confetti {
                    0% {
                        transform: translateY(-100%) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                .animate-confetti {
                    animation: confetti 3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

/**
 * Mini calendar showing last 30 days with streak highlights
 */
const MiniCalendar: React.FC<{ streakDates: string[] }> = ({ streakDates }) => {
    const today = getArgentinaDateString();
    const days: { date: string; isStreak: boolean; isToday: boolean }[] = [];

    // Show last 30 days in 5 rows x 6 cols
    for (let i = 29; i >= 0; i--) {
        const date = addDaysToDate(today, -i);
        const isStreak = streakDates.includes(date);
        const isToday = date === today;
        days.push({ date, isStreak, isToday });
    }

    return (
        <div className="grid grid-cols-6 gap-1.5">
            {days.map((day) => (
                <div
                    key={day.date}
                    className={`aspect-square rounded-md transition-all ${
                        day.isStreak
                            ? day.isToday
                                ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg scale-110'
                                : 'bg-gradient-to-br from-orange-400 to-orange-600'
                            : 'bg-surface opacity-30'
                    }`}
                    title={day.date}
                />
            ))}
        </div>
    );
};

export const StreaksVisualizer: React.FC<StreaksVisualizerProps> = ({ streakData }) => {
    const { t } = useTranslation();
    const [showConfetti, setShowConfetti] = useState(false);

    const { currentStreak, longestStreak, streakDates } = streakData;

    // Show confetti for streaks > 30 days (only once)
    useEffect(() => {
        if (currentStreak > 30) {
            setShowConfetti(true);
            const timeout = setTimeout(() => setShowConfetti(false), 4000);
            return () => clearTimeout(timeout);
        }
    }, [currentStreak]);

    // Milestone achievements
    const getMilestone = (streak: number) => {
        if (streak >= 90) return { emoji: '🏆', label: t('progress.analytics.streaks.milestone90') };
        if (streak >= 60) return { emoji: '💪', label: t('progress.analytics.streaks.milestone60') };
        if (streak >= 30) return { emoji: '🔥', label: t('progress.analytics.streaks.milestone30') };
        if (streak >= 14) return { emoji: '⭐', label: t('progress.analytics.streaks.milestone14') };
        if (streak >= 7) return { emoji: '🎯', label: t('progress.analytics.streaks.milestone7') };
        return { emoji: '🌱', label: t('progress.analytics.streaks.milestoneStart') };
    };

    const milestone = getMilestone(currentStreak);

    return (
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border relative overflow-hidden">
            {showConfetti && <Confetti />}

            {/* Header */}
            <div className="mb-4">
                <h3 className="text-lg font-black text-text-primary mb-1 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-fat" />
                    {t('progress.analytics.streaks.title')}
                </h3>
                <p className="text-sm text-text-tertiary">
                    {t('progress.analytics.streaks.subtitle')}
                </p>
            </div>

            {/* Current Streak Badge */}
            <div className="mb-6">
                <div className="relative">
                    {/* Circular badge */}
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-2xl flex flex-col items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-red-500 animate-pulse opacity-30" />
                        <Flame className="w-8 h-8 text-white mb-1" />
                        <p className="text-4xl font-black text-white">{currentStreak}</p>
                        <p className="text-xs font-bold text-white/90 uppercase tracking-wider">
                            {t('progress.analytics.streaks.days')}
                        </p>
                    </div>

                    {/* Milestone label */}
                    <div className="mt-3 text-center">
                        <p className="text-2xl">{milestone.emoji}</p>
                        <p className="text-sm font-bold text-text-primary mt-1">
                            {milestone.label}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Longest Streak */}
                <div className="bg-background rounded-xl p-4 text-center">
                    <Trophy className="w-5 h-5 text-warning mx-auto mb-2" />
                    <p className="text-2xl font-black text-text-primary">{longestStreak}</p>
                    <p className="text-xs text-text-tertiary font-semibold mt-1">
                        {t('progress.analytics.streaks.longestStreak')}
                    </p>
                </div>

                {/* Days Tracked */}
                <div className="bg-background rounded-xl p-4 text-center">
                    <Calendar className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-black text-text-primary">{streakDates.length}</p>
                    <p className="text-xs text-text-tertiary font-semibold mt-1">
                        {t('progress.analytics.streaks.daysInStreak')}
                    </p>
                </div>
            </div>

            {/* Mini Calendar */}
            <div>
                <p className="text-xs font-black text-text-tertiary uppercase tracking-wider mb-3">
                    {t('progress.analytics.streaks.last30Days')}
                </p>
                <MiniCalendar streakDates={streakDates} />
                <p className="text-xs text-text-tertiary text-center mt-3">
                    {t('progress.analytics.streaks.calendarLegend')}
                </p>
            </div>

            {/* Motivation Message */}
            {currentStreak > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-text-secondary text-center italic">
                        {currentStreak === 1
                            ? t('progress.analytics.streaks.motivation1')
                            : currentStreak < 7
                            ? t('progress.analytics.streaks.motivationEarly')
                            : currentStreak < 30
                            ? t('progress.analytics.streaks.motivationMid')
                            : t('progress.analytics.streaks.motivationHigh')}
                    </p>
                </div>
            )}

            {/* No streak message */}
            {currentStreak === 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-text-secondary text-center">
                        {t('progress.analytics.streaks.noStreak')}
                    </p>
                </div>
            )}
        </div>
    );
};
