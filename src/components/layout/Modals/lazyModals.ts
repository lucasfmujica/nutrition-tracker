import { lazyWithRetry } from '../../../utils/lazyUtils';

const FoodHistoryPanel = lazyWithRetry(() =>
    import('../../Food/FoodHistoryPanel').then((module) => ({
        default: module.FoodHistoryPanel,
    })),
);
const AIMealSuggestionModal = lazyWithRetry(() =>
    import('../../Modals/AIMealSuggestionModal').then((module) => ({
        default: module.AIMealSuggestionModal,
    })),
);
const BarcodeScannerModal = lazyWithRetry(() =>
    import('../../Modals/BarcodeScannerModal').then((module) => ({
        default: module.BarcodeScannerModal,
    })),
);
const FoodCameraModal = lazyWithRetry(() =>
    import('../../Modals/FoodCameraModal').then((module) => ({
        default: module.FoodCameraModal,
    })),
);
const FoodSearchModal = lazyWithRetry(() =>
    import('../../Modals/FoodSearchModal').then((module) => ({
        default: module.FoodSearchModal,
    })),
);
const MondayBriefingModal = lazyWithRetry(() =>
    import('../../Modals/MondayBriefingModal').then((module) => ({
        default: module.MondayBriefingModal,
    })),
);
const WorkoutScanner = lazyWithRetry(() =>
    import('../../Workouts/WorkoutScanner').then((module) => ({
        default: module.WorkoutScanner,
    })),
);
const WeeklyReport = lazyWithRetry(() =>
    import('./WeeklyReport').then((module) => ({
        default: module.WeeklyReport,
    })),
);

export {
    AIMealSuggestionModal,
    BarcodeScannerModal,
    FoodCameraModal,
    FoodHistoryPanel,
    FoodSearchModal,
    MondayBriefingModal,
    WeeklyReport,
    WorkoutScanner,
};
