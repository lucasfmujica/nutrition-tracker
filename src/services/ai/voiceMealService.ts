/**
 * Voice Meal Service
 * Parses a free-text meal description (from voice dictation or typed text)
 * into structured food items with estimated macros, using Gemini via the
 * server-side proxy (geminiClient).
 */
import { generateGeminiContent } from './geminiClient';

const MODEL_NAME = 'gemini-3.5-flash';

export type ParsedMealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface ParsedFoodItem {
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealType: ParsedMealType;
}

export interface ParsedMealResult {
    items: ParsedFoodItem[];
    mealName: string;
    mealType: ParsedMealType;
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

const VALID_MEAL_TYPES: ParsedMealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

const buildSystemPrompt = (language: string, localHour: number): string => {
    const isEnglish = language.startsWith('en');

    if (isEnglish) {
        return `You are a nutrition assistant. The user describes (by voice) what they ate in plain language.
Parse the description into individual food items with estimated macros (typical US portions).
Current local hour of the user: ${localHour} (0-23). Use it to suggest the meal type:
6-10 breakfast, 11-15 lunch, 16-19 snack, otherwise dinner — unless the user explicitly says otherwise (e.g. "for breakfast").

RULES:
1. Estimate realistic macros per item based on the stated quantity (or a typical portion if not stated).
2. quantity is a short human string, e.g. "2 units", "1 slice", "100g".
3. mealType must be one of: breakfast, lunch, snack, dinner.
4. mealName: short name summarizing the whole meal.
5. If the text does NOT describe food, return {"items": []}.
6. Strict JSON only, no markdown.

OUTPUT SCHEMA:
{
  "mealName": "Eggs and toast",
  "mealType": "breakfast",
  "items": [
    {"name": "Eggs", "quantity": "2 units", "calories": 140, "protein": 12, "carbs": 1, "fat": 10, "mealType": "breakfast"}
  ]
}`;
    }

    return `Sos un asistente de nutrición. El usuario describe (por voz) lo que comió en lenguaje natural (español de Argentina, ej: "comí 2 huevos y una tostada con palta").
Parseá la descripción en alimentos individuales con macros estimados (porciones típicas argentinas).
Hora local actual del usuario: ${localHour} (0-23). Usala para sugerir el tipo de comida:
6-10 breakfast, 11-15 lunch, 16-19 snack, resto dinner — salvo que el usuario diga explícitamente otra cosa (ej: "de desayuno").

REGLAS:
1. Estimá macros realistas por ítem según la cantidad dicha (o porción típica si no se especifica).
2. quantity es un string corto, ej: "2 unidades", "1 rebanada", "100g".
3. mealType debe ser uno de: breakfast, lunch, snack, dinner.
4. mealName: nombre corto que resuma la comida completa.
5. Si el texto NO describe comida, devolvé {"items": []}.
6. Solo JSON estricto, sin markdown.

SCHEMA DE SALIDA:
{
  "mealName": "Huevos con tostada de palta",
  "mealType": "breakfast",
  "items": [
    {"name": "Huevos", "quantity": "2 unidades", "calories": 140, "protein": 12, "carbs": 1, "fat": 10, "mealType": "breakfast"}
  ]
}`;
};

const toNumber = (value: unknown): number => {
    const n = typeof value === 'string' ? parseFloat(value) : Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
};

const sanitizeMealType = (value: unknown, fallback: ParsedMealType): ParsedMealType =>
    VALID_MEAL_TYPES.includes(value as ParsedMealType)
        ? (value as ParsedMealType)
        : fallback;

const defaultMealTypeForHour = (hour: number): ParsedMealType => {
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 20) return 'snack';
    return 'dinner';
};

/**
 * Parse a free-text meal description into structured food items with macros.
 * @throws Error('NO_FOOD_DETECTED') when the text doesn't describe any food.
 * @throws Error on network/AI/parsing failures.
 */
export const parseMealFromText = async (
    text: string,
    language: string,
): Promise<ParsedMealResult> => {
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error('NO_FOOD_DETECTED');
    }

    const localHour = new Date().getHours();
    const fallbackMealType = defaultMealTypeForHour(localHour);

    const responseText = await generateGeminiContent({
        model: MODEL_NAME,
        systemInstruction: buildSystemPrompt(language, localHour),
        generationConfig: { responseMimeType: 'application/json' },
        request: trimmed,
    });

    let parsed: any;
    try {
        parsed = JSON.parse(responseText);
    } catch (err) {
        console.error('[voiceMealService] Invalid JSON from AI:', err, responseText);
        throw new Error('PARSE_ERROR');
    }

    const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
    const mealType = sanitizeMealType(parsed?.mealType, fallbackMealType);

    const items: ParsedFoodItem[] = rawItems
        .filter((item: any) => item && typeof item.name === 'string' && item.name.trim())
        .map((item: any) => ({
            name: String(item.name).trim(),
            quantity:
                typeof item.quantity === 'string' && item.quantity.trim()
                    ? item.quantity.trim()
                    : '1',
            calories: toNumber(item.calories),
            protein: toNumber(item.protein),
            carbs: toNumber(item.carbs),
            fat: toNumber(item.fat),
            mealType: sanitizeMealType(item.mealType, mealType),
        }));

    if (items.length === 0) {
        throw new Error('NO_FOOD_DETECTED');
    }

    const totals = items.reduce(
        (acc, item) => ({
            calories: acc.calories + item.calories,
            protein: acc.protein + item.protein,
            carbs: acc.carbs + item.carbs,
            fat: acc.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return {
        items,
        mealName:
            typeof parsed?.mealName === 'string' && parsed.mealName.trim()
                ? parsed.mealName.trim()
                : items.map((i) => i.name).join(', '),
        mealType: items[0].mealType,
        totals: {
            calories: Math.round(totals.calories),
            protein: Math.round(totals.protein * 10) / 10,
            carbs: Math.round(totals.carbs * 10) / 10,
            fat: Math.round(totals.fat * 10) / 10,
        },
    };
};
