import {
    CustomTargets,
    FoodEntry,
    MealTemplate,
    OuraEntry,
    Profile,
    StepsEntry,
    WaterEntry,
    WeightEntry,
    Workout,
} from '../types/domain';
import { Tables, TablesInsert } from '../types/supabase';

type DbProfile = Tables<'profiles'>;
type DbWeight = Tables<'weight_history'>;
type DbFood = Tables<'food_log'>;
type DbWorkout = Tables<'workouts'>;
type DbSteps = Tables<'steps_log'>;
type DbOura = Tables<'oura_log'>;
type DbWater = Tables<'water_log'>;
type DbTemplate = Tables<'meal_templates'>;

// Helper to convert between localStorage format and Supabase format
export const mappers = {
    // Profile: localStorage -> Supabase
    profileToDb: (
        profile: Partial<Profile>,
        userId: string,
    ): Partial<DbProfile> => ({
        user_id: userId,
        display_name: profile.name,
        avatar_url: profile.avatar,
        height: profile.height,
        current_weight: profile.currentWeight,
        target_weight: profile.targetWeight,
        // step_goal: profile.stepGoal || 8000,
        age: profile.age,
        activity_level: profile.activityLevel,
        goal: profile.goal,
        safety_net_days: profile.safety_net_days || [],
        // Multi-user support fields
        has_oura_ring: profile.hasOuraRing,
        oura_personal_token: profile.ouraPersonalToken,
        onboarding_completed: profile.onboardingCompleted,
        tutorial_completed: profile.tutorialCompleted,
        ios_shortcuts_configured: profile.iosShortcutsConfigured,
    }),

    // Profile: Supabase -> localStorage format (for compatibility)
    profileFromDb: (dbProfile: DbProfile): Profile => ({
        id: dbProfile.id,
        userId: dbProfile.user_id,
        name: dbProfile.display_name,
        avatar: dbProfile.avatar_url,
        height: Number(dbProfile.height),
        currentWeight: Number(dbProfile.current_weight),
        targetWeight: Number(dbProfile.target_weight),
        stepGoal: 8000,
        age: dbProfile.age,
        activityLevel: dbProfile.activity_level as any,
        goal: dbProfile.goal as any,
        targetCalories: dbProfile.target_calories,
        targetProtein: dbProfile.target_protein,
        targetCarbs: dbProfile.target_carbs,
        targetFat: dbProfile.target_fat,
        targetFiber: dbProfile.target_fiber,
        trainingDayCaloriesBonus: dbProfile.training_day_calories_bonus,
        trainingDayCarbs: dbProfile.training_day_carbs,
        safety_net_days: (dbProfile as any).safety_net_days || [],
        createdAt: dbProfile.created_at || new Date().toISOString(),
        updatedAt: dbProfile.updated_at || new Date().toISOString(),
        // Multi-user support fields
        hasOuraRing: dbProfile.has_oura_ring ?? false,
        ouraPersonalToken: dbProfile.oura_personal_token ?? undefined,
        onboardingCompleted: dbProfile.onboarding_completed ?? false,
        tutorialCompleted: dbProfile.tutorial_completed ?? false,
        iosShortcutsConfigured: dbProfile.ios_shortcuts_configured ?? false,
    }),

    // Targets: localStorage -> Supabase (stored in profiles table)
    // Note: This returns partial DbProfile update object
    targetsToDb: (targets: CustomTargets): Partial<DbProfile> => ({
        target_calories: targets.calories,
        target_protein: targets.protein,
        target_carbs: targets.carbs,
        target_fat: targets.fat,
        target_fiber: targets.fiber,
        training_day_calories_bonus: targets.trainingDayCaloriesBonus,
        training_day_carbs: targets.trainingDayCarbs,
    }),

    // Targets: Supabase -> localStorage format
    targetsFromDb: (dbProfile: DbProfile): CustomTargets => ({
        calories: dbProfile.target_calories,
        protein: dbProfile.target_protein,
        carbs: dbProfile.target_carbs,
        fat: dbProfile.target_fat,
        fiber: dbProfile.target_fiber,
        trainingDayCaloriesBonus: dbProfile.training_day_calories_bonus,
        trainingDayCarbs: dbProfile.training_day_carbs,
    }),

    // Weight: localStorage -> Supabase
    weightToDb: (
        entry: Partial<WeightEntry>,
        userId: string,
    ): Partial<DbWeight> => ({
        user_id: userId,
        date: entry.date,
        weight: entry.weight,
    }),

    // Weight: Supabase -> localStorage format
    weightFromDb: (dbEntry: DbWeight): WeightEntry => ({
        id: dbEntry.id,
        date: dbEntry.date,
        weight: Number(dbEntry.weight),
        timestamp: new Date(dbEntry.created_at || Date.now()).getTime(),
    }),

    // Food: localStorage -> Supabase
    foodToDb: (entry: Partial<FoodEntry>, userId: string): Partial<DbFood> => {
        const dbEntry: Partial<DbFood> = {
            user_id: userId,
            date: entry.date,
            time: entry.time || null,
            meal: entry.meal,
            name: entry.name,
            description: entry.description || null,
            calories: entry.calories,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
            fiber: entry.fiber || 0,
            source: entry.source || 'manual',
            reviewed: entry.reviewed ?? true,
            confidence: entry.confidence ?? 1.0,
            source_id: entry.sourceId || null,
        };

        if (entry.id && !entry.id.toString().startsWith('f-')) {
            dbEntry.id = entry.id;
        }

        return dbEntry;
    },

    // Food: Supabase -> localStorage format
    foodFromDb: (dbEntry: DbFood): FoodEntry => ({
        id: dbEntry.id,
        date: dbEntry.date,
        time: dbEntry.time,
        meal: dbEntry.meal as any,
        name: dbEntry.name,
        description: dbEntry.description,
        calories: dbEntry.calories,
        protein: Number(dbEntry.protein),
        carbs: Number(dbEntry.carbs),
        fat: Number(dbEntry.fat),
        fiber: Number(dbEntry.fiber),
        source: dbEntry.source as any,
        reviewed: dbEntry.reviewed,
        confidence: Number(dbEntry.confidence),
        sourceId: dbEntry.source_id,
    }),

    // Workout: localStorage -> Supabase
    workoutToDb: (entry: Partial<Workout>, userId: string): Partial<DbWorkout> => {
        // Normalize type to valid Supabase types: 'gym', 'cardio', 'sport', 'other'
        const validTypes = ['gym', 'cardio', 'sport', 'other'];
        const typeMap: Record<string, string> = {
            tennis: 'sport',
            tenis: 'sport',
            running: 'cardio',
            swimming: 'cardio',
            cycling: 'cardio',
            yoga: 'other',
            stretching: 'other',
        };

        let normalizedType = entry.type?.toLowerCase() || 'other';
        if (!validTypes.includes(normalizedType)) {
            normalizedType = typeMap[normalizedType] || 'other';
        }

        return {
            user_id: userId,
            date: entry.date,
            type: normalizedType as 'gym' | 'cardio' | 'sport' | 'other',
            name: entry.name,
            duration: Math.round(Number(entry.duration) || 0),
            calories: Math.round(Number(entry.calories) || 0),
            volume: entry.volume ? Math.round(Number(entry.volume)) : null,
            exercises: entry.exercises as any, // Json type in DB
            notes: entry.notes || null,
        };
    },

    // Workout: Supabase -> localStorage format
    workoutFromDb: (dbEntry: DbWorkout): Workout => {
        // CRITICAL FIX: Restore 'tennis' type from 'sport' when name indicates tennis
        // Database normalizes tennis → sport, but UI/analysis expects 'tennis' type
        let displayType = dbEntry.type;
        if (dbEntry.type === 'sport') {
            const nameLower = dbEntry.name.toLowerCase();
            if (nameLower.includes('tenis') || nameLower.includes('tennis')) {
                displayType = 'tennis' as any;
            }
        }

        return {
            id: dbEntry.id,
            date: dbEntry.date,
            type: displayType as any,
            name: dbEntry.name,
            duration: dbEntry.duration,
            calories: dbEntry.calories,
            volume: dbEntry.volume,
            exercises: (dbEntry.exercises as any) || [],
            notes: dbEntry.notes,
        };
    },

    // Steps: localStorage -> Supabase
    stepsToDb: (entry: Partial<StepsEntry>, userId: string): Partial<DbSteps> => ({
        user_id: userId,
        date: entry.date,
        steps: entry.steps,
    }),

    // Steps: Supabase -> localStorage format
    stepsFromDb: (dbEntry: DbSteps): StepsEntry => ({
        id: dbEntry.id,
        date: dbEntry.date,
        steps: dbEntry.steps,
    }),

    // Oura: localStorage -> Supabase
    ouraToDb: (entry: Partial<OuraEntry>, userId: string): Partial<DbOura> => ({
        user_id: userId,
        date: entry.date,
        sleep_score: entry.sleepScore,
        readiness_score: entry.readinessScore,
        activity_score: entry.activityScore,
        hrv: entry.hrv,
        resting_hr: entry.restingHr,
        sleep_hours: entry.sleepHours,
        deep_sleep_mins: entry.deepSleepMins,
        rem_sleep_mins: entry.remSleepMins,
        // Note: DB doesn't have bedtime/wake_time columns defined in some schemas, relying on what's there
        // If they were added later, they should be here. The provided schema only showed them in mapOuraSleepDetails mapping but not prominently in CREATE TABLE in some past versions?
        // Wait, viewing supabase-schema.sql earlier:
        // ... sleep_hours, deep_sleep_mins, rem_sleep_mins, created_at
        // No bedtime/wake_time columns in oura_log table definition!
        // But they were used in ouraMappers.js...
        // I will assume they might be missing from DB or just not synced.
        // I'll leave them out of toDb if they don't exist in type DbOura (which is based on schema).
        // DbOura (Row) based on schema:
        // sleep_score, readiness_score, activity_score, hrv, resting_hr, sleep_hours, deep_sleep_mins, rem_sleep_mins.
        // So bedtime/wake_time are NOT in DB. I will NOT map them to DB.
    }),

    // Oura: Supabase -> localStorage format
    ouraFromDb: (dbEntry: DbOura): OuraEntry => ({
        id: dbEntry.id,
        date: dbEntry.date,
        sleepScore: dbEntry.sleep_score,
        readinessScore: dbEntry.readiness_score,
        activityScore: dbEntry.activity_score,
        hrv: dbEntry.hrv,
        restingHr: dbEntry.resting_hr,
        sleepHours: dbEntry.sleep_hours ? Number(dbEntry.sleep_hours) : null,
        deepSleepMins: dbEntry.deep_sleep_mins,
        remSleepMins: dbEntry.rem_sleep_mins,
        bedtime: null, // Not in DB
        wakeTime: null, // Not in DB
    }),

    // Water: localStorage -> Supabase
    waterToDb: (entry: Partial<WaterEntry>, userId: string): Partial<DbWater> => ({
        user_id: userId,
        date: entry.date,
        glasses: entry.glasses || 0,
        ml: entry.ml || (entry.glasses || 0) * 250,
    }),

    // Water: Supabase -> localStorage format
    waterFromDb: (dbEntry: DbWater): WaterEntry => ({
        id: dbEntry.id,
        date: dbEntry.date,
        glasses: dbEntry.glasses,
        ml: dbEntry.ml,
    }),

    // Template: localStorage -> Supabase
    templateToDb: (
        template: Partial<MealTemplate>,
        userId: string,
    ): Partial<DbTemplate> => ({
        user_id: userId,
        name: template.name,
        meal: template.meal,
        description: template.description || null,
        calories: template.calories || 0,
        protein: template.protein || 0,
        carbs: template.carbs || 0,
        fat: template.fat || 0,
        fiber: template.fiber || 0,
    }),

    // Template: Supabase -> localStorage format
    templateFromDb: (dbEntry: DbTemplate): MealTemplate => ({
        id: dbEntry.id,
        name: dbEntry.name,
        meal: dbEntry.meal as any,
        description: dbEntry.description,
        calories: dbEntry.calories,
        protein: Number(dbEntry.protein),
        carbs: Number(dbEntry.carbs),
        fat: Number(dbEntry.fat),
        fiber: Number(dbEntry.fiber),
    }),
};
