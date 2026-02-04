import { Database } from '../types/supabase';

type Tables = Database['public']['Tables'];

export const mappers = {
    // Profile: localStorage -> Supabase
    profileToDb: (profile: any, userId: string): Tables['profiles']['Insert'] => ({
        user_id: userId,
        display_name: profile.name,
        avatar_url: profile.avatar,
        height: profile.height,
        current_weight: profile.currentWeight,
        target_weight: profile.targetWeight,
        step_goal: profile.stepGoal || 8000,
        activity_level: profile.activityLevel,
        goal: profile.goal,
        smart_hydration: profile.smartHydration ?? true,
    }),

    // Profile: Supabase -> localStorage format (for compatibility)
    profileFromDb: (dbProfile: Tables['profiles']['Row']) => ({
        name: dbProfile.display_name,
        avatar: dbProfile.avatar_url,
        height: dbProfile.height,
        currentWeight: dbProfile.current_weight,
        targetWeight: dbProfile.target_weight,
        stepGoal: dbProfile.step_goal || 8000,
        age: dbProfile.age,
        activityLevel: dbProfile.activity_level,
        goal: dbProfile.goal,
        smartHydration: dbProfile.smart_hydration ?? true,
    }),

    // Targets: localStorage -> Supabase (stored in profiles table)
    targetsToDb: (targets: any): Partial<Tables['profiles']['Update']> => ({
        target_calories: targets.calories,
        target_protein: targets.protein,
        target_carbs: targets.carbs,
        target_fat: targets.fat,
        target_fiber: targets.fiber,
        training_day_calories_bonus: targets.trainingDayCaloriesBonus,
        training_day_carbs: targets.trainingDayCarbs,
    }),

    // Targets: Supabase -> localStorage format
    targetsFromDb: (dbProfile: Tables['profiles']['Row']) => ({
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
        entry: any,
        userId: string,
    ): Tables['weight_history']['Insert'] => ({
        user_id: userId,
        date: entry.date!,
        weight: entry.weight,
    }),

    // Weight: Supabase -> localStorage format
    weightFromDb: (dbEntry: Tables['weight_history']['Row']) => ({
        id: dbEntry.id,
        date: dbEntry.date,
        weight:
            typeof dbEntry.weight === 'string'
                ? parseFloat(dbEntry.weight)
                : dbEntry.weight,
        timestamp: dbEntry.created_at
            ? new Date(dbEntry.created_at).getTime()
            : Date.now(),
    }),

    // Food: localStorage -> Supabase
    foodToDb: (entry: any, userId: string): Tables['food_log']['Insert'] => ({
        user_id: userId,
        date: entry.date!,
        time: entry.time || null,
        meal: entry.meal!,
        name: entry.name!,
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
    }),

    // Food: Supabase -> localStorage format
    foodFromDb: (dbEntry: Tables['food_log']['Row']) => ({
        id: dbEntry.id,
        date: dbEntry.date,
        time: dbEntry.time,
        meal: dbEntry.meal,
        name: dbEntry.name,
        description: dbEntry.description,
        calories: dbEntry.calories,
        protein:
            typeof dbEntry.protein === 'string'
                ? parseFloat(dbEntry.protein)
                : dbEntry.protein,
        carbs:
            typeof dbEntry.carbs === 'string'
                ? parseFloat(dbEntry.carbs)
                : dbEntry.carbs,
        fat: typeof dbEntry.fat === 'string' ? parseFloat(dbEntry.fat) : dbEntry.fat,
        fiber:
            typeof dbEntry.fiber === 'string'
                ? parseFloat(dbEntry.fiber)
                : dbEntry.fiber,
        source: dbEntry.source,
        reviewed: dbEntry.reviewed,
        confidence:
            typeof dbEntry.confidence === 'string'
                ? parseFloat(dbEntry.confidence)
                : dbEntry.confidence,
        sourceId: dbEntry.source_id,
    }),

    // Workout: localStorage -> Supabase
    workoutToDb: (entry: any, userId: string): Tables['workouts']['Insert'] => {
        // Normalize type to valid Supabase types: 'gym', 'cardio', 'sport', 'other'
        const validTypes = ['gym', 'cardio', 'sport', 'other'] as const;
        const typeMap: Record<string, (typeof validTypes)[number]> = {
            tennis: 'sport',
            tenis: 'sport',
            running: 'cardio',
            swimming: 'cardio',
            cycling: 'cardio',
            yoga: 'other',
            stretching: 'other',
        };

        let normalizedType: (typeof validTypes)[number] = 'other';
        const entryType = entry.type?.toLowerCase() || 'other';

        if (validTypes.includes(entryType as any)) {
            normalizedType = entryType as (typeof validTypes)[number];
        } else {
            normalizedType = typeMap[entryType] || 'other';
        }

        return {
            user_id: userId,
            date: entry.date!,
            type: normalizedType,
            name: entry.name!,
            duration: Math.round(Number(entry.duration) || 0),
            calories: Math.round(Number(entry.calories) || 0),
            volume: entry.volume ? Math.round(Number(entry.volume)) : null,
            exercises: entry.exercises || [],
            notes: entry.notes || null,
        };
    },

    // Workout: Supabase -> localStorage format
    workoutFromDb: (dbEntry: Tables['workouts']['Row']) => {
        // CRITICAL FIX: Restore 'tennis' type from 'sport' when name indicates tennis
        // Database normalizes tennis → sport, but UI/analysis expects 'tennis' type
        let displayType: string = dbEntry.type;
        if (dbEntry.type === 'sport') {
            const nameLower = dbEntry.name.toLowerCase();
            if (nameLower.includes('tenis') || nameLower.includes('tennis')) {
                displayType = 'tennis';
            }
        }

        return {
            id: dbEntry.id,
            date: dbEntry.date,
            type: displayType,
            name: dbEntry.name,
            duration: dbEntry.duration,
            calories: dbEntry.calories,
            volume: dbEntry.volume,
            exercises: (dbEntry.exercises as any) || [],
            notes: dbEntry.notes,
        };
    },

    // Steps: localStorage -> Supabase
    stepsToDb: (entry: any, userId: string): Tables['steps_log']['Insert'] => ({
        user_id: userId,
        date: entry.date!,
        steps: entry.steps,
    }),

    // Steps: Supabase -> localStorage format
    stepsFromDb: (dbEntry: Tables['steps_log']['Row']) => ({
        id: dbEntry.id,
        date: dbEntry.date,
        steps: dbEntry.steps,
    }),

    // Oura: localStorage -> Supabase
    ouraToDb: (entry: any, userId: string): Tables['oura_log']['Insert'] => ({
        user_id: userId,
        date: entry.date!,
        sleep_score: entry.sleepScore,
        readiness_score: entry.readinessScore,
        activity_score: entry.activityScore,
        hrv: entry.hrv,
        resting_hr: entry.restingHr,
        sleep_hours: entry.sleepHours,
        deep_sleep_mins: entry.deepSleepMins,
        rem_sleep_mins: entry.rem_sleep_mins,
    }),

    // Oura: Supabase -> localStorage format
    ouraFromDb: (dbEntry: Tables['oura_log']['Row']) => ({
        id: dbEntry.id,
        date: dbEntry.date,
        sleepScore: dbEntry.sleep_score,
        readinessScore: dbEntry.readiness_score,
        activityScore: dbEntry.activity_score,
        hrv: dbEntry.hrv,
        restingHr: dbEntry.resting_hr,
        sleepHours: dbEntry.sleep_hours
            ? typeof dbEntry.sleep_hours === 'string'
                ? parseFloat(dbEntry.sleep_hours)
                : dbEntry.sleep_hours
            : null,
        deepSleepMins: dbEntry.deep_sleep_mins,
        remSleepMins: dbEntry.rem_sleep_mins,
    }),

    // Water: localStorage -> Supabase
    waterToDb: (entry: any, userId: string): Tables['water_log']['Insert'] => ({
        user_id: userId,
        date: entry.date!,
        glasses: entry.glasses || 0,
        ml: entry.ml || (entry.glasses || 0) * 250,
        daily_target: entry.dailyTarget || null,
        max_temp: entry.maxTemp || null,
        weather_unit: entry.weatherUnit || null,
        weather_location: entry.weatherLocation || null,
    }),

    // Water: Supabase -> localStorage format
    waterFromDb: (dbEntry: Tables['water_log']['Row']) => ({
        id: dbEntry.id,
        date: dbEntry.date,
        glasses: dbEntry.glasses,
        ml: dbEntry.ml,
        dailyTarget: dbEntry.daily_target || undefined,
        maxTemp: dbEntry.max_temp || undefined,
        weatherUnit: (dbEntry.weather_unit as 'C' | 'F') || undefined,
        weatherLocation: dbEntry.weather_location || undefined,
    }),

    // Template: localStorage -> Supabase
    templateToDb: (
        template: any,
        userId: string,
    ): Tables['meal_templates']['Insert'] => ({
        user_id: userId,
        name: template.name!,
        meal: template.meal!,
        description: template.description || null,
        calories: template.calories || 0,
        protein: template.protein || 0,
        carbs: template.carbs || 0,
        fat: template.fat || 0,
        fiber: template.fiber || 0,
    }),

    // Template: Supabase -> localStorage format
    templateFromDb: (dbEntry: Tables['meal_templates']['Row']) => ({
        id: dbEntry.id,
        name: dbEntry.name,
        meal: dbEntry.meal,
        description: dbEntry.description,
        calories: dbEntry.calories,
        protein:
            typeof dbEntry.protein === 'string'
                ? parseFloat(dbEntry.protein)
                : dbEntry.protein,
        carbs:
            typeof dbEntry.carbs === 'string'
                ? parseFloat(dbEntry.carbs)
                : dbEntry.carbs,
        fat: typeof dbEntry.fat === 'string' ? parseFloat(dbEntry.fat) : dbEntry.fat,
        fiber:
            typeof dbEntry.fiber === 'string'
                ? parseFloat(dbEntry.fiber)
                : dbEntry.fiber,
    }),
};
