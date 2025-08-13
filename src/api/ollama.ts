// src/api/ollama.ts

import {
  SYSTEM_PROMPT,
  REBUTTAL_SYSTEM_PROMPT,
  TRANSLATION_SYSTEM_PROMPT,
  ANALYSIS_TRANSLATION_PROMPT,
  SIMPLE_TEXT_TRANSLATION_PROMPT,
  JSON_REPAIR_SYSTEM_PROMPT,
} from '../config/api-prompts';
import { AIAnalysisOutput, PatternFinding, AIModel } from '../types/api';
import { LanguageCode } from '../i18n';
import {
  createNumberedJsonForTranslation,
  reconstructTranslatedJson,
  flattenAnalysisForTranslation,
  reconstructAnalysisFromTranslation
} from '../utils/translationUtils';
import { extractJson } from '../utils/apiUtils';
import { LANGUAGE_CODE_MAP } from '../constants';
import { ConfigError, GeneralError } from '../utils/errors';


/**
 * Attempts to repair a malformed JSON string by sending it back to the Ollama model
 * with specific instructions to fix it.
 * @param serverUrl The URL of the Ollama server.
 * @param modelName The model to use for the repair.
 * @param brokenJson The malformed JSON string.
 * @returns A promise that resolves to the parsed JSON object.
 */
async function repairAndParseJsonWithOllama(
    serverUrl: string,
    modelName: string,
    brokenJson: string
): Promise<any> {
    console.warn("HootSpot: Attempting to repair malformed JSON from Ollama...");
    try {
        const payload = {
            model: modelName,
            messages: [
                { role: "system", content: JSON_REPAIR_SYSTEM_PROMPT },
                { role: "user", content: brokenJson }
            ],
            format: "json", // Ask Ollama to ensure the output is JSON
            stream: false,
            options: {
                temperature: 0.0,
            }
        };
        const response = await fetch(`${serverUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new GeneralError('error_analysis_failed', { message: `Repair attempt failed with status: ${response.statusText}` });
        }

        const data = await response.json();
        const repairedContent = data.message?.content;
        if (!repairedContent) {
            throw new GeneralError('error_unexpected_json_structure');
        }

        // Ollama with format: "json" should return clean JSON, but we extract just in case.
        const repairedJson = extractJson(repairedContent);
        return JSON.parse(repairedJson);

    } catch (e: any) {
        console.error("--- HootSpot JSON REPAIR FAILED ---");
        console.error("Original broken JSON from Ollama:", brokenJson);
        throw new GeneralError('error_analysis_failed', { message: `Failed to parse or repair the model's response. Details: ${e.message}` });
    }
}

export const fetchOllamaModels = async (serverUrl: string): Promise<AIModel[]> => {
  try {
    const response = await fetch(`${serverUrl}/api/tags`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.models || !Array.isArray(data.models)) {
        console.warn("Ollama API did not return a models array. Response:", data);
        return [];
    }
    return data.models.map((model: any) => ({
      name: model.name,
      displayName: model.name,
      supportedGenerationMethods: ["generateContent"],
      version: "1.0",
    }));
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    throw error;
  }
};

export const testOllamaConnection = async (
    serverUrl: string,
    modelName: string
): Promise<void> => {
    if (!serverUrl || !modelName) throw new ConfigError('error_local_server_config_missing');
    try {
        const response = await fetch(`${serverUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: 'Hello' }],
                options: {"num_ctx": 5, "temperature": 0}
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ConfigError('error_local_model_not_loaded', { model: modelName, message: errorData.error || response.statusText });
        }
    } catch (error: any) {
        if (error instanceof TypeError || error.message.includes('Failed to fetch')) {
            throw new ConfigError('error_local_server_connection', { url: serverUrl });
        }
        throw error;
    }
};

export const analyzeTextWithOllama = async (
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
        format: "json",
        stream: false,
        options: {"temperature": 0}
    };
    try {
        const response = await fetch(`${serverUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new ConfigError('error_local_model_not_loaded', { model: modelName, message: errorData.error || response.statusText });
        }
        const data = await response.json();
        const content = data.message?.content;
        if (!content) throw new GeneralError('error_unexpected_json_structure');

        const jsonStr = extractJson(content);
        let parsedData;

        try {
            // First attempt to parse
            parsedData = JSON.parse(jsonStr);
        } catch (error) {
            // Fallback to repair function
            parsedData = await repairAndParseJsonWithOllama(serverUrl, modelName, jsonStr);
        }

        if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
            parsedData.findings.sort((a: PatternFinding, b: PatternFinding) => {
                return textToAnalyze.indexOf(a.specific_quote) - textToAnalyze.indexOf(b.specific_quote);
            });
            return parsedData;
        } else {
            throw new GeneralError('error_unexpected_json_structure');
        }
    } catch (error: any) {
        if (error instanceof TypeError) throw new ConfigError('error_local_server_connection', { url: serverUrl });
        console.error("Error analyzing text with Ollama:", error);
        throw error;
    }
};

export const generateRebuttalWithOllama = async (
    sourceText: string,
    analysis: AIAnalysisOutput,
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode
): Promise<string> => {
    if (!serverUrl || !modelName) throw new ConfigError('error_local_server_config_missing');
    if (!sourceText.trim() || !analysis) throw new GeneralError('error_rebuttal_generation');

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
        stream: false,
        options: {"temperature": 0.7}
    };
    const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
        if (!response.ok) {
            const errorData = await response.json();
            throw new ConfigError('error_local_model_not_loaded', { model: modelName, message: errorData.error || "Unknown" });
        }
    const data = await response.json();
    return (data.message?.content || '').trim();
};

