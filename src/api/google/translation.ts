// src/api/google/translation.ts
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME, ANALYSIS_TRANSLATION_PROMPT, SIMPLE_TEXT_TRANSLATION_PROMPT, TRANSLATION_SYSTEM_PROMPT } from "../../config/api-prompts";
import { GeminiAnalysisResponse } from "../../types/api";
import { LanguageCode } from "../../i18n";
import { extractJson, repairAndParseJson } from "./utils";
import { createNumberedJsonForTranslation, reconstructTranslatedJson } from "../../utils/translationUtils";

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

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

  // Flatten the analysis object for translation
  const flatSource: Record<string, string> = { 'analysis_summary': analysis.analysis_summary };
  analysis.findings.forEach((finding, index) => {
    flatSource[`finding_${index}_display_name`] = finding.display_name;
    flatSource[`finding_${index}_explanation`] = finding.explanation;
  });

  // Create numbered JSON for efficiency
  const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(flatSource);
  const contentToTranslate = JSON.stringify(numberedJson);

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

    // Reconstruct the flat object with translations
    const translatedFlat = reconstructTranslatedJson(parsedData, numberToKeyMap);

    // Create a deep copy and merge translations back into the original structure
    const translatedAnalysis = JSON.parse(JSON.stringify(analysis));
    translatedAnalysis.analysis_summary = translatedFlat['analysis_summary'] || analysis.analysis_summary;
    translatedAnalysis.findings.forEach((finding: any, index: number) => {
      finding.display_name = translatedFlat[`finding_${index}_display_name`] || finding.display_name;
      finding.explanation = translatedFlat[`finding_${index}_explanation`] || finding.explanation;
    });

    return translatedAnalysis;

  } catch (error: any) {
    console.error("Error translating analysis result:", error);
    if (error.message && error.message.includes("SAFETY")) {
      throw new Error(t('error_safety_block'));
    }
    throw new Error(t('error_translation_failed', { message: error.message || "Unknown API error" }));
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