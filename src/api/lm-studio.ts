// src/api/lm-studio.ts

import { LMStudioClient } from "@lmstudio/sdk";
import {
  SYSTEM_PROMPT,
  REBUTTAL_SYSTEM_PROMPT,
  TRANSLATION_SYSTEM_PROMPT,
  ANALYSIS_TRANSLATION_PROMPT,
  SIMPLE_TEXT_TRANSLATION_PROMPT
} from '../config/api-prompts';
import { GeminiAnalysisResponse, GeminiFinding, GeminiModel } from '../types/api';
import { LanguageCode } from '../i18n';
import {
  createNumberedJsonForTranslation,
  reconstructTranslatedJson,
  flattenAnalysisForTranslation,
  reconstructAnalysisFromTranslation
} from '../utils/translationUtils';
import { ANALYSIS_RESPONSE_SCHEMA, UI_TRANSLATION_SCHEMA, ANALYSIS_TRANSLATION_SCHEMA } from '../config/schemas';
import { LANGUAGE_CODE_MAP } from '../constants';

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

export const fetchLMStudioModels = async (serverUrl: string): Promise<GeminiModel[]> => {
  try {
    const response = await fetch(`${serverUrl}/v1/models`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
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
    modelName: string,
    t: TFunction
): Promise<void> => {
    if (!serverUrl || !modelName) {
        throw new Error('error_local_server_config_missing');
    }
    try {
        const client = new LMStudioClient({ baseUrl: serverUrl });
        const model = await client.llm.model(modelName, { verbose: false });

        const result = await model.respond(
            [{ role: 'user', content: 'Hello' }],
            { maxTokens: 5 }
        );

        if (!result.content || result.content.trim().length === 0) {
            throw new Error(t('test_query_returned_empty'));
        }
    } catch (error: any) {
        if (error instanceof TypeError || error.message.includes('Failed to fetch')) {
            throw new Error(t('error_local_server_connection', { url: serverUrl }));
        }
        if (error.message.includes('model_not_found')) {
            throw new Error(t('error_local_model_not_loaded_exact', { model: modelName }));
        }
        throw new Error(t('error_local_model_not_loaded', { model: modelName, message: error.message || 'Unknown error' }));
    }
};

export const analyzeTextWithLMStudio = async (
    textToAnalyze: string,
    serverUrl: string,
    modelName: string,
    t: TFunction
): Promise<GeminiAnalysisResponse> => {
    if (!serverUrl || !modelName) throw new Error('error_local_server_config_missing');
    if (!textToAnalyze.trim()) return { analysis_summary: "No text provided for analysis.", findings: [] };

    try {
        const client = new LMStudioClient({ baseUrl: serverUrl });
        const model = await client.llm.model(modelName, { verbose: false });

        const result = await model.respond(
            [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Please analyze the following text: ${textToAnalyze}` }
            ],
            {
                temperature: 0.2,
                maxTokens: 8192,
                structured: {
                    type: "json",
                    jsonSchema: ANALYSIS_RESPONSE_SCHEMA
                }
            }
        );

        const content = result.content;
        if (!content) throw new Error(t('error_unexpected_json_structure'));

        const parsedData = JSON.parse(content);
        if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
            parsedData.findings.sort((a: GeminiFinding, b: GeminiFinding) => {
                return (textToAnalyze.indexOf(a.specific_quote) - textToAnalyze.indexOf(b.specific_quote));
            });
            return parsedData;
        } else {
            throw new Error(t('error_unexpected_json_structure'));
        }
    } catch (error: any) {
        if (error instanceof TypeError) throw new Error(t('error_local_server_connection', { url: serverUrl }));
        console.error("Error analyzing text with LM Studio:", error);
        throw error;
    }
};

export const generateRebuttalWithLMStudio = async (
    sourceText: string,
    analysis: GeminiAnalysisResponse,
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode,
    t: TFunction
): Promise<string> => {
    if (!serverUrl || !modelName) throw new Error(t('error_local_server_config_missing'));
    if (!sourceText || !analysis) throw new Error("Source text and analysis are required to generate a rebuttal.");
    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[languageCode] || languageCode;

    const systemPrompt = REBUTTAL_SYSTEM_PROMPT.replace('{language}', languageName);
    const userContent = `Here is the AI analysis of the source text:\n${JSON.stringify(analysis, null, 2)}\n\nHere is the original source text you must rebut:\n${sourceText}`;

    try {
        const client = new LMStudioClient({ baseUrl: serverUrl });
        const model = await client.llm.model(modelName, { verbose: false });

        const result = await model.respond(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            {
                temperature: 0.7,
                maxTokens: 8192,
            }
        );

        return result.content.trim();
    } catch (error: any) {
        if (error instanceof TypeError) throw new Error(t('error_local_server_connection', { url: serverUrl }));
        console.error("Error generating rebuttal with LM Studio:", error);
        throw error;
    }
};

export const translateUIWithLMStudio = async (
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode,
    jsonToTranslate: string,
    t: TFunction,
): Promise<Record<string, string>> => {
    if (!serverUrl || !modelName) throw new Error(t('error_local_server_config_missing'));

    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[languageCode] || languageCode;

    // Parse the base translations JSON
    const baseTranslations = JSON.parse(jsonToTranslate);

    // Use translation utilities for token efficiency
    const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(baseTranslations);
    const contentToTranslate = JSON.stringify(numberedJson);

    const userPrompt = `Translate the following JSON values to ${languageName}:\n\n${contentToTranslate}`;

    try {
        const client = new LMStudioClient({ baseUrl: serverUrl });
        const model = await client.llm.model(modelName, { verbose: false });

        const result = await model.respond(
            [
                { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            {
                temperature: 0.2,
                maxTokens: 8192,
                structured: {
                    type: "json",
                    jsonSchema: UI_TRANSLATION_SCHEMA
                }
            }
        );

        const content = result.content;
        if (!content) throw new Error(t('error_unexpected_json_structure'));

        const translatedNumbered = JSON.parse(content);
        return reconstructTranslatedJson(translatedNumbered, numberToKeyMap);
    } catch (error: any) {
        if (error instanceof TypeError) throw new Error(t('error_local_server_connection', { url: serverUrl }));
        console.error("Error translating UI with LM Studio:", error);
        throw error;
    }
};

export const translateAnalysisResultWithLMStudio = async (
    analysis: GeminiAnalysisResponse,
    serverUrl: string,
    modelName: string,
    targetLanguage: LanguageCode,
    t: TFunction
): Promise<GeminiAnalysisResponse> => {
    if (!serverUrl || !modelName) throw new Error(t('error_local_server_config_missing'));
    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[targetLanguage] || targetLanguage;
    const systemPrompt = ANALYSIS_TRANSLATION_PROMPT.replace('{language}', languageName);

    const flatSource = flattenAnalysisForTranslation(analysis);
    const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(flatSource);
    const contentToTranslate = JSON.stringify(numberedJson);

    try {
        const client = new LMStudioClient({ baseUrl: serverUrl });
        const model = await client.llm.model(modelName, { verbose: false });

        const result = await model.respond(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: contentToTranslate }
            ],
            {
                temperature: 0.2,
                maxTokens: 8192,
                structured: {
                    type: "json",
                    jsonSchema: ANALYSIS_TRANSLATION_SCHEMA
                }
            }
        );

        const content = result.content;
        if (!content) throw new Error(t('error_unexpected_json_structure'));

        const translatedNumbered = JSON.parse(content);
        const translatedFlat = reconstructTranslatedJson(translatedNumbered, numberToKeyMap);

        return reconstructAnalysisFromTranslation(analysis, translatedFlat);
    } catch (error: any) {
        if (error instanceof TypeError) throw new Error(t('error_local_server_connection', { url: serverUrl }));
        console.error("Error translating analysis with LM Studio:", error);
        throw error;
    }
};

export const translateTextWithLMStudio = async (
    textToTranslate: string,
    serverUrl: string,
    modelName: string,
    targetLanguage: LanguageCode,
    t: TFunction
): Promise<string> => {
    if (!textToTranslate.trim()) return "";
    if (!serverUrl || !modelName) throw new Error(t('error_local_server_config_missing'));
    const languageMap: { [key: string]: string } = LANGUAGE_CODE_MAP;
    const languageName = languageMap[targetLanguage] || targetLanguage;
    const systemPrompt = SIMPLE_TEXT_TRANSLATION_PROMPT.replace('{language}', languageName);

    try {
        const client = new LMStudioClient({ baseUrl: serverUrl });
        const model = await client.llm.model(modelName, { verbose: false });

        const result = await model.respond(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: textToTranslate }
            ],
            {
                temperature: 0.2,
            }
        );

        return result.content.trim();
    } catch (error: any) {
        if (error instanceof TypeError) throw new Error(t('error_local_server_connection', { url: serverUrl }));
        console.error("Error translating text with LM Studio:", error);
        throw error;
    }
};
