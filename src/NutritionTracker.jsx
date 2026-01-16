import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useSupabase } from './hooks/useSupabase';
import { AuthUI } from './components/AuthUI';

// =====================================================
// SWIPEABLE ITEM COMPONENT - Swipe left to delete
// =====================================================
const SwipeableItem = ({ children, onDelete, deleteLabel = 'Eliminar' }) => {
  const itemRef = useRef(null);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const DELETE_THRESHOLD = -80;

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = translateX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startXRef.current;
    const newX = Math.min(0, Math.max(-120, currentXRef.current + diff));
    setTranslateX(newX);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (translateX < DELETE_THRESHOLD) {
      setTranslateX(-120);
    } else {
      setTranslateX(0);
    }
  };

  const handleDelete = () => {
    setTranslateX(-300);
    setTimeout(() => onDelete(), 200);
  };

  const resetSwipe = () => setTranslateX(0);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete background */}
      <div
        className="absolute inset-y-0 right-0 flex items-center bg-red-500 transition-all"
        style={{ width: Math.abs(translateX) + 'px' }}
      >
        <button
          onClick={handleDelete}
          className="w-full h-full flex items-center justify-center text-white font-medium px-4"
        >
          {Math.abs(translateX) > 50 && <span>🗑️ {deleteLabel}</span>}
        </button>
      </div>

      {/* Main content */}
      <div
        ref={itemRef}
        className={`swipe-item relative bg-gray-800 ${isSwiping ? 'swiping' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={translateX < 0 ? resetSwipe : undefined}
      >
        {children}
      </div>
    </div>
  );
};

// =====================================================
// BOTTOM NAVIGATION COMPONENT
// =====================================================
const BottomNav = ({ activeTab, setActiveTab, onFabClick }) => {
  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Home' },
    { id: 'comidas', icon: '🍽️', label: 'Comidas' },
    { id: 'entrenos', icon: '🏋️', label: 'Entrenos' },
    { id: 'peso', icon: '⚖️', label: 'Peso' },
    { id: 'config', icon: '⚙️', label: 'Config' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 bottom-nav z-40">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === tab.id
                ? 'text-emerald-400'
                : 'text-gray-400 active:text-gray-200'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// =====================================================
// FLOATING ACTION BUTTON COMPONENT
// =====================================================
const FloatingActionButton = ({ onAddFood, onAddWorkout, onImportFood, onImportWorkout, onQuickAdd }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: '⭐', label: 'Favoritos', onClick: onQuickAdd, color: 'bg-purple-500' },
    { icon: '📸', label: 'Importar Comida', onClick: onImportFood, color: 'bg-emerald-500' },
    { icon: '🏋️', label: 'Importar Entreno', onClick: onImportWorkout, color: 'bg-amber-500' },
    { icon: '🍽️', label: 'Agregar Comida', onClick: onAddFood, color: 'bg-blue-500' },
    { icon: '💪', label: 'Agregar Entreno', onClick: onAddWorkout, color: 'bg-orange-500' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed right-4 bottom-20 z-50 flex flex-col items-end gap-3">
        {/* FAB Menu */}
        <div className={`fab-menu flex flex-col gap-2 ${isOpen ? 'open' : ''}`}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); setIsOpen(false); }}
              className={`fab-item flex items-center gap-2 ${action.color} text-white px-4 py-2.5 rounded-full whitespace-nowrap`}
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <span>{action.icon}</span>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`fab w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl transition-transform ${isOpen ? 'rotate-45' : ''}`}
        >
          +
        </button>
      </div>
    </>
  );
};

// =====================================================
// PULL TO REFRESH COMPONENT
// =====================================================
const PullToRefresh = ({ children, onRefresh, isRefreshing }) => {
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef(0);
  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || containerRef.current?.scrollTop > 0) return;
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      await onRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="pull-indicator absolute top-0 left-0 right-0 flex items-center justify-center bg-gray-800/80 z-10"
          style={{ height: isRefreshing ? 50 : pullDistance }}
        >
          {isRefreshing ? (
            <svg className="animate-spin h-5 w-5 text-emerald-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <span className={`text-sm ${pullDistance >= PULL_THRESHOLD ? 'text-emerald-400' : 'text-gray-400'}`}>
              {pullDistance >= PULL_THRESHOLD ? '↑ Soltar para actualizar' : '↓ Arrastra para actualizar'}
            </span>
          )}
        </div>
      )}

      <div style={{ transform: `translateY(${isRefreshing ? 50 : pullDistance}px)`, transition: isPulling ? 'none' : 'transform 0.2s ease' }}>
        {children}
      </div>
    </div>
  );
};

const NutritionTracker = () => {
  // Supabase auth and data hook
  const supabase = useSupabase();
  const [showAuth, setShowAuth] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  // Prompt 3: Migration modal state
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationData, setMigrationData] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Argentina timezone constant
  const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

  // Helper to format any date to YYYY-MM-DD in Argentina timezone
  const toArgentinaDateString = (date = new Date()) => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: ARGENTINA_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date); // Returns YYYY-MM-DD
  };

  // Helper to get current date in Argentina
  const getArgentinaDateString = () => toArgentinaDateString(new Date());

  // Helper to get day of week in Argentina (0=Sun, 6=Sat)
  const getArgentinaDay = (date = new Date()) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ARGENTINA_TZ,
      weekday: 'short'
    });
    const dayName = formatter.format(date);
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return days[dayName];
  };

  // Helper to add/subtract days from a date string (returns YYYY-MM-DD in Argentina TZ)
  const addDaysToDate = (dateStr, days) => {
    const date = new Date(dateStr + 'T12:00:00');
    date.setDate(date.getDate() + days);
    return toArgentinaDateString(date);
  };

  // Helper to get Monday of the week for a given date
  const getMondayOfWeek = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = getArgentinaDay(date);
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return addDaysToDate(dateStr, -daysToMonday);
  };

  // User profile state
  const [profile, setProfile] = useState({
    height: 173,
    currentWeight: 84.9,
    targetWeight: 75,
    age: 27,
    activityLevel: 'moderate',
    goal: 'cut'
  });

  // Editable targets state
  const [customTargets, setCustomTargets] = useState({
    calories: 2100,
    protein: 170,
    carbs: 180,
    fat: 70,
    fiber: 30,
    // Training day adjustments
    trainingDayCaloriesBonus: 200,
    trainingDayCarbs: 220
  });

  // Local config state for debounced saving
  const [localConfig, setLocalConfig] = useState(null);
  const [configDirty, setConfigDirty] = useState(false);

  // Weight history - initialized with Lucas's data
  const [weightHistory, setWeightHistory] = useState([
    { id: 'wh-1', date: '2026-01-16', weight: 84.9, timestamp: 1737025200000 }
  ]);
  const [editingWeightId, setEditingWeightId] = useState(null);
  const [editingWeightValue, setEditingWeightValue] = useState('');

  // Food log - with IA schema: source, reviewed, confidence, sourceId
  const [foodLog, setFoodLog] = useState([
    {
      id: 'f-20260116-breakfast',
      date: '2026-01-16',
      time: '09:30',
      meal: 'Desayuno',
      name: 'Café con leche + Oat pancake + Queso',
      description: 'Café Nescafé con leche descremada 200ml, oat banana pancake 69g, port salut light 54g',
      calories: 345,
      protein: 26,
      carbs: 33,
      fat: 12,
      fiber: 2,
      source: 'ai-photo',
      reviewed: true,
      confidence: 0.9,
      sourceId: 'photo-20260116-breakfast-001'
    },
    {
      id: 'f-20260116-lunch',
      date: '2026-01-16',
      time: '13:45',
      meal: 'Almuerzo',
      name: 'Bife de chorizo + Batata + Ensalada',
      description: 'Bife de chorizo 170g, batata ~160g, ensalada (lechuga, zanahoria, tomates cherry) con 1 cda aceite oliva',
      calories: 645,
      protein: 55,
      carbs: 42,
      fat: 28,
      fiber: 7,
      source: 'ai-photo',
      reviewed: true,
      confidence: 0.9,
      sourceId: 'photo-20260116-lunch-001'
    },
    {
      id: 'f-20260116-merienda',
      date: '2026-01-16',
      time: '15:20',
      meal: 'Merienda',
      name: 'Latte con leche entera',
      description: '',
      calories: 135,
      protein: 7,
      carbs: 11,
      fat: 7,
      fiber: 0,
      source: 'manual',
      reviewed: true,
      confidence: 1,
      sourceId: 'manual-20260116-merienda-001'
    }
  ]);

  // Workout log - with IA schema
  const [workoutLog, setWorkoutLog] = useState([
    {
      id: 'w1',
      date: '2026-01-11',
      type: 'gym',
      name: 'Push Day (Pecho/Hombros/Triceps)',
      duration: 60,
      calories: 258,
      volume: 2438,
      exercises: [
        { name: 'Press banca inclinado mancuernas', sets: 4, reps: 10, weight: 5 },
        { name: 'Press banca', sets: 4, reps: 11, weight: 20 },
        { name: 'Press Arnold', sets: 3, reps: '7-12', weight: '4-5' },
        { name: 'Vuelo lateral mancuerna', sets: 3, reps: 12, weight: 4 },
        { name: 'Extensión tríceps agarre supino', sets: 4, reps: 11, weight: 10 },
        { name: 'Extensión tríceps mancuerna', sets: 3, reps: 7, weight: 4 }
      ],
      notes: 'Primera sesión. Press banca 20kg x11 sólido.',
      source: 'ai-text', reviewed: true, confidence: 0.95, sourceId: 'gravl-20260111-push'
    },
    {
      id: 'w2',
      date: '2026-01-12',
      type: 'gym',
      name: 'Pull Day (Espalda/Biceps/Traps)',
      duration: 63,
      calories: 270,
      volume: 3814,
      exercises: [
        { name: 'Jalón al pecho agarre supino', sets: 4, reps: '9-12', weight: '25-30' },
        { name: 'Remo con mancuerna', sets: 3, reps: 10, weight: '12-14' },
        { name: 'Encogimiento hombros mancuerna', sets: 4, reps: '10-12', weight: '10-12' },
        { name: 'Vuelo posterior parado', sets: 3, reps: 10, weight: 4 },
        { name: 'Curl bíceps concentrado', sets: 4, reps: '6-10', weight: '6-8' },
        { name: 'Curl martillo', sets: 4, reps: 8, weight: '5-6' }
      ],
      notes: 'Buen volumen. Jalón subió a 30kg en las últimas series.',
      source: 'ai-text', reviewed: true, confidence: 0.95, sourceId: 'gravl-20260112-pull'
    },
    {
      id: 'w3',
      date: '2026-01-14',
      type: 'tennis',
      name: 'Clase de Tenis',
      duration: 120,
      calories: 600,
      exercises: [],
      notes: '2 horas: canastos + 30min partido.',
      source: 'manual', reviewed: true, confidence: 1, sourceId: 'manual-20260114-tennis'
    },
    {
      id: 'w4',
      date: '2026-01-15',
      type: 'gym',
      name: 'Leg Day (Piernas/Glúteos/Core)',
      duration: 57,
      calories: 233,
      volume: 2692,
      exercises: [
        { name: 'Estocada con mancuernas', sets: 4, reps: 10, weight: 8 },
        { name: 'Sentadilla split mancuerna', sets: 3, reps: 12, weight: 8 },
        { name: 'Peso muerto rumano mancuerna', sets: 3, reps: 10, weight: 10 },
        { name: 'Elevación talón mancuernas', sets: 3, reps: 12, weight: 8 },
        { name: 'Puente de glúteo mancuerna', sets: 3, reps: 10, weight: 10 },
        { name: 'Crunch oblicuo', sets: 3, reps: 8, weight: 0 }
      ],
      notes: 'Día de piernas sólido.',
      source: 'ai-text', reviewed: true, confidence: 0.95, sourceId: 'gravl-20260115-legs'
    }
  ]);

  // Steps log - initialized with Lucas's data
  const [stepsLog, setStepsLog] = useState([
    { date: '2026-01-15', steps: 4154 },
    { date: '2026-01-14', steps: 9868 },
    { date: '2026-01-13', steps: 5422 },
    { date: '2026-01-12', steps: 5973 },
    { date: '2026-01-11', steps: 5573 },
    { date: '2026-01-10', steps: 3111 },
    { date: '2026-01-09', steps: 8820 }
  ]);

  // Oura Ring data log - daily wellness metrics
  const [ouraLog, setOuraLog] = useState([
    {
      date: '2026-01-16',
      sleepScore: 77,
      readinessScore: 87,
      activityScore: 76,
      hrv: 40,
      restingHr: 52,
      sleepHours: 7.25,
      deepSleepMins: null,
      remSleepMins: null,
      bedtime: '00:45',
      wakeTime: '08:57'
    }
  ]);
  const [newOuraEntry, setNewOuraEntry] = useState({
    date: getArgentinaDateString(),
    sleepScore: '',
    readinessScore: '',
    activityScore: '',
    hrv: '',
    restingHr: '',
    sleepHours: '',
    deepSleepMins: '',
    remSleepMins: '',
    bedtime: '',
    wakeTime: ''
  });

  // Water tracking state
  const [waterLog, setWaterLog] = useState([]);
  const WATER_GOAL_GLASSES = 8; // 8 glasses = 2L daily goal

  // UI state - SEPARATE dates for food and workout tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newWeight, setNewWeight] = useState('');
  const [newWeightTime, setNewWeightTime] = useState('09:00');
  const [newSteps, setNewSteps] = useState('');
  const [stepsDate, setStepsDate] = useState(getArgentinaDateString());
  const [selectedFoodDate, setSelectedFoodDate] = useState(getArgentinaDateString());
  const [selectedWorkoutDate, setSelectedWorkoutDate] = useState(getArgentinaDateString());
  const [dashboardDate, setDashboardDate] = useState(getArgentinaDateString());
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', id: null, name: '' });

  // Undo state
  const [undoAction, setUndoAction] = useState(null);

  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // FAB menu state
  const [showFab, setShowFab] = useState(true);

  // Meal Templates/Favorites state
  const [mealTemplates, setMealTemplates] = useState([
    // Default templates - can be customized
    { id: 'tpl-1', name: 'Desayuno típico', meal: 'Desayuno', description: 'Yogur + fruta + granola', calories: 350, protein: 15, carbs: 45, fat: 12, fiber: 5 },
    { id: 'tpl-2', name: 'Almuerzo proteico', meal: 'Almuerzo', description: 'Pollo + arroz + verduras', calories: 550, protein: 45, carbs: 50, fat: 12, fiber: 6 },
    { id: 'tpl-3', name: 'Merienda', meal: 'Merienda', description: 'Café + tostadas', calories: 200, protein: 8, carbs: 25, fat: 8, fiber: 2 },
  ]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateToSave, setTemplateToSave] = useState(null);

  // Manual food entry form
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [newFood, setNewFood] = useState({
    date: getArgentinaDateString(),
    time: '12:00',
    meal: 'Almuerzo',
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: ''
  });

  // Manual workout entry form
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    date: getArgentinaDateString(),
    type: 'gym',
    name: '',
    duration: '',
    calories: '',
    volume: '',
    notes: ''
  });

  // Import modals
  const [showImportFoodModal, setShowImportFoodModal] = useState(false);
  const [showImportWorkoutModal, setShowImportWorkoutModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Check if date is a training day (gym or tennis)
  const isTrainingDay = useCallback((date) => {
    return workoutLog.some(w => w.date === date);
  }, [workoutLog]);

  // Get targets for specific date (adjusts for training days)
  const getTargetsForDate = useCallback((date) => {
    const training = isTrainingDay(date);
    if (training) {
      return {
        ...customTargets,
        calories: customTargets.calories + customTargets.trainingDayCaloriesBonus,
        carbs: customTargets.trainingDayCarbs
      };
    }
    return customTargets;
  }, [customTargets, isTrainingDay]);

  // Memoized totals by date - prevents recalculating on every render
  const totalsByDate = useMemo(() => {
    const totals = {};
    foodLog.forEach(entry => {
      if (!totals[entry.date]) {
        totals[entry.date] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      }
      totals[entry.date].calories += entry.calories || 0;
      totals[entry.date].protein += entry.protein || 0;
      totals[entry.date].carbs += entry.carbs || 0;
      totals[entry.date].fat += entry.fat || 0;
      totals[entry.date].fiber += entry.fiber || 0;
    });
    return totals;
  }, [foodLog]);

  const getTotalsForDate = useCallback((date) => {
    return totalsByDate[date] || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }, [totalsByDate]);

  // Check if day is "completed" (within targets)
  const isDayCompleted = useCallback((date) => {
    const totals = getTotalsForDate(date);
    const targets = getTargetsForDate(date);
    const calRange = 150; // ±150 kcal tolerance
    const calOk = totals.calories >= targets.calories - calRange && totals.calories <= targets.calories + calRange;
    const protOk = totals.protein >= targets.protein * 0.9; // 90% of protein target
    return calOk && protOk;
  }, [getTotalsForDate, getTargetsForDate]);

  const dashboardTotals = getTotalsForDate(dashboardDate);
  const dashboardTargets = getTargetsForDate(dashboardDate);

  // Sort weight history by timestamp (most recent first)
  const sortWeightHistory = (history) => {
    return [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  };

  // Get the most recent weight entry
  const getMostRecentWeight = (history) => {
    if (history.length === 0) return null;
    return sortWeightHistory(history)[0];
  };

  // Storage helper with localStorage fallback (used in offline/unauthenticated mode)
  const storage = {
    async get(key) {
      try {
        if (window.storage) {
          return await window.storage.get(key);
        }
        const val = localStorage.getItem(key);
        return val ? { value: val } : null;
      } catch {
        const val = localStorage.getItem(key);
        return val ? { value: val } : null;
      }
    },
    async set(key, value) {
      try {
        if (window.storage) {
          return await window.storage.set(key, value);
        }
        localStorage.setItem(key, value);
        return { key, value };
      } catch {
        localStorage.setItem(key, value);
        return { key, value };
      }
    }
  };

  // Check if using Supabase (authenticated) or localStorage (offline)
  const useCloud = supabase.isAuthenticated && !offlineMode && supabase.isOnline;

  // Load data from Supabase or localStorage
  useEffect(() => {
    // Wait for auth to initialize
    if (supabase.loading) return;

    // If authenticated, hide auth screen
    if (supabase.isAuthenticated) {
      setShowAuth(false);

      // Prompt 3: Check for localStorage data to migrate
      const { hasData, localData } = supabase.checkLocalStorageForMigration();
      if (hasData && supabase.isOnline) {
        setMigrationData(localData);
        setShowMigrationModal(true);
      }
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        if (useCloud) {
          // Load from Supabase
          const data = await supabase.fetchAllData();
          if (data) {
            if (data.profile) setProfile(data.profile);
            if (data.targets) setCustomTargets(data.targets);
            if (data.weightHistory?.length) setWeightHistory(data.weightHistory);
            if (data.foodLog?.length) setFoodLog(data.foodLog);
            if (data.workouts?.length) setWorkoutLog(data.workouts);
            if (data.stepsLog?.length) setStepsLog(data.stepsLog);
            if (data.ouraLog?.length) setOuraLog(data.ouraLog);
            if (data.waterLog?.length) setWaterLog(data.waterLog);
          }
        } else {
          // Load from localStorage
        const [profileData, weightData, foodData, workoutData, stepsData, targetsData, ouraData, waterData] = await Promise.all([
          storage.get('lucas-profile-v5').catch(() => null),
          storage.get('lucas-weight-history-v5').catch(() => null),
          storage.get('lucas-food-log-v5').catch(() => null),
          storage.get('lucas-workout-log-v5').catch(() => null),
          storage.get('lucas-steps-log-v5').catch(() => null),
          storage.get('lucas-targets-v5').catch(() => null),
          storage.get('lucas-oura-log-v5').catch(() => null),
          storage.get('lucas-water-log-v5').catch(() => null)
        ]);

        if (profileData?.value) setProfile(JSON.parse(profileData.value));
        if (weightData?.value) setWeightHistory(JSON.parse(weightData.value));
        if (foodData?.value) setFoodLog(JSON.parse(foodData.value));
        if (workoutData?.value) setWorkoutLog(JSON.parse(workoutData.value));
        if (stepsData?.value) setStepsLog(JSON.parse(stepsData.value));
        if (targetsData?.value) setCustomTargets(JSON.parse(targetsData.value));
        if (ouraData?.value) setOuraLog(JSON.parse(ouraData.value));
        if (waterData?.value) setWaterLog(JSON.parse(waterData.value));
        }
      } catch (err) {
        console.log('Loading fresh state:', err);
      }
      setIsLoading(false);
    };

    // Only load data if not showing auth screen or in offline mode
    if (!showAuth || offlineMode) {
    loadData();
    }
  }, [supabase.loading, supabase.isAuthenticated, useCloud, showAuth, offlineMode, supabase.isOnline]);

  // Debounced config save
  useEffect(() => {
    if (!configDirty || !localConfig) return;
    const timer = setTimeout(() => {
      saveProfile(localConfig.profile);
      saveTargets(localConfig.targets);
      setConfigDirty(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [localConfig, configDirty]);

  // Auto-hide undo after 5 seconds
  useEffect(() => {
    if (!undoAction) return;
    const timer = setTimeout(() => setUndoAction(null), 5000);
    return () => clearTimeout(timer);
  }, [undoAction]);

  // Save functions - save to both localStorage (backup) and Supabase (if authenticated)
  const saveProfile = async (newProfile) => {
    setProfile(newProfile);
    try {
      // Always save to localStorage as backup
      await storage.set('lucas-profile-v5', JSON.stringify(newProfile));

      // Save to Supabase if authenticated
      if (useCloud) {
        await supabase.saveProfile(newProfile, customTargets);
      }

      setSaveStatus('✓');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveStatus('Error');
    }
  };

  const saveTargets = async (newTargets) => {
    setCustomTargets(newTargets);
    try {
      await storage.set('lucas-targets-v5', JSON.stringify(newTargets));

      if (useCloud) {
        await supabase.saveProfile(profile, newTargets);
      }
    } catch (err) {
      console.error('Error saving targets:', err);
    }
  };

  const saveWeightHistory = async (newHistory) => {
    const sorted = sortWeightHistory(newHistory);
    setWeightHistory(sorted);
    try {
      await storage.set('lucas-weight-history-v5', JSON.stringify(sorted));

      // Update current weight to most recent
      const mostRecent = getMostRecentWeight(sorted);
      if (mostRecent) {
        saveProfile({ ...profile, currentWeight: mostRecent.weight });
      }
    } catch (err) {
      console.error('Error saving weight history:', err);
    }
  };

  // Save single weight entry to Supabase (called when adding/updating weight)
  const saveWeightEntry = async (entry) => {
    if (useCloud) {
      await supabase.saveWeight(entry);
    }
  };

  const saveFoodLog = async (newLog) => {
    setFoodLog(newLog);
    try {
      await storage.set('lucas-food-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving food log:', err);
    }
  };

  // Save single food entry to Supabase
  const saveFoodEntry = async (entry) => {
    if (useCloud) {
      const result = await supabase.saveFood(entry);
      return result.data; // Returns entry with Supabase-generated ID
    }
    return entry;
  };

  // Delete food entry from Supabase
  const deleteFoodEntry = async (id) => {
    if (useCloud) {
      await supabase.deleteFood(id);
    }
  };

  const saveWorkoutLog = async (newLog) => {
    setWorkoutLog(newLog);
    try {
      await storage.set('lucas-workout-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving workout log:', err);
    }
  };

  // Save single workout to Supabase
  const saveWorkoutEntry = async (entry) => {
    if (useCloud) {
      const result = await supabase.saveWorkout(entry);
      return result.data;
    }
    return entry;
  };

  // Delete workout from Supabase
  const deleteWorkoutEntry = async (id) => {
    if (useCloud) {
      await supabase.deleteWorkout(id);
    }
  };

  const saveStepsLog = async (newLog) => {
    setStepsLog(newLog);
    try {
      await storage.set('lucas-steps-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving steps log:', err);
    }
  };

  // Save single steps entry to Supabase
  const saveStepsEntry = async (entry) => {
    if (useCloud) {
      await supabase.saveSteps(entry);
    }
  };

  const saveWaterLog = async (newLog) => {
    setWaterLog(newLog);
    try {
      await storage.set('lucas-water-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving water log:', err);
    }
  };

  // Save single water entry to Supabase
  const saveWaterEntry = async (entry) => {
    if (useCloud) {
      await supabase.saveWater(entry);
    }
  };

  // Get today's water intake
  const getTodayWater = () => {
    const today = getArgentinaDateString();
    return waterLog.find(e => e.date === today) || { date: today, glasses: 0, ml: 0 };
  };

  // Add a glass of water
  const addWaterGlass = async () => {
    const today = getArgentinaDateString();
    const existingEntry = waterLog.find(e => e.date === today);

    const newEntry = existingEntry
      ? { ...existingEntry, glasses: existingEntry.glasses + 1, ml: (existingEntry.glasses + 1) * 250 }
      : { date: today, glasses: 1, ml: 250 };

    const newLog = existingEntry
      ? waterLog.map(e => e.date === today ? newEntry : e)
      : [...waterLog, newEntry];

    saveWaterLog(newLog);
    saveWaterEntry(newEntry);
    setSaveStatus('💧 +1 vaso');
    setTimeout(() => setSaveStatus(''), 1500);
  };

  // Remove a glass of water
  const removeWaterGlass = async () => {
    const today = getArgentinaDateString();
    const existingEntry = waterLog.find(e => e.date === today);

    if (!existingEntry || existingEntry.glasses <= 0) return;

    const newEntry = { ...existingEntry, glasses: existingEntry.glasses - 1, ml: (existingEntry.glasses - 1) * 250 };

    const newLog = waterLog.map(e => e.date === today ? newEntry : e);

    saveWaterLog(newLog);
    saveWaterEntry(newEntry);
    setSaveStatus('💧 -1 vaso');
    setTimeout(() => setSaveStatus(''), 1500);
  };

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (useCloud) {
        const data = await supabase.fetchAllData();
        if (data) {
          if (data.profile) setProfile(data.profile);
          if (data.targets) setCustomTargets(data.targets);
          if (data.weightHistory?.length) setWeightHistory(data.weightHistory);
          if (data.foodLog?.length) setFoodLog(data.foodLog);
          if (data.workouts?.length) setWorkoutLog(data.workouts);
          if (data.stepsLog?.length) setStepsLog(data.stepsLog);
          if (data.ouraLog?.length) setOuraLog(data.ouraLog);
          if (data.waterLog?.length) setWaterLog(data.waterLog);
        }
        setSaveStatus('✓ Actualizado');
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setSaveStatus('Error al actualizar');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // Update config with debounce
  const updateConfig = (newProfile, newTargets) => {
    setLocalConfig({ profile: newProfile, targets: newTargets });
    setProfile(newProfile);
    setCustomTargets(newTargets);
    setConfigDirty(true);
  };

  // Add weight entry with time
  const addWeightEntry = async () => {
    if (!newWeight) return;
    // Parse time input to create timestamp
    const [hours, minutes] = newWeightTime.split(':').map(Number);
    const dateObj = new Date();
    // Set to Argentina timezone
    const argDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    argDate.setHours(hours, minutes, 0, 0);

    const entry = {
      id: `wh-${Date.now()}`,
      date: getArgentinaDateString(),
      weight: parseFloat(newWeight),
      timestamp: argDate.getTime()
    };
    saveWeightHistory([...weightHistory, entry]);
    await saveWeightEntry(entry); // Save to Supabase
    setNewWeight('');
    setNewWeightTime('09:00');
  };

  // Show delete confirmation
  const confirmDelete = (type, id, name) => {
    setDeleteModal({ show: true, type, id, name });
  };

  // Execute delete with undo option
  const executeDelete = () => {
    const { type, id } = deleteModal;

    if (type === 'food') {
      const item = foodLog.find(f => f.id === id);
      const newLog = foodLog.filter(f => f.id !== id);
      saveFoodLog(newLog);
      setUndoAction({ type: 'food', item, restore: () => saveFoodLog([...newLog, item]) });
    } else if (type === 'workout') {
      const item = workoutLog.find(w => w.id === id);
      const newLog = workoutLog.filter(w => w.id !== id);
      saveWorkoutLog(newLog);
      setUndoAction({ type: 'workout', item, restore: () => saveWorkoutLog([...newLog, item]) });
    } else if (type === 'weight') {
      const item = weightHistory.find(w => w.id === id || weightHistory.indexOf(w) === id);
      const newHistory = weightHistory.filter(w => w.id !== id && weightHistory.indexOf(w) !== id);
      saveWeightHistory(newHistory);
      setUndoAction({ type: 'weight', item, restore: () => saveWeightHistory([...newHistory, item]) });
    }

    setDeleteModal({ show: false, type: '', id: null, name: '' });
  };

  // Copy meals from yesterday
  const copyMealsFromYesterday = () => {
    const yesterday = changeDate(dashboardDate, -1);
    const yesterdayMeals = foodLog.filter(f => f.date === yesterday);
    if (yesterdayMeals.length === 0) {
      alert('No hay comidas de ayer para copiar');
      return;
    }
    const newMeals = yesterdayMeals.map(meal => ({
      ...meal,
      id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: dashboardDate
    }));
    saveFoodLog([...foodLog, ...newMeals]);
  };

  // Start editing weight by ID
  const startEditWeight = (id) => {
    const entry = weightHistory.find(w => w.id === id);
    if (entry) {
      setEditingWeightId(id);
      setEditingWeightValue(entry.weight.toString());
    }
  };

  // Save edited weight by ID
  const saveEditWeight = () => {
    if (!editingWeightId || !editingWeightValue) return;
    const newHistory = weightHistory.map(entry =>
      entry.id === editingWeightId
        ? { ...entry, weight: parseFloat(editingWeightValue) }
        : entry
    );
    saveWeightHistory(newHistory);
    setEditingWeightId(null);
    setEditingWeightValue('');
  };

  // Cancel weight edit
  const cancelEditWeight = () => {
    setEditingWeightId(null);
    setEditingWeightValue('');
  };

  // Add steps entry
  const addStepsEntry = async () => {
    if (!newSteps) return;
    const entry = { date: stepsDate, steps: parseInt(newSteps) };
    const existingIndex = stepsLog.findIndex(s => s.date === stepsDate);
    let newLog;
    if (existingIndex >= 0) {
      newLog = [...stepsLog];
      newLog[existingIndex] = entry;
    } else {
      newLog = [...stepsLog, entry];
    }
    newLog.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveStepsLog(newLog);
    await saveStepsEntry(entry); // Save to Supabase
    setNewSteps('');
  };

  // Add manual food entry with IA schema
  const addManualFood = async () => {
    if (!newFood.name || !newFood.calories) return;
    const sourceId = `manual-${newFood.date}-${Date.now()}`;
    const entry = {
      id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: newFood.date,
      time: newFood.time || '',
      meal: newFood.meal,
      name: newFood.name,
      description: newFood.description || '',
      calories: parseInt(newFood.calories) || 0,
      protein: parseInt(newFood.protein) || 0,
      carbs: parseInt(newFood.carbs) || 0,
      fat: parseInt(newFood.fat) || 0,
      fiber: parseInt(newFood.fiber) || 0,
      // IA schema - manual entries are always reviewed
      source: 'manual',
      reviewed: true,
      confidence: 1,
      sourceId
    };

    // Save to Supabase first to get the real ID
    const savedEntry = await saveFoodEntry(entry);
    const finalEntry = savedEntry?.id ? savedEntry : entry;

    saveFoodLog([...foodLog, finalEntry]);
    setNewFood({
      date: getArgentinaDateString(),
      time: '12:00',
      meal: 'Almuerzo',
      name: '',
      description: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: ''
    });
    setShowFoodForm(false);
  };

  // =====================================================
  // MEAL TEMPLATES / FAVORITES
  // =====================================================

  // Load templates from localStorage on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const stored = await storage.get('lucas-meal-templates-v1');
        if (stored?.value) {
          setMealTemplates(JSON.parse(stored.value));
        }
      } catch (err) {
        console.log('Using default templates');
      }
    };
    loadTemplates();
  }, []);

  // Save templates to localStorage when they change
  const saveMealTemplates = async (templates) => {
    setMealTemplates(templates);
    try {
      await storage.set('lucas-meal-templates-v1', JSON.stringify(templates));
    } catch (err) {
      console.error('Error saving templates:', err);
    }
  };

  // Add food from template
  const addFromTemplate = async (template) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: ARGENTINA_TZ });

    const entry = {
      id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: selectedFoodDate,
      time,
      meal: template.meal,
      name: template.name,
      description: template.description || '',
      calories: template.calories,
      protein: template.protein,
      carbs: template.carbs,
      fat: template.fat,
      fiber: template.fiber || 0,
      source: 'template',
      reviewed: true,
      confidence: 1,
      sourceId: `tpl-${template.id}-${Date.now()}`
    };

    // Save to Supabase first
    const savedEntry = await saveFoodEntry(entry);
    const finalEntry = savedEntry?.id ? savedEntry : entry;

    saveFoodLog([...foodLog, finalEntry]);
    setShowTemplatesModal(false);
    setSaveStatus(`✓ ${template.name}`);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Save current food as template
  const saveAsTemplate = (food) => {
    setTemplateToSave({
      name: food.name,
      meal: food.meal,
      description: food.description || '',
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber || 0
    });
    setShowSaveTemplateModal(true);
  };

  // Confirm save template
  const confirmSaveTemplate = () => {
    if (!templateToSave?.name) return;
    const newTemplate = {
      id: `tpl-${Date.now()}`,
      ...templateToSave
    };
    saveMealTemplates([...mealTemplates, newTemplate]);
    setShowSaveTemplateModal(false);
    setTemplateToSave(null);
    setSaveStatus('✓ Plantilla guardada');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Delete template
  const deleteTemplate = (id) => {
    saveMealTemplates(mealTemplates.filter(t => t.id !== id));
  };

  // Add manual workout entry with IA schema
  const addManualWorkout = async () => {
    if (!newWorkout.name) return;
    const sourceId = `manual-${newWorkout.date}-${Date.now()}`;
    const entry = {
      id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: newWorkout.date,
      type: newWorkout.type,
      name: newWorkout.name,
      duration: parseInt(newWorkout.duration) || 0,
      calories: parseInt(newWorkout.calories) || 0,
      volume: parseInt(newWorkout.volume) || 0,
      exercises: [],
      notes: newWorkout.notes || '',
      // IA schema
      source: 'manual',
      reviewed: true,
      confidence: 1,
      sourceId
    };

    // Save to Supabase first to get the real ID
    const savedEntry = await saveWorkoutEntry(entry);
    const finalEntry = savedEntry?.id ? savedEntry : entry;

    saveWorkoutLog([...workoutLog, finalEntry]);
    setNewWorkout({
      date: getArgentinaDateString(),
      type: 'gym',
      name: '',
      duration: '',
      calories: '',
      volume: '',
      notes: ''
    });
    setShowWorkoutForm(false);
  };

  // Add or update food entry (for IA imports with deduplication)
  const upsertFood = (entry) => {
    if (!entry.sourceId) {
      // No sourceId, just add
      saveFoodLog([...foodLog, { ...entry, id: entry.id || `f-${Date.now()}` }]);
      return;
    }
    // Check for existing entry with same sourceId
    const existingIndex = foodLog.findIndex(f => f.sourceId === entry.sourceId);
    if (existingIndex >= 0) {
      // Update existing
      const newLog = [...foodLog];
      newLog[existingIndex] = { ...newLog[existingIndex], ...entry };
      saveFoodLog(newLog);
    } else {
      // Add new
      saveFoodLog([...foodLog, { ...entry, id: entry.id || `f-${Date.now()}` }]);
    }
  };

  // Add or update workout entry (for IA imports with deduplication)
  const upsertWorkout = (entry) => {
    if (!entry.sourceId) {
      saveWorkoutLog([...workoutLog, { ...entry, id: entry.id || `w-${Date.now()}` }]);
      return;
    }
    const existingIndex = workoutLog.findIndex(w => w.sourceId === entry.sourceId);
    if (existingIndex >= 0) {
      const newLog = [...workoutLog];
      newLog[existingIndex] = { ...newLog[existingIndex], ...entry };
      saveWorkoutLog(newLog);
    } else {
      saveWorkoutLog([...workoutLog, { ...entry, id: entry.id || `w-${Date.now()}` }]);
    }
  };

  // Confirm/review an entry
  const confirmFood = (id) => {
    const newLog = foodLog.map(f => f.id === id ? { ...f, reviewed: true } : f);
    saveFoodLog(newLog);
  };

  const confirmWorkout = (id) => {
    const newLog = workoutLog.map(w => w.id === id ? { ...w, reviewed: true } : w);
    saveWorkoutLog(newLog);
  };

  // Import food from JSON text
  const handleImportFood = () => {
    setImportError('');
    try {
      const data = JSON.parse(importText);
      const entries = Array.isArray(data) ? data : [data];

      entries.forEach(entry => {
        const foodEntry = {
          id: entry.id || `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: entry.date || getArgentinaDateString(),
          time: entry.time || '',
          meal: entry.meal || 'Almuerzo',
          name: entry.name || 'Comida importada',
          description: entry.description || '',
          calories: parseInt(entry.calories) || 0,
          protein: parseInt(entry.protein) || 0,
          carbs: parseInt(entry.carbs) || 0,
          fat: parseInt(entry.fat) || 0,
          fiber: parseInt(entry.fiber) || 0,
          source: entry.source || 'ai-text',
          reviewed: false,
          confidence: entry.confidence || 0.8,
          sourceId: entry.sourceId || `import-${Date.now()}`
        };
        upsertFood(foodEntry);
      });

      setShowImportFoodModal(false);
      setImportText('');
    } catch (e) {
      setImportError('JSON inválido. Revisá el formato.');
    }
  };

  // Import workout from JSON text
  const handleImportWorkout = () => {
    setImportError('');
    try {
      const data = JSON.parse(importText);
      const entries = Array.isArray(data) ? data : [data];

      entries.forEach(entry => {
        const workoutEntry = {
          id: entry.id || `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: entry.date || getArgentinaDateString(),
          type: entry.type || 'gym',
          name: entry.name || 'Entreno importado',
          duration: parseInt(entry.duration) || 0,
          calories: parseInt(entry.calories) || 0,
          volume: parseInt(entry.volume) || 0,
          exercises: entry.exercises || [],
          notes: entry.notes || '',
          source: entry.source || 'ai-text',
          reviewed: false,
          confidence: entry.confidence || 0.8,
          sourceId: entry.sourceId || `import-${Date.now()}`
        };
        upsertWorkout(workoutEntry);
      });

      setShowImportWorkoutModal(false);
      setImportText('');
    } catch (e) {
      setImportError('JSON inválido. Revisá el formato.');
    }
  };

  // Export all data as JSON backup
  const exportBackup = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      version: 'v5',
      profile,
      customTargets,
      weightHistory,
      foodLog,
      workoutLog,
      stepsLog,
      ouraLog
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucas-tracker-backup-${getArgentinaDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import backup from JSON file
  const importBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.profile) setProfile(data.profile);
        if (data.customTargets) setCustomTargets(data.customTargets);
        if (data.weightHistory) saveWeightHistory(data.weightHistory);
        if (data.foodLog) saveFoodLog(data.foodLog);
        if (data.workoutLog) saveWorkoutLog(data.workoutLog);
        if (data.stepsLog) saveStepsLog(data.stepsLog);
        if (data.ouraLog) saveOuraLog(data.ouraLog);

        alert('Backup restaurado correctamente!');
      } catch (err) {
        alert('Error al importar backup: archivo inválido');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Save Oura log
  const saveOuraLog = async (newLog) => {
    setOuraLog(newLog);
    try {
      await storage.set('lucas-oura-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving oura log:', err);
    }
  };

  // Save single Oura entry to Supabase
  const saveOuraEntry = async (entry) => {
    if (useCloud) {
      await supabase.saveOura(entry);
    }
  };

  // Add Oura entry
  const addOuraEntry = async () => {
    if (!newOuraEntry.sleepScore && !newOuraEntry.readinessScore) return;
    const existingIndex = ouraLog.findIndex(o => o.date === newOuraEntry.date);
    const entry = {
      date: newOuraEntry.date,
      sleepScore: parseInt(newOuraEntry.sleepScore) || null,
      readinessScore: parseInt(newOuraEntry.readinessScore) || null,
      activityScore: parseInt(newOuraEntry.activityScore) || null,
      hrv: parseInt(newOuraEntry.hrv) || null,
      restingHr: parseInt(newOuraEntry.restingHr) || null,
      sleepHours: parseFloat(newOuraEntry.sleepHours) || null,
      deepSleepMins: parseInt(newOuraEntry.deepSleepMins) || null,
      remSleepMins: parseInt(newOuraEntry.remSleepMins) || null,
      bedtime: newOuraEntry.bedtime || null,
      wakeTime: newOuraEntry.wakeTime || null
    };

    let newLog;
    if (existingIndex >= 0) {
      newLog = [...ouraLog];
      newLog[existingIndex] = entry;
    } else {
      newLog = [...ouraLog, entry];
    }
    newLog.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveOuraLog(newLog);
    await saveOuraEntry(entry); // Save to Supabase
    setNewOuraEntry({
      date: getArgentinaDateString(),
      sleepScore: '', readinessScore: '', activityScore: '',
      hrv: '', restingHr: '', sleepHours: '',
      deepSleepMins: '', remSleepMins: '', bedtime: '', wakeTime: ''
    });
  };

  // Get Oura data for date
  const getOuraForDate = (date) => ouraLog.find(o => o.date === date);

  // Export food log for nutritionist as formatted TXT
  const exportForNutritionist = () => {
    const today = getArgentinaDateString();
    const startDate = addDaysToDate(today, -13);

    // Get all dates in range
    const dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(addDaysToDate(startDate, i));
    }

    // Format date range for title
    const formatFullDate = (dateStr) => {
      const date = new Date(dateStr + 'T12:00:00');
      return new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: ARGENTINA_TZ
      }).format(date);
    };

    const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    // Calculate average sleep times from Oura data
    const ouraInRange = ouraLog.filter(o => o.date >= startDate && o.date <= today);
    let avgBedtime = 'N/D';
    let avgWakeTime = 'N/D';
    if (ouraInRange.length > 0) {
      const bedtimes = ouraInRange.filter(o => o.bedtime).map(o => o.bedtime);
      const wakeTimes = ouraInRange.filter(o => o.wakeTime).map(o => o.wakeTime);
      if (bedtimes.length > 0) avgBedtime = bedtimes[Math.floor(bedtimes.length / 2)];
      if (wakeTimes.length > 0) avgWakeTime = wakeTimes[Math.floor(wakeTimes.length / 2)];
    }

    // Get workouts in range
    const workoutsInRange = workoutLog.filter(w => w.date >= startDate && w.date <= today);

    // Build TXT content
    let txt = '';
    txt += '═══════════════════════════════════════════════════════════════\n';
    txt += '                    REGISTRO DE COMIDAS\n';
    txt += '═══════════════════════════════════════════════════════════════\n\n';
    txt += 'Nombre: Lucas Mujica\n';
    txt += `Período: ${capitalizeFirst(formatFullDate(startDate))} → ${capitalizeFirst(formatFullDate(today))}\n\n`;

    txt += '———————————————————————————————————————————————————————————————\n';
    txt += 'HORARIO PROMEDIO\n';
    txt += '———————————————————————————————————————————————————————————————\n';
    txt += `Despertar: ${avgWakeTime}\n`;
    txt += `Dormir: ${avgBedtime}\n\n`;

    txt += '———————————————————————————————————————————————————————————————\n';
    txt += 'ACTIVIDAD FÍSICA DURANTE EL PERÍODO\n';
    txt += '———————————————————————————————————————————————————————————————\n';
    if (workoutsInRange.length === 0) {
      txt += 'Sin actividad registrada.\n';
    } else {
      workoutsInRange.forEach(w => {
        const dayName = capitalizeFirst(formatFullDate(w.date).split(',')[0]);
        const typeMap = { gym: 'Gym', tennis: 'Tenis', cardio: 'Cardio', other: 'Otro' };
        txt += `${dayName}: ${typeMap[w.type] || w.type} ─ ${w.duration} min (${w.name})\n`;
      });
    }
    txt += '\n';

    txt += '═══════════════════════════════════════════════════════════════\n';
    txt += '                    REGISTRO DIARIO\n';
    txt += '═══════════════════════════════════════════════════════════════\n\n';

    // Each day
    dates.forEach(date => {
      const foods = foodLog.filter(f => f.date === date).sort((a, b) => {
        // Sort by time if available, otherwise by meal order
        if (a.time && b.time) return a.time.localeCompare(b.time);
        const mealOrder = { 'Desayuno': 1, 'Almuerzo': 2, 'Merienda': 3, 'Snack': 4, 'Cena': 5 };
        return (mealOrder[a.meal] || 99) - (mealOrder[b.meal] || 99);
      });

      txt += `———————————————————————————————————————————————————————————————\n`;
      txt += `${capitalizeFirst(formatFullDate(date))}\n`;
      txt += `———————————————————————————————————————————————————————————————\n`;

      if (foods.length === 0) {
        txt += 'Sin registro.\n';
      } else {
        foods.forEach(f => {
          const timeStr = f.time ? ` ─ ${f.time}` : '';
          txt += `${f.meal}${timeStr}: ${f.name}`;
          if (f.description) txt += ` (${f.description})`;
          txt += '\n';
        });
      }
      txt += '\n';
    });

    txt += '═══════════════════════════════════════════════════════════════\n';
    txt += `Generado: ${new Date().toLocaleString('es-AR', { timeZone: ARGENTINA_TZ })}\n`;

    // Download
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registro-nutricionista-${today}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export for Claude - generates a structured summary to paste in chat
  const exportForClaude = () => {
    const today = getArgentinaDateString();
    const daysBack = 7; // Last 7 days of data
    const startDate = addDaysToDate(today, -(daysBack - 1));

    // Get dates array
    const dates = [];
    for (let i = 0; i < daysBack; i++) {
      dates.push(addDaysToDate(startDate, i));
    }

    // Current status
    const currentWeight = getMostRecentWeight(weightHistory);
    const todayTotals = getTotalsForDate(today);
    const todayTargets = getTargetsForDate(today);
    const todaySteps = getStepsForDate(today);
    const todayOura = getOuraForDate(today);
    const todayWorkouts = getWorkoutsForDate(today);

    // Weekly stats
    const weekStats = getWeeklyAdherence(0);
    const lastWeekStats = getWeeklyAdherence(1);

    // Build export text
    let txt = '=== LUCAS TRACKER - EXPORT PARA CLAUDE ===\n';
    txt += `Fecha: ${today}\n\n`;

    // Current profile
    txt += '## PERFIL ACTUAL\n';
    txt += `Peso actual: ${currentWeight?.weight || profile.currentWeight}kg (${currentWeight?.date || 'N/D'})\n`;
    txt += `Peso objetivo: ${profile.targetWeight}kg\n`;
    txt += `Faltan: ${((currentWeight?.weight || profile.currentWeight) - profile.targetWeight).toFixed(1)}kg\n`;
    txt += `Altura: ${profile.height}cm | Edad: ${profile.age}\n\n`;

    // Targets
    txt += '## OBJETIVOS DIARIOS\n';
    txt += `Rest day: ${customTargets.calories}kcal | ${customTargets.protein}g prot | ${customTargets.carbs}g carbs | ${customTargets.fat}g fat | ${customTargets.fiber}g fibra\n`;
    txt += `Training day: ${customTargets.calories + customTargets.trainingDayCaloriesBonus}kcal | ${customTargets.protein}g prot | ${customTargets.trainingDayCarbs}g carbs\n\n`;

    // Today's status
    txt += '## HOY (' + today + ')\n';
    txt += `Macros: ${todayTotals.calories}/${todayTargets.calories}kcal | ${todayTotals.protein}/${todayTargets.protein}g prot | ${todayTotals.carbs}/${todayTargets.carbs}g carbs | ${todayTotals.fat}/${todayTargets.fat}g fat\n`;
    txt += `Restante: ${todayTargets.calories - todayTotals.calories}kcal | ${todayTargets.protein - todayTotals.protein}g prot\n`;
    txt += `Pasos: ${todaySteps}\n`;
    if (todayWorkouts.length > 0) {
      txt += `Entreno: ${todayWorkouts.map(w => w.name).join(', ')}\n`;
    }
    if (todayOura) {
      txt += `Oura: Sleep ${todayOura.sleepScore} | Readiness ${todayOura.readinessScore} | HRV ${todayOura.hrv}ms\n`;
    }
    txt += '\n';

    // Today's meals
    const todayFoods = getFoodsForDate(today);
    if (todayFoods.length > 0) {
      txt += '## COMIDAS DE HOY\n';
      todayFoods.forEach(f => {
        txt += `- ${f.meal}${f.time ? ' (' + f.time + ')' : ''}: ${f.name} → ${f.calories}kcal, ${f.protein}g prot\n`;
      });
      txt += '\n';
    }

    // Weekly adherence
    txt += '## ADHERENCIA SEMANAL\n';
    txt += `Esta semana: Score ${weekStats.score}/10 | Cal OK: ${weekStats.calOkDays}/${weekStats.daysTracked} | Prot OK: ${weekStats.protOkDays}/${weekStats.daysTracked} | Pasos OK: ${weekStats.stepsOkDays}/${weekStats.daysTracked}\n`;
    txt += `Promedios: ${weekStats.avgCals}kcal/día | ${weekStats.avgProt}g prot/día | ${weekStats.avgSteps} pasos/día\n`;
    txt += `Semana pasada: Score ${lastWeekStats.score}/10 | ${lastWeekStats.avgCals}kcal/día | ${lastWeekStats.avgProt}g prot/día\n\n`;

    // Weight trend
    if (weightHistory.length >= 2) {
      const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
      const recentWeights = sorted.slice(-7);
      txt += '## PESO ÚLTIMOS 7 REGISTROS\n';
      recentWeights.forEach(w => {
        txt += `${w.date}: ${w.weight}kg\n`;
      });

      // Calculate trend
      if (recentWeights.length >= 2) {
        const oldest = recentWeights[0];
        const newest = recentWeights[recentWeights.length - 1];
        const daysDiff = Math.max(1, (new Date(newest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24));
        const weightDiff = oldest.weight - newest.weight;
        const weeklyRate = (weightDiff / daysDiff) * 7;
        txt += `Tendencia: ${weeklyRate > 0 ? '-' : '+'}${Math.abs(weeklyRate).toFixed(2)}kg/semana\n`;
      }
      txt += '\n';
    }

    // Recent workouts
    const recentWorkouts = workoutLog
      .filter(w => w.date >= startDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (recentWorkouts.length > 0) {
      txt += '## ENTRENOS ÚLTIMOS 7 DÍAS\n';
      recentWorkouts.forEach(w => {
        txt += `${w.date}: ${w.type.toUpperCase()} - ${w.name} (${w.duration}min`;
        if (w.volume) txt += `, ${w.volume}kg vol`;
        txt += ')\n';
        if (w.exercises && w.exercises.length > 0) {
          w.exercises.slice(0, 3).forEach(ex => {
            txt += `  - ${ex.name}: ${ex.sets}x${ex.reps}@${ex.weight}kg\n`;
          });
          if (w.exercises.length > 3) txt += `  ... y ${w.exercises.length - 3} ejercicios más\n`;
        }
      });
      txt += '\n';
    }

    // Daily summary last 7 days
    txt += '## RESUMEN DIARIO (ÚLTIMOS 7 DÍAS)\n';
    dates.forEach(date => {
      const totals = getTotalsForDate(date);
      const targets = getTargetsForDate(date);
      const steps = getStepsForDate(date);
      const workouts = getWorkoutsForDate(date);
      const isTraining = workouts.length > 0;

      const calStatus = Math.abs(totals.calories - targets.calories) <= 150 ? '✓' : totals.calories > targets.calories ? '↑' : '↓';
      const protStatus = totals.protein >= targets.protein * 0.9 ? '✓' : '↓';

      txt += `${date}${isTraining ? ' 🏋️' : ''}: ${totals.calories}kcal${calStatus} | ${totals.protein}g prot${protStatus} | ${steps} pasos`;
      if (workouts.length > 0) txt += ` | ${workouts.map(w => w.type).join('+')}`;
      txt += '\n';
    });

    txt += '\n=== FIN EXPORT ===\n';
    txt += 'Pegá esto en el chat con Claude para contexto completo.\n';

    // Copy to clipboard
    navigator.clipboard.writeText(txt).then(() => {
      alert('✓ Copiado al portapapeles!\n\nPegalo en el chat con Claude.');
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-claude-${today}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // Format timestamp to time string
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
  };

  // Navigation helpers - use Argentina timezone
  const changeDate = (dateStr, delta) => addDaysToDate(dateStr, delta);

  const formatDateDisplay = (dateStr) => {
    const today = getArgentinaDateString();
    const yesterday = changeDate(today, -1);
    if (dateStr === today) return 'Hoy';
    if (dateStr === yesterday) return 'Ayer';
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: ARGENTINA_TZ
    }).format(date);
  };

  // Circular progress component - responsive with better fonts
  const CircularProgress = ({ current, target, label, color, size = 80 }) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isOver = current > target;
    const strokeWidth = size < 60 ? 5 : 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    // Better font sizes for readability
    const fontSize = size < 60 ? 'text-xs' : 'text-sm';
    const subFontSize = size < 60 ? 'text-[9px]' : 'text-[10px]';
    const labelSize = size < 60 ? 'text-[10px]' : 'text-xs';

    return (
      <div className="flex flex-col items-center min-w-0">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg className="transform -rotate-90" width={size} height={size}>
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="#374151" strokeWidth={strokeWidth} fill="none" />
            <circle cx={size / 2} cy={size / 2} r={radius} stroke={isOver ? '#f87171' : color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
            <span className={`${fontSize} font-bold ${isOver ? 'text-red-400' : 'text-white'}`}>{current}</span>
            <span className={`${subFontSize} text-gray-400`}>/{target}</span>
          </div>
        </div>
        <span className={`${labelSize} font-medium text-gray-300 mt-0.5`}>{label}</span>
      </div>
    );
  };

  // Progress bar component
  const ProgressBar = ({ current, target, label, unit, color }) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isOver = current > target;
    return (
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-300">{label}</span>
          <span className={`text-xs font-bold ${isOver ? 'text-red-400' : 'text-gray-200'}`}>{current}/{target}{unit}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : color}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  };

  // Mini bar
  const MiniBar = ({ current, target, color }) => {
    const percentage = Math.min((current / target) * 100, 100);
    return (
      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    );
  };

  // Weight Line Chart with 7-day moving average
  const WeightLineChart = ({ data }) => {
    if (data.length === 0) return null;

    const weights = data.map(d => d.weight);
    const minWeight = Math.min(...weights) - 0.5;
    const maxWeight = Math.max(...weights) + 0.5;
    const range = maxWeight - minWeight;

    const chartHeight = 120;
    const chartWidth = 100; // percentage
    const padding = 10;

    const getY = (weight) => {
      return chartHeight - padding - ((weight - minWeight) / range) * (chartHeight - padding * 2);
    };

    // Create path for actual weight
    const weightPath = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = getY(d.weight);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Create path for 7-day average
    const avgPath = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = getY(d.avg7d);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Target line
    const targetY = getY(profile.targetWeight);

    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-emerald-400">📈 PESO</h3>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 inline-block"></span> Peso</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block"></span> Media 7d</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-500 inline-block border-dashed"></span> Objetivo</span>
          </div>
        </div>

        <div className="relative" style={{ height: chartHeight }}>
          <svg viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full">
            {/* Target line */}
            {profile.targetWeight >= minWeight && profile.targetWeight <= maxWeight && (
              <line x1="0" y1={targetY} x2="100" y2={targetY} stroke="#6b7280" strokeWidth="0.5" strokeDasharray="2,2" />
            )}

            {/* 7-day average line */}
            <path d={avgPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Actual weight line */}
            <path d={weightPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data points */}
            {data.map((d, i) => (
              <circle key={i} cx={(i / (data.length - 1)) * 100} cy={getY(d.weight)} r="2" fill="#10b981" />
            ))}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[9px] text-gray-500 -ml-1">
            <span>{maxWeight.toFixed(1)}</span>
            <span>{minWeight.toFixed(1)}</span>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-1 text-[9px] text-gray-500">
          {data.length > 0 && <span>{data[0].dayLabel}</span>}
          {data.length > 1 && <span>{data[data.length - 1].dayLabel}</span>}
        </div>

        {/* Current stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{data[data.length - 1]?.weight || '-'}</div>
            <div className="text-[9px] text-gray-400">Último</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">{data[data.length - 1]?.avg7d || '-'}</div>
            <div className="text-[9px] text-gray-400">Media 7d</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-400">{profile.targetWeight}</div>
            <div className="text-[9px] text-gray-400">Objetivo</div>
          </div>
        </div>
      </div>
    );
  };

  // Adherence Card Component
  const AdherenceCard = ({ data, label }) => {
    const getScoreColor = (score) => {
      if (score >= 8) return 'text-emerald-400';
      if (score >= 6) return 'text-amber-400';
      return 'text-red-400';
    };

    return (
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-bold text-gray-400">{label}</h4>
          <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>{data.score}/10</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div>
            <div className="text-emerald-400 font-bold">{data.calOkDays}/{data.daysTracked}</div>
            <div className="text-gray-500">Cal OK</div>
          </div>
          <div>
            <div className="text-blue-400 font-bold">{data.protOkDays}/{data.daysTracked}</div>
            <div className="text-gray-500">Prot OK</div>
          </div>
          <div>
            <div className="text-cyan-400 font-bold">{data.stepsOkDays}/{data.daysTracked}</div>
            <div className="text-gray-500">Pasos OK</div>
          </div>
        </div>
      </div>
    );
  };

  // Get data for date
  const getFoodsForDate = (date) => foodLog.filter(entry => entry.date === date);
  const getWorkoutsForDate = (date) => workoutLog.filter(entry => entry.date === date);
  const getStepsForDate = (date) => stepsLog.find(s => s.date === date)?.steps || 0;

  // ============ ADVANCED ANALYTICS ============

  // Get weight data with 7-day moving average
  const getWeightChartData = useMemo(() => {
    if (weightHistory.length === 0) return [];

    const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

    return sorted.map((entry, idx) => {
      const windowStart = Math.max(0, idx - 6);
      const window = sorted.slice(windowStart, idx + 1);
      const avg = window.reduce((sum, e) => sum + e.weight, 0) / window.length;

      return {
        date: entry.date,
        weight: entry.weight,
        avg7d: Math.round(avg * 10) / 10,
        dayLabel: new Date(entry.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
      };
    });
  }, [weightHistory]);

  // Calculate weekly adherence stats
  const getWeeklyAdherence = useCallback((weeksAgo = 0) => {
    const today = getArgentinaDateString();

    // Get Monday of current week, then go back weeksAgo weeks
    let mondayStr = getMondayOfWeek(today);
    for (let i = 0; i < weeksAgo; i++) {
      mondayStr = addDaysToDate(mondayStr, -7);
    }

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = addDaysToDate(mondayStr, i);
      if (dateStr <= today) weekDates.push(dateStr);
    }

    let calOkDays = 0, protOkDays = 0, stepsOkDays = 0;
    let totalCals = 0, totalProt = 0, totalSteps = 0, daysWithFood = 0;

    weekDates.forEach(date => {
      const totals = getTotalsForDate(date);
      const targets = getTargetsForDate(date);
      const steps = getStepsForDate(date);

      if (totals.calories > 0) {
        daysWithFood++;
        totalCals += totals.calories;
        totalProt += totals.protein;
        if (Math.abs(totals.calories - targets.calories) <= 150) calOkDays++;
        if (totals.protein >= targets.protein * 0.9) protOkDays++;
      }

      if (steps > 0) {
        totalSteps += steps;
        if (steps >= 8000) stepsOkDays++;
      }
    });

    const daysTracked = weekDates.length;
    const score = daysTracked > 0 ? Math.round(((calOkDays + protOkDays + stepsOkDays) / (daysTracked * 3)) * 100) / 10 : 0;

    return {
      weekStart: mondayStr,
      daysTracked, daysWithFood, calOkDays, protOkDays, stepsOkDays,
      avgCals: daysWithFood > 0 ? Math.round(totalCals / daysWithFood) : 0,
      avgProt: daysWithFood > 0 ? Math.round(totalProt / daysWithFood) : 0,
      avgSteps: daysTracked > 0 ? Math.round(totalSteps / daysTracked) : 0,
      score
    };
  }, [getTotalsForDate, getTargetsForDate, getStepsForDate]);

  // Compare current week vs last week
  const weekComparison = useMemo(() => {
    const thisWeek = getWeeklyAdherence(0);
    const lastWeek = getWeeklyAdherence(1);
    return {
      thisWeek, lastWeek,
      calsDiff: thisWeek.avgCals - lastWeek.avgCals,
      protDiff: thisWeek.avgProt - lastWeek.avgProt,
      stepsDiff: thisWeek.avgSteps - lastWeek.avgSteps
    };
  }, [getWeeklyAdherence]);

  // Calculate weight loss rate and projection
  const weightProjection = useMemo(() => {
    if (weightHistory.length < 2) return null;

    const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    const daysDiff = Math.max(1, (new Date(newest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24));
    const weightDiff = oldest.weight - newest.weight;
    const weeklyRate = (weightDiff / daysDiff) * 7;

    const kgToLose = profile.currentWeight - profile.targetWeight;
    const weeksToGoal = weeklyRate > 0 ? Math.ceil(kgToLose / weeklyRate) : null;

    const goalDate = weeksToGoal ? new Date() : null;
    if (goalDate && weeksToGoal) goalDate.setDate(goalDate.getDate() + (weeksToGoal * 7));

    let recommendation = null;
    if (daysDiff >= 14) {
      if (weeklyRate < 0.2) recommendation = { type: 'decrease', text: 'Bajando muy lento. Considerá reducir 150-200 kcal.' };
      else if (weeklyRate > 1.0) recommendation = { type: 'increase', text: 'Bajando muy rápido. Considerá subir 100-150 kcal para preservar músculo.' };
      else if (weeklyRate >= 0.3 && weeklyRate <= 0.7) recommendation = { type: 'good', text: 'Ritmo óptimo. Seguí así.' };
    }

    return {
      weeklyRate: Math.round(weeklyRate * 100) / 100,
      weeksToGoal,
      goalDate: goalDate ? goalDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      recommendation,
      dataPoints: sorted.length,
      daysCovered: Math.round(daysDiff)
    };
  }, [weightHistory, profile.currentWeight, profile.targetWeight]);

  // ============ END ADVANCED ANALYTICS ============

  // Weekly workout analysis
  const getWeeklyWorkoutAnalysis = () => {
    const todayStr = getArgentinaDateString();
    const dayOfWeek = getArgentinaDay();
    const mondayStr = getMondayOfWeek(todayStr);

    const weekWorkouts = workoutLog.filter(w => w.date >= mondayStr && w.date <= todayStr);
    const gymSessions = weekWorkouts.filter(w => w.type === 'gym');
    const tennisSessions = weekWorkouts.filter(w => w.type === 'tennis');

    const totalVolume = gymSessions.reduce((sum, w) => sum + (w.volume || 0), 0);
    const totalDuration = weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalCalsBurned = weekWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);

    let analysis = [];
    if (gymSessions.length === 0 && dayOfWeek > 1) {
      analysis.push('⚠️ Sin gym esta semana.');
    } else if (gymSessions.length > 0) {
      analysis.push(`✅ ${gymSessions.length} sesión(es) de gym.`);
      if (totalVolume > 0) analysis.push(`📊 Volumen: ${totalVolume.toLocaleString()} kg`);
    }
    if (tennisSessions.length > 0) {
      analysis.push(`🎾 Tenis: ${tennisSessions.reduce((s, t) => s + t.duration, 0)} min.`);
    } else if (dayOfWeek >= 3 || dayOfWeek === 0) {
      analysis.push('📍 Falta: Tenis (miércoles)');
    }
    if (totalCalsBurned > 0) analysis.push(`🔥 ~${totalCalsBurned} kcal quemadas.`);

    const types = gymSessions.map(g => g.name.toLowerCase());
    const hasPush = types.some(t => t.includes('push') || t.includes('pecho'));
    const hasPull = types.some(t => t.includes('pull') || t.includes('espalda'));
    const hasLegs = types.some(t => t.includes('leg') || t.includes('pierna'));
    if (gymSessions.length >= 1) {
      const missing = [];
      if (!hasPush) missing.push('Push');
      if (!hasPull) missing.push('Pull');
      if (!hasLegs) missing.push('Legs');
      if (missing.length > 0 && missing.length < 3) analysis.push(`📍 Falta: ${missing.join(', ')}`);
    }

    return { gymCount: gymSessions.length, tennisCount: tennisSessions.length, totalVolume, totalDuration, totalCalsBurned, analysis, weekStart: mondayStr };
  };

  // Weekly data for charts
  const getWeeklyData = () => {
    const data = [];
    const today = getArgentinaDateString();
    for (let i = 6; i >= 0; i--) {
      const dateStr = addDaysToDate(today, -i);
      const totals = getTotalsForDate(dateStr);
      const steps = getStepsForDate(dateStr);
      const date = new Date(dateStr + 'T12:00:00');
      const dayLabel = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: ARGENTINA_TZ }).format(date).slice(0, 2);
      data.push({
        date: dateStr,
        day: dayLabel,
        calories: totals.calories,
        protein: totals.protein,
        steps,
        completed: isDayCompleted(dateStr)
      });
    }
    return data;
  };

  // Simple bar chart
  const SimpleBarChart = ({ data, dataKey, target, color, label }) => {
    const maxVal = Math.max(...data.map(d => d[dataKey]), target) * 1.1 || target * 1.1;
    return (
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-300">{label}</span>
          <span className="text-[10px] text-gray-500">Meta: {target}</span>
        </div>
        <div className="flex items-end justify-between h-16 gap-0.5">
          {data.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-full bg-gray-700 rounded-t relative" style={{ height: '48px' }}>
                <div className={`absolute bottom-0 w-full rounded-t transition-all ${color} ${d[dataKey] > target ? 'opacity-60' : ''}`} style={{ height: `${Math.min((d[dataKey] / maxVal) * 100, 100)}%` }} />
                <div className="absolute w-full border-t border-dashed border-gray-500" style={{ bottom: `${(target / maxVal) * 100}%` }} />
                {d.completed && <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-[8px]">✓</div>}
              </div>
              <span className="text-[9px] text-gray-500 mt-0.5">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const weeklyData = getWeeklyData();
  const workoutAnalysis = getWeeklyWorkoutAnalysis();

  // Show Auth UI if not authenticated and not in offline mode
  // Priority: AuthUI should show even during loading states after logout
  if (showAuth && !offlineMode) {
    // Wrap signIn to update showAuth immediately on success
    const handleSignIn = async (email, password) => {
      const result = await supabase.signIn(email, password);
      if (!result.error) {
        setShowAuth(false);
      }
      return result;
    };

    // Wrap signUp to update showAuth on auto-confirm success
    const handleSignUp = async (email, password) => {
      const result = await supabase.signUp(email, password);
      if (!result.error && !result.needsConfirmation) {
        setShowAuth(false);
      }
      return result;
    };

    return (
      <AuthUI
        onAuth={{
          signIn: handleSignIn,
          signUp: handleSignUp,
          resetPassword: supabase.resetPassword,
          continueOffline: () => {
            setOfflineMode(true);
            setShowAuth(false);
          },
        }}
        error={supabase.authError}
        isSupabaseConfigured={supabase.isSupabaseConfigured}
        loading={supabase.loading}
      />
    );
  }

  // Show loading only when actually loading data (not during auth flows)
  if ((isLoading || supabase.loading) && !showAuth) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-emerald-400 text-xl">Cargando...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 text-base md:text-lg">
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; }
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-5 max-w-sm w-full border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar?</h3>
            <p className="text-base text-gray-400 mb-4">"{deleteModal.name}"</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteModal({ show: false, type: '', id: null, name: '' })} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2.5 rounded text-base">Cancelar</button>
              <button onClick={executeDelete} className="flex-1 bg-red-600 hover:bg-red-500 py-2.5 rounded text-base font-bold">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt 3: Migration Modal */}
      {showMigrationModal && migrationData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-emerald-500/30 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">☁️</div>
              <h3 className="text-xl font-bold text-white mb-2">Datos locales encontrados</h3>
              <p className="text-gray-400 text-sm">
                Tienes datos guardados en este dispositivo. ¿Quieres sincronizarlos con tu cuenta?
              </p>
            </div>

            {/* Summary of data to migrate */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-sm">
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                {migrationData.weightHistory?.length > 0 && (
                  <div>📊 {migrationData.weightHistory.length} registros de peso</div>
                )}
                {migrationData.foodLog?.length > 0 && (
                  <div>🍽️ {migrationData.foodLog.length} comidas</div>
                )}
                {migrationData.workouts?.length > 0 && (
                  <div>🏋️ {migrationData.workouts.length} entrenos</div>
                )}
                {migrationData.stepsLog?.length > 0 && (
                  <div>👟 {migrationData.stepsLog.length} días de pasos</div>
                )}
                {migrationData.ouraLog?.length > 0 && (
                  <div>💍 {migrationData.ouraLog.length} registros Oura</div>
                )}
                {migrationData.profile && (
                  <div>👤 Perfil y objetivos</div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={async () => {
                  setIsMigrating(true);
                  const result = await supabase.migrateLocalStorageToSupabase(migrationData);
                  if (result.success) {
                    supabase.clearMigratedLocalStorage();
                    // Reload data from Supabase
                    const data = await supabase.fetchAllData();
                    if (data) {
                      if (data.profile) setProfile(data.profile);
                      if (data.targets) setCustomTargets(data.targets);
                      if (data.weightHistory?.length) setWeightHistory(data.weightHistory);
                      if (data.foodLog?.length) setFoodLog(data.foodLog);
                      if (data.workouts?.length) setWorkoutLog(data.workouts);
                      if (data.stepsLog?.length) setStepsLog(data.stepsLog);
                      if (data.ouraLog?.length) setOuraLog(data.ouraLog);
                    }
                  }
                  setIsMigrating(false);
                  setShowMigrationModal(false);
                }}
                disabled={isMigrating}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
              >
                {isMigrating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Migrando datos...
                  </span>
                ) : (
                  'Sí, sincronizar todo'
                )}
              </button>

              <button
                onClick={() => {
                  setShowMigrationModal(false);
                  setMigrationData(null);
                }}
                disabled={isMigrating}
                className="w-full py-3 bg-gray-700 text-gray-300 font-medium rounded-xl hover:bg-gray-600 transition-all disabled:opacity-50"
              >
                No, empezar de cero
              </button>

              <p className="text-xs text-gray-500 text-center">
                Si eliges "empezar de cero", los datos locales se mantendrán pero no se sincronizarán.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Food Entry Modal */}
      {showFoodForm && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-2 pt-10 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-sm border border-gray-700">
            <h3 className="text-base font-bold text-emerald-400 mb-3">➕ Nueva Comida</h3>
            <div className="space-y-2">
              {/* Row 1: Meal type + Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Comida</label>
                  <select value={newFood.meal} onChange={(e) => setNewFood({ ...newFood, meal: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm">
                    <option>Desayuno</option>
                    <option>Almuerzo</option>
                    <option>Merienda</option>
                    <option>Cena</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Hora</label>
                  <input type="time" value={newFood.time} onChange={(e) => setNewFood({ ...newFood, time: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
              </div>
              {/* Row 2: Name */}
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Nombre *</label>
                <input type="text" value={newFood.name} onChange={(e) => setNewFood({ ...newFood, name: e.target.value })} placeholder="Pollo con arroz" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
              </div>
              {/* Row 3: Description */}
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Descripción</label>
                <input type="text" value={newFood.description} onChange={(e) => setNewFood({ ...newFood, description: e.target.value })} placeholder="200g pechuga, 150g arroz" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
              </div>
              {/* Row 4: Macros - 3+2 grid for mobile */}
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Cal *</label>
                  <input type="number" value={newFood.calories} onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })} placeholder="500" className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-2 text-sm text-center" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Prot</label>
                  <input type="number" value={newFood.protein} onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })} placeholder="40" className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-2 text-sm text-center" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Carbs</label>
                  <input type="number" value={newFood.carbs} onChange={(e) => setNewFood({ ...newFood, carbs: e.target.value })} placeholder="50" className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-2 text-sm text-center" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Fat</label>
                  <input type="number" value={newFood.fat} onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })} placeholder="15" className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-2 text-sm text-center" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Fibra</label>
                  <input type="number" value={newFood.fiber} onChange={(e) => setNewFood({ ...newFood, fiber: e.target.value })} placeholder="5" className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-2 text-sm text-center" />
                </div>
              </div>
              {/* Hidden date - use selected date */}
              <input type="hidden" value={newFood.date} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowFoodForm(false)} className="flex-1 bg-gray-700 active:bg-gray-600 py-2.5 rounded text-sm">Cancelar</button>
              <button onClick={addManualFood} className="flex-1 bg-emerald-600 active:bg-emerald-500 py-2.5 rounded text-sm font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Workout Entry Modal */}
      {showWorkoutForm && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-2 pt-10 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-sm border border-gray-700">
            <h3 className="text-base font-bold text-amber-400 mb-3">🏋️ Nuevo Entreno</h3>
            <div className="space-y-2">
              {/* Row 1: Type */}
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Tipo</label>
                <select value={newWorkout.type} onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm">
                  <option value="gym">Gym</option>
                  <option value="tennis">Tenis</option>
                  <option value="cardio">Cardio</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              {/* Row 2: Name */}
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Nombre *</label>
                <input type="text" value={newWorkout.name} onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })} placeholder="Push Day, Clase de Tenis" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
              </div>
              {/* Row 3: Stats */}
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Min</label>
                  <input type="number" value={newWorkout.duration} onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })} placeholder="60" className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-2 text-sm text-center" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Kcal</label>
                  <input type="number" value={newWorkout.calories} onChange={(e) => setNewWorkout({ ...newWorkout, calories: e.target.value })} placeholder="300" className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-2 text-sm text-center" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Vol (kg)</label>
                  <input type="number" value={newWorkout.volume} onChange={(e) => setNewWorkout({ ...newWorkout, volume: e.target.value })} placeholder="2500" className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-2 text-sm text-center" />
                </div>
              </div>
              {/* Row 4: Notes */}
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Notas</label>
                <input type="text" value={newWorkout.notes} onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })} placeholder="Subí peso en press banca" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowWorkoutForm(false)} className="flex-1 bg-gray-700 active:bg-gray-600 py-2.5 rounded text-sm">Cancelar</button>
              <button onClick={addManualWorkout} className="flex-1 bg-amber-600 active:bg-amber-500 py-2.5 rounded text-sm font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Food Modal */}
      {showImportFoodModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-2 pt-10 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-sm border border-gray-700">
            <h3 className="text-base font-bold text-emerald-400 mb-2">📥 Importar Comida</h3>
            <p className="text-xs text-gray-400 mb-3">Pegá el JSON de la comida.</p>
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder={`{"meal": "Almuerzo", "name": "Pollo", "calories": 500, "protein": 40}`}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-xs font-mono h-36 resize-none"
            />
            {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowImportFoodModal(false); setImportText(''); setImportError(''); }} className="flex-1 bg-gray-700 active:bg-gray-600 py-2.5 rounded text-sm">Cancelar</button>
              <button onClick={handleImportFood} className="flex-1 bg-emerald-600 active:bg-emerald-500 py-2.5 rounded text-sm font-bold">Importar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Workout Modal */}
      {showImportWorkoutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-2 pt-10 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-sm border border-gray-700">
            <h3 className="text-base font-bold text-amber-400 mb-2">📥 Importar Entreno</h3>
            <p className="text-xs text-gray-400 mb-3">Pegá el JSON del entreno (Gravl o IA).</p>
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder={`{"type": "gym", "name": "Push Day", "duration": 60, "exercises": [...]}`}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-xs font-mono h-36 resize-none"
            />
            {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowImportWorkoutModal(false); setImportText(''); setImportError(''); }} className="flex-1 bg-gray-700 active:bg-gray-600 py-2.5 rounded text-sm">Cancelar</button>
              <button onClick={handleImportWorkout} className="flex-1 bg-amber-600 active:bg-amber-500 py-2.5 rounded text-sm font-bold">Importar</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast - positioned above bottom nav */}
      {undoAction && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-full px-4 py-2 flex items-center gap-3 z-50 shadow-lg">
          <span className="text-sm text-gray-300">Eliminado</span>
          <button onClick={() => { undoAction.restore(); setUndoAction(null); }} className="text-emerald-400 font-bold text-sm active:text-emerald-300">DESHACER</button>
        </div>
      )}

      {/* Header - Compact for mobile */}
      <header className="bg-gray-800 border-b border-emerald-500/30 px-3 py-2 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-emerald-400 truncate">LUCAS TRACKER</h1>
            <p className="text-xs text-gray-500 truncate">
              {profile.currentWeight}kg → {profile.targetWeight}kg
              {isTrainingDay(dashboardDate) && <span className="ml-1 text-amber-400">🏋️</span>}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Save status - small badge */}
            {saveStatus && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded animate-pulse">{saveStatus}</span>
            )}

            {/* Sync status - compact */}
            {supabase.isAuthenticated ? (
              <div className="flex items-center gap-1">
                {/* Offline indicator */}
                {!supabase.isOnline && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">📴</span>
                )}

                {/* Sync status - icon only on mobile */}
                {supabase.isOnline && (
                  <span className={`text-[10px] w-6 h-6 rounded flex items-center justify-center ${
                    supabase.syncStatus === 'syncing' ? 'bg-blue-500/20 text-blue-400' :
                    supabase.syncStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                    supabase.syncStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                    'text-gray-500'
                  }`}>
                    {supabase.syncStatus === 'syncing' ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : supabase.syncStatus === 'success' ? '✓' : supabase.syncStatus === 'error' ? '⚠️' : '☁️'}
                  </span>
                )}

                <button
                  onClick={async () => {
                    await supabase.signOut();
                    setShowAuth(true);
                    setOfflineMode(false);
                  }}
                  className="text-[10px] text-gray-400 active:text-red-400 px-1.5 py-1 rounded active:bg-gray-700"
                  title="Cerrar sesión"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAuth(true);
                  setOfflineMode(false);
                }}
                className="text-[10px] text-emerald-400 active:text-emerald-300 px-2 py-1 rounded active:bg-gray-700"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Secondary tabs for Pasos/Oura (accessible from Dashboard) */}
      {['pasos', 'oura'].includes(activeTab) && (
        <nav className="bg-gray-800/50 border-b border-gray-700 px-4">
          <div className="max-w-6xl mx-auto flex gap-1">
            {['pasos', 'oura'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-gray-400 active:text-gray-200'
                }`}
              >
                {tab === 'oura' ? '💍 Oura' : '👟 Pasos'}
              </button>
            ))}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="ml-auto text-gray-500 text-xs px-2"
            >
              ← Volver
            </button>
          </div>
        </nav>
      )}

      {/* Main Content with Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
        <main className="p-4 pb-safe w-full max-w-6xl mx-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-3">
              {/* Date Navigator - Compact */}
              <div className="flex items-center justify-between bg-gray-800 rounded-lg p-2.5 border border-gray-700">
                <button onClick={() => setDashboardDate(changeDate(dashboardDate, -1))} className="text-gray-400 active:text-white w-10 h-10 flex items-center justify-center text-xl rounded-lg hover:bg-gray-700">‹</button>
                <div className="text-center min-w-0 flex-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base font-bold text-emerald-400 truncate">{formatDateDisplay(dashboardDate)}</span>
                    {isDayCompleted(dashboardDate) && <span className="text-emerald-400 text-sm flex-shrink-0">✓</span>}
                    {isTrainingDay(dashboardDate) && <span className="text-amber-400 text-sm flex-shrink-0">🏋️</span>}
                  </div>
                </div>
                <button onClick={() => setDashboardDate(changeDate(dashboardDate, 1))} className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg hover:bg-gray-700 ${dashboardDate >= getArgentinaDateString() ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 active:text-white'}`} disabled={dashboardDate >= getArgentinaDateString()}>›</button>
              </div>

              {/* Quick Access Row - Pasos & Oura */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setActiveTab('pasos')} className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2.5 flex items-center justify-center gap-2">
                  <span className="text-lg">👟</span>
                  <span className="text-cyan-400 text-sm font-medium">{getStepsForDate(dashboardDate).toLocaleString()} pasos</span>
                </button>
                <button onClick={() => setActiveTab('oura')} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2.5 flex items-center justify-center gap-2">
                  <span className="text-lg">💍</span>
                  <span className="text-purple-400 text-sm font-medium">Oura</span>
                </button>
              </div>

              {/* Macro Circles + Progress Bars */}
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold text-emerald-400">📊 MACROS</h2>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500 hidden sm:inline">{getFoodsForDate(dashboardDate).length} comidas</span>
                    <button onClick={copyMealsFromYesterday} className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded whitespace-nowrap">📋 Copiar</button>
                  </div>
                </div>

                {/* Macro circles - balanced for mobile */}
                <div className="flex justify-between items-start mb-3 px-1">
                  <CircularProgress current={dashboardTotals.calories} target={dashboardTargets.calories} label="Cal" color="#10b981" size={58} />
                  <CircularProgress current={dashboardTotals.protein} target={dashboardTargets.protein} label="Prot" color="#3b82f6" size={58} />
                  <CircularProgress current={dashboardTotals.carbs} target={dashboardTargets.carbs} label="Carbs" color="#f59e0b" size={58} />
                  <CircularProgress current={dashboardTotals.fat} target={dashboardTargets.fat} label="Gras" color="#ec4899" size={58} />
                  <CircularProgress current={dashboardTotals.fiber} target={dashboardTargets.fiber} label="Fib" color="#8b5cf6" size={58} />
                </div>

                <div className="space-y-1 pt-2 border-t border-gray-700">
                  <ProgressBar current={dashboardTotals.calories} target={dashboardTargets.calories} label="Calorías" unit="kcal" color="bg-emerald-500" />
                  <ProgressBar current={dashboardTotals.protein} target={dashboardTargets.protein} label="Proteína" unit="g" color="bg-blue-500" />
                  <ProgressBar current={dashboardTotals.carbs} target={dashboardTargets.carbs} label="Carbos" unit="g" color="bg-amber-500" />
                  <ProgressBar current={dashboardTotals.fat} target={dashboardTargets.fat} label="Grasas" unit="g" color="bg-pink-500" />
                  <ProgressBar current={dashboardTotals.fiber} target={dashboardTargets.fiber} label="Fibra" unit="g" color="bg-purple-500" />
                </div>
              </div>

              {/* Remaining */}
              <div className="bg-gray-800 rounded-lg p-2.5 border border-gray-700 overflow-hidden">
                <h3 className="text-xs font-bold text-emerald-400 mb-2">🎯 TE QUEDAN</h3>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { val: dashboardTargets.calories - dashboardTotals.calories, label: 'kcal', color: '#10b981' },
                    { val: dashboardTargets.protein - dashboardTotals.protein, label: 'prot', color: '#3b82f6', suffix: 'g' },
                    { val: dashboardTargets.carbs - dashboardTotals.carbs, label: 'carbs', color: '#f59e0b', suffix: 'g' },
                    { val: dashboardTargets.fat - dashboardTotals.fat, label: 'fat', color: '#ec4899', suffix: 'g' },
                    { val: dashboardTargets.fiber - dashboardTotals.fiber, label: 'fibra', color: '#8b5cf6', suffix: 'g' }
                  ].map((item, i) => (
                    <div key={i} className="text-center p-1.5 bg-gray-700/50 rounded min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: item.val < 0 ? '#f87171' : item.color }}>{item.val}{item.suffix || ''}</div>
                      <div className="text-[8px] text-gray-500 truncate">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

            {/* Meals Summary */}
            {getFoodsForDate(dashboardDate).length > 0 && (
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <h3 className="text-xs font-bold text-emerald-400 mb-2">🍽️ COMIDAS</h3>
                <div className="space-y-1">
                  {getFoodsForDate(dashboardDate).map(food => (
                    <div key={food.id} className="flex justify-between items-center text-xs py-1 border-b border-gray-700/50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-emerald-400 uppercase mr-1">{food.meal}</span>
                        <span className="text-gray-200">{food.name}</span>
                      </div>
                      <div className="flex gap-1.5 text-[10px] flex-shrink-0 ml-2">
                        <span className="text-emerald-400">{food.calories}</span>
                        <span className="text-blue-400">{food.protein}p</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {/* Steps & Water Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Steps */}
                <div className="bg-gray-800 rounded-lg p-2.5 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-bold text-cyan-400">👟</h3>
                    <span className="text-sm font-bold text-white">{getStepsForDate(dashboardDate).toLocaleString()}</span>
                  </div>
                  <MiniBar current={getStepsForDate(dashboardDate)} target={8000} color="bg-cyan-500" />
                </div>

                {/* Water Tracking Widget - Compact */}
                <div className="bg-gray-800 rounded-lg p-2.5 border border-cyan-500/30">
                  <div className="flex justify-between items-center mb-1.5">
                    <h3 className="text-[10px] font-bold text-cyan-400">💧</h3>
                    <span className="text-sm font-bold text-white">{getTodayWater().glasses}/{WATER_GOAL_GLASSES}</span>
                  </div>

                  {/* Water glasses visual - smaller */}
                  <div className="flex justify-center gap-0.5 mb-1.5">
                    {Array.from({ length: WATER_GOAL_GLASSES }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-4 rounded-sm transition-all ${
                          i < getTodayWater().glasses
                            ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]'
                            : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Add/Remove buttons - smaller */}
                  <div className="flex justify-center gap-1.5">
                    <button
                      onClick={removeWaterGlass}
                      disabled={getTodayWater().glasses <= 0}
                      className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm transition-colors"
                    >
                      −
                    </button>
                    <button
                      onClick={addWaterGlass}
                      className="w-7 h-7 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center text-sm font-bold text-gray-900 transition-colors shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-3">
              <SimpleBarChart data={weeklyData} dataKey="calories" target={customTargets.calories} color="bg-emerald-500" label="Calorías 7d" />
              <SimpleBarChart data={weeklyData} dataKey="protein" target={customTargets.protein} color="bg-blue-500" label="Proteína 7d" />
            </div>

            {/* Weekly Adherence */}
            <div className="grid grid-cols-2 gap-3">
              <AdherenceCard data={weekComparison.thisWeek} label="📊 ESTA SEMANA" />
              <AdherenceCard data={weekComparison.lastWeek} label="📊 SEMANA PASADA" />
            </div>

            {/* Week vs Week Comparison */}
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h3 className="text-xs font-bold text-emerald-400 mb-2">📈 ESTA SEMANA VS ANTERIOR</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-sm text-gray-400">Calorías/día</div>
                  <div className="text-lg font-bold text-white">{weekComparison.thisWeek.avgCals || '-'}</div>
                  <div className={`text-xs ${weekComparison.calsDiff < 0 ? 'text-emerald-400' : weekComparison.calsDiff > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {weekComparison.calsDiff !== 0 && (weekComparison.calsDiff > 0 ? '+' : '')}{weekComparison.calsDiff || '='} vs anterior
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Proteína/día</div>
                  <div className="text-lg font-bold text-white">{weekComparison.thisWeek.avgProt || '-'}g</div>
                  <div className={`text-xs ${weekComparison.protDiff > 0 ? 'text-emerald-400' : weekComparison.protDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {weekComparison.protDiff !== 0 && (weekComparison.protDiff > 0 ? '+' : '')}{weekComparison.protDiff || '='}g vs anterior
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Pasos/día</div>
                  <div className="text-lg font-bold text-white">{weekComparison.thisWeek.avgSteps?.toLocaleString() || '-'}</div>
                  <div className={`text-xs ${weekComparison.stepsDiff > 0 ? 'text-emerald-400' : weekComparison.stepsDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {weekComparison.stepsDiff !== 0 && (weekComparison.stepsDiff > 0 ? '+' : '')}{weekComparison.stepsDiff?.toLocaleString() || '='} vs anterior
                  </div>
                </div>
              </div>
            </div>

            {/* Weight Projection */}
            {weightProjection && (
              <div className="bg-gray-800 rounded-lg p-3 border border-amber-500/30">
                <h3 className="text-xs font-bold text-amber-400 mb-2">🎯 PROYECCIÓN</h3>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="text-center p-2 bg-gray-700/50 rounded">
                    <div className="text-lg font-bold text-white">{weightProjection.weeklyRate > 0 ? '-' : '+'}{Math.abs(weightProjection.weeklyRate)} kg/sem</div>
                    <div className="text-[9px] text-gray-400">Ritmo actual</div>
                  </div>
                  <div className="text-center p-2 bg-gray-700/50 rounded">
                    <div className="text-lg font-bold text-emerald-400">
                      {weightProjection.weeksToGoal ? `~${weightProjection.weeksToGoal} sem` : '-'}
                    </div>
                    <div className="text-[9px] text-gray-400">Para objetivo</div>
                  </div>
                </div>
                {weightProjection.goalDate && (
                  <p className="text-xs text-gray-400 text-center">Fecha estimada: <span className="text-emerald-400">{weightProjection.goalDate}</span></p>
                )}
                {weightProjection.recommendation && (
                  <div className={`mt-2 p-2 rounded text-xs ${weightProjection.recommendation.type === 'good' ? 'bg-emerald-900/30 text-emerald-400' :
                    weightProjection.recommendation.type === 'decrease' ? 'bg-amber-900/30 text-amber-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                    💡 {weightProjection.recommendation.text}
                  </div>
                )}
                <p className="text-[9px] text-gray-500 mt-2 text-center">Basado en {weightProjection.dataPoints} registros ({weightProjection.daysCovered} días)</p>
              </div>
            )}
          </div>
        )}

        {/* Comidas Tab - uses selectedFoodDate */}
        {activeTab === 'comidas' && (
          <div className="space-y-3">
            {/* Date selector - compact */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedFoodDate}
                onChange={(e) => setSelectedFoodDate(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2.5 text-base flex-1 min-w-0"
              />
            </div>

            {/* Swipe hint */}
            {getFoodsForDate(selectedFoodDate).length > 0 && (
              <p className="text-[10px] text-gray-500 text-center">← Desliza para eliminar</p>
            )}

            {getFoodsForDate(selectedFoodDate).length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
                <p className="text-gray-400 text-base">Sin comidas registradas.</p>
                <p className="text-sm text-emerald-400 mt-2">Usá el botón + abajo a la derecha</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getFoodsForDate(selectedFoodDate).map(entry => {
                  const needsReview = !entry.reviewed || (entry.confidence && entry.confidence < 0.7);
                  return (
                    <SwipeableItem
                      key={entry.id}
                      onDelete={() => confirmDelete('food', entry.id, entry.name)}
                    >
                      <div className={`p-3 border-l-4 ${needsReview ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs text-emerald-400 uppercase font-medium">{entry.meal}</span>
                              {entry.time && <span className="text-xs text-gray-500">{entry.time}</span>}
                              {needsReview && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">⚠️</span>
                              )}
                            </div>
                            <h3 className="font-medium text-base truncate">{entry.name}</h3>
                          </div>
                          {needsReview && (
                            <button onClick={() => confirmFood(entry.id)} className="text-emerald-400 active:text-emerald-300 px-2 py-1 text-sm font-medium bg-emerald-500/20 rounded ml-2 flex-shrink-0">✓</button>
                          )}
                        </div>
                        {entry.description && <p className="text-xs text-gray-400 mb-1.5 truncate-2">{entry.description}</p>}
                        <div className="flex justify-between items-center">
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="text-emerald-400 font-medium">{entry.calories}kcal</span>
                            <span className="text-blue-400">{entry.protein}P</span>
                            <span className="text-amber-400">{entry.carbs}C</span>
                            <span className="text-pink-400">{entry.fat}F</span>
                            {entry.fiber > 0 && <span className="text-purple-400">{entry.fiber}Fib</span>}
                          </div>
                          <button
                            onClick={() => saveAsTemplate(entry)}
                            className="text-purple-400 active:text-purple-300 text-[10px] px-1.5 py-0.5 bg-purple-500/20 rounded"
                            title="Guardar como favorito"
                          >
                            ⭐
                          </button>
                        </div>
                      </div>
                    </SwipeableItem>
                  );
                })}
              </div>
            )}

            {getFoodsForDate(selectedFoodDate).length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 border border-emerald-500/30">
                <h3 className="text-sm font-bold text-emerald-400 mb-3">TOTAL DEL DÍA</h3>
                {(() => {
                  const t = getTotalsForDate(selectedFoodDate);
                  return (
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div><span className="text-base font-bold text-emerald-400">{t.calories}</span><br /><span className="text-[9px] text-gray-400">kcal</span></div>
                      <div><span className="text-base font-bold text-blue-400">{t.protein}g</span><br /><span className="text-[9px] text-gray-400">prot</span></div>
                      <div><span className="text-base font-bold text-amber-400">{t.carbs}g</span><br /><span className="text-[9px] text-gray-400">carbs</span></div>
                      <div><span className="text-base font-bold text-pink-400">{t.fat}g</span><br /><span className="text-[9px] text-gray-400">fat</span></div>
                      <div><span className="text-base font-bold text-purple-400">{t.fiber}g</span><br /><span className="text-[9px] text-gray-400">fibra</span></div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Entrenos Tab - uses selectedWorkoutDate */}
        {activeTab === 'entrenos' && (
          <div className="space-y-3">
            {/* Weekly Analysis */}
            <div className="bg-gray-800 rounded-lg p-3 border border-emerald-500/30">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xs font-bold text-emerald-400">📊 SEMANA</h2>
                <span className="text-[10px] text-gray-500">desde {workoutAnalysis.weekStart}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center p-2 bg-gray-700/50 rounded">
                  <div className="text-lg font-bold text-amber-400">{workoutAnalysis.gymCount}</div>
                  <div className="text-[9px] text-gray-400">Gym</div>
                </div>
                <div className="text-center p-2 bg-gray-700/50 rounded">
                  <div className="text-lg font-bold text-green-400">{workoutAnalysis.tennisCount}</div>
                  <div className="text-[9px] text-gray-400">Tenis</div>
                </div>
                <div className="text-center p-2 bg-gray-700/50 rounded">
                  <div className="text-lg font-bold text-cyan-400">{workoutAnalysis.totalDuration}'</div>
                  <div className="text-[9px] text-gray-400">Min</div>
                </div>
              </div>
              <div className="space-y-0.5">
                {workoutAnalysis.analysis.map((line, i) => <p key={i} className="text-[11px] text-gray-300">{line}</p>)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedWorkoutDate}
                onChange={(e) => setSelectedWorkoutDate(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2.5 text-base min-w-0"
              />
            </div>

            {/* Swipe hint */}
            {getWorkoutsForDate(selectedWorkoutDate).length > 0 && (
              <p className="text-[10px] text-gray-500 text-center">← Desliza para eliminar</p>
            )}

            {getWorkoutsForDate(selectedWorkoutDate).length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
                <p className="text-gray-400 text-base">Sin entrenos para esta fecha.</p>
                <p className="text-sm text-amber-400 mt-2">Usá el botón + abajo a la derecha</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getWorkoutsForDate(selectedWorkoutDate).map(workout => {
                  const needsReview = !workout.reviewed || (workout.confidence && workout.confidence < 0.7);
                  return (
                    <SwipeableItem
                      key={workout.id}
                      onDelete={() => confirmDelete('workout', workout.id, workout.name)}
                    >
                      <div className={`p-3 border-l-4 ${workout.type === 'gym' ? 'border-l-amber-500' : 'border-l-green-500'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs uppercase font-medium ${workout.type === 'gym' ? 'text-amber-400' : 'text-green-400'}`}>{workout.type}</span>
                              {needsReview && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">⚠️</span>
                              )}
                            </div>
                            <h3 className="font-medium text-base truncate">{workout.name}</h3>
                          </div>
                          {needsReview && (
                            <button onClick={() => confirmWorkout(workout.id)} className="text-emerald-400 active:text-emerald-300 px-2 py-1 text-sm font-medium bg-emerald-500/20 rounded ml-2 flex-shrink-0">✓</button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-2">
                          {workout.duration && <span>⏱️ {workout.duration}'</span>}
                          {workout.volume && <span>📊 {workout.volume.toLocaleString()}kg</span>}
                          {workout.calories && <span>🔥 {workout.calories}</span>}
                        </div>
                        {workout.exercises?.length > 0 && (
                          <div className="space-y-0.5 border-t border-gray-700 pt-2 max-h-32 overflow-y-auto">
                            {workout.exercises.map((ex, idx) => (
                              <div key={idx} className="text-xs text-gray-300 flex justify-between">
                                <span className="truncate flex-1 min-w-0">{ex.name}</span>
                                <span className="text-gray-500 ml-2 flex-shrink-0">{ex.sets}x{ex.reps}@{ex.weight}kg</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {workout.notes && <p className="text-xs text-emerald-400 mt-1.5 italic truncate">{workout.notes}</p>}
                      </div>
                    </SwipeableItem>
                  );
                })}
              </div>
            )}

            {/* Schedule */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <h3 className="text-xs font-bold text-gray-400 mb-2">SCHEDULE</h3>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                  <div key={day} className={`p-1.5 rounded text-[10px] ${[0, 3, 5].includes(i) ? 'bg-amber-500/20 text-amber-400' : i === 2 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500'}`}>
                    <div className="font-bold">{day}</div>
                    <div className="text-[8px]">{[0, 3, 5].includes(i) ? 'GYM' : i === 2 ? 'TEN' : '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Peso Tab */}
        {activeTab === 'peso' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-bold text-emerald-400 mb-2">⚖️ NUEVO PESO</h2>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="84.5" className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2.5 text-lg min-w-0" />
                  <span className="flex items-center text-gray-400 text-sm">kg</span>
                </div>
                <div className="flex gap-2">
                  <input type="time" value={newWeightTime} onChange={(e) => setNewWeightTime(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2.5 text-sm min-w-0" />
                  <button onClick={addWeightEntry} disabled={!newWeight} className="bg-emerald-600 active:bg-emerald-500 disabled:opacity-50 px-5 py-2.5 rounded font-bold text-sm flex-shrink-0">Guardar</button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-base font-bold text-emerald-400 mb-3">📍 PROGRESO</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-700/50 rounded">
                  <div className="text-xl font-bold text-white">{profile.currentWeight}</div>
                  <div className="text-[10px] text-gray-400">actual</div>
                </div>
                <div className="p-2 bg-gray-700/50 rounded">
                  <div className="text-xl font-bold text-emerald-400">{profile.targetWeight}</div>
                  <div className="text-[10px] text-gray-400">objetivo</div>
                </div>
                <div className="p-2 bg-gray-700/50 rounded">
                  <div className="text-xl font-bold text-amber-400">{(profile.currentWeight - profile.targetWeight).toFixed(1)}</div>
                  <div className="text-[10px] text-gray-400">faltan</div>
                </div>
              </div>
            </div>

            {/* Weight Chart with 7-day moving average */}
            {getWeightChartData.length > 1 && (
              <WeightLineChart data={getWeightChartData} />
            )}

            {/* Projection */}
            {weightProjection && (
              <div className="bg-gray-800 rounded-lg p-4 border border-amber-500/30">
                <h2 className="text-sm font-bold text-amber-400 mb-3">🎯 PROYECCIÓN</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center p-3 bg-gray-700/50 rounded">
                    <div className="text-xl font-bold text-white">
                      {weightProjection.weeklyRate > 0 ? '-' : '+'}{Math.abs(weightProjection.weeklyRate)} kg
                    </div>
                    <div className="text-xs text-gray-400">por semana</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/50 rounded">
                    <div className="text-xl font-bold text-emerald-400">
                      {weightProjection.weeksToGoal ? `${weightProjection.weeksToGoal} sem` : '-'}
                    </div>
                    <div className="text-xs text-gray-400">para llegar a {profile.targetWeight}kg</div>
                  </div>
                </div>

                {weightProjection.goalDate && (
                  <div className="text-center p-2 bg-emerald-900/20 rounded mb-3">
                    <span className="text-sm text-gray-300">Fecha estimada: </span>
                    <span className="text-sm font-bold text-emerald-400">{weightProjection.goalDate}</span>
                  </div>
                )}

                {weightProjection.recommendation && (
                  <div className={`p-3 rounded ${weightProjection.recommendation.type === 'good' ? 'bg-emerald-900/30 border border-emerald-500/30' :
                    weightProjection.recommendation.type === 'decrease' ? 'bg-amber-900/30 border border-amber-500/30' :
                      'bg-red-900/30 border border-red-500/30'
                    }`}>
                    <p className={`text-sm ${weightProjection.recommendation.type === 'good' ? 'text-emerald-400' :
                      weightProjection.recommendation.type === 'decrease' ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                      💡 {weightProjection.recommendation.text}
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-gray-500 mt-3 text-center">
                  Análisis basado en {weightProjection.dataPoints} registros durante {weightProjection.daysCovered} días
                </p>
              </div>
            )}

            {weightHistory.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-base font-bold text-emerald-400 mb-3">📉 HISTORIAL</h2>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {weightHistory.map((entry, idx) => (
                    <div key={entry.id} className="flex items-center justify-between py-2.5 border-b border-gray-700 text-base">
                      <div className="flex flex-col">
                        <span className="text-gray-300">{entry.date}</span>
                        {entry.timestamp && <span className="text-sm text-gray-500">{formatTime(entry.timestamp)}</span>}
                      </div>
                      {editingWeightId === entry.id ? (
                        <div className="flex items-center gap-2">
                          <input type="number" step="0.1" value={editingWeightValue} onChange={(e) => setEditingWeightValue(e.target.value)} className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-base" />
                          <button onClick={saveEditWeight} className="text-emerald-400 px-2 text-lg">✓</button>
                          <button onClick={cancelEditWeight} className="text-gray-400 px-2 text-lg">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">{entry.weight} kg</span>
                          {idx < weightHistory.length - 1 && (
                            <span className={`text-sm ${entry.weight < weightHistory[idx + 1].weight ? 'text-emerald-400' : entry.weight > weightHistory[idx + 1].weight ? 'text-red-400' : 'text-gray-400'}`}>
                              {entry.weight < weightHistory[idx + 1].weight ? '↓' : entry.weight > weightHistory[idx + 1].weight ? '↑' : '='}{Math.abs(entry.weight - weightHistory[idx + 1].weight).toFixed(1)}
                            </span>
                          )}
                          <button onClick={() => startEditWeight(entry.id)} className="text-blue-400 px-1 text-lg">✎</button>
                          <button onClick={() => confirmDelete('weight', entry.id, `${entry.weight} kg (${entry.date})`)} className="text-red-400 px-1 text-lg">✕</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pasos Tab */}
        {activeTab === 'pasos' && (
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-bold text-emerald-400 mb-3">👟 REGISTRAR PASOS</h2>
              <input type="date" value={stepsDate} onChange={(e) => setStepsDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm mb-2" />
              <div className="flex gap-2">
                <input type="number" value={newSteps} onChange={(e) => setNewSteps(e.target.value)} placeholder="ej: 8500" className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-3 text-lg" />
                <button onClick={addStepsEntry} className="bg-cyan-600 active:bg-cyan-500 px-6 py-3 rounded font-bold">OK</button>
              </div>
            </div>

            <SimpleBarChart data={weeklyData} dataKey="steps" target={8000} color="bg-cyan-500" label="Pasos 7 días" />

            {stepsLog.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-sm font-bold text-emerald-400 mb-3">📊 HISTORIAL</h2>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {stepsLog.slice(0, 14).map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-700 text-sm">
                      <span className="text-gray-400">{entry.date}</span>
                      <span className={`font-bold ${entry.steps >= 8000 ? 'text-cyan-400' : 'text-gray-300'}`}>{entry.steps.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Oura Tab */}
        {activeTab === 'oura' && (
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h2 className="text-sm font-bold text-purple-400 mb-2">💍 REGISTRAR DATOS OURA</h2>
              <div className="space-y-2">
                <input type="date" value={newOuraEntry.date} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, date: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />

                {/* Scores - 2 cols on mobile, 3 on larger */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Sleep</label>
                    <input type="number" value={newOuraEntry.sleepScore} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, sleepScore: e.target.value })} placeholder="85" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Ready</label>
                    <input type="number" value={newOuraEntry.readinessScore} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, readinessScore: e.target.value })} placeholder="80" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Activity</label>
                    <input type="number" value={newOuraEntry.activityScore} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, activityScore: e.target.value })} placeholder="75" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">HRV</label>
                    <input type="number" value={newOuraEntry.hrv} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, hrv: e.target.value })} placeholder="45" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">RHR</label>
                    <input type="number" value={newOuraEntry.restingHr} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, restingHr: e.target.value })} placeholder="58" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Horas</label>
                    <input type="number" step="0.1" value={newOuraEntry.sleepHours} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, sleepHours: e.target.value })} placeholder="7.5" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                </div>

                {/* Sleep details - compact 2x2 grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Deep</label>
                    <input type="number" value={newOuraEntry.deepSleepMins} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, deepSleepMins: e.target.value })} placeholder="90" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">REM</label>
                    <input type="number" value={newOuraEntry.remSleepMins} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, remSleepMins: e.target.value })} placeholder="100" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Acostarse</label>
                    <input type="time" value={newOuraEntry.bedtime} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, bedtime: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Despertar</label>
                    <input type="time" value={newOuraEntry.wakeTime} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, wakeTime: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                </div>

                <button onClick={addOuraEntry} className="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded font-bold text-sm">Guardar</button>
              </div>
            </div>

            {/* Oura History - Compact */}
            {ouraLog.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <h2 className="text-sm font-bold text-purple-400 mb-2">📊 HISTORIAL</h2>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {ouraLog.slice(0, 14).map((entry, idx) => (
                    <div key={idx} className="bg-gray-700/50 rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-300 text-sm font-medium">{entry.date}</span>
                        <div className="flex gap-1.5 text-xs">
                          {entry.sleepScore && <span className="text-purple-400">😴{entry.sleepScore}</span>}
                          {entry.readinessScore && <span className="text-emerald-400">⚡{entry.readinessScore}</span>}
                          {entry.activityScore && <span className="text-amber-400">🏃{entry.activityScore}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-gray-400">
                        {entry.hrv && <span>HRV:{entry.hrv}</span>}
                        {entry.restingHr && <span>RHR:{entry.restingHr}</span>}
                        {entry.sleepHours && <span>{entry.sleepHours}h</span>}
                        {entry.bedtime && entry.wakeTime && <span>{entry.bedtime}→{entry.wakeTime}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Oura Insights - Compact */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
              <h3 className="text-xs font-bold text-purple-400 mb-1.5">💡 GUÍA RÁPIDA</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px] text-gray-300">
                <span>😴 Sleep ≥85 = óptimo</span>
                <span>⚡ Ready &lt;70 = descanso</span>
                <span>❤️ HRV = recuperación</span>
              </div>
            </div>
          </div>
        )}

        {/* Config Tab - with editable targets and debounced saving */}
        {activeTab === 'config' && (
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h2 className="text-sm font-bold text-emerald-400 mb-3">👤 PERFIL</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Peso Actual</label>
                  <input type="number" step="0.1" value={profile.currentWeight} onChange={(e) => updateConfig({ ...profile, currentWeight: parseFloat(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Peso Objetivo</label>
                  <input type="number" step="0.1" value={profile.targetWeight} onChange={(e) => updateConfig({ ...profile, targetWeight: parseFloat(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Altura (cm)</label>
                  <input type="number" value={profile.height} onChange={(e) => updateConfig({ ...profile, height: parseInt(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Edad</label>
                  <input type="number" value={profile.age} onChange={(e) => updateConfig({ ...profile, age: parseInt(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 border border-emerald-500/30">
              <h2 className="text-sm font-bold text-emerald-400 mb-3">🎯 OBJETIVOS (Rest Day)</h2>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Calorías</label>
                  <input type="number" value={customTargets.calories} onChange={(e) => updateConfig(profile, { ...customTargets, calories: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Prot (g)</label>
                  <input type="number" value={customTargets.protein} onChange={(e) => updateConfig(profile, { ...customTargets, protein: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Carbs (g)</label>
                  <input type="number" value={customTargets.carbs} onChange={(e) => updateConfig(profile, { ...customTargets, carbs: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Grasas (g)</label>
                  <input type="number" value={customTargets.fat} onChange={(e) => updateConfig(profile, { ...customTargets, fat: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Fibra (g)</label>
                  <input type="number" value={customTargets.fiber} onChange={(e) => updateConfig(profile, { ...customTargets, fiber: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 border border-amber-500/30">
              <h2 className="text-sm font-bold text-amber-400 mb-3">🏋️ TRAINING DAY</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Kcal extra</label>
                  <input type="number" value={customTargets.trainingDayCaloriesBonus} onChange={(e) => updateConfig(profile, { ...customTargets, trainingDayCaloriesBonus: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Carbs (g)</label>
                  <input type="number" value={customTargets.trainingDayCarbs} onChange={(e) => updateConfig(profile, { ...customTargets, trainingDayCarbs: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Training day: {customTargets.calories + customTargets.trainingDayCaloriesBonus} kcal, {customTargets.trainingDayCarbs}g carbs</p>
            </div>

            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-2.5">
              <p className="text-[10px] text-emerald-400">💾 Auto-save (800ms)</p>
            </div>

            {/* Export buttons - compact grid */}
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h2 className="text-sm font-bold text-gray-300 mb-3">📤 EXPORTAR</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={exportForClaude}
                  className="bg-cyan-600 active:bg-cyan-500 py-2.5 rounded font-medium text-sm flex items-center justify-center gap-1"
                >
                  🤖 Claude
                </button>
                <button
                  onClick={exportForNutritionist}
                  className="bg-pink-600 active:bg-pink-500 py-2.5 rounded font-medium text-sm flex items-center justify-center gap-1"
                >
                  🩺 Nutri
                </button>
                <button
                  onClick={exportBackup}
                  className="bg-amber-600 active:bg-amber-500 py-2.5 rounded font-medium text-sm flex items-center justify-center gap-1"
                >
                  📤 Backup
                </button>
                <label className="bg-gray-700 active:bg-gray-600 py-2.5 rounded font-medium text-sm flex items-center justify-center gap-1 cursor-pointer">
                  📥 Importar
                  <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                </label>
              </div>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                <div className="p-1.5 bg-gray-700/50 rounded">
                  <div className="text-sm font-bold text-white">{weightHistory.length}</div>
                  <div className="text-[8px] text-gray-500">Peso</div>
                </div>
                <div className="p-1.5 bg-gray-700/50 rounded">
                  <div className="text-sm font-bold text-white">{foodLog.length}</div>
                  <div className="text-[8px] text-gray-500">Comidas</div>
                </div>
                <div className="p-1.5 bg-gray-700/50 rounded">
                  <div className="text-sm font-bold text-white">{workoutLog.length}</div>
                  <div className="text-[8px] text-gray-500">Entrenos</div>
                </div>
                <div className="p-1.5 bg-gray-700/50 rounded">
                  <div className="text-sm font-bold text-white">{stepsLog.length}</div>
                  <div className="text-[8px] text-gray-500">Pasos</div>
                </div>
              </div>

              <p className="text-[9px] text-gray-500 mt-2 text-center">⚠️ Importar reemplaza TODOS los datos</p>
            </div>
          </div>
        )}
        </main>
      </PullToRefresh>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Floating Action Button */}
      {showFab && ['dashboard', 'comidas', 'entrenos'].includes(activeTab) && (
        <FloatingActionButton
          onAddFood={() => { setNewFood({ ...newFood, date: selectedFoodDate }); setShowFoodForm(true); }}
          onAddWorkout={() => { setNewWorkout({ ...newWorkout, date: selectedWorkoutDate }); setShowWorkoutForm(true); }}
          onImportFood={() => setShowImportFoodModal(true)}
          onImportWorkout={() => setShowImportWorkoutModal(true)}
          onQuickAdd={() => setShowTemplatesModal(true)}
        />
      )}

      {/* Meal Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-2 pt-8 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-sm border border-purple-500/30">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-purple-400">⭐ Favoritos</h3>
              <button onClick={() => setShowTemplatesModal(false)} className="text-gray-400 text-xl">×</button>
            </div>

            {mealTemplates.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No hay plantillas guardadas. Agregá comidas y guardalas como favoritos.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {mealTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-gray-700 rounded-lg p-3 border border-gray-600 active:bg-gray-600"
                  >
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => addFromTemplate(template)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-purple-400 uppercase">{template.meal}</span>
                        </div>
                        <h4 className="font-medium text-sm text-white">{template.name}</h4>
                        {template.description && (
                          <p className="text-[10px] text-gray-400 truncate">{template.description}</p>
                        )}
                        <div className="flex gap-2 mt-1 text-[10px]">
                          <span className="text-emerald-400">{template.calories}kcal</span>
                          <span className="text-blue-400">{template.protein}P</span>
                          <span className="text-amber-400">{template.carbs}C</span>
                          <span className="text-pink-400">{template.fat}F</span>
                        </div>
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-gray-500 active:text-red-400 p-1"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-gray-500 mt-3 text-center">
              Toca una comida para agregarla · Desliza a las comidas para guardar nuevas
            </p>
          </div>
        </div>
      )}

      {/* Save as Template Modal */}
      {showSaveTemplateModal && templateToSave && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-xs border border-purple-500/30">
            <h3 className="text-sm font-bold text-purple-400 mb-3">⭐ Guardar como Favorito</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={templateToSave.name}
                  onChange={(e) => setTemplateToSave({ ...templateToSave, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Tipo</label>
                  <select
                    value={templateToSave.meal}
                    onChange={(e) => setTemplateToSave({ ...templateToSave, meal: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm"
                  >
                    <option>Desayuno</option>
                    <option>Almuerzo</option>
                    <option>Merienda</option>
                    <option>Cena</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Calorías</label>
                  <input
                    type="number"
                    value={templateToSave.calories}
                    onChange={(e) => setTemplateToSave({ ...templateToSave, calories: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-400">
                P: {templateToSave.protein}g · C: {templateToSave.carbs}g · F: {templateToSave.fat}g
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowSaveTemplateModal(false); setTemplateToSave(null); }} className="flex-1 bg-gray-700 active:bg-gray-600 py-2.5 rounded text-sm">Cancelar</button>
              <button onClick={confirmSaveTemplate} className="flex-1 bg-purple-600 active:bg-purple-500 py-2.5 rounded text-sm font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionTracker;
