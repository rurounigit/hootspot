// src/utils/apiUtils.ts

/**
 * Aggressively extracts a JSON object from a string that might be wrapped
 * in markdown fences or other conversational text. This is a safety net
 * for models that don't perfectly adhere to JSON-only output instructions.
 *
 * @param str The raw string response from an API.
 * @returns The cleaned, extracted JSON string.
 */
export function extractJson(str: string): string {
    // First, try to find JSON within markdown fences.
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/s;
    const fenceMatch = str.match(fenceRegex);
    if (fenceMatch && fenceMatch[1]) {
        return fenceMatch[1].trim();
    }

    // If no fences, find the first '{' and the last '}'
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        // Return the original string if no valid JSON structure is found
        return str;
    }

    return str.substring(firstBrace, lastBrace + 1);
}