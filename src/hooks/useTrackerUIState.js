import { useState } from 'react';
import { getArgentinaDateString } from '../utils/dateUtils';

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
  const [dashboardDate, setDashboardDate] = useState(getArgentinaDateString());
  const [selectedFoodDate, setSelectedFoodDate] = useState(getArgentinaDateString());
  const [selectedWorkoutDate, setSelectedWorkoutDate] = useState(getArgentinaDateString());
  const [stepsDate, setStepsDate] = useState(getArgentinaDateString());

  const [showImportFoodModal, setShowImportFoodModal] = useState(false);
  const [showImportWorkoutModal, setShowImportWorkoutModal] = useState(false);
  const [showFoodScanModal, setShowFoodScanModal] = useState(false); // New state for AI Scanner Modal

  const [showFab, setShowFab] = useState(true);

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
    setShowFoodScanModal, // Return new state
    showFab,
    setShowFab
  };
};
