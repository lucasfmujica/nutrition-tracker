/**
 * Supabase Database Types for LukenFit
 * These match the schema defined in supabase-schema.sql
 */

/**
 * @typedef {Object} Profile
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to auth.users
 * @property {string|null} display_name
 * @property {string|null} avatar_url
 * @property {number} height - Height in cm
 * @property {number} current_weight - Current weight in kg
 * @property {number} target_weight - Target weight in kg
 * @property {number} step_goal - Daily step goal
 * @property {number} age - Age in years
 * @property {'sedentary'|'light'|'moderate'|'active'|'very_active'} activity_level
 * @property {'cut'|'maintain'|'bulk'} goal
 * @property {number} target_calories
 * @property {number} target_protein
 * @property {number} target_carbs
 * @property {number} target_fat
 * @property {number} target_fiber
 * @property {number} training_day_calories_bonus
 * @property {number} training_day_carbs
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} WeightEntry
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to auth.users
 * @property {string} date - YYYY-MM-DD format
 * @property {number} weight - Weight in kg
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} FoodEntry
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to auth.users
 * @property {string} date - YYYY-MM-DD format
 * @property {string|null} time - HH:MM format
 * @property {'Desayuno'|'Almuerzo'|'Merienda'|'Cena'|'Snack'|'Pre-entreno'|'Post-entreno'} meal
 * @property {string} name - Food name
 * @property {string|null} description - Additional details
 * @property {number} calories
 * @property {number} protein - grams
 * @property {number} carbs - grams
 * @property {number} fat - grams
 * @property {number} fiber - grams
 * @property {'manual'|'ai-photo'|'ai-text'|'barcode'|'recipe'} source
 * @property {boolean} reviewed - Whether AI entry was reviewed
 * @property {number} confidence - 0-1 confidence score
 * @property {string|null} source_id - Reference ID for source
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} Exercise
 * @property {string} name - Exercise name
 * @property {number} sets - Number of sets
 * @property {number|string} reps - Reps per set (can be range like "8-12")
 * @property {number|string} weight - Weight in kg (can be range)
 */

/**
 * @typedef {Object} Workout
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to auth.users
 * @property {string} date - YYYY-MM-DD format
 * @property {'gym'|'cardio'|'sport'|'other'} type
 * @property {string} name - Workout name
 * @property {number} duration - Duration in minutes
 * @property {number} calories - Calories burned
 * @property {number|null} volume - Total volume in kg
 * @property {Exercise[]} exercises - Array of exercises
 * @property {string|null} notes
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} StepsEntry
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to auth.users
 * @property {string} date - YYYY-MM-DD format
 * @property {number} steps - Step count
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} OuraEntry
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to auth.users
 * @property {string} date - YYYY-MM-DD format
 * @property {number|null} sleep_score - 0-100
 * @property {number|null} readiness_score - 0-100
 * @property {number|null} activity_score - 0-100
 * @property {number|null} hrv - Heart Rate Variability in ms
 * @property {number|null} resting_hr - Resting heart rate in BPM
 * @property {number|null} sleep_hours - Total sleep in hours
 * @property {number|null} deep_sleep_mins
 * @property {number|null} rem_sleep_mins
 * @property {string} created_at - ISO timestamp
 */

