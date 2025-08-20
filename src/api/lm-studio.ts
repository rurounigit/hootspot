// src/api/lm-studio.ts

import {
  SYSTEM_PROMPT,
  REBUTTAL_SYSTEM_PROMPT,
  TRANSLATION_SYSTEM_PROMPT,
  ANALYSIS_TRANSLATION_PROMPT,
  SIMPLE_TEXT_TRANSLATION_PROMPT,
  JSON_REPAIR_SYSTEM_PROMPT,
} from '../config/api-prompts';
import {  AIAnalysisOutput, AIModel } from '../types/api';
import { LanguageCode } from '../i18n';
import {
  createNumberedJsonForTranslation,
  reconstructTranslatedJson,
  flattenAnalysisForTranslation,
  reconstructAnalysisFromTranslation
} from '../utils/translationUtils';
import { extractJson } from '../utils/apiUtils';
import { LANGUAGE_CODE_MAP } from '../constants';
import JSON5 from 'json5';
import { ConfigError, GeneralError } from '../utils/errors';

/**
 * Attempts to repair a malformed JSON string by sending it back to the model
 * with specific instructions to fix it.
 * @param serverUrl The URL of the LM Studio server.
 * @param modelName The model to use for the repair.
 * @param brokenJson The malformed JSON string.
 * @returns A promise that resolves to the parsed JSON object.
 */
async function repairAndParseJsonWithLMStudio(
    serverUrl: string,
    modelName: string,
    brokenJson: string
): Promise<any> {
    console.warn("HootSpot: Attempting to repair malformed JSON from LM Studio...");
    try {
        const payload = {
            model: modelName,
            messages: [
                { role: "system", content: JSON_REPAIR_SYSTEM_PROMPT },
                { role: "user", content: brokenJson }
            ],
            temperature: 0.0, // Use 0 temperature for deterministic repair
        };
        const response = await fetch(`${serverUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new ConfigError('error_analysis_failed', { message: `Repair attempt failed with status: ${response.statusText}` });
        }

        const data = await response.json();
        const repairedContent = data.choices[0]?.message?.content;
        if (!repairedContent) {
            throw new GeneralError('error_unexpected_json_structure');
        }

        // Extract JSON from the repaired content, in case the model added markdown fences again
        const repairedJson = extractJson(repairedContent);
        return JSON.parse(repairedJson); // Parse the hopefully fixed JSON

    } catch (e: any) {
        console.error("--- HootSpot JSON REPAIR FAILED ---");
        console.error("Original broken JSON from LM Studio:", brokenJson);
        // Throw a specific, user-facing error.
        throw new GeneralError('error_analysis_failed', { message: e.message });
    }
}


export const fetchLMStudioModels = async (serverUrl: string): Promise<AIModel[]> => {
  try {
    const response = await fetch(`${serverUrl}/v1/models`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GeneralError('error_analysis_failed', { message: errorData.error?.message || `HTTP error! status: ${response.status}` });
    }
    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
        console.warn("LM Studio API did not return a models array. Response:", data);
        return [];
    }

    return data.data.map((model: any) => ({
      name: model.id,
      displayName: model.id,
      supportedGenerationMethods: ["generateContent"],
      version: "1.0",
    }));

  } catch (error) {
    console.error("Failed to fetch LM Studio models:", error);
    throw error;
  }
};

export const testLMStudioConnection = async (
    serverUrl: string,
    modelName: string
): Promise<void> => {
    if (!serverUrl || !modelName) {
        throw new ConfigError('error_local_server_config_missing');
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
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || response.statusText;
            if (errorMessage.includes("model_not_found")) {
                 throw new ConfigError('error_local_model_not_loaded_exact', { model: modelName });
            }
            throw new ConfigError('error_local_model_not_loaded', { model: modelName, message: errorMessage });
        }

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
            throw new ConfigError('test_query_returned_empty');
        }
        const respondingModel = data.model;
        if (respondingModel && !respondingModel.toLowerCase().includes(modelName.toLowerCase())) {
            throw new ConfigError('error_local_model_mismatch', { actual: respondingModel, requested: modelName });
        }

    } catch (error: any) {
        if (error.message.includes('error_local_model_mismatch')) throw error;
        if (error instanceof TypeError || error.message.includes('Failed to fetch')) {
            throw new ConfigError('error_local_server_connection', { url: serverUrl });
        }
        throw error;
    }
};

export const analyzeTextWithLMStudio = async (
    textToAnalyze: string,
    serverUrl: string,
    modelName: string
): Promise<AIAnalysisOutput> => {
    if (!serverUrl || !modelName) throw new ConfigError('error_local_server_config_missing');
    if (!textToAnalyze.trim()) return { analysis_summary: "No text provided for analysis.", findings: [] };

    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Please analyze the following text: ${textToAnalyze}` }
        ],
        temperature: 0,
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
            throw new ConfigError('error_local_model_not_loaded', { model: modelName, message: errorData.error?.message || response.statusText });
        }
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (!content) throw new GeneralError('error_unexpected_json_structure');

        const jsonStr = extractJson(content);
        let parsedData;

        try {
            // STAGE 1: Try the fast, strict, standard parser first.
            parsedData = JSON.parse(jsonStr);
        } catch (strictError) {
            try {
                // STAGE 2: If it fails, try the forgiving, non-LLM parser.
                parsedData = JSON5.parse(jsonStr);
            } catch (lenientError) {
                // STAGE 3: If all else fails, use the expensive but powerful LLM repair.
                parsedData = await repairAndParseJsonWithLMStudio(serverUrl, modelName, jsonStr);
            }
        }

        if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
            return parsedData;
        } else {
            throw new GeneralError('error_unexpected_json_structure');
        }
    } catch (error: any) {
        if (error instanceof TypeError) throw new ConfigError('error_local_server_connection', { url: serverUrl });
        console.error("Error analyzing text with LM Studio:", error);
        throw error; // Re-throw the (potentially new) error
    }
};

