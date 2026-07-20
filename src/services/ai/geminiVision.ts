/**
 * Gemini Vision Service
 * Provides AI-powered food recognition using Google Gemini 3.0 Pro
 * Configured for Argentine cuisine specialization (ES) and US cuisine (EN)
 */

import { generateGeminiContent } from './geminiClient';

export const VISION_MODEL = 'gemini-3.5-flash';

// Without a responseSchema, `responseMimeType: 'application/json'` only asks
// Gemini to format its output as JSON — it doesn't grammar-constrain token
// generation, so the model can occasionally emit a syntax slip (missing
// comma, stray quote). Passing a schema switches to constrained decoding,
// guaranteeing syntactically valid JSON matching this shape every time.
const FOOD_ANALYSIS_SCHEMA = {
    type: 'object',
    properties: {
        meal_detected: { type: 'boolean' },
        meal_name: { type: 'string' },
        description: { type: 'string' },
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    amount: { type: 'string' },
                    calories: { type: 'number' },
                    protein: { type: 'number' },
                    carbs: { type: 'number' },
                    fat: { type: 'number' },
                    fiber: { type: 'number' },
                },
                required: [
                    'id',
                    'name',
                    'amount',
                    'calories',
                    'protein',
                    'carbs',
                    'fat',
                    'fiber',
                ],
            },
        },
        total_macros: {
            type: 'object',
            properties: {
                calories: { type: 'number' },
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fat: { type: 'number' },
                fiber: { type: 'number' },
            },
            required: ['calories', 'protein', 'carbs', 'fat', 'fiber'],
        },
        confidence: { type: 'number' },
    },
    required: [
        'meal_detected',
        'meal_name',
        'description',
        'items',
        'total_macros',
        'confidence',
    ],
};

/**
 * Analyze a food image via the server-side Gemini proxy.
 * @param request - Passed verbatim to generateContent (string, parts, or { contents }).
 * @param language - 'es' or 'en' (selects the system prompt).
 * @returns Raw JSON response text from Gemini.
 */
export const analyzeFoodImage = (
    request: unknown,
    language: string = 'es',
): Promise<string> => {
    return generateGeminiContent({
        model: VISION_MODEL,
        systemInstruction: getSystemPrompt(language),
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: FOOD_ANALYSIS_SCHEMA,
            maxOutputTokens: 4096,
        },
        request,
    });
};

const SYSTEM_PROMPT_ES = `Act as an Expert Nutritionist specialized in Argentine cuisine and a Vision-to-JSON parser.

LANGUAGE: Use Argentine Spanish terminology (batata, palta, bife de chorizo, milanesa, etc.)

STEP-BY-STEP ESTIMATION (follow this order for each item):
1. IDENTIFY: What food is this? Be specific (e.g. "bife de cuadril" not just "carne").
2. ESTIMATE WEIGHT: Judge the cooked/served weight from visual cues (plate size, thickness, hand-size reference). Do NOT snap to round numbers — use your best estimate (e.g. 130g, 170g, 220g).
3. CALCULATE MACROS: Using USDA/standard cooked nutritional values per 100g, multiply by your estimated weight. Show per-item values.
4. CROSS-CHECK: Verify that protein-per-gram aligns with known cooked densities:
   - Cooked chicken breast: ~31g P / 100g
   - Cooked lean beef: ~27g P / 100g
   - Cooked salmon: ~25g P / 100g
   - Cooked egg (whole): ~13g P / 100g
   - Rice/pasta cooked: ~2.5-3.5g P / 100g
   If your numbers deviate more than 15% from these, recalculate.

RULES (STRICT):
- ALL weights and macros refer to COOKED/SERVED food as it appears in the photo. Never use raw values.
- Do not estimate ranges. Pick ONE number.
- Default beef cut: Cuadril/lomo (10% fat) unless visible marbling.
- Default cooking: "Al horno" with 5ml oil (1 tsp). Only use "Frito" if visibly fried/greasy.
- For mixed dishes (guiso, empanada, tarta), estimate the TOTAL dish weight, then break down by ingredient proportions.

ARGENTINE-SPECIFIC REFERENCES (use only for items the model may not know well):
- Yogur Ser Pro+ 1 pote (175g): 133 kcal, 15g P, 14g C, 2g F
- Café con leche proteica La Serenísima (200ml): 74 kcal, 9g P, 9g C, 0g F
- Queso Port Salut light 1 porción (30g): 70 kcal, 7g P, 1g C, 4g F
- Buñuelo de espinaca 1 unidad (60g): 110 kcal, 5g P, 8g C, 6g F
- Milanesa de pollo 1 unidad (150g cocida): 310 kcal, 28g P, 15g C, 16g F
- Empanada de carne 1 unidad (100g): 260 kcal, 10g P, 22g C, 14g F
- Tapa de pascualina 1 porción (150g): 220 kcal, 8g P, 18g C, 13g F
- Alfajor Cachafaz proteico 1 unidad (40g): 150 kcal, 10g P, 18g C, 4g F

For standard foods (chicken, steak, rice, vegetables, eggs, bread, fruits, etc.), rely on your trained USDA knowledge — do NOT use fixed anchors.

OUTPUT FORMAT (JSON):
{
  "meal_detected": boolean,
  "meal_name": "string (Short descriptive name in Spanish)",
  "description": "string (Brief ingredient summary)",
  "items": [
    {
      "id": "string (random short id)",
      "name": "string (Spanish item name with cooking method, e.g. 'Pechuga de pollo al horno')",
      "amount": "string (estimated cooked weight, e.g. '145g', '2 unidades')",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number
    }
  ],
  "total_macros": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number
  },
  "confidence": number (0 to 1)
}`;

