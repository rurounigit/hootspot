// src/api/google/translation.ts
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME, ANALYSIS_TRANSLATION_PROMPT, SIMPLE_TEXT_TRANSLATION_PROMPT, TRANSLATION_SYSTEM_PROMPT } from "../../config/api-prompts";
import { AIAnalysisOutput } from "../../types/api";
import { LanguageCode } from "../../i18n";
import { repairAndParseJson } from "./utils";
import { extractJson } from "../../utils/apiUtils";
import {
  createNumberedJsonForTranslation,
  reconstructTranslatedJson,
  flattenAnalysisForTranslation,
  reconstructAnalysisFromTranslation
} from "../../utils/translationUtils";

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

export const translateAnalysisResult = async (
  apiKey: string,
  analysis: AIAnalysisOutput,
  targetLanguage: LanguageCode,
  modelName: string,
  t: TFunction
): Promise<AIAnalysisOutput> => {
  if (!apiKey) {
    throw new Error(`KEY::error_api_key_not_configured::${t('error_api_key_not_configured')}`);
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = ANALYSIS_TRANSLATION_PROMPT.replace('{language}', targetLanguage);

  const flatSource = flattenAnalysisForTranslation(analysis);
  const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(flatSource);
  const contentToTranslate = JSON.stringify(numberedJson);

  try {
    const fullResponse = await ai.models.generateContent({
      model: modelName || GEMINI_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: contentToTranslate }] }],
      config: {
        systemInstruction: String(systemPrompt),
        temperature: 0.2,
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

    const translatedFlat = reconstructTranslatedJson(parsedData, numberToKeyMap);
    return reconstructAnalysisFromTranslation(analysis, translatedFlat);

  } catch (error: any) {
    console.error("Error translating analysis result:", error);
    if (error.message && error.message.includes("SAFETY")) {
      throw new Error(`KEY::error_safety_block::${t('error_safety_block')}`);
    }
    throw new Error(`KEY::error_translation_failed::${t('error_translation_failed', { message: error.message || "Unknown API error" })}`);
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
    throw new Error(`KEY::error_api_key_not_configured::${t('error_api_key_not_configured')}`);
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
    throw new Error(`KEY::error_rebuttal_translation_failed::${t('error_rebuttal_translation_failed', { message: error.message || "Unknown API error" })}`);
  }
};

export const translateUI = async (
  apiKey: string,
  targetLanguage: string,
  baseTranslationsJSON: string,
  modelName: string,
  t: TFunction
): Promise<Record<string, string>> => {
    if (!apiKey) {
        throw new Error(`KEY::error_api_key_not_configured::${t('error_api_key_not_configured')}`);
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        // Parse the base translations JSON
        const baseTranslations = JSON.parse(baseTranslationsJSON);

        // Use translation utilities for token efficiency
        const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(baseTranslations);
        const contentToTranslate = JSON.stringify(numberedJson);

        const fullResponse = await ai.models.generateContent({
            model: modelName,
            contents: [
                { role: "user", parts: [{ text: `Translate the following JSON values to ${targetLanguage}:\n\n${contentToTranslate}` }] }
            ],
            config: {
                systemInstruction: String(TRANSLATION_SYSTEM_PROMPT),
                temperature: 0.2,
            },
        });

        const rawText = fullResponse.text ?? '';
        const jsonStr = extractJson(rawText);
        let parsedData;
        try {
            parsedData = JSON.parse(jsonStr);
        } catch(e) {
            parsedData = await repairAndParseJson(apiKey, jsonStr, modelName);
        }

        // Reconstruct the translated JSON with original keys
        return reconstructTranslatedJson(parsedData, numberToKeyMap);
    } catch (error: any) {
        console.error("Error translating UI with Gemini API:", error);
        if (error.message && error.message.includes("SAFETY")) {
            throw new Error(`KEY::lang_manager_error_safety::${t('lang_manager_error_safety')}`);
        }
        throw new Error(`KEY::lang_manager_error_api::${t('lang_manager_error_api', { message: error.message || "Unknown API error" })}`);
    }
};
