import { OPENROUTER_API_BASE_URL } from '../../constants';
import { ANALYSIS_TRANSLATION_PROMPT, SIMPLE_TEXT_TRANSLATION_PROMPT, TRANSLATION_SYSTEM_PROMPT } from '../../config/api-prompts';
import { GeminiAnalysisResponse } from '../../types/api';
import { LanguageCode } from '../../i18n';
import { repairAndParseJson } from './utils';
import { extractJson } from '../../utils/apiUtils';
import {
  createNumberedJsonForTranslation,
  reconstructTranslatedJson,
  flattenAnalysisForTranslation,
  reconstructAnalysisFromTranslation
} from '../../utils/translationUtils';

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

export const translateAnalysisResult = async (
  apiKey: string,
  analysis: GeminiAnalysisResponse,
  targetLanguage: LanguageCode,
  modelName: string,
  t: TFunction
): Promise<GeminiAnalysisResponse> => {
  if (!apiKey) {
    throw new Error(`KEY::error_api_key_not_configured::${t('error_api_key_not_configured')}`);
  }

  const systemPrompt = ANALYSIS_TRANSLATION_PROMPT.replace('{language}', targetLanguage);

  const flatSource = flattenAnalysisForTranslation(analysis);
  const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(flatSource);
  const contentToTranslate = JSON.stringify(numberedJson);

  const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentToTranslate },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`KEY::error_translation_failed::${t('error_translation_failed', { message: errorData.error.message || "Unknown API error" })}`);
  }

  const rawJson = await response.json();
  const jsonStr = extractJson(rawJson.choices[0].message.content);
  let parsedData;

  try {
      parsedData = JSON.parse(jsonStr);
  } catch (e) {
      parsedData = await repairAndParseJson(apiKey, jsonStr, modelName);
  }

  const translatedFlat = reconstructTranslatedJson(parsedData, numberToKeyMap);
  return reconstructAnalysisFromTranslation(analysis, translatedFlat);
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

  const systemPrompt = SIMPLE_TEXT_TRANSLATION_PROMPT.replace('{language}', targetLanguage);

  const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: textToTranslate },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`KEY::error_rebuttal_translation_failed::${t('error_rebuttal_translation_failed', { message: errorData.error.message || "Unknown API error" })}`);
  }

  const json = await response.json();
  return json.choices[0].message.content;
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

    const baseTranslations = JSON.parse(baseTranslationsJSON);
    const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(baseTranslations);
    const contentToTranslate = JSON.stringify(numberedJson);

    const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
                { role: 'user', content: `Translate the following JSON values to ${targetLanguage}:

${contentToTranslate}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`KEY::lang_manager_error_api::${t('lang_manager_error_api', { message: errorData.error.message || "Unknown API error" })}`);
    }

    const rawJson = await response.json();
    const jsonStr = extractJson(rawJson.choices[0].message.content);
    let parsedData;
    try {
        parsedData = JSON.parse(jsonStr);
    } catch(e) {
        parsedData = await repairAndParseJson(apiKey, jsonStr, modelName);
    }

    return reconstructTranslatedJson(parsedData, numberToKeyMap);
};