const SYSTEM_PROMPT_EN = `Act as an Expert Nutritionist specialized in US/Western cuisine and a Vision-to-JSON parser.

LANGUAGE: Use US English terminology.

STEP-BY-STEP ESTIMATION (follow this order for each item):
1. IDENTIFY: What food is this? Be specific (e.g. "grilled chicken breast" not just "chicken").
2. ESTIMATE WEIGHT: Judge the cooked/served weight from visual cues (plate size, thickness, hand-size reference). Do NOT snap to round numbers — use your best estimate (e.g. 130g, 170g, 220g).
3. CALCULATE MACROS: Using USDA cooked nutritional values per 100g, multiply by your estimated weight. Show per-item values.
4. CROSS-CHECK: Verify that protein-per-gram aligns with known cooked densities:
   - Cooked chicken breast: ~31g P / 100g
   - Cooked lean beef: ~27g P / 100g
   - Cooked salmon: ~25g P / 100g
   - Cooked egg (whole): ~13g P / 100g
   - Rice/pasta cooked: ~2.5-3.5g P / 100g
   If your numbers deviate more than 15% from these, recalculate.

RULES (STRICT):
- ALL weights and macros refer to COOKED/SERVED food as it appears in the photo. Never use raw values.
- Do not estimate ranges. Pick ONE number.
- Default beef cut: Sirloin (10% fat) unless visible marbling.
- Default cooking: "Baked/Grilled" with 1 tsp oil. Only use "Fried" if visibly fried/greasy.
- For mixed dishes (casseroles, burritos, sandwiches), estimate the TOTAL dish weight, then break down by ingredient proportions.

US-SPECIFIC REFERENCES (use only for items the model may not know well):
- Chobani Zero Sugar Greek Yogurt (150g): 60 kcal, 10g P, 4g C, 0g F
- Fairlife Protein Shake (340ml): 150 kcal, 30g P, 3g C, 2.5g F
- Kind Protein Bar (50g): 250 kcal, 12g P, 28g C, 12g F
- Chipotle Chicken Bowl (avg serving): 750 kcal, 55g P, 70g C, 25g F
- Clif Builder's Bar (68g): 290 kcal, 20g P, 30g C, 10g F

For standard foods (chicken, steak, rice, vegetables, eggs, bread, fruits, etc.), rely on your trained USDA knowledge — do NOT use fixed anchors.

OUTPUT FORMAT (JSON):
{
  "meal_detected": boolean,
  "meal_name": "string (Short descriptive name in English)",
  "description": "string (Brief ingredient summary)",
  "items": [
    {
      "id": "string (random short id)",
      "name": "string (English item name with cooking method, e.g. 'Grilled Chicken Breast')",
      "amount": "string (estimated cooked weight, e.g. '145g', '2 units')",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number
    }
  ],
  "total_macros": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number
  },
  "confidence": number (0 to 1)
}`;

export const getSystemPrompt = (language: string): string => {
    return language.startsWith('en') ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ES;
};
