import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_WEEKLY_PLAN } from '../../constants/weeklyPlan';
import type { PlannedWorkout } from '../../constants/weeklyPlan';
import { useTracker } from '../../context/TrackerContext';
import {
    addDaysToDate,
    getArgentinaDateString,
    getMondayOfWeek,
} from '../../utils/dateUtils';

interface EditableWeeklyPlanProps {
    selectedWorkoutDate: string;
    setSelectedWorkoutDate: (date: string) => void;
}

export const EditableWeeklyPlan: React.FC<EditableWeeklyPlanProps> = ({
    setSelectedWorkoutDate,
}) => {
    const { t } = useTranslation();
    const {
        weeklyPlan,
        updateDayPlan,
        weeklyPlanLoading: isLoading,
    } = useTracker();
    const plan = weeklyPlan as Record<number, PlannedWorkout | null>;

    const [isEditing, setIsEditing] = useState(false);
    const [editingDay, setEditingDay] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const todayStr = getArgentinaDateString();

    const handleDayClick = (dayDate: string, dayIndex: number) => {
        if (isEditing) {
            setEditingDay(dayIndex);
        } else {
            setSelectedWorkoutDate(dayDate);
        }
    };

    const handleTypeChange = async (dayIndex: number, newType: string) => {
        setIsSaving(true);

        const intensityMap: Record<string, string> = {
            gym: 'moderate',
            sport: 'high',
            cardio: 'moderate',
            rest: 'recovery',
        };

        const nameMap: Record<string, string | null> = {
            gym: 'Gym',
            sport: t('workouts.tennis'),
            cardio: 'Cardio',
            rest: null,
        };

        if (newType === 'rest') {
            await updateDayPlan(dayIndex, null);
        } else {
            const validTypes = ['gym', 'sport', 'cardio', 'other'] as const;
            if (!validTypes.includes(newType as any)) return;

            await updateDayPlan(dayIndex, {
                type: newType as 'gym' | 'sport' | 'cardio' | 'other',
                name: nameMap[newType] || '',
                intensity: intensityMap[newType] as any,
            });
        }

        setEditingDay(null);
        setIsSaving(false);
    };

    const dayLabels: string[] = t('workouts.weeklyPlanSection.dayLabels', { returnObjects: true }) as string[];

    return (
        <div className="bg-surface rounded-card p-6 border border-border shadow-card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                    {t('workouts.weeklyPlan')}
                </h3>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isSaving}
                    className={`group relative flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-control transition-all duration-200 ${
                        isEditing
                            ? 'bg-success text-white shadow-card active:scale-95'
                            : 'bg-surface-lighter text-text-secondary hover:bg-surface-lighter active:scale-95'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <span className="text-base">{isEditing ? '✓' : '✏️'}</span>
                    <span>
                        {isEditing ? t('workouts.done') : t('workouts.edit')}
                    </span>
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
                {dayLabels.map((day: string, i: number) => {
                    const mondayOfWeek = getMondayOfWeek(getArgentinaDateString());
                    const dayDate = addDaysToDate(mondayOfWeek, i);
                    const isToday = dayDate === todayStr;

                    const plannedWorkout =
                        plan && Object.prototype.hasOwnProperty.call(plan, i)
                            ? plan[i]
                            : DEFAULT_WEEKLY_PLAN[i as keyof typeof DEFAULT_WEEKLY_PLAN];

                    const isGym = plannedWorkout?.type === 'gym';
                    const isTennis = plannedWorkout?.type === 'sport';
                    const isCardio = plannedWorkout?.type === 'cardio';

                    if (isEditing && editingDay === i) {
                        return (
                            <div key={i} className="relative">
                                <select
                                    value={
                                        !plannedWorkout ||
                                        (plannedWorkout.type as string) === 'rest' ||
                                        plannedWorkout.type === 'other'
                                            ? 'rest'
                                            : plannedWorkout.type
                                    }
                                    onChange={(e) => {
                                        handleTypeChange(i, e.target.value);
                                    }}
                                    className="w-full p-2 rounded-control border-2 border-primary bg-surface text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-float transition-all cursor-pointer appearance-none text-center"
                                    autoFocus
                                    style={{
                                        backgroundImage:
                                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234B5563' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundSize: '12px',
                                    }}>
                                    <option value="rest">{t('workouts.types.rest')}</option>
                                    <option value="gym">{t('workouts.types.gym')}</option>
                                    <option value="sport">{t('workouts.types.sport')}</option>
                                    <option value="cardio">{t('workouts.types.cardio')}</option>
                                </select>
                            </div>
                        );
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleDayClick(dayDate, i)}
                            disabled={isSaving}
                            className={`p-2 rounded-control border transition-all duration-200 ${
                                isEditing
                                    ? 'hover:scale-105 hover:ring-2 hover:ring-primary hover:shadow-float active:scale-100'
                                    : 'hover:scale-105 active:scale-95'
                            } cursor-pointer ${
                                isSaving ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                                isToday ? 'ring-2 ring-primary ring-offset-1' : ''
                            } ${
                                isGym
                                    ? 'bg-warning-soft border-warning/30 text-warning hover:bg-warning/20'
                                    : isTennis
                                      ? 'bg-success-soft border-success/30 text-success hover:bg-success/20'
                                      : isCardio
                                        ? 'bg-info-soft border-info/30 text-info hover:bg-info/20'
                                        : 'bg-background border-border text-text-tertiary hover:bg-surface-lighter'
                            }`}>
                            <div className="font-bold text-xs">{day}</div>
                            <div className="text-[10px] font-bold mt-1 tracking-tighter">
                                {isGym
                                    ? t('workouts.types.gym')
                                    : isTennis
                                      ? t('workouts.types.sport')
                                      : isCardio
                                        ? t('workouts.types.cardio')
                                        : t('workouts.types.rest')}
                            </div>
                            {isEditing && (
                                <div className="mt-1 text-[8px] text-text-tertiary font-normal">
                                    tap
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {isEditing && (
                <div className="mt-4 p-3 bg-primary-soft border border-primary/20 rounded-control">
                    <p className="text-xs text-primary text-center font-medium">
                        👆 {t('workouts.weeklyPlanSection.editHint')}
                    </p>
                </div>
            )}

            {isSaving && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-text-tertiary">
                    <div className="w-3 h-3 border-2 border-border border-t-primary rounded-full animate-spin"></div>
                    {t('common.saving')}
                </div>
            )}
        </div>
    );
};
