import { useEffect, useState } from 'react';
import { getArgentinaDateString } from '../utils/dateUtils';

// Declare gtag for TypeScript
declare global {
    interface Window {
        gtag?: (
            command: string,
            eventName: string,
            params?: Record<string, any>
        ) => void;
    }
}

/**
 * useTrackerUIState - Manages all UI-related state for the tracker
 *
 * Extracts UI state management from TrackerContext to improve modularity
 * and reduce the main context file size.
 *
 * @returns {Object} UI state and setters
 */
export const useTrackerUIState = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Google Analytics: Track tab changes
    useEffect(() => {
        if (typeof window.gtag !== 'undefined') {
            window.gtag('event', 'page_view', {
                page_title: `${activeTab} - LukenFit`,
                page_path: `/${activeTab}`,
                page_location: window.location.href
            });
        }
    }, [activeTab]);
    const [dashboardDate, setDashboardDate] = useState(getArgentinaDateString());
    const [selectedFoodDate, setSelectedFoodDate] = useState(
        getArgentinaDateString(),
    );
    const [selectedWorkoutDate, setSelectedWorkoutDate] = useState(
        getArgentinaDateString(),
    );
    const [stepsDate, setStepsDate] = useState(getArgentinaDateString());

    const [showImportFoodModal, setShowImportFoodModal] = useState(false);
    const [showImportWorkoutModal, setShowImportWorkoutModal] = useState(false);
    const [showFoodScanModal, setShowFoodScanModal] = useState(false); // AI Scanner Modal
    const [showFoodSearchModal, setShowFoodSearchModal] = useState(false); // Food Search Modal
    const [showBarcodeModal, setShowBarcodeModal] = useState(false); // Barcode Scanner Modal
    const [showFoodHistoryPanel, setShowFoodHistoryPanel] = useState(false); // Food History Panel

    const [showFab, setShowFab] = useState(true);
    const [newSteps, setNewSteps] = useState('');

    return {
        activeTab,
        setActiveTab,
        dashboardDate,
        setDashboardDate,
        selectedFoodDate,
        setSelectedFoodDate,
        selectedWorkoutDate,
        setSelectedWorkoutDate,
        stepsDate,
        setStepsDate,
        showImportFoodModal,
        setShowImportFoodModal,
        showImportWorkoutModal,
        setShowImportWorkoutModal,
        showFoodScanModal,
        setShowFoodScanModal,
        showFoodSearchModal,
        setShowFoodSearchModal,
        showBarcodeModal,
        setShowBarcodeModal,
        showFoodHistoryPanel,
        setShowFoodHistoryPanel,
        showFab,
        setShowFab,
        newSteps,
        setNewSteps,
    };
};
