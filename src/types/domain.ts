import { Database } from './supabase';

// App-level interfaces (CamelCase)
// These generally match what the mappers produce from the raw DB rows.

export interface Profile {
    id: string;
    userId: string;
    name: string | null;
    avatar: string | null;
    height: number;
    currentWeight: number;
    targetWeight: number;
    stepGoal: number;
    age: number;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    goal: 'cut' | 'maintain' | 'bulk';
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    targetFiber: number;
    trainingDayCaloriesBonus: number;
    trainingDayCarbs: number;
    tdee?: number;
    createdAt: string;
    updatedAt: string;
    safety_net_days?: string[]; // Array of dates (YYYY-MM-DD) where Safety Net is active
    // Multi-user support fields
    hasOuraRing?: boolean;
    ouraPersonalToken?: string;
    onboardingCompleted?: boolean;
    tutorialCompleted?: boolean;
    iosShortcutsConfigured?: boolean;
    // Macro calculation fields (optional - used for auto-calculation)
    gender?: 'male' | 'female'; // TODO: Add to DB schema
    trainingDaysPerWeek?: number; // TODO: Add to DB schema (0-7)
    unitSystem?: 'metric' | 'imperial';
    language?: 'es' | 'en';
    // Steps tracking preferences
    stepsAutoSync?: boolean; // Enable Oura Ring auto-sync for steps (default: false)
    smartHydration?: boolean; // Enable weather-based hydration targets
    theme?: 'light' | 'dark' | 'system'; // App theme preference
}

export type UnitSystem = 'metric' | 'imperial';
export type Language = 'es' | 'en';

export const CONVERSION_CONSTANTS = {
    KG_TO_LBS: 2.20462,
    LBS_TO_KG: 0.453592,
} as const;

export interface WeightEntry {
    id: string;
    date: string;
    weight: number;
    timestamp: number;
}

// Basic types
export type MealType =
    | 'breakfast'
    | 'lunch'
    | 'snack'
    | 'dinner'
    | 'other'
    | 'preworkout'
    | 'postworkout';

export interface FoodEntry {
    id: string;
    date: string;
    time: string | null;
    meal: MealType;
    name: string;
    description: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    source: 'manual' | 'ai-photo' | 'ai-text' | 'barcode' | 'recipe' | 'template';
    reviewed: boolean;
    confidence: number;
    sourceId: string | null;
    is_safety_net_day?: boolean;
}

export interface Exercise {
    name: string;
    sets: number;
    reps: number | string;
    weight: number | string;
}

export interface Workout {
    id: string;
    date: string;
    type: 'gym' | 'cardio' | 'sport' | 'other' | 'tennis';
    name: string;
    duration: number;
    calories: number;
    volume: number | null;
    exercises: Exercise[];
    notes: string | null;
    source?: 'manual' | 'ai-text' | 'oura';
    reviewed?: boolean;
    confidence?: number;
    sourceId?: string | null;
}

export interface StepsEntry {
    id: string;
    date: string;
    steps: number;
    source?: 'manual' | 'oura' | 'ios-health';
    updatedAt?: string;
}

export interface OuraEntry {
    id: string;
    date: string;
    sleepScore: number | null;
    readinessScore: number | null;
    activityScore: number | null;
    hrv: number | null;
    restingHr: number | null;
    sleepHours: number | null;
    deepSleepMins: number | null;
    remSleepMins: number | null;
    bedtime: string | null;
    wakeTime: string | null;
}

export interface WaterEntry {
    id: string;
    date: string;
    glasses: number;
    ml: number;
    dailyTarget?: number;
    maxTemp?: number;
    weatherUnit?: 'C' | 'F';
    weatherLocation?: string;
}

export interface MealTemplate {
    id: string;
    name: string;
    meal: MealType;
    description: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    items?: FoodEntry[]; // For Combo Meals support
}

export interface CustomTargets {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    trainingDayCaloriesBonus: number;
    trainingDayCarbs: number;
}

