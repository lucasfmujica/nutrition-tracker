import {
    BarChart2,
    BookOpen,
    CalendarDays,
    Drumstick,
    Dumbbell,
    Footprints,
    Home,
    Image,
    Import,
    Moon,
    MoreHorizontal,
    Plus,
    Settings,
    Star,
    Users,
    Utensils,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIMeals } from '../../../context/AIMealSuggestionsContext';
import { useTracker } from '../../../context/TrackerContext';
import { cn } from '../../../utils/cn';
import { NavActionMenu, NavMenuItem } from './NavActionMenu';
import { NavTabButton } from './NavTabButton';

// =====================================================
// BOTTOM NAVIGATION - PERFORMANCE LAB EDITION
// =====================================================

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    pendingRequestCount?: number;
}

const MORE_TABS = ['meal-prep', 'pasos', 'oura', 'progreso', 'config'];

export const BottomNav: React.FC<BottomNavProps> = ({
    activeTab,
    setActiveTab,
    pendingRequestCount = 0,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const {
        setShowFoodForm,
        setShowWorkoutForm,
        setShowImportWorkoutModal,
        setShowTemplatesModal,
        newFood,
        setNewFood,
        newWorkout,
        setNewWorkout,
        dashboardDate,
        selectedFoodDate,
        selectedWorkoutDate,
        setShowFoodScanModal,
    } = useTracker() as any;
    const { setShowSuggestionModal } = useAIMeals();
    const { t } = useTranslation();

    // Determine which date to use based on active tab
    const getContextualDate = () => {
        if (activeTab === 'comidas') return selectedFoodDate;
        if (activeTab === 'entrenos') return selectedWorkoutDate;
        return dashboardDate; // Default for dashboard, peso, progreso, social, etc.
    };

    const actions: NavMenuItem[] = [
        {
            icon: <Utensils size={22} />,
            label: t('navigation.meals').toUpperCase(),
            sublabel: t('modals.foods.manualEntry').toUpperCase(),
            onClick: () => {
                setNewFood({ ...newFood, date: getContextualDate() });
                setShowFoodForm(true);
            },
            color: 'text-accent-blue',
            bg: 'bg-info-soft',
        },
        {
            icon: <Dumbbell size={22} />,
            label: t('navigation.workouts').toUpperCase(),
            sublabel: t('modals.foods.manualEntry').toUpperCase(),
            onClick: () => {
                setNewWorkout({ ...newWorkout, date: getContextualDate() });
                setShowWorkoutForm(true);
            },
            color: 'text-fat',
            bg: 'bg-fat-soft',
        },
        {
            icon: <Star size={22} />,
            label: t('common.favorites')?.toUpperCase() || 'FAVORITOS',
            sublabel: 'TEMPLATES',
            onClick: () => setShowTemplatesModal(true),
            color: 'text-warning',
            bg: 'bg-warning-soft',
        },
        {
            icon: <Drumstick size={20} />,
            label: t('common.scan')?.toUpperCase() || 'ESCANEAR',
            sublabel: 'VISION IA',
            onClick: () => setShowFoodScanModal(true),
            color: 'text-primary',
            bg: 'bg-primary-soft',
        },
        {
            icon: <Import size={20} />,
            label: t('workouts.importGravl').toUpperCase(),
            sublabel: 'GEMINI AI',
            onClick: () => setShowImportWorkoutModal(true),
            color: 'text-carbs',
            bg: 'bg-carbs-soft',
        },
        {
            icon: <BookOpen size={20} />,
            label: 'AI CHEF',
            sublabel: 'SUGERENCIAS',
            onClick: () => setShowSuggestionModal(true),
            color: 'text-fat',
            bg: 'bg-fat-soft',
        },
    ];

    const moreOptions: NavMenuItem[] = [
        {
            icon: <CalendarDays size={22} />,
            label: t('mealPrep.title').toUpperCase(),
            sublabel: t('mealPrep.subtitle').toUpperCase(),
            onClick: () => setActiveTab('meal-prep'),
            color: 'text-success',
            bg: 'bg-success-soft',
        },
        {
            icon: <Footprints size={22} />,
            label: t('navigation.steps').toUpperCase(),
            sublabel: t('dashboard.activity.steps').toUpperCase(),
            onClick: () => setActiveTab('pasos'),
            color: 'text-info',
            bg: 'bg-info-soft',
        },
        {
            icon: <Moon size={22} />,
            label: 'OURA',
            sublabel: 'SUEÑO & HRV',
            onClick: () => setActiveTab('oura'),
            color: 'text-oura',
            bg: 'bg-oura-soft',
        },
        {
            icon: <Image size={22} />,
            label: t('navigation.progress').toUpperCase(),
            sublabel: 'FOTOS',
            onClick: () => setActiveTab('progreso'),
            color: 'text-accent',
            bg: 'bg-success-soft',
        },
        {
            icon: <Settings size={22} />,
            label: t('navigation.config').toUpperCase(),
            sublabel: t('config.title').toUpperCase(),
            onClick: () => setActiveTab('config'),
            color: 'text-text-tertiary',
            bg: 'bg-surface-lighter',
        },
    ];

    const selectTab = (tab: string) => {
        setActiveTab(tab);
        setIsMoreMenuOpen(false);
        setIsMenuOpen(false);
    };

    return (
        <>
            {isMenuOpen && (
                <NavActionMenu
                    items={actions}
                    onClose={() => setIsMenuOpen(false)}
                />
            )}
            {isMoreMenuOpen && (
                <NavActionMenu
                    items={moreOptions}
                    onClose={() => setIsMoreMenuOpen(false)}
                />
            )}

            {/* Main Navigation Island */}
            <div className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.5rem))] left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-50">
                <nav
                    className="glass rounded-full px-5 h-14 flex items-center justify-between shadow-float relative overflow-visible"
                    style={{ touchAction: 'manipulation' }}>
                    <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none rounded-full" />

                    <NavTabButton
                        icon={Home}
                        label={t('navigation.dashboard').toUpperCase()}
                        isActive={activeTab === 'dashboard'}
                        onClick={() => selectTab('dashboard')}
                        tutorialId="dashboard-tab"
                        ariaCurrent={activeTab === 'dashboard'}
                    />
                    <NavTabButton
                        icon={Utensils}
                        label={t('navigation.meals').toUpperCase()}
                        isActive={activeTab === 'comidas'}
                        onClick={() => selectTab('comidas')}
                        tutorialId="diary-tab"
                        ariaCurrent={activeTab === 'comidas'}
                    />
                    <NavTabButton
                        icon={Dumbbell}
                        label={t('navigation.workouts').toUpperCase()}
                        isActive={activeTab === 'entrenos'}
                        onClick={() => selectTab('entrenos')}
                        tutorialId="workouts-tab"
                        ariaCurrent={activeTab === 'entrenos'}
                    />

                    {/* Center action FAB */}
                    <button
                        onClick={() => {
                            setIsMenuOpen(!isMenuOpen);
                            setIsMoreMenuOpen(false);
                        }}
                        data-tutorial="fab-button"
                        aria-label={
                            isMenuOpen
                                ? t('a11y.closeQuickActions')
                                : t('a11y.openQuickActions')
                        }
                        aria-expanded={isMenuOpen}
                        aria-haspopup="menu"
                        className={cn(
                            'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 relative -top-7 z-20',
                            isMenuOpen
                                ? 'bg-text-primary text-background rotate-45 scale-110 shadow-float'
                                : 'bg-primary text-white shadow-glow hover:scale-110 hover:-translate-y-1',
                        )}>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                        <Plus size={28} strokeWidth={3} className="relative z-10" />
                        <div className="absolute top-1 left-2 right-2 h-1/2 bg-surface/10 rounded-t-full filter blur-[1px] pointer-events-none" />
                    </button>

                    <NavTabButton
                        icon={BarChart2}
                        label={t('navigation.weight').toUpperCase()}
                        isActive={activeTab === 'peso'}
                        onClick={() => selectTab('peso')}
                        tutorialId="weight-tab"
                        ariaCurrent={activeTab === 'peso'}
                    />
                    <NavTabButton
                        icon={MoreHorizontal}
                        label={t('navigation.more')?.toUpperCase() || 'MORE'}
                        isActive={MORE_TABS.includes(activeTab)}
                        onClick={() => {
                            setIsMoreMenuOpen(!isMoreMenuOpen);
                            setIsMenuOpen(false);
                        }}
                        ariaLabel={t('a11y.moreMenu')}
                        ariaExpanded={isMoreMenuOpen}
                        ariaHasPopup
                    />
                    <NavTabButton
                        icon={Users}
                        label={t('navigation.social').toUpperCase()}
                        isActive={activeTab === 'social'}
                        onClick={() => selectTab('social')}
                        tutorialId="social-tab"
                        badgeCount={pendingRequestCount}
                        ariaCurrent={activeTab === 'social'}
                    />
                </nav>
            </div>
        </>
    );
};
