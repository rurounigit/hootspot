// src/api/google/utils.ts
import { GoogleGenAI } from "@google/genai";
import { JSON_REPAIR_SYSTEM_PROMPT, GEMINI_MODEL_NAME } from "../../config/api-prompts";

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

// This helper function aggressively extracts a JSON object from a string.
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

// Self-healing JSON repair function
export async function repairAndParseJson(
    apiKey: string,
    brokenJson: string,
    modelName: string
): Promise<any> {
    console.warn("Attempting to repair malformed JSON...");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const repairResponse = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: brokenJson }] }],
            config: {
                systemInstruction: String(JSON_REPAIR_SYSTEM_PROMPT),
                temperature: 0,
            },
        });
        const repairedJson = extractJson(repairResponse.text ?? '');
        return JSON.parse(repairedJson);
    } catch (e) {
        console.error("--- HootSpot JSON REPAIR FAILED ---");
        console.error("Original broken JSON:", brokenJson);
        throw new Error(`Failed to parse analysis even after attempting a repair: ${(e as Error).message}`);
    }
}


export const testApiKey = async (
  apiKey: string,
  t: TFunction,
  modelName: string
): Promise<void> => {
  if (!apiKey) {
    throw new Error('error_api_key_empty');
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName || GEMINI_MODEL_NAME,
      contents: [{role: "user", parts:[{text: "Hello"}]}],
      config: {
        temperature: 0,
        topK: 1,
        topP: 0,
      }
    });
    if (!(response.text) || response.text.trim().length === 0) {
        throw new Error(t('test_query_returned_empty'));
    }
  } catch (error: any) {
    console.error("API Key test failed:", error);
    let apiErrorObject;
    try {
      apiErrorObject = JSON.parse(error.message);
    } catch (e) {
      throw new Error(t('error_api_key_test_failed_message', { message: error.message || 'Unknown error' }));
    }
    if (apiErrorObject && apiErrorObject.error && apiErrorObject.error.message) {
      const { code, status, message } = apiErrorObject.error;
      if (status === 'RESOURCE_EXHAUSTED' || code === 429) {
        throw new Error(t('error_quota_exhausted', { message: message }));
      }
      throw new Error(t('error_api_generic', { message: message }));
    }
    throw new Error(t('error_api_key_test_failed_generic'));
  }
};