export const generateRebuttalWithLMStudio = async (
    sourceText: string,
    analysis: AIAnalysisOutput,
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode
): Promise<string> => {
    if (!serverUrl || !modelName) throw new ConfigError('error_local_server_config_missing');
    if (!sourceText || !analysis) throw new ConfigError('error_rebuttal_generation');
    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[languageCode] || languageCode;

    const systemPrompt = REBUTTAL_SYSTEM_PROMPT.replace('{language}', languageName);
    const userContent = `Here is the AI analysis of the source text:\n${JSON.stringify(analysis, null, 2)}\n\nHere is the original source text you must rebut:\n${sourceText}`;

    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent }
        ],
        temperature: 0.7,
        max_tokens: 8192,
    };
    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ConfigError('error_local_model_not_loaded', { model: modelName, message: errorData.error?.message || response.statusText });
    }
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new GeneralError('error_unexpected_json_structure');
    return content.trim();
};

export const translateUIWithLMStudio = async (
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode,
    jsonToTranslate: string
): Promise<Record<string, string>> => {
    if (!serverUrl || !modelName) throw new ConfigError('error_local_server_config_missing');

    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[languageCode] || languageCode;

    // Parse the base translations JSON
    const baseTranslations = JSON.parse(jsonToTranslate);

    // Use translation utilities for token efficiency
    const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(baseTranslations);
    const contentToTranslate = JSON.stringify(numberedJson);

    const userPrompt = `Translate the following JSON values to ${languageName}:\n\n${contentToTranslate}`;
    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 8192,
    };
    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ConfigError('error_local_model_not_loaded', { model: modelName, message: errorData.error?.message || response.statusText });
    }
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new GeneralError('error_unexpected_json_structure');

    // Reconstruct the translated JSON with original keys
    const translatedNumbered = JSON.parse(extractJson(content));
    return reconstructTranslatedJson(translatedNumbered, numberToKeyMap);
};

export const translateAnalysisResultWithLMStudio = async (
    analysis: AIAnalysisOutput,
    serverUrl: string,
    modelName: string,
    targetLanguage: LanguageCode
): Promise<AIAnalysisOutput> => {
    if (!serverUrl || !modelName) throw new ConfigError('error_local_server_config_missing');
    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[targetLanguage] || targetLanguage;
    const systemPrompt = ANALYSIS_TRANSLATION_PROMPT.replace('{language}', languageName);

    const flatSource = flattenAnalysisForTranslation(analysis);
    const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(flatSource);
    const contentToTranslate = JSON.stringify(numberedJson);

    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: contentToTranslate }
        ],
        temperature: 0.2,
        max_tokens: 8192,
    };
    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new GeneralError('error_translation_failed', { message: `LM Studio: ${response.statusText}` });

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new GeneralError('error_unexpected_json_structure');

    const translatedNumbered = JSON.parse(extractJson(content));
    const translatedFlat = reconstructTranslatedJson(translatedNumbered, numberToKeyMap);

    return reconstructAnalysisFromTranslation(analysis, translatedFlat);
};

export const translateTextWithLMStudio = async (
    textToTranslate: string,
    serverUrl: string,
    modelName: string,
    targetLanguage: LanguageCode
): Promise<string> => {
    if (!textToTranslate.trim()) return "";
    if (!serverUrl || !modelName) throw new ConfigError('error_local_server_config_missing');
    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[targetLanguage] || targetLanguage;
    const systemPrompt = SIMPLE_TEXT_TRANSLATION_PROMPT.replace('{language}', languageName);
    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: textToTranslate }
        ],
        temperature: 0.2,
    };
    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new GeneralError('error_rebuttal_translation_failed', { message: `LM Studio: ${response.statusText}` });
    const data = await response.json();
    return (data.choices[0]?.message?.content || '').trim();
};
