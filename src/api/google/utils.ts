// src/api/google/utils.ts
import { GoogleGenAI } from "@google/genai";
import { JSON_REPAIR_SYSTEM_PROMPT, GEMINI_MODEL_NAME } from "../../config/api-prompts";
import { extractJson } from "../../utils/apiUtils"; // Import from the central utility
import { ConfigError } from "../../utils/errors";

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

// Self-healing JSON repair function (Google-specific)
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
        throw new ConfigError('error_json_repair_failed', { message: (e as Error).message });
    }
}


export const testApiKey = async (
  apiKey: string,
  t: TFunction,
  modelName: string
): Promise<void> => {
  if (!apiKey) {
    throw new ConfigError('error_api_key_empty');
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
        throw new ConfigError('test_query_returned_empty');
    }
    } catch (error: any) {
    console.error("API Key test failed:", error);
    let apiErrorObject;
    try {
      apiErrorObject = JSON.parse(error.message);
    } catch (e) {
      throw new ConfigError('error_api_key_test_failed_message', { message: error.message || 'Unknown error' });
    }
    if (apiErrorObject && apiErrorObject.error && apiErrorObject.error.message) {
      const { code, status, message } = apiErrorObject.error;
      if (status === 'RESOURCE_EXHAUSTED' || code === 429) {
        throw new ConfigError('error_quota_exhausted', { message: message });
      }
      throw new ConfigError('error_api_generic', { message: message });
    }
    throw new ConfigError('error_api_key_test_failed_generic');
  }
};
