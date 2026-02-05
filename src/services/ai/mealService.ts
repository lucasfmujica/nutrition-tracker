import { GoogleGenerativeAI } from '@google/generative-ai';

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
}

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
