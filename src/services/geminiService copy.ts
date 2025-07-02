// src/services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT } from "../constants";
import { GeminiAnalysisResponse, GeminiModel } from "../types";
import { LanguageCode } from "../i18n";

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

// MODIFIED: This function now throws an error on failure instead of returning an object.
export const testApiKey = async (
  apiKey: string,
  t: TFunction,
  modelName: string
): Promise<void> => {
  if (!apiKey) {
    // Throw an error that the calling function can catch.
    throw new Error(t('error_api_key_empty'));
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response: GenerateContentResponse = await ai.models.generateContent({
      // Use the dynamically selected model for the test.
      model: modelName || GEMINI_MODEL_NAME,
      contents: "Hello",
      config: {
        temperature: 0,
        topK: 1,
        topP: 0,
      }
    });

    // If the response is empty or invalid, it's a failure.
    if (!response.text || response.text.trim().length === 0) {
        throw new Error(t('test_query_returned_empty'));
    }
    // If we reach here, the function completes successfully.
  } catch (error: any) {
    console.error("API Key test failed:", error);

    // Use the same robust error parsing as analyzeText.
    let apiErrorObject;
    try {
      apiErrorObject = JSON.parse(error.message);
    } catch (e) {
      // It's not a JSON error from the API, so use the original message.
      throw new Error(t('error_api_key_test_failed_message', { message: error.message || 'Unknown error' }));
    }

    if (apiErrorObject && apiErrorObject.error && apiErrorObject.error.message) {
      const { code, status, message } = apiErrorObject.error;
      if (status === 'RESOURCE_EXHAUSTED' || code === 429) {
        throw new Error(t('error_quota_exhausted', { message: message }));
      }
      throw new Error(t('error_api_generic', { message: message }));
    }

    // Fallback for any other kind of error.
    throw new Error(t('error_api_key_test_failed_generic'));
  }
};

export const analyzeText = async (
  apiKey: string,
  textToAnalyze: string,
  t: TFunction,
  language: LanguageCode,
  modelName: string,
): Promise<GeminiAnalysisResponse> => {
  if (!apiKey) {
    throw new Error(t('error_api_key_not_configured'));
  }
  if (!textToAnalyze.trim()) {
    return {
      analysis_summary: t('error_no_text_for_analysis'),
      findings: [],
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const dynamicSystemPrompt = `${SYSTEM_PROMPT}\n\nIMPORTANT: The 'analysis_summary' and all 'explanation' fields in the JSON response must be in the following language: ${language}.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName || GEMINI_MODEL_NAME,
      contents: [
        { role: "user", parts: [{ text: `Please analyze the following text: ${textToAnalyze}` }] }
      ],
      config: {
        systemInstruction: dynamicSystemPrompt,
        responseMimeType: "application/json",
        temperature: 0,
        topP: 0,
        topK: 1,
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr) as GeminiAnalysisResponse;
      if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
        return parsedData;
      } else {
        console.error("Parsed JSON does not match expected structure:", parsedData);
        throw new Error(t('error_unexpected_json_structure'));
      }
    } catch (e) {
      console.error("Failed to parse JSON response:", e, "Raw response:", jsonStr);
      throw new Error(t('error_json_parse', { message: (e as Error).message, response: jsonStr.substring(0,100) }));
    }
  } catch (error: any) {
    console.error("Error analyzing text with Gemini API:", error);

    if (error.message && error.message.includes("SAFETY")) {
        throw new Error(t('error_safety_block'));
    }

    let apiErrorObject;
    try {
      apiErrorObject = JSON.parse(error.message);
    } catch (parseError) {
      throw new Error(t('error_analysis_failed', { message: error.message || "Unknown API error" }));
    }

    if (apiErrorObject && apiErrorObject.error && apiErrorObject.error.message) {
      const { code, status, message } = apiErrorObject.error;
      if (status === 'RESOURCE_EXHAUSTED' || code === 429) {
        throw new Error(t('error_quota_exhausted', { message: message }));
      } else {
        throw new Error(t('error_api_generic', { message: message }));
      }
    }

    throw new Error(t('error_analysis_failed', { message: error.message || "Unknown API error" }));
  }
};

export const fetchModels = async (apiKey: string): Promise<GeminiModel[]> => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!Array.isArray(data.models)) {
      if (data.error) {
        throw new Error(data.error.message);
      }
      console.warn("API did not return a models array. Response:", data);
      return [];
    }

    const models = data.models as GeminiModel[];

    const filteredModels = models.filter(model =>
      model.supportedGenerationMethods.includes("generateContent") &&
      !model.name.includes("embedding") &&
      !model.name.includes("aqa") &&
      !model.name.includes("imagen")
    );

    filteredModels.sort((a, b) => {
      const aIsPreview = a.displayName.toLowerCase().includes('preview');
      const bIsPreview = b.displayName.toLowerCase().includes('preview');

      if (aIsPreview && !bIsPreview) return -1;
      if (!aIsPreview && bIsPreview) return 1;

      return a.displayName.localeCompare(b.displayName);
    });

    return filteredModels;
  } catch (error) {
    console.error("Failed to fetch models:", error);
    throw error;
  }
};

export const translateUI = async (
  apiKey: string,
  targetLanguage: string,
  baseTranslationsJSON: string,
  t: TFunction
): Promise<Record<string, string>> => {
    if (!apiKey) {
        throw new Error(t('error_api_key_not_configured'));
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: [
                { role: "user", parts: [{ text: `Translate the following JSON values to ${targetLanguage}:\n\n${baseTranslationsJSON}` }] }
            ],
            config: {
                systemInstruction: TRANSLATION_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                temperature: 0.2,
            },
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[1]) {
            jsonStr = match[1].trim();
        }

        try {
            const parsedData = JSON.parse(jsonStr) as Record<string, string>;
            return parsedData;
        } catch (e) {
            console.error("Failed to parse translated JSON response:", e, "Raw response:", jsonStr);
            throw new Error(t('lang_manager_error_parse', { message: (e as Error).message }));
        }
    } catch (error: any) {
        console.error("Error translating UI with Gemini API:", error);
        if (error.message && error.message.includes("SAFETY")) {
            throw new Error(t('lang_manager_error_safety'));
        }
        throw new Error(t('lang_manager_error_api', { message: error.message || "Unknown API error" }));
    }
};