export interface Macros {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

export interface WeightAnalytics {
    currentTrend: number | null;
    weeklyAdherence: number;
    estimatedGoalDate: string | null;
    remainingWeight: number;
}

export interface CoachInsight {
    message: string;
    description?: string;
    icon: string;
    type?: 'success' | 'warning' | 'caution' | 'info';
    gradient?: string;
}

export interface WeightProjection {
    realistTrend: number | null;
    adjustedTrend: number | null;
    remainingWeight: number;
    adherencePercent: number;
    adherenceDetails: any;
    projectedGoalDate: string | null;
    formattedGoalDate: string | null;
    weeksToGoal: string | null;
    daysToGoal: number | null;
    projectionStatus: 'goal_reached' | 'not_losing' | 'on_track';
    actualPath: Array<{ date: string; actualWeight: number }>;
    projectedPath: Array<{ date: string; projectedWeight: number }>;
    targetWeight: number;
    coachMessage: { emoji: string; text: string };
    dataPoints: number;
    daysCovered: number;
}

// =====================================================
// SOCIAL FEATURE TYPES
// =====================================================

export interface Friend {
    id: string;
    odId: string;
    name: string;
    avatar: string | null;
    friendCode: string;
    connectedAt: string;
    weeklyStats?: WeeklySummary;
}

export interface FriendRequest {
    id: string;
    fromUserId: string;
    fromName: string;
    fromAvatar: string | null;
    fromFriendCode: string;
    createdAt: string;
}

export interface WeeklySummary {
    weightDelta: number | null;
    workoutCount: number;
    consistencyStreak: number;
    avgDeficit: number;
}

export type ActivityType =
    | 'workout_logged'
    | 'weight_milestone'
    | 'streak_achieved'
    | 'goal_reached'
    | 'friend_added'
    | 'weekly_summary';

export interface ActivityItem {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string | null;
    activityType: ActivityType;
    metadata: Record<string, any>;
    createdAt: string;
    reactionCount?: number;
    hasReacted?: boolean;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    avatar: string | null;
    value: number;
    isCurrentUser: boolean;
}

export type LeaderboardMetric = 'streak' | 'workouts' | 'weight' | 'deficit';

export interface Friendship {
    id: string;
    userId: string;
    friendId: string;
    status: 'pending' | 'accepted' | 'blocked';
    createdAt: string;
    acceptedAt: string | null;
}

export type ChallengeType =
    | 'step_count'
    | 'workout_frequency'
    | 'calorie_deficit'
    | 'distance';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: ChallengeType;
    startDate: string;
    endDate: string;
    target: number;
    unit: string;
    participants: ChallengeParticipant[];
    status: 'active' | 'upcoming' | 'ended';
    image?: string;
}

export interface ChallengeParticipant {
    userId: string;
    avatar: string | null;
    name: string;
    progress: number; // Current value vs target
    rank?: number;
}

export interface SocialGroup {
    id: string;
    name: string;
    description: string;
    members: string[]; // user IDs
    image?: string;
    isPrivate: boolean;
    code?: string; // Invite code
}

// =====================================================
// PROGRESS PHOTOS & BODY MEASUREMENTS
// =====================================================

export type PhotoAngle = 'front' | 'side' | 'back' | 'other';

export interface ProgressPhoto {
    id: string;
    date: string;
    photoUrl: string;
    thumbnailUrl?: string;
    angle?: PhotoAngle;
    notes?: string;
    weight?: number; // Weight at time of photo
    createdAt: string;
    updatedAt?: string;
}

export interface BodyMeasurement {
    id: string;
    date: string;
    // Upper body (cm)
    chest?: number;
    shoulders?: number;
    bicepsLeft?: number;
    bicepsRight?: number;
    forearmLeft?: number;
    forearmRight?: number;
    // Core (cm)
    waist?: number;
    hips?: number;
    // Lower body (cm)
    thighLeft?: number;
    thighRight?: number;
    calfLeft?: number;
    calfRight?: number;
    // Additional
    neck?: number;
    bodyFatPercent?: number;
    notes?: string;
    createdAt: string;
    updatedAt?: string;
}

// =====================================================
// AI CHEF FEATURE TYPES
// =====================================================

export type DietaryMode = 'standard' | 'vegetarian' | 'vegan' | 'gluten_free' | 'lactose_free';
export type PrepTime = 'quick' | 'medium' | 'long'; // <15min, 15-30min, >30min
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AIChefMealTime = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'late_night';

export interface AIChefPreferences {
    dietaryMode: DietaryMode;
    prepTime: PrepTime;
    difficulty: Difficulty;
    rejectedMeals: string[]; // Meal names to avoid
    rejectedMealsExpiry: number; // Timestamp when rejected meals list should be cleared (30 days)
}

export interface AIChefContext {
    // Time context
    mealTime: AIChefMealTime;
    currentHour: number;

    // Remaining macros
    remainingCalories: number;
    remainingProtein: number;
    remainingCarbs: number;
    remainingFat: number;

    // Workout context
    isTrainingDay: boolean;
    workoutIntensity?: 'high' | 'moderate' | 'recovery' | null;

    // User preferences
    preferences: AIChefPreferences;

    // Ingredient mode (optional)
    availableIngredients?: string[];

    // Language
    language: string;
}
