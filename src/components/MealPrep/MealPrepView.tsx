import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ShoppingCart, Sparkles } from 'lucide-react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { GroceryListGenerator } from './GroceryListGenerator';
import { GenerateWeeklyPlanModal } from './GenerateWeeklyPlanModal';
import { useMealPrepPlan } from '../../hooks/useMealPrepPlan';
import { useGenerateWeeklyMealPlan } from '../../hooks/useGenerateWeeklyMealPlan';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface MealPrepViewProps {
    userId: string;
}

type TabType = 'calendar' | 'grocery';

/**
 * MealPrepView - Main container for Meal Prep Planning feature
 *
 * Features:
 * - Tab navigation between Calendar and Grocery List
 * - Mobile-optimized layout
 * - Integrates WeeklyCalendar and GroceryListGenerator
 *
 * Usage:
 * ```tsx
 * // In your TabNavigation or Dashboard:
 * <MealPrepView userId={userId} />
 * ```
 */
export const MealPrepView: React.FC<MealPrepViewProps> = ({ userId }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>('calendar');
    const { weekPlan, currentWeekStart, fetchWeekPlan } = useMealPrepPlan(userId);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [weeklyWorkouts, setWeeklyWorkouts] = useState<any[]>([]);

    const weekStartDate = format(currentWeekStart, 'yyyy-MM-dd');
    const {
        isGenerating,
        error,
        progress,
        generateWeeklyPlan,
    } = useGenerateWeeklyMealPlan(userId, weekStartDate);

    // Fetch user profile for modal preview
    useEffect(() => {
        const fetchProfile = async () => {
            if (!supabase) return;
            const { data } = await supabase
                .from('profiles')
                .select('target_calories, target_protein, goal')
                .eq('user_id', userId)
                .single();

            if (data) {
                setUserProfile({
                    targetCalories: data.target_calories,
                    targetProtein: data.target_protein,
                    goal: data.goal,
                });
            }
        };

        fetchProfile();
    }, [userId]);

    // Fetch workouts for modal preview
    useEffect(() => {
        const fetchWorkouts = async () => {
            if (!supabase) return;
            const weekEndDate = format(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

            const { data } = await supabase
                .from('workouts')
                .select('date, type, name')
                .eq('user_id', userId)
                .gte('date', weekStartDate)
                .lte('date', weekEndDate);

            if (data) {
                const mapped = data.map((w: any) => {
                    const workoutDate = new Date(w.date);
                    const startDate = new Date(weekStartDate);
                    const dayOfWeek = Math.floor(
                        (workoutDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    let intensity = 'moderate';
                    const name = (w.name || '').toLowerCase();
                    const type = (w.type || '').toLowerCase();

                    if (name.includes('intenso') || type === 'gym') {
                        intensity = 'high';
                    } else if (name.includes('recuperación') || type === 'recovery') {
                        intensity = 'recovery';
                    }

                    return {
                        day: dayOfWeek,
                        type: w.type || 'workout',
                        intensity,
                    };
                });

                setWeeklyWorkouts(mapped);
            }
        };

        fetchWorkouts();
    }, [userId, weekStartDate, currentWeekStart]);

    const handleGenerate = async () => {
        const result = await generateWeeklyPlan();
        if (result) {
            // Success - refresh the week plan
            await fetchWeekPlan();
            setShowGenerateModal(false);
        }
    };

    return (
        <div className="w-full bg-background pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b border-border">
                <div className="px-4 py-4">
                    <h1 className="text-2xl font-black text-text-primary mb-1">
                        {t('mealPrep.title')}
                    </h1>
                    <p className="text-sm text-text-tertiary font-medium">
                        {t('mealPrep.subtitle')}
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="px-4">
                    <div className="flex gap-2 border-b border-border">
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 ${
                                activeTab === 'calendar'
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                            }`}
                        >
                            <Calendar className="w-4 h-4" />
                            {t('mealPrep.weeklyCalendar')}
                        </button>

                        <button
                            onClick={() => setActiveTab('grocery')}
                            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 ${
                                activeTab === 'grocery'
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                            }`}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {t('mealPrep.groceryList')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6">
                {/* Generate Button CTA */}
                <button
                    onClick={() => setShowGenerateModal(true)}
                    disabled={isGenerating}
                    className="w-full mb-6 py-4 bg-oura hover:opacity-90 text-white rounded-card font-bold shadow-float transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                    <Sparkles className="w-5 h-5" />
                    {t('mealPrep.generateWeeklyPlan')}
                </button>

                {activeTab === 'calendar' ? (
                    <WeeklyCalendar userId={userId} />
                ) : (
                    <GroceryListGenerator weekPlan={weekPlan} />
                )}
            </div>

            {/* Generate Modal */}
            <GenerateWeeklyPlanModal
                isOpen={showGenerateModal}
                onClose={() => setShowGenerateModal(false)}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                progress={progress}
                error={error}
                weekStartDate={currentWeekStart}
                userProfile={userProfile}
                weeklyWorkouts={weeklyWorkouts}
            />
        </div>
    );
};
