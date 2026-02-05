import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIChefContext, AIChefMealTime } from '../../types/domain';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const MODEL_NAME = 'gemini-3-flash-preview'; // Fast and capable for creative lists

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
1. Ajustarse lo mejor posible a los macros dados (permitido +-150kcal margen).
2. Si los macros son muy bajos (<200kcal), sugiere snacks pequeños.
3. Incluir prepTime (minutos) y difficulty en cada sugerencia.
4. Formato JSON estricto.

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
1. Fit the given macros as closely as possible (+-150kcal margin allowed).
2. If macros are very low (<200kcal), suggest small snacks.
3. Include prepTime (minutes) and difficulty in each suggestion.
4. Strict JSON format.

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

        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction,
            generationConfig: {
                responseMimeType: 'application/json',
            },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

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

        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction,
            generationConfig: {
                responseMimeType: 'application/json',
            },
        });

        const result = await model.generateContent(userPrompt);
        const response = await result.response;
        const text = response.text();

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
