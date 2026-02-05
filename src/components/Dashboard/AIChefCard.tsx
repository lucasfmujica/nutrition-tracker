import { ChefHat, Clock, Dumbbell, Sparkles } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { AIChefMealTime } from '../../types/domain';

interface AIChefCardProps {
    onOpen: () => void;
}

export const AIChefCard: React.FC<AIChefCardProps> = ({ onOpen }) => {
    const { t } = useTranslation();
    const {
        currentMealTime,
        dashboardDate,
        getTotalsForDate,
        getTargetsForDate,
        workoutLog,
    } = useTracker() as any;

    // Calculate remaining calories
    const remainingCalories = useMemo(() => {
        const totals = getTotalsForDate?.(dashboardDate) || { calories: 0 };
        const targets = getTargetsForDate?.(dashboardDate) || { calories: 2000 };
        return Math.max(0, targets.calories - totals.calories);
    }, [getTotalsForDate, getTargetsForDate, dashboardDate]);

    // Check if training day
    const isTrainingDay = useMemo(() => {
        return workoutLog?.some((w: any) => w.date === dashboardDate) || false;
    }, [workoutLog, dashboardDate]);

    // Get meal time label
    const mealTimeLabels: Record<AIChefMealTime, string> = {
        breakfast: t('mealTypes.breakfast'),
        lunch: t('mealTypes.lunch'),
        snack: t('mealTypes.snack'),
        dinner: t('mealTypes.dinner'),
    };

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 dark:from-purple-900 dark:via-purple-800 dark:to-indigo-900 rounded-2xl p-4 shadow-lg shadow-purple-500/20 dark:shadow-purple-900/30">
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-indigo-500/20 rounded-full blur-lg" />

            {/* Content */}
            <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <ChefHat size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white tracking-tight">
                                {t('aiChef.title')}
                            </h3>
                            <p className="text-[10px] text-white/60 uppercase tracking-wider font-bold">
                                {t('aiChef.cardSubtitle')}
                            </p>
                        </div>
                    </div>
                    <Sparkles size={16} className="text-white/40" />
                </div>

                {/* Context chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/15 rounded-lg text-[10px] font-bold text-white/90">
                        <Clock size={10} />
                        {mealTimeLabels[currentMealTime as AIChefMealTime] || t('mealTypes.lunch')}
                    </span>
                    {isTrainingDay && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/30 rounded-lg text-[10px] font-bold text-amber-100">
                            <Dumbbell size={10} />
                            {t('aiChef.trainingDay')}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/15 rounded-lg text-[10px] font-bold text-white/90">
                        {Math.round(remainingCalories)} kcal
                    </span>
                </div>

                {/* CTA Button */}
                <button
                    onClick={onOpen}
                    className="w-full py-3 bg-white text-purple-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
                    <Sparkles size={16} />
                    {t('aiChef.openButton')}
                </button>
            </div>
        </div>
    );
};
