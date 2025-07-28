// src/api/ollama.ts

import {
  SYSTEM_PROMPT,
  REBUTTAL_SYSTEM_PROMPT,
  TRANSLATION_SYSTEM_PROMPT,
  ANALYSIS_TRANSLATION_PROMPT,
  SIMPLE_TEXT_TRANSLATION_PROMPT
} from '../config/api-prompts';
import { GeminiAnalysisResponse, GeminiFinding, GeminiModel } from '../types/api';
import { LanguageCode } from '../i18n';
import { createNumberedJsonForTranslation, reconstructTranslatedJson } from '../utils/translationUtils';

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

export const fetchOllamaModels = async (serverUrl: string): Promise<GeminiModel[]> => {
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
    modelName: string,
    t: TFunction
): Promise<void> => {
    if (!serverUrl || !modelName) throw new Error('error_local_server_config_missing');
    try {
        const response = await fetch(`${serverUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: 'Hello' }],
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(t('error_local_model_not_loaded', { model: modelName, message: errorData.error || response.statusText }));
        }
    } catch (error: any) {
        if (error instanceof TypeError || error.message.includes('Failed to fetch')) {
            throw new Error(t('error_local_server_connection', { url: serverUrl }));
        }
        throw error;
    }
};

export const analyzeTextWithOllama = async (
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
        format: "json",
        stream: false,
    };
    try {
        const response = await fetch(`${serverUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(t('error_local_model_not_loaded', { model: modelName, message: errorData.error || response.statusText }));
        }
        const data = await response.json();
        const content = data.message?.content;
        if (!content) throw new Error(t('error_unexpected_json_structure'));
        let parsedData = JSON.parse(content);
        if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
            parsedData.findings.sort((a: GeminiFinding, b: GeminiFinding) => {
                return textToAnalyze.indexOf(a.specific_quote) - textToAnalyze.indexOf(b.specific_quote);
            });
            return parsedData;
        } else {
            throw new Error(t('error_unexpected_json_structure'));
        }
    } catch (error: any) {
        if (error instanceof TypeError) throw new Error(t('error_local_server_connection', { url: serverUrl }));
        console.error("Error analyzing text with Ollama:", error);
        throw error;
    }
};

export const generateRebuttalWithOllama = async (
    sourceText: string,
    analysis: GeminiAnalysisResponse,
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode,
    t: TFunction
): Promise<string> => {
    const systemPrompt = REBUTTAL_SYSTEM_PROMPT.replace('{languageCode}', languageCode);
    const userContent = `Here is the AI analysis of the source text:\n${JSON.stringify(analysis, null, 2)}\n\nHere is the original source text you must rebut:\n${sourceText}`;

    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent }
        ],
        stream: false,
    };
    const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(t('error_local_model_not_loaded', { model: modelName, message: errorData.error || "Unknown" }));
    }
    const data = await response.json();
    return (data.message?.content || '').trim();
};

export const translateUIWithOllama = async (
    serverUrl: string,
    modelName: string,
    languageCode: LanguageCode,
    jsonToTranslate: string,
    t: TFunction,
): Promise<Record<string, string>> => {
    const languageMap: { [key: string]: string } = { it: 'Italian', de: 'German', fr: 'French', es: 'Spanish', en: 'English' };
    const languageName = languageMap[languageCode] || languageCode;
    const userPrompt = `Translate the following JSON values to ${languageName}:\n\n${jsonToTranslate}`;
    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
        ],
        format: "json",
        stream: false,
    };
    const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(t('error_local_model_not_loaded', { model: modelName, message: errorData.error || "Unknown" }));
    }
    const data = await response.json();
    const content = data.message?.content;
    if (!content) throw new Error(t('error_unexpected_json_structure'));
    return JSON.parse(content);
};

export const translateAnalysisResultWithOllama = async (
    analysis: GeminiAnalysisResponse,
    serverUrl: string,
    modelName: string,
    targetLanguage: LanguageCode,
    t: TFunction
): Promise<GeminiAnalysisResponse> => {
    if (!serverUrl || !modelName) throw new Error(t('error_local_server_config_missing'));
    const systemPrompt = ANALYSIS_TRANSLATION_PROMPT.replace('{language}', targetLanguage);

    const flatSource: Record<string, string> = { 'analysis_summary': analysis.analysis_summary };
    analysis.findings.forEach((finding, index) => {
        flatSource[`finding_${index}_display_name`] = finding.display_name;
        flatSource[`finding_${index}_explanation`] = finding.explanation;
    });

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
    };
    const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(t('error_translation_failed', { message: `Ollama: ${response.statusText}` }));

    const data = await response.json();
    const content = data.message?.content;
    if (!content) throw new Error(t('error_unexpected_json_structure'));

    const translatedNumbered = JSON.parse(content);
    const translatedFlat = reconstructTranslatedJson(translatedNumbered, numberToKeyMap);

    const translatedAnalysis = JSON.parse(JSON.stringify(analysis));
    translatedAnalysis.analysis_summary = translatedFlat['analysis_summary'] || analysis.analysis_summary;
    translatedAnalysis.findings.forEach((finding: any, index: number) => {
      finding.display_name = translatedFlat[`finding_${index}_display_name`] || finding.display_name;
      finding.explanation = translatedFlat[`finding_${index}_explanation`] || finding.explanation;
    });

    return translatedAnalysis;
};

export const translateTextWithOllama = async (
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
        stream: false,
    };
    const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(t('error_rebuttal_translation_failed', { message: `Ollama: ${response.statusText}` }));
    const data = await response.json();
    return (data.message?.content || '').trim();
};