// Helper to convert between localStorage format and Supabase format
export const mappers = {
  // Profile: localStorage -> Supabase
  profileToDb: (profile, userId) => ({
    user_id: userId,
    display_name: profile.name,
    avatar_url: profile.avatar,
    height: profile.height,
    current_weight: profile.currentWeight,
    target_weight: profile.targetWeight,
    step_goal: profile.stepGoal || 8000,
    age: profile.age,
    activity_level: profile.activityLevel,
    goal: profile.goal,
  }),

  // Profile: Supabase -> localStorage format (for compatibility)
  profileFromDb: (dbProfile) => ({
    name: dbProfile.display_name,
    avatar: dbProfile.avatar_url,
    height: dbProfile.height,
    currentWeight: dbProfile.current_weight,
    targetWeight: dbProfile.target_weight,
    stepGoal: dbProfile.step_goal || 8000,
    age: dbProfile.age,
    activityLevel: dbProfile.activity_level,
    goal: dbProfile.goal,
  }),


  // Targets: localStorage -> Supabase (stored in profiles table)
  targetsToDb: (targets) => ({
    target_calories: targets.calories,
    target_protein: targets.protein,
    target_carbs: targets.carbs,
    target_fat: targets.fat,
    target_fiber: targets.fiber,
    training_day_calories_bonus: targets.trainingDayCaloriesBonus,
    training_day_carbs: targets.trainingDayCarbs,
  }),

  // Targets: Supabase -> localStorage format
  targetsFromDb: (dbProfile) => ({
    calories: dbProfile.target_calories,
    protein: dbProfile.target_protein,
    carbs: dbProfile.target_carbs,
    fat: dbProfile.target_fat,
    fiber: dbProfile.target_fiber,
    trainingDayCaloriesBonus: dbProfile.training_day_calories_bonus,
    trainingDayCarbs: dbProfile.training_day_carbs,
  }),

  // Weight: localStorage -> Supabase
  weightToDb: (entry, userId) => ({
    user_id: userId,
    date: entry.date,
    weight: entry.weight,
  }),

  // Weight: Supabase -> localStorage format
  weightFromDb: (dbEntry) => ({
    id: dbEntry.id,
    date: dbEntry.date,
    weight: parseFloat(dbEntry.weight),
    timestamp: new Date(dbEntry.created_at).getTime(),
  }),

  // Food: localStorage -> Supabase
  foodToDb: (entry, userId) => ({
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
  }),

  // Food: Supabase -> localStorage format
  foodFromDb: (dbEntry) => ({
    id: dbEntry.id,
    date: dbEntry.date,
    time: dbEntry.time,
    meal: dbEntry.meal,
    name: dbEntry.name,
    description: dbEntry.description,
    calories: dbEntry.calories,
    protein: parseFloat(dbEntry.protein),
    carbs: parseFloat(dbEntry.carbs),
    fat: parseFloat(dbEntry.fat),
    fiber: parseFloat(dbEntry.fiber),
    source: dbEntry.source,
    reviewed: dbEntry.reviewed,
    confidence: parseFloat(dbEntry.confidence),
    sourceId: dbEntry.source_id,
  }),

  // Workout: localStorage -> Supabase
  workoutToDb: (entry, userId) => {
    // Normalize type to valid Supabase types: 'gym', 'cardio', 'sport', 'other'
    const validTypes = ['gym', 'cardio', 'sport', 'other'];
    const typeMap = {
      'tennis': 'sport',
      'tenis': 'sport',
      'running': 'cardio',
      'swimming': 'cardio',
      'cycling': 'cardio',
      'yoga': 'other',
      'stretching': 'other',
    };

    let normalizedType = entry.type?.toLowerCase() || 'other';
    if (!validTypes.includes(normalizedType)) {
      normalizedType = typeMap[normalizedType] || 'other';
    }

    return {
      user_id: userId,
      date: entry.date,
      type: normalizedType,
      name: entry.name,
      duration: Math.round(Number(entry.duration) || 0),
      calories: Math.round(Number(entry.calories) || 0),
      volume: entry.volume ? Math.round(Number(entry.volume)) : null,
      exercises: entry.exercises || [],
      notes: entry.notes || null,
    };
  },

  // Workout: Supabase -> localStorage format
  workoutFromDb: (dbEntry) => {
    // CRITICAL FIX: Restore 'tennis' type from 'sport' when name indicates tennis
    // Database normalizes tennis → sport, but UI/analysis expects 'tennis' type
    let displayType = dbEntry.type;
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
      exercises: dbEntry.exercises || [],
      notes: dbEntry.notes,
    };
  },

  // Steps: localStorage -> Supabase
  stepsToDb: (entry, userId) => ({
    user_id: userId,
    date: entry.date,
    steps: entry.steps,
  }),

  // Steps: Supabase -> localStorage format
  stepsFromDb: (dbEntry) => ({
    id: dbEntry.id,
    date: dbEntry.date,
    steps: dbEntry.steps,
  }),

  // Oura: localStorage -> Supabase
  ouraToDb: (entry, userId) => ({
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
    bedtime: entry.bedtime || null,
    wake_time: entry.wakeTime || null,
  }),

  // Oura: Supabase -> localStorage format
  ouraFromDb: (dbEntry) => ({
    id: dbEntry.id,
    date: dbEntry.date,
    sleepScore: dbEntry.sleep_score,
    readinessScore: dbEntry.readiness_score,
    activityScore: dbEntry.activity_score,
    hrv: dbEntry.hrv,
    restingHr: dbEntry.resting_hr,
    sleepHours: dbEntry.sleep_hours ? parseFloat(dbEntry.sleep_hours) : null,
    deepSleepMins: dbEntry.deep_sleep_mins,
    remSleepMins: dbEntry.rem_sleep_mins,
    bedtime: dbEntry.bedtime || null,
    wakeTime: dbEntry.wake_time || null,
  }),

  // Water: localStorage -> Supabase
  waterToDb: (entry, userId) => ({
    user_id: userId,
    date: entry.date,
    glasses: entry.glasses || 0,
    ml: entry.ml || (entry.glasses || 0) * 250,
  }),

  // Water: Supabase -> localStorage format
  waterFromDb: (dbEntry) => ({
    id: dbEntry.id,
    date: dbEntry.date,
    glasses: dbEntry.glasses,
    ml: dbEntry.ml,
  }),
};
