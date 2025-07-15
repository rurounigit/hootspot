// src/services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, ANALYSIS_TRANSLATION_PROMPT, REBUTTAL_SYSTEM_PROMPT } from "../constants";
import { GeminiAnalysisResponse, GeminiModel } from "../types";
import { LanguageCode } from "../i18n";
import { GroupedModels } from "../hooks/useModels";

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

// --- NEW HELPER FUNCTION ---
// This function aggressively extracts a JSON object from a string.
function extractJson(str: string): string {
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


export const testApiKey = async (
  apiKey: string,
  t: TFunction,
  modelName: string
): Promise<void> => {
  if (!apiKey) {
    throw new Error(t('error_api_key_empty'));
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName || GEMINI_MODEL_NAME,
      contents: "Hello",
      config: {
        temperature: 0,
        topK: 1,
        topP: 0,
      }
    });
    if (!response.text || response.text.trim().length === 0) {
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

export const analyzeText = async (
  apiKey: string,
  textToAnalyze: string,
  modelName: string,
): Promise<GeminiAnalysisResponse> => {
    if (!apiKey) {
      throw new Error("API Key is not configured.");
    }
    if (!textToAnalyze.trim()) {
      return {
        analysis_summary: "No text provided for analysis.",
        findings: [],
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const fullResponse = await ai.models.generateContent({
        model: modelName || GEMINI_MODEL_NAME,
        contents: [
          { role: "user", parts: [{ text: `Please analyze the following text: ${textToAnalyze}` }] }
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          // responseMimeType: "application/json", // Keep this commented out for robustness
          temperature: 0,
          topP: 0,
          topK: 1,
          maxOutputTokens: 8192,
        },
      });

      const rawText = fullResponse.text;
      const jsonStr = extractJson(rawText);

      try {
        const parsedData = JSON.parse(jsonStr) as GeminiAnalysisResponse;
        if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
          // THIS IS THE NEW LOGIC
          // Sort findings by their first appearance in the source text.
          parsedData.findings.sort((a, b) => {
            const indexA = textToAnalyze.indexOf(a.specific_quote);
            const indexB = textToAnalyze.indexOf(b.specific_quote);
            // If a quote isn't found, it should be sorted to the end.
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          return parsedData; // Return the correctly sorted data
        } else {
          throw new Error("Received an unexpected JSON structure from the API.");
        }
      } catch (e) {
        console.error("--- HootSpot JSON Parsing Error (Analysis) ---");
        console.error("Failed to parse the following text as JSON:");
        console.log(jsonStr);
        const finishReason = fullResponse.candidates?.[0]?.finishReason;
        const safetyRatings = fullResponse.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}`);
        if (safetyRatings) {
          console.error("Safety Ratings:", JSON.stringify(safetyRatings, null, 2));
        }
        throw new Error(`Failed to parse analysis: ${(e as Error).message}`);
      }
    } catch (error: any) {
        console.error("Error analyzing text with Gemini API:", error);
        if (error.message && error.message.includes("SAFETY")) {
            throw new Error("The request was blocked due to safety concerns from the API.");
        }
        let apiErrorObject;
        try {
          apiErrorObject = JSON.parse(error.message);
        } catch (parseError) {
          throw new Error(`Failed to analyze text: ${error.message || "Unknown API error"}`);
        }
        if (apiErrorObject && apiErrorObject.error && apiErrorObject.error.message) {
          const { code, status, message } = apiErrorObject.error;
          if (status === 'RESOURCE_EXHAUSTED' || code === 429) {
            throw new Error(`API Quota Error: ${message}`);
          } else {
            throw new Error(`API Error: ${message}`);
          }
        }
        throw new Error(`Failed to analyze text: ${error.message || "Unknown API error"}`);
    }
};

export const translateAnalysisResult = async (
  apiKey: string,
  analysis: GeminiAnalysisResponse,
  targetLanguage: LanguageCode,
  modelName: string,
  t: TFunction
): Promise<GeminiAnalysisResponse> => {
  if (!apiKey) {
    throw new Error(t('error_api_key_not_configured'));
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = ANALYSIS_TRANSLATION_PROMPT.replace('{language}', targetLanguage);
  const contentToTranslate = JSON.stringify(analysis);

  try {
    const fullResponse = await ai.models.generateContent({
      model: modelName || GEMINI_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: contentToTranslate }] }],
      config: {
        systemInstruction: systemPrompt,
        // responseMimeType: "application/json", // Keep this commented out for robustness
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    });

    const rawText = fullResponse.text;
    const jsonStr = extractJson(rawText);

    try {
      const parsedData = JSON.parse(jsonStr) as GeminiAnalysisResponse;
      if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
        return parsedData;
      } else {
        throw new Error(t('error_unexpected_json_structure'));
      }
    } catch (e) {
      console.error("--- HootSpot JSON Parsing Error (Translation) ---");
      console.error("Failed to parse the following text as JSON:");
      console.log(jsonStr);
      const finishReason = fullResponse.candidates?.[0]?.finishReason;
      const safetyRatings = fullResponse.candidates?.[0]?.safetyRatings;
      console.error(`Finish Reason: ${finishReason}`);
      if (safetyRatings) {
        console.error("Safety Ratings:", JSON.stringify(safetyRatings, null, 2));
      }
      throw new Error(t('error_json_parse', { message: (e as Error).message, response: jsonStr.substring(0, 100) }));
    }
  } catch (error: any) {
    console.error("Error translating analysis result:", error);
    if (error.message && error.message.includes("SAFETY")) {
      throw new Error(t('error_safety_block'));
    }
    throw new Error(t('error_translation_failed', { message: error.message || "Unknown API error" }));
  }
};

export const generateRebuttal = async (
  apiKey: string,
  sourceText: string,
  analysis: GeminiAnalysisResponse,
  modelName: string,
  languageCode: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is not configured.");
  }
  if (!sourceText || !analysis) {
    throw new Error("Source text and analysis are required to generate a rebuttal.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct the prompt with the source text, its analysis, and the desired language
  const prompt = REBUTTAL_SYSTEM_PROMPT
    .replace('{analysisJson}', JSON.stringify(analysis, null, 2))
    .replace('{sourceText}', sourceText)
    .replace('{languageCode}', languageCode);

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Error generating rebuttal:", error);
    if (error.message && error.message.includes("SAFETY")) {
        throw new Error("The rebuttal generation was blocked due to safety concerns from the API.");
    }
    throw new Error(`Failed to generate rebuttal: ${error.message || "Unknown API error"}`);
  }
};


export const fetchModels = async (apiKey: string): Promise<GroupedModels> => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!Array.isArray(data.models)) {
        if (data.error) throw new Error(data.error.message);
        console.warn("API did not return a models array. Response:", data);
        return { preview: [], stable: [] };
    }

    const filteredModels = (data.models as GeminiModel[]).filter(model => {
      const name = model.name.toLowerCase();
      const displayName = model.displayName.toLowerCase();

      if (!model.supportedGenerationMethods.includes("generateContent")) return false;
      if (name.includes("embedding") || name.includes("aqa") || name.includes("imagen") || name.includes("tts") || name.includes("vision")) return false;
      if (displayName.includes("exp")) return false;
      if (displayName.includes("gemini 1.0")) return false;
      if (displayName.includes("cursor testing")) return false;

      return true;
    });

    const modelMap = new Map<string, GeminiModel>();

    filteredModels.forEach(model => {
      const baseName = model.displayName.toLowerCase()
        .replace(/(\s\d{3})$/, '')
        .replace(/(\s\d{2}-\d{2})$/, '')
        .replace(/(-latest)$/, '')
        .trim();

      const existingModel = modelMap.get(baseName);

      if (!existingModel || model.version > existingModel.version) {
        modelMap.set(baseName, model);
      }
    });

    const uniqueModels = Array.from(modelMap.values());

    const sorter = (a: GeminiModel, b: GeminiModel): number => {
        const aIsGemini = a.displayName.toLowerCase().includes('gemini');
        const bIsGemini = b.displayName.toLowerCase().includes('gemini');

        if (aIsGemini && !bIsGemini) return -1;
        if (!aIsGemini && bIsGemini) return 1;

        const regex = /(gemini|gemma)\s(3n|[\d.]+)/i;
        const aMatch = a.displayName.match(regex);
        const bMatch = b.displayName.match(regex);

        if (aMatch && bMatch) {
            const aVersion = aMatch[2].toLowerCase() === '3n' ? 3.1 : parseFloat(aMatch[2]);
            const bVersion = bMatch[2].toLowerCase() === '3n' ? 3.1 : parseFloat(bMatch[2]);
            if (aVersion !== bVersion) return bVersion - aVersion;
        }

        return b.displayName.localeCompare(a.displayName);
    };

    const preview = uniqueModels.filter(m => m.displayName.toLowerCase().includes('preview')).sort(sorter);
    const stable = uniqueModels.filter(m => !m.displayName.toLowerCase().includes('preview')).sort(sorter);

    return { preview, stable };

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
        const fullResponse = await ai.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: [
                { role: "user", parts: [{ text: `Translate the following JSON values to ${targetLanguage}:\n\n${baseTranslationsJSON}` }] }
            ],
            config: {
                systemInstruction: TRANSLATION_SYSTEM_PROMPT,
                // responseMimeType: "application/json", // Keep this commented out for robustness
                temperature: 0.2,
                maxOutputTokens: 8192,
            },
        });

        const rawText = fullResponse.text;
        const jsonStr = extractJson(rawText);

        try {
            const parsedData = JSON.parse(jsonStr) as Record<string, string>;
            return parsedData;
        } catch (e) {
            console.error("--- HootSpot JSON Parsing Error (UI Translation) ---");
            console.error("Failed to parse the following text as JSON:");
            console.log(jsonStr);
            const finishReason = fullResponse.candidates?.[0]?.finishReason;
            const safetyRatings = fullResponse.candidates?.[0]?.safetyRatings;
            console.error(`Finish Reason: ${finishReason}`);
            if (safetyRatings) {
              console.error("Safety Ratings:", JSON.stringify(safetyRatings, null, 2));
            }
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