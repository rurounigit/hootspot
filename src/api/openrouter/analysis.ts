import { OPENROUTER_API_BASE_URL } from '../../constants';
import { SYSTEM_PROMPT, REBUTTAL_SYSTEM_PROMPT } from '../../config/api-prompts';
import { AIAnalysisOutput, PatternFinding } from '../../types/api';
import { extractJson } from '../../utils/apiUtils';
import { repairAndParseJson } from './utils';
import { ConfigError, GeneralError } from '../../utils/errors';

export const analyzeText = async (
  apiKey: string,
  textToAnalyze: string,
  modelName: string,
): Promise<AIAnalysisOutput> => {
  if (!apiKey) {
    throw new ConfigError('error_api_key_not_configured');
  }
  if (!textToAnalyze.trim()) {
    return {
      analysis_summary: "No text provided for analysis.",
      findings: [],
    };
  }

  const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Please analyze the following text: ${textToAnalyze}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      top_p: 0,
      top_k: 1,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.error.code === 'context_length_exceeded') {
        throw new GeneralError('error_context_length_exceeded');
    }
    throw new GeneralError('error_analysis_failed', { message: errorData.error.message });
  }

  const rawJson = await response.json();
  const jsonStr = extractJson(rawJson.choices[0].message.content);
  let parsedData;

  try {
    parsedData = JSON.parse(jsonStr);
  } catch (e) {
    parsedData = await repairAndParseJson(apiKey, jsonStr, modelName);
  }

  if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
      parsedData.findings.sort((a: PatternFinding, b: PatternFinding) => {
        const indexA = textToAnalyze.indexOf(a.specific_quote);
        const indexB = textToAnalyze.indexOf(b.specific_quote);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      return parsedData;
  } else {
    throw new GeneralError('error_unexpected_json_structure');
  }
};

export const generateRebuttal = async (
  apiKey: string,
  sourceText: string,
  analysis: AIAnalysisOutput,
  modelName: string,
  languageCode: string
): Promise<string> => {
  if (!apiKey) {
    throw new ConfigError('error_api_key_not_configured');
  }
  if (!sourceText || !analysis) {
    throw new GeneralError('error_rebuttal_generation');
  }

  const systemPrompt = REBUTTAL_SYSTEM_PROMPT
    .replace('{language}', languageCode)
    .replace('{analysisJson}', JSON.stringify(analysis, null, 2))
    .replace('{sourceText}', sourceText);

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
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new GeneralError('error_rebuttal_generation', { message: errorData.error.message });
  }

  const json = await response.json();
  return json.choices[0].message.content;
};