export const translateUIWithOllama = async (
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode,
    jsonToTranslate: string
): Promise<Record<string, string>> => {
    if (!serverUrl || !modelName) throw new ConfigError('error_local_server_config_missing');

    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[languageCode] || languageCode;

    const baseTranslations = JSON.parse(jsonToTranslate);
    const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(baseTranslations);
    const contentToTranslate = JSON.stringify(numberedJson);

    const userPrompt = `Translate the following JSON values to ${languageName}:\n\n${contentToTranslate}`;
    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
        ],
        format: "json",
        stream: false,
        options: {"temperature": 0.2}
    };
    const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
        if (!response.ok) {
            const errorData = await response.json();
            throw new ConfigError('error_local_model_not_loaded', { model: modelName, message: errorData.error || "Unknown" });
        }
    const data = await response.json();
    const content = data.message?.content;
        if (!content) throw new GeneralError('error_unexpected_json_structure');

    const translatedNumbered = JSON.parse(extractJson(content));
    return reconstructTranslatedJson(translatedNumbered, numberToKeyMap);
};

export const translateAnalysisResultWithOllama = async (
    analysis: AIAnalysisOutput,
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode
): Promise<AIAnalysisOutput> => {
    if (!serverUrl || !modelName) throw new ConfigError('error_local_server_config_missing');
    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[languageCode] || languageCode;

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
        format: "json",
        stream: false,
        options: {"temperature": 0.2}
    };
    const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new GeneralError('error_translation_failed', { message: `Ollama: ${response.statusText}` });

    const data = await response.json();
    const content = data.message?.content;
        if (!content) throw new GeneralError('error_unexpected_json_structure');

    const translatedNumbered = JSON.parse(extractJson(content));
    const translatedFlat = reconstructTranslatedJson(translatedNumbered, numberToKeyMap);

    return reconstructAnalysisFromTranslation(analysis, translatedFlat);
};

export const translateTextWithOllama = async (
    textToTranslate: string,
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode
): Promise<string> => {
    if (!textToTranslate.trim()) return "";
    if (!serverUrl || !modelName) throw new ConfigError('error_local_server_config_missing');
    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[languageCode] || languageCode;

    const systemPrompt = SIMPLE_TEXT_TRANSLATION_PROMPT.replace('{language}', languageName);
    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: textToTranslate }
        ],
        stream: false,
        options: {"temperature": 0.2}
    };
    const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new GeneralError('error_rebuttal_translation_failed', { message: `Ollama: ${response.statusText}` });
    const data = await response.json();
    return (data.message?.content || '').trim();
};
