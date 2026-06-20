/**
 * Robust JSON parser for LLM responses.
 *
 * LLMs frequently wrap their JSON output in markdown code fences or add
 * surrounding prose, even when asked for "strict JSON". This helper normalizes
 * that output before parsing so the rest of the app can rely on clean objects.
 */

/**
 * Extract the first balanced `{...}` or `[...]` block from a string.
 * Returns the original string if no opening brace/bracket is found.
 * Respects strings and escapes so braces inside string literals are ignored.
 */
const extractBalancedBlock = (text: string): string => {
    const startObj = text.indexOf('{');
    const startArr = text.indexOf('[');

    let start = -1;
    if (startObj === -1) start = startArr;
    else if (startArr === -1) start = startObj;
    else start = Math.min(startObj, startArr);

    if (start === -1) return text;

    const open = text[start];
    const close = open === '{' ? '}' : ']';

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {
        const char = text[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === '\\') {
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (char === open) depth++;
        else if (char === close) {
            depth--;
            if (depth === 0) {
                return text.slice(start, i + 1);
            }
        }
    }

    // Unbalanced: return from the first opener onwards and let JSON.parse fail clearly.
    return text.slice(start);
};

/**
 * Parse JSON returned by an LLM, tolerating markdown fences and surrounding text.
 *
 * Steps:
 * 1. Trim whitespace.
 * 2. Strip ```json ... ``` or ``` ... ``` markdown fences.
 * 3. Extract the first balanced `{...}` or `[...]` block if extra text remains.
 * 4. JSON.parse the result.
 *
 * @param text Raw response text from the model.
 * @returns The parsed value typed as `T`.
 * @throws Error with a clear message if parsing fails.
 */
export function parseLLMJson<T>(text: string): T {
    if (typeof text !== 'string' || !text.trim()) {
        throw new Error('parseLLMJson: empty or non-string response');
    }

    let cleaned = text.trim();

    // Remove markdown code fences (```json ... ``` or ``` ... ```).
    if (cleaned.startsWith('```')) {
        cleaned = cleaned
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/, '')
            .trim();
    }

    // If there is still surrounding prose, extract the first balanced JSON block.
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
        cleaned = extractBalancedBlock(cleaned).trim();
    }

    try {
        return JSON.parse(cleaned) as T;
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`parseLLMJson: failed to parse LLM JSON: ${detail}`);
    }
}
