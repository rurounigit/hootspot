// src/services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT } from "../constants";
import { GeminiAnalysisResponse } from "../types";
import { LanguageCode } from "../i18n";

// Type for the translation function, passed from components
type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

export const testApiKey = async (apiKey: string, t: TFunction): Promise<{isValid: boolean, error?: string}> => {
  if (!apiKey) {
    return {isValid: false, error: t('error_api_key_empty')};
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: "Hello",
      config: {
        temperature: 0,
        topK: 1,
        topP: 0,
      }
    });
    if (response.text && response.text.trim().length > 0) {
        return {isValid: true};
    } else {
        return {isValid: false, error: t('test_query_returned_empty')};
    }
  } catch (error: any) {
    console.error("API Key test failed:", error);
    let errorMessage = t('error_api_key_test_failed_generic');
    if (error.message) {
      if (error.toString().includes("API key not valid")) {
        errorMessage = t('error_api_key_invalid');
      } else if (error.toString().includes("fetch")) {
        errorMessage = t('error_api_key_network');
      } else {
        errorMessage = t('error_api_key_test_failed_message', { message: error.message });
      }
    }
    return {isValid: false, error: errorMessage};
  }
};

export const analyzeText = async (
  apiKey: string,
  textToAnalyze: string,
  t: TFunction,
  language: LanguageCode
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
      model: GEMINI_MODEL_NAME,
      contents: [
        { role: "user", parts: [{ text: `Please analyze the following text: ${textToAnalyze}` }] }
      ],
      config: {
        systemInstruction: dynamicSystemPrompt,
        responseMimeType: "application/json",
        // *** THE FIX: RELAXED PARAMETERS TO ALLOW FOR MULTIPLE FINDINGS ***
        temperature: 0.2,
        topP: 0.9,
        topK: 5,
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
    throw new Error(t('error_analysis_failed', { message: error.message || "Unknown API error" }));
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