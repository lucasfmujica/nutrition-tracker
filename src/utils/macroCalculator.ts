/**
 * macroCalculator.ts
 *
 * Shared macro calculation utilities based on scientific evidence
 * Used by OnboardingWizard and ConfigTab for auto-calculating targets
 *
 * IMPROVEMENTS IMPLEMENTED:
 * 1. ✅ Deficit/surplus as % of TDEE (not fixed 500 kcal)
 * 2. ✅ Minimum fat per kg body weight (hormonal health)
 * 3. ✅ Increased fat % from 28% to 30%
 *
 * SCIENTIFIC BASIS:
 * - BMR: Mifflin-St Jeor equation (most accurate for general population)
 * - Protein: 1.8-2.2g/kg (evidence-based for muscle preservation/growth)
 * - Fat: Minimum 0.7-0.8g/kg (essential for hormones)
 * - Deficit: 20% for sustainable weight loss (avoids metabolic adaptation)
 * - Surplus: 10% for lean muscle gain (minimizes fat gain)
 */

interface MacroCalculationParams {
    weight: number; // kg
    height: number; // cm
    age: number; // years
    gender: 'male' | 'female';
    trainingDaysPerWeek: number; // 0-7
    primaryGoal: 'lose' | 'maintain' | 'gain';
}

interface MacroResult {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

/**
 * Calculate activity multiplier based on training days per week
 */
export const getActivityMultiplier = (trainingDays: number): number => {
    if (trainingDays <= 1) return 1.2; // sedentary
    if (trainingDays <= 2) return 1.375; // light
    if (trainingDays <= 4) return 1.55; // moderate
    if (trainingDays <= 6) return 1.725; // active
    return 1.9; // very_active
};

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * Most accurate formula for general population
 */
export const calculateBMR = (
    weight: number,
    height: number,
    age: number,
    isMale: boolean,
): number => {
    return isMale
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
export const calculateTDEE = (bmr: number, activityMultiplier: number): number => {
    return bmr * activityMultiplier;
};

/**
 * Adjust calories based on goal
 * IMPROVEMENT: Uses % of TDEE instead of fixed deficit/surplus
 */
export const adjustCaloriesForGoal = (
    tdee: number,
    goal: 'lose' | 'maintain' | 'gain',
): number => {
    switch (goal) {
        case 'lose':
            // 20% deficit (sustainable, preserves muscle)
            return Math.round(tdee * 0.8);
        case 'gain':
            // 10% surplus (lean muscle gain, minimal fat)
            return Math.round(tdee * 1.1);
        case 'maintain':
        default:
            return Math.round(tdee);
    }
};

/**
 * Calculate protein target based on weight and goal
 * Evidence-based ranges for muscle preservation/growth
 */
export const calculateProtein = (
    weight: number,
    goal: 'lose' | 'maintain' | 'gain',
): number => {
    let proteinPerKg = 1.8; // maintain baseline
    if (goal === 'lose') proteinPerKg = 2.0; // preserve muscle in deficit
    if (goal === 'gain') proteinPerKg = 2.0; // muscle building

    return Math.round(weight * proteinPerKg);
};

/**
 * Calculate fat target with minimum threshold for hormonal health
 * IMPROVEMENT: Ensures minimum fat per kg body weight
 */
export const calculateFat = (
    weight: number,
    calories: number,
    isMale: boolean,
): number => {
    const minFatGrams = weight * (isMale ? 0.7 : 0.8); // Minimum by sex
    const fatFromPercent = (calories * 0.3) / 9; // 30% of total calories

    return Math.round(Math.max(fatFromPercent, minFatGrams));
};

/**
 * Calculate carbs as remainder of calories
 */
export const calculateCarbs = (
    calories: number,
    proteinCalories: number,
    fatCalories: number,
): number => {
    const carbCalories = calories - proteinCalories - fatCalories;
    return Math.max(Math.round(carbCalories / 4), 0); // No negative carbs
};

/**
 * Main function: Calculate all macros based on profile
 */
export const calculateMacros = (params: MacroCalculationParams): MacroResult => {
    const { weight, height, age, gender, trainingDaysPerWeek, primaryGoal } = params;

    const isMale = gender === 'male';

    // 1. Calculate BMR (Mifflin-St Jeor)
    const bmr = calculateBMR(weight, height, age, isMale);

    // 2. Get activity multiplier
    const activityMultiplier = getActivityMultiplier(trainingDaysPerWeek);

    // 3. Calculate TDEE
    const tdee = calculateTDEE(bmr, activityMultiplier);

    // 4. Adjust calories for goal
    const calories = adjustCaloriesForGoal(tdee, primaryGoal);

    // 5. Calculate protein
    const protein = calculateProtein(weight, primaryGoal);
    const proteinCalories = protein * 4;

    // 6. Calculate fat (with minimum threshold)
    const fat = calculateFat(weight, calories, isMale);
    const fatCalories = fat * 9;

    // 7. Calculate carbs (remainder)
    const carbs = calculateCarbs(calories, proteinCalories, fatCalories);

    return {
        calories,
        protein,
        carbs,
        fat,
    };
};
