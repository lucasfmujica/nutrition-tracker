import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ShoppingCart } from 'lucide-react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { GroceryListGenerator } from './GroceryListGenerator';
import { useMealPrepPlan } from '../../hooks/useMealPrepPlan';

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
    const { weekPlan } = useMealPrepPlan(userId);

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-black text-text-primary mb-1">
                        {t('mealPrep.title')}
                    </h1>
                    <p className="text-sm text-text-tertiary font-medium">
                        {t('mealPrep.subtitle')}
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="max-w-4xl mx-auto px-4">
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
            <div className="max-w-4xl mx-auto px-4 py-6">
                {activeTab === 'calendar' ? (
                    <WeeklyCalendar userId={userId} />
                ) : (
                    <GroceryListGenerator weekPlan={weekPlan} />
                )}
            </div>
        </div>
    );
};
