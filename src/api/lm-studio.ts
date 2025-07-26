// src/api/lm-studio.ts

import {
  SYSTEM_PROMPT,
  REBUTTAL_SYSTEM_PROMPT,
  TRANSLATION_SYSTEM_PROMPT,
  ANALYSIS_TRANSLATION_PROMPT,
  SIMPLE_TEXT_TRANSLATION_PROMPT
} from '../config/api-prompts';
import { GeminiAnalysisResponse, GeminiFinding, GeminiModel } from '../types/api';
import { LanguageCode } from '../i18n';

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

function extractJson(str: string): string {
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/s;
    const fenceMatch = str.match(fenceRegex);
    if (fenceMatch && fenceMatch[1]) {
        return fenceMatch[1].trim();
    }
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        return str;
    }
    return str.substring(firstBrace, lastBrace + 1);
}

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
                 throw new Error(t('error_local_model_not_loaded_exact', { model: modelName }));
            }
            throw new Error(t('error_local_model_not_loaded', { model: modelName, message: errorMessage }));
        }

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
            throw new Error(t('test_query_returned_empty'));
        }
        const respondingModel = data.model;
        if (respondingModel && !respondingModel.toLowerCase().includes(modelName.toLowerCase())) {
            throw new Error(t('error_local_model_mismatch', { requested: modelName, actual: respondingModel }));
        }

    } catch (error: any) {
        if (error.message.includes('error_local_model_mismatch')) throw error;
        if (error instanceof TypeError || error.message.includes('Failed to fetch')) {
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
    if (!serverUrl || !modelName) throw new Error('error_local_server_config_missing');
    if (!textToAnalyze.trim()) return { analysis_summary: "No text provided for analysis.", findings: [] };

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
        if (!content) throw new Error(t('error_unexpected_json_structure'));
        let parsedData = JSON.parse(extractJson(content));
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

    const prompt = REBUTTAL_SYSTEM_PROMPT
        .replace('{analysisJson}', JSON.stringify(analysis, null, 2))
        .replace('{sourceText}', sourceText)
        .replace('{languageCode}', languageCode);
    const payload = {
        model: modelName,
        messages: [ { role: "user", content: prompt } ],
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
        throw new Error(t('error_local_model_not_loaded', { model: modelName, message: errorData.error?.message || response.statusText }));
    }
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error(t('error_unexpected_json_structure'));
    return content.trim();
};

export const translateUIWithLMStudio = async (
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode,
    jsonToTranslate: string,
    t: TFunction,
): Promise<Record<string, string>> => {
    if (!serverUrl || !modelName) throw new Error(t('error_local_server_config_missing'));
    const languageMap: { [key: string]: string } = { it: 'Italian', de: 'German', fr: 'French', es: 'Spanish', en: 'English' };
    const languageName = languageMap[languageCode] || languageCode;
    const userPrompt = `Translate the following JSON values to ${languageName}:\n\n${jsonToTranslate}`;
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
        throw new Error(t('error_local_model_not_loaded', { model: modelName, message: errorData.error?.message || response.statusText }));
    }
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error(t('error_unexpected_json_structure'));
    return JSON.parse(extractJson(content));
};

export const translateAnalysisResultWithLMStudio = async (
    analysis: GeminiAnalysisResponse,
    serverUrl: string,
    modelName: string,
    targetLanguage: LanguageCode,
    t: TFunction
): Promise<GeminiAnalysisResponse> => {
    if (!serverUrl || !modelName) throw new Error(t('error_local_server_config_missing'));
    const systemPrompt = ANALYSIS_TRANSLATION_PROMPT.replace('{language}', targetLanguage);
    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(analysis) }
        ],
        temperature: 0.2,
        max_tokens: 8192,
    };
    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(t('error_translation_failed', { message: `LM Studio: ${response.statusText}` }));
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error(t('error_unexpected_json_structure'));
    return JSON.parse(extractJson(content));
};

export const translateTextWithLMStudio = async (
    textToTranslate: string,
    serverUrl: string,
    modelName: string,
    targetLanguage: LanguageCode,
    t: TFunction
): Promise<string> => {
    if (!serverUrl || !modelName) throw new Error(t('error_local_server_config_missing'));
    const systemPrompt = SIMPLE_TEXT_TRANSLATION_PROMPT.replace('{language}', targetLanguage);
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
    if (!response.ok) throw new Error(t('error_rebuttal_translation_failed', { message: `LM Studio: ${response.statusText}` }));
    const data = await response.json();
    return (data.choices[0]?.message?.content || '').trim();
};