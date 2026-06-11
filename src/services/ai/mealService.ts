import { AIChefContext, AIChefMealTime } from '../../types/domain';
import { generateGeminiContent } from './geminiClient';

const MODEL_NAME = 'gemini-3.5-flash'; // Fast and capable for creative lists

interface MealSuggestionParams {
    remainingCalories: number;
    remainingProtein: number;
    remainingCarbs: number;
    remainingFat: number;
    language: string;
}

export interface MealSuggestion {
    name: string;
    description: string;
    macros: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    ingredients: {
        name: string;
        amount: string;
        calories: number; // Rough estimate per ingredient
    }[];
    prepTime?: number; // minutes
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface RecipeDetail {
    steps: string[];
    tips?: string;
}

// =====================================================
// SYSTEM PROMPTS - SPANISH (ARGENTINA)
// =====================================================

const SYSTEM_PROMPT_ES = `Actúa como un Nutricionista Deportivo experto en cocina ARGENTINA.
Genera 3 opciones de comida distintas que se ajusten APROXIMADAMENTE a los macros restantes del usuario.
Prioriza ingredientes típicos argentinos, fáciles de conseguir en Argentina y cocina rápida.

CONTEXTO REGIONAL (Argentina):
- Usa ingredientes disponibles en supermercados argentinos (Carrefour, Coto, Jumbo, Día)
- Incluye opciones como: carnes argentinas (bife, pollo, cerdo), lácteos (queso fresco, yogur),
  legumbres, verduras de estación, pan lactal, galletitas, frutas locales
- Marcas conocidas están bien (La Serenísima, Granix, etc.)

REGLAS:
1. Ajustarse lo mejor posible a los macros dados (permitido +-200kcal margen).
2. Si los macros son muy bajos (<200kcal), sugiere snacks pequeños.
3. Formato JSON estricto.

SCHEMA DE SALIDA:
Devuelve un array de objetos JSON:
[
  {
    "name": "Nombre del plato",
    "description": "Breve descripción",
    "macros": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
    "ingredients": [
        { "name": "Ingrediente 1", "amount": "100g", "calories": 0 }
    ]
  }
]`;

const buildContextualPromptES = (context: AIChefContext): string => {
    const parts: string[] = [];

    // Base system prompt
    parts.push(`Actúa como un Nutricionista Deportivo experto en cocina ARGENTINA.
Genera 3 opciones de comida que se ajusten a los macros y contexto del usuario.
Prioriza ingredientes típicos argentinos, fáciles de conseguir.

CONTEXTO REGIONAL (Argentina):
- Usa ingredientes de supermercados argentinos (Carrefour, Coto, Jumbo, Día)
- Marcas conocidas están bien (La Serenísima, Granix, etc.)`);

    // Meal time context
    const mealTimeMap: Record<AIChefMealTime, string> = {
        breakfast: 'DESAYUNO - opciones rápidas para empezar el día con energía',
        lunch: 'ALMUERZO - plato principal balanceado y saciante',
        snack: 'MERIENDA/SNACK - opciones ligeras para mantener energía',
        dinner: 'CENA - opciones más livianas, fáciles de digerir',
        late_night: 'NOCTURNO - snacks livianos, bajo en carbos, alto en proteína (yogur, queso, frutos secos)'
    };
    parts.push(`\nHORARIO: ${mealTimeMap[context.mealTime]}`);

    // Workout context
    if (context.isTrainingDay) {
        if (context.workoutIntensity === 'high') {
            parts.push(`\nDÍA DE ENTRENAMIENTO INTENSO:
- Prioriza CARBOHIDRATOS para recuperación muscular
- Incluye proteína de alta calidad
- Sugiere opciones con más calorías`);
        } else if (context.workoutIntensity === 'moderate') {
            parts.push(`\nDÍA DE ENTRENAMIENTO MODERADO:
- Balance carbohidratos y proteína
- Opciones que favorezcan la recuperación`);
        } else {
            parts.push(`\nDÍA DE RECUPERACIÓN/DESCANSO:
- Prioriza PROTEÍNA y vegetales
- Mantén carbohidratos moderados
- Opciones más livianas`);
        }
    }

    // Dietary restrictions
    const dietaryMap: Record<string, string> = {
        vegetarian: 'VEGETARIANO - Sin carne ni pescado, lácteos y huevos permitidos',
        vegan: 'VEGANO - Sin productos de origen animal',
        gluten_free: 'SIN GLUTEN - Evitar trigo, cebada, centeno',
        lactose_free: 'SIN LACTOSA - Evitar lácteos o usar alternativas sin lactosa'
    };
    if (context.preferences.dietaryMode !== 'standard') {
        parts.push(`\nRESTRICCIÓN DIETARIA: ${dietaryMap[context.preferences.dietaryMode]}`);
    }

    // Allergies / hard exclusions
    if (context.preferences.allergies && context.preferences.allergies.length > 0) {
        parts.push(`\nALERGIAS / EXCLUSIONES (NUNCA incluir estos ingredientes):
${context.preferences.allergies.join(', ')}`);
    }

    // Disliked meals
    if (context.preferences.dislikedMeals && context.preferences.dislikedMeals.length > 0) {
        parts.push(`\nCOMIDAS QUE NO LE GUSTAN AL USUARIO (evitar):
${context.preferences.dislikedMeals.join(', ')}`);
    }

    // Prep time preference
    const prepTimeMap: Record<string, string> = {
        quick: 'RÁPIDO (<15 min) - Opciones que no requieran mucha preparación',
        medium: 'MODERADO (15-30 min) - Platos con preparación normal',
        long: 'ELABORADO (>30 min) - Puede incluir recetas más complejas'
    };
    parts.push(`\nTIEMPO DE PREPARACIÓN: ${prepTimeMap[context.preferences.prepTime]}`);

    // Difficulty preference
    const difficultyMap: Record<string, string> = {
        easy: 'FÁCIL - Recetas simples, pocos ingredientes',
        medium: 'INTERMEDIO - Recetas estándar',
        hard: 'AVANZADO - Puede incluir técnicas más elaboradas'
    };
    parts.push(`\nDIFICULTAD: ${difficultyMap[context.preferences.difficulty]}`);

    // Rejected meals
    if (context.preferences.rejectedMeals.length > 0) {
        parts.push(`\nEVITAR ESTAS COMIDAS (el usuario las rechazó):
${context.preferences.rejectedMeals.join(', ')}`);
    }

    // Ingredients mode
    if (context.availableIngredients && context.availableIngredients.length > 0) {
        parts.push(`\nINGREDIENTES DISPONIBLES (usar SOLO estos):
${context.availableIngredients.join(', ')}
IMPORTANTE: Las recetas DEBEN usar principalmente estos ingredientes.`);
    }

    // Rules and output schema
    parts.push(`\nREGLAS:
1. IMPORTANTE: Los macros dados son específicamente para ESTA comida, NO para todo el día. No los excedas.
2. Ajustarse lo mejor posible a los macros dados (permitido +-150kcal margen).
3. Si los macros son muy bajos (<200kcal), sugiere snacks pequeños.
4. Incluir prepTime (minutos) y difficulty en cada sugerencia.
5. Formato JSON estricto.

SCHEMA DE SALIDA:
Devuelve un array de objetos JSON:
[
  {
    "name": "Nombre del plato",
    "description": "Breve descripción",
    "macros": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
    "ingredients": [
        { "name": "Ingrediente 1", "amount": "100g", "calories": 0 }
    ],
    "prepTime": 15,
    "difficulty": "easy"
  }
]`);

    return parts.join('\n');
};

// =====================================================
// SYSTEM PROMPTS - ENGLISH (US)
// =====================================================

const SYSTEM_PROMPT_EN = `Act as an expert Sports Nutritionist familiar with AMERICAN cuisine.
Generate 3 distinct meal options that roughly fit the user's remaining macros.
Prioritize healthy ingredients commonly found in US supermarkets and quick cooking.

REGIONAL CONTEXT (United States):
- Use ingredients available in US stores (Whole Foods, Trader Joe's, Walmart, Target)
- Include options like: lean proteins (chicken breast, turkey, salmon), Greek yogurt,
  whole grains, vegetables, eggs, nut butters, fruits
- American brands and products are fine (Chobani, Kind bars, etc.)

RULES:
1. Fit the given macros as closely as possible (+-200kcal margin allowed).
2. If macros are very low (<200kcal), suggest small snacks.
3. Strict JSON format.

OUTPUT SCHEMA:
Return an array of JSON objects:
[
  {
    "name": "Dish Name",
    "description": "Brief description",
    "macros": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
    "ingredients": [
        { "name": "Ingredient 1", "amount": "100g", "calories": 0 }
    ]
  }
]`;

const buildContextualPromptEN = (context: AIChefContext): string => {
    const parts: string[] = [];

    parts.push(`Act as an expert Sports Nutritionist familiar with AMERICAN cuisine.
Generate 3 meal options that fit the user's macros and context.
Prioritize healthy ingredients commonly found in US supermarkets.

REGIONAL CONTEXT (United States):
- Use ingredients from US stores (Whole Foods, Trader Joe's, Walmart, Target)
- American brands and products are fine (Chobani, Kind bars, etc.)`);

    // Meal time context
    const mealTimeMap: Record<AIChefMealTime, string> = {
        breakfast: 'BREAKFAST - quick options to start the day with energy',
        lunch: 'LUNCH - balanced, filling main dish',
        snack: 'SNACK - light options to maintain energy',
        dinner: 'DINNER - lighter options, easy to digest',
        late_night: 'LATE NIGHT - light snacks, low carb, high protein (yogurt, cheese, nuts)'
    };
    parts.push(`\nMEAL TIME: ${mealTimeMap[context.mealTime]}`);

    // Workout context
    if (context.isTrainingDay) {
        if (context.workoutIntensity === 'high') {
            parts.push(`\nHIGH INTENSITY TRAINING DAY:
- Prioritize CARBOHYDRATES for muscle recovery
- Include high-quality protein
- Suggest higher calorie options`);
        } else if (context.workoutIntensity === 'moderate') {
            parts.push(`\nMODERATE TRAINING DAY:
- Balance carbohydrates and protein
- Options that favor recovery`);
        } else {
            parts.push(`\nREST/RECOVERY DAY:
- Prioritize PROTEIN and vegetables
- Keep carbohydrates moderate
- Lighter options`);
        }
    }

    // Dietary restrictions
    const dietaryMap: Record<string, string> = {
        vegetarian: 'VEGETARIAN - No meat or fish, dairy and eggs allowed',
        vegan: 'VEGAN - No animal products',
        gluten_free: 'GLUTEN-FREE - Avoid wheat, barley, rye',
        lactose_free: 'LACTOSE-FREE - Avoid dairy or use lactose-free alternatives'
    };
    if (context.preferences.dietaryMode !== 'standard') {
        parts.push(`\nDIETARY RESTRICTION: ${dietaryMap[context.preferences.dietaryMode]}`);
    }

    // Allergies / hard exclusions
    if (context.preferences.allergies && context.preferences.allergies.length > 0) {
        parts.push(`\nALLERGIES / EXCLUSIONS (NEVER include these ingredients):
${context.preferences.allergies.join(', ')}`);
    }

    // Disliked meals
    if (context.preferences.dislikedMeals && context.preferences.dislikedMeals.length > 0) {
        parts.push(`\nMEALS THE USER DISLIKES (avoid):
${context.preferences.dislikedMeals.join(', ')}`);
    }

    // Prep time preference
    const prepTimeMap: Record<string, string> = {
        quick: 'QUICK (<15 min) - Options that don\'t require much preparation',
        medium: 'MODERATE (15-30 min) - Standard preparation dishes',
        long: 'ELABORATE (>30 min) - Can include more complex recipes'
    };
    parts.push(`\nPREP TIME: ${prepTimeMap[context.preferences.prepTime]}`);

    // Difficulty preference
    const difficultyMap: Record<string, string> = {
        easy: 'EASY - Simple recipes, few ingredients',
        medium: 'INTERMEDIATE - Standard recipes',
        hard: 'ADVANCED - Can include more elaborate techniques'
    };
    parts.push(`\nDIFFICULTY: ${difficultyMap[context.preferences.difficulty]}`);

    // Rejected meals
    if (context.preferences.rejectedMeals.length > 0) {
        parts.push(`\nAVOID THESE MEALS (user rejected them):
${context.preferences.rejectedMeals.join(', ')}`);
    }

    // Ingredients mode
    if (context.availableIngredients && context.availableIngredients.length > 0) {
        parts.push(`\nAVAILABLE INGREDIENTS (use ONLY these):
${context.availableIngredients.join(', ')}
IMPORTANT: Recipes MUST primarily use these ingredients.`);
    }

    // Rules and output schema
    parts.push(`\nRULES:
1. IMPORTANT: The macros given are specifically for THIS meal, NOT the entire day. Do not exceed them.
2. Fit the given macros as closely as possible (+-150kcal margin allowed).
3. If macros are very low (<200kcal), suggest small snacks.
4. Include prepTime (minutes) and difficulty in each suggestion.
5. Strict JSON format.

OUTPUT SCHEMA:
Return an array of JSON objects:
[
  {
    "name": "Dish Name",
    "description": "Brief description",
    "macros": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
    "ingredients": [
        { "name": "Ingredient 1", "amount": "100g", "calories": 0 }
    ],
    "prepTime": 15,
    "difficulty": "easy"
  }
]`);

    return parts.join('\n');
};

// =====================================================
// LEGACY FUNCTION (backward compatibility)
// =====================================================

export const suggestMeals = async ({
    remainingCalories,
    remainingProtein,
    remainingCarbs,
    remainingFat,
    language,
}: MealSuggestionParams): Promise<MealSuggestion[]> => {
    try {
        const prompt = language.startsWith('en')
            ? `Remaining Macros: ${Math.round(remainingCalories)}kcal, ${Math.round(remainingProtein)}g Protein, ${Math.round(remainingCarbs)}g Carbs, ${Math.round(remainingFat)}g Fat.`
            : `Macros Restantes: ${Math.round(remainingCalories)}kcal, ${Math.round(remainingProtein)}g Proteína, ${Math.round(remainingCarbs)}g Carbos, ${Math.round(remainingFat)}g Grasa.`;

        const systemInstruction = language.startsWith('en')
            ? SYSTEM_PROMPT_EN
            : SYSTEM_PROMPT_ES;

        const text = await generateGeminiContent({
            model: MODEL_NAME,
            systemInstruction,
            generationConfig: { responseMimeType: 'application/json' },
            request: prompt,
        });

        return JSON.parse(text);
    } catch (error) {
        console.error('Error getting meal suggestions:', error);
        throw new Error('Failed to generate meal suggestions.');
    }
};

// =====================================================
// NEW CONTEXT-AWARE FUNCTION
// =====================================================

export const suggestMealsWithContext = async (
    context: AIChefContext
): Promise<MealSuggestion[]> => {
    try {
        const isEnglish = context.language.startsWith('en');

        // Build user prompt with macros
        const userPrompt = isEnglish
            ? `Remaining Macros: ${Math.round(context.remainingCalories)}kcal, ${Math.round(context.remainingProtein)}g Protein, ${Math.round(context.remainingCarbs)}g Carbs, ${Math.round(context.remainingFat)}g Fat.`
            : `Macros Restantes: ${Math.round(context.remainingCalories)}kcal, ${Math.round(context.remainingProtein)}g Proteína, ${Math.round(context.remainingCarbs)}g Carbos, ${Math.round(context.remainingFat)}g Grasa.`;

        // Build contextual system prompt
        const systemInstruction = isEnglish
            ? buildContextualPromptEN(context)
            : buildContextualPromptES(context);

        const text = await generateGeminiContent({
            model: MODEL_NAME,
            systemInstruction,
            generationConfig: { responseMimeType: 'application/json' },
            request: userPrompt,
        });

        return JSON.parse(text);
    } catch (error) {
        console.error('[mealService] Error getting contextual meal suggestions:', error);
        throw new Error('Failed to generate meal suggestions.');
    }
};

// =====================================================
// INGREDIENTS-BASED SUGGESTION FUNCTION
// =====================================================

export const suggestMealsFromIngredients = async (
    ingredients: string[],
    context: Omit<AIChefContext, 'availableIngredients'>
): Promise<MealSuggestion[]> => {
    return suggestMealsWithContext({
        ...context,
        availableIngredients: ingredients,
    });
};

// =====================================================
// RECIPE INSTRUCTIONS GENERATION
// =====================================================

export const generateRecipeInstructions = async (
    suggestion: MealSuggestion,
    language: string
): Promise<RecipeDetail> => {
    try {
        const isEnglish = language.startsWith('en');

        const ingredientsList = suggestion.ingredients
            .map((i) => `${i.name} (${i.amount})`)
            .join(', ');

        const systemInstruction = isEnglish
            ? `You are a cooking instructor. Given a meal and its ingredients, generate clear step-by-step cooking instructions.
Return a JSON object with:
- "steps": array of 4-8 instruction strings (numbered steps, concise and clear)
- "tips": optional single string with a useful cooking tip

RULES:
1. Steps must be practical and actionable.
2. Keep each step to 1-2 sentences.
3. Strict JSON format only.`
            : `Sos un instructor de cocina argentino. Dado un plato y sus ingredientes, generá instrucciones paso a paso claras.
Devolvé un objeto JSON con:
- "steps": array de 4-8 strings con instrucciones (pasos numerados, concisos y claros)
- "tips": string opcional con un tip útil de cocina

REGLAS:
1. Los pasos deben ser prácticos y accionables.
2. Máximo 1-2 oraciones por paso.
3. Formato JSON estricto.`;

        const userPrompt = isEnglish
            ? `Meal: ${suggestion.name}\nDescription: ${suggestion.description}\nIngredients: ${ingredientsList}`
            : `Plato: ${suggestion.name}\nDescripción: ${suggestion.description}\nIngredientes: ${ingredientsList}`;

        const text = await generateGeminiContent({
            model: MODEL_NAME,
            systemInstruction,
            generationConfig: { responseMimeType: 'application/json' },
            request: userPrompt,
        });

        return JSON.parse(text);
    } catch (error) {
        console.error('[mealService] Error generating recipe instructions:', error);
        throw new Error('Failed to generate recipe instructions.');
    }
};

// =====================================================
// WEEKLY MEAL PLAN GENERATION
// =====================================================

import type { WeeklyMealPlanRequest, WeeklyMealPlanResponse } from '../../types/domain';

const buildWeeklyPlanPromptES = (request: WeeklyMealPlanRequest): string => {
    const { dailyTargets, goal, activityLevel, weeklyWorkouts, preferences, favoriteFoods } = request;

    const goalMap: Record<string, string> = {
        cut: 'Pérdida de grasa (déficit calórico)',
        maintain: 'Mantenimiento',
        bulk: 'Ganancia muscular (superávit calórico)'
    };

    const workoutSchedule = Array.from({ length: 7 }, (_, i) => {
        const workout = weeklyWorkouts.find(w => w.day === i);
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        if (workout) {
            const intensityMap = {
                high: 'intenso',
                moderate: 'moderado',
                recovery: 'recuperación'
            };
            return `- ${dayNames[i]}: ${workout.type || 'Entrenamiento'} (${intensityMap[workout.intensity || 'moderate']})`;
        }
        return `- ${dayNames[i]}: Descanso`;
    }).join('\n');

    const dietaryMap: Record<string, string> = {
        standard: 'Sin restricciones',
        vegetarian: 'Vegetariano',
        vegan: 'Vegano',
        gluten_free: 'Sin gluten',
        lactose_free: 'Sin lactosa'
    };

    let prompt = `Sos un nutricionista deportivo especializado en Argentina.

CONTEXTO DEL USUARIO:
- Objetivo: ${goalMap[goal]}
- Macros diarios: ${dailyTargets.calories} kcal, ${dailyTargets.protein}g prot, ${dailyTargets.carbs}g carbs, ${dailyTargets.fat}g grasas
- Nivel actividad: ${activityLevel}
- Restricción dietaria: ${dietaryMap[preferences.dietaryMode]}

ENTRENAMIENTOS ESTA SEMANA:
${workoutSchedule}
`;

    if (favoriteFoods && favoriteFoods.length > 0) {
        prompt += `\nCOMIDAS FAVORITAS DEL USUARIO (por frecuencia):
${favoriteFoods.slice(0, 10).map((f, i) => `${i + 1}. ${f}`).join('\n')}
`;
    }

    prompt += `
RESTRICCIONES:
- Evitar: ${preferences.rejectedMeals.length > 0 ? preferences.rejectedMeals.join(', ') : 'Ninguna'}
- Alergias/exclusiones (NUNCA incluir): ${preferences.exclusions && preferences.exclusions.length > 0 ? preferences.exclusions.join(', ') : 'Ninguna'}
- Tiempo de preparación: ${preferences.prepTime} (quick=15min, medium=30min, long=45min+)
- Dificultad: ${preferences.difficulty}

TAREA:
Genera un plan de comidas para 7 días (lunes a domingo) que:
1. Respete los macros diarios (±5% tolerancia)
2. En días de entrenamiento intenso: más carbs, proteína post-entreno
3. En días de descanso: reducir carbs ligeramente
4. Use comidas favoritas del usuario pero con variación
5. Evite repetir la misma comida más de 2 veces por semana
6. Considere tiempo de prep (días laborales = comidas más rápidas)
7. Incluya ingredientes típicos de Argentina (disponibles en Carrefour/Coto)

FORMATO DE SALIDA (JSON estricto):
{
  "weekPlan": {
    "2026-02-10": {
      "breakfast": [{
        "name": "Nombre de la comida",
        "items": [
          {"name": "Huevos", "amount": "3 unidades", "calories": 210},
          {"name": "Pan integral", "amount": "2 rebanadas", "calories": 140}
        ],
        "macros": {
          "calories": 350,
          "protein": 25,
          "carbs": 30,
          "fat": 12
        },
        "notes": "Opcional: tips de prep"
      }],
      "lunch": [{"name": "...", "items": [...], "macros": {...}}],
      "snack": [{"name": "...", "items": [...], "macros": {...}}],
      "dinner": [{"name": "...", "items": [...], "macros": {...}}]
    },
    ... (7 días totales desde ${request.weekStartDate})
  },
  "weekSummary": "Plan adaptado a tus entrenamientos con énfasis en proteína post-gym"
}

IMPORTANTE:
- Cada día debe tener exactamente 4 tipos de comida: breakfast, lunch, snack, dinner
- Los macros deben sumar ~${dailyTargets.calories} por día
- Incluye ingredientes específicos con cantidades (ej: "200g pechuga de pollo", no solo "pollo")
- Las comidas deben ser realistas y prácticas para preparar`;

    return prompt;
};

const buildWeeklyPlanPromptEN = (request: WeeklyMealPlanRequest): string => {
    const { dailyTargets, goal, activityLevel, weeklyWorkouts, preferences, favoriteFoods } = request;

    const goalMap: Record<string, string> = {
        cut: 'Fat loss (caloric deficit)',
        maintain: 'Maintenance',
        bulk: 'Muscle gain (caloric surplus)'
    };

    const workoutSchedule = Array.from({ length: 7 }, (_, i) => {
        const workout = weeklyWorkouts.find(w => w.day === i);
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (workout) {
            const intensityMap = {
                high: 'intense',
                moderate: 'moderate',
                recovery: 'recovery'
            };
            return `- ${dayNames[i]}: ${workout.type || 'Workout'} (${intensityMap[workout.intensity || 'moderate']})`;
        }
        return `- ${dayNames[i]}: Rest`;
    }).join('\n');

    const dietaryMap: Record<string, string> = {
        standard: 'No restrictions',
        vegetarian: 'Vegetarian',
        vegan: 'Vegan',
        gluten_free: 'Gluten-free',
        lactose_free: 'Lactose-free'
    };

    let prompt = `You are a sports nutritionist specialized in the United States.

USER CONTEXT:
- Goal: ${goalMap[goal]}
- Daily macros: ${dailyTargets.calories} kcal, ${dailyTargets.protein}g protein, ${dailyTargets.carbs}g carbs, ${dailyTargets.fat}g fat
- Activity level: ${activityLevel}
- Dietary restriction: ${dietaryMap[preferences.dietaryMode]}

WORKOUTS THIS WEEK:
${workoutSchedule}
`;

    if (favoriteFoods && favoriteFoods.length > 0) {
        prompt += `\nUSER'S FAVORITE FOODS (by frequency):
${favoriteFoods.slice(0, 10).map((f, i) => `${i + 1}. ${f}`).join('\n')}
`;
    }

    prompt += `
CONSTRAINTS:
- Avoid: ${preferences.rejectedMeals.length > 0 ? preferences.rejectedMeals.join(', ') : 'None'}
- Allergies/exclusions (NEVER include): ${preferences.exclusions && preferences.exclusions.length > 0 ? preferences.exclusions.join(', ') : 'None'}
- Prep time: ${preferences.prepTime} (quick=15min, medium=30min, long=45min+)
- Difficulty: ${preferences.difficulty}

TASK:
Generate a 7-day meal plan (Monday-Sunday) that:
1. Respects daily macros (±5% tolerance)
2. On intense training days: more carbs, post-workout protein
3. On rest days: slightly reduce carbs
4. Uses user's favorite foods with variation
5. Avoids repeating the same meal more than 2x per week
6. Considers prep time (workdays = quicker meals)
7. Includes typical US ingredients (available at Whole Foods/Trader Joe's/Walmart)

OUTPUT FORMAT (strict JSON):
{
  "weekPlan": {
    "2026-02-10": {
      "breakfast": [{
        "name": "Meal name",
        "items": [
          {"name": "Eggs", "amount": "3 units", "calories": 210},
          {"name": "Whole wheat bread", "amount": "2 slices", "calories": 140}
        ],
        "macros": {
          "calories": 350,
          "protein": 25,
          "carbs": 30,
          "fat": 12
        },
        "notes": "Optional: prep tips"
      }],
      "lunch": [{"name": "...", "items": [...], "macros": {...}}],
      "snack": [{"name": "...", "items": [...], "macros": {...}}],
      "dinner": [{"name": "...", "items": [...], "macros": {...}}]
    },
    ... (7 total days starting from ${request.weekStartDate})
  },
  "weekSummary": "Plan adapted to your workouts with emphasis on post-gym protein"
}

IMPORTANT:
- Each day must have exactly 4 meal types: breakfast, lunch, snack, dinner
- Macros should sum to ~${dailyTargets.calories} per day
- Include specific ingredients with amounts (e.g., "200g chicken breast", not just "chicken")
- Meals should be realistic and practical to prepare`;

    return prompt;
};

/**
 * Generate a full 7-day meal plan using AI
 */
export const generateWeeklyMealPlan = async (
    request: WeeklyMealPlanRequest,
    language: string
): Promise<WeeklyMealPlanResponse> => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`[mealService ${timestamp}] Generating weekly meal plan for user: ${request.userId}`);

        const systemPrompt = language === 'es'
            ? buildWeeklyPlanPromptES(request)
            : buildWeeklyPlanPromptEN(request);

        const userPrompt = language === 'es'
            ? `Genera el plan de comidas completo para 7 días siguiendo el formato JSON especificado.`
            : `Generate the complete 7-day meal plan following the specified JSON format.`;

        const text = await generateGeminiContent({
            model: MODEL_NAME,
            systemInstruction: systemPrompt,
            generationConfig: { responseMimeType: 'application/json' },
            request: userPrompt,
        });

        const parsed = JSON.parse(text);

        console.log(`[mealService ${timestamp}] ✓ Weekly meal plan generated successfully`);

        return {
            ...parsed,
            generatedAt: timestamp,
            model: MODEL_NAME,
        };
    } catch (error) {
        const timestamp = new Date().toISOString();
        console.error(`[mealService ${timestamp}] Error generating weekly meal plan:`, error);
        throw new Error('Failed to generate weekly meal plan.');
    }
};
