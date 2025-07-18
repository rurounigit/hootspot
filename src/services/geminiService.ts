// src/services/geminiService.ts

import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, ANALYSIS_TRANSLATION_PROMPT, REBUTTAL_SYSTEM_PROMPT, JSON_REPAIR_SYSTEM_PROMPT, SIMPLE_TEXT_TRANSLATION_PROMPT } from "../constants";
import { GeminiAnalysisResponse, GeminiModel, GeminiFinding } from "../types";
import { LanguageCode } from "../i18n";
import { GroupedModels } from "../hooks/useModels";

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

// This helper function aggressively extracts a JSON object from a string.
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

// Self-healing JSON repair function
async function repairAndParseJson(
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

export const analyzeText = async (
  apiKey: string,
  textToAnalyze: string,
  modelName: string,
): Promise<GeminiAnalysisResponse> => {
    if (!apiKey) {
      throw new Error("error_api_key_not_configured");
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
          systemInstruction: String(SYSTEM_PROMPT),
          temperature: 0,
          topP: 0,
          topK: 1,
          maxOutputTokens: 8192,
        },
      });

      const rawText = fullResponse.text ?? '';
      const jsonStr = extractJson(rawText);
      let parsedData;

      try {
        parsedData = JSON.parse(jsonStr);
      } catch (e) {
        parsedData = await repairAndParseJson(apiKey, jsonStr, modelName);
      }

      if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
          parsedData.findings.sort((a: GeminiFinding, b: GeminiFinding) => {
            const indexA = textToAnalyze.indexOf(a.specific_quote);
            const indexB = textToAnalyze.indexOf(b.specific_quote);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          return parsedData;
      } else {
        throw new Error("Received an unexpected JSON structure from the API.");
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

export const testLMStudioConnection = async (
    serverUrl: string,
    modelName: string,
    t: TFunction
): Promise<void> => {
    if (!serverUrl || !modelName) {
        throw new Error('error_local_server_config_missing');
    }
    try {
        const response = await fetch(`${serverUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(t('error_local_model_not_loaded', { model: modelName, message: errorData.error?.message || response.statusText }));
        }
        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
            throw new Error(t('test_query_returned_empty'));
        }
    } catch (error: any) {
        if (error instanceof TypeError) {
            throw new Error(t('error_local_server_connection', { url: serverUrl }));
        }
        throw error;
    }
};

export const analyzeTextWithLMStudio = async (
    textToAnalyze: string,
    serverUrl: string,
    modelName: string,
    t: TFunction
): Promise<GeminiAnalysisResponse> => {
    if (!serverUrl || !modelName) {
        throw new Error('error_local_server_config_missing');
    }
    if (!textToAnalyze.trim()) {
        return { analysis_summary: "No text provided for analysis.", findings: [] };
    }

    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Please analyze the following text: ${textToAnalyze}` }
        ],
        temperature: 0.2,
        max_tokens: 8192,
    };

    try {
        const response = await fetch(`${serverUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(t('error_local_model_not_loaded', { model: modelName, message: errorData.error?.message || response.statusText }));
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (!content) {
            throw new Error(t('error_unexpected_json_structure'));
        }

        const jsonStr = extractJson(content);
        let parsedData;

        try {
            parsedData = JSON.parse(jsonStr);
        } catch (e) {
            console.error("--- HootSpot LOCAL JSON PARSE FAILED ---");
            console.error("Original malformed JSON from local model:", jsonStr);
            throw new Error(t('error_json_parse', { message: (e as Error).message, response: jsonStr.substring(0, 100) }));
        }

        if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
            parsedData.findings.sort((a: GeminiFinding, b: GeminiFinding) => {
                const indexA = textToAnalyze.indexOf(a.specific_quote);
                const indexB = textToAnalyze.indexOf(b.specific_quote);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
            return parsedData;
        } else {
            throw new Error(t('error_unexpected_json_structure'));
        }
    } catch (error: any) {
        if (error instanceof TypeError) {
             throw new Error(t('error_local_server_connection', { url: serverUrl }));
        }
        console.error("Error analyzing text with LM Studio:", error);
        throw error;
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
        systemInstruction: String(systemPrompt),
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    });

    const rawText = fullResponse.text ?? '';
    const jsonStr = extractJson(rawText);
    let parsedData;

    try {
        parsedData = JSON.parse(jsonStr);
    } catch (e) {
        parsedData = await repairAndParseJson(apiKey, jsonStr, modelName);
    }

    if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
        return parsedData;
    } else {
        throw new Error(t('error_unexpected_json_structure'));
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

    return (response.text ?? '').trim();
  } catch (error: any) {
    console.error("Error generating rebuttal:", error);
    if (error.message && error.message.includes("SAFETY")) {
        throw new Error("The rebuttal generation was blocked due to safety concerns from the API.");
    }
    throw new Error(`Failed to generate rebuttal: ${error.message || "Unknown API error"}`);
  }
};

export const translateText = async (
  apiKey: string,
  textToTranslate: string,
  targetLanguage: LanguageCode,
  modelName: string,
  t: TFunction
): Promise<string> => {
  if (!apiKey) {
    throw new Error(t('error_api_key_not_configured'));
  }
  if (!textToTranslate) {
    return "";
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = SIMPLE_TEXT_TRANSLATION_PROMPT.replace('{language}', targetLanguage);

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: textToTranslate }] }],
      config: {
        systemInstruction: String(systemPrompt),
        temperature: 0.2,
      },
    });

    return (response.text ?? '').trim();
  } catch (error: any) {
    console.error(`Error translating text to ${targetLanguage}:`, error);
    throw new Error(t('error_rebuttal_translation_failed', { message: error.message || "Unknown API error" }));
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
                systemInstruction: String(TRANSLATION_SYSTEM_PROMPT),
                temperature: 0.2,
                maxOutputTokens: 8192,
            },
        });

        const rawText = fullResponse.text ?? '';
        const jsonStr = extractJson(rawText);
        let parsedData;
        try {
            parsedData = JSON.parse(jsonStr);
        } catch(e) {
            parsedData = await repairAndParseJson(apiKey, jsonStr, GEMINI_MODEL_NAME);
        }
        return parsedData;
    } catch (error: any) {
        console.error("Error translating UI with Gemini API:", error);
        if (error.message && error.message.includes("SAFETY")) {
            throw new Error(t('lang_manager_error_safety'));
        }
        throw new Error(t('lang_manager_error_api', { message: error.message || "Unknown API error" }));
    }
};