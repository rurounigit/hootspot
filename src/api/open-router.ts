import { OPENROUTER_API_BASE_URL } from '../constants';
import { ANALYSIS_TRANSLATION_PROMPT, SYSTEM_PROMPT } from '../config/api-prompts';
import { GeminiAnalysisResponse } from '../types/api';
import { extractJson } from '../utils/apiUtils';

export const getOpenRouterModels = async (apiKey: string) => {
  const response = await fetch(`${OPENROUTER_API_BASE_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch OpenRouter models: ${errorData.error.message}`);
  }

  const { data } = await response.json();
  return data;
};

export const testOpenRouterConnection = async (apiKey: string, model: string) => {
  if (!apiKey) {
    throw new Error('OpenRouter API key is missing.');
  }

  if (!model) {
    throw new Error('OpenRouter model is not selected.');
  }

  const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Hello' }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter API request failed: ${errorData.error.message}`);
  }
};

export const analyzeTextWithOpenRouter = async (apiKey: string, text: string, model: string): Promise<GeminiAnalysisResponse> => {
  const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter analysis request failed: ${errorData.error.message}`);
  }

  const rawJson = await response.json();
  const extractedJson = extractJson(rawJson.choices[0].message.content);
  return JSON.parse(extractedJson) as GeminiAnalysisResponse;
};

export const translateAnalysisResultWithOpenRouter = async (
  apiKey: string,
  analysis: GeminiAnalysisResponse,
  targetLang: string,
  model: string
): Promise<GeminiAnalysisResponse> => {
  const translationPrompt = ANALYSIS_TRANSLATION_PROMPT.replace('{language}', targetLang);

  const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: translationPrompt },
        { role: 'user', content: JSON.stringify(analysis) },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter translation request failed: ${errorData.error.message}`);
  }

  const rawJson = await response.json();
  const extractedJson = extractJson(rawJson.choices[0].message.content);
  return JSON.parse(extractedJson) as GeminiAnalysisResponse;
};
