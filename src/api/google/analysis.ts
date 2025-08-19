import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_PROMPT, REBUTTAL_SYSTEM_PROMPT } from "../../config/api-prompts";
import { AIAnalysisOutput } from "../../types/api";
import { repairAndParseJson } from "./utils";
import { extractJson } from "../../utils/apiUtils";
import { ConfigError, GeneralError } from "../../utils/errors";

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

    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models;

    try {
      const result = await model.generateContent({
        model: modelName || GEMINI_MODEL_NAME,
        contents: [
          { role: "user", parts: [{ text: `Please analyze the following text: ${textToAnalyze}` }] }
        ],
        config: {
          systemInstruction: String(SYSTEM_PROMPT),
          temperature: 0.0,
          topP: 0,
          topK: 1,
        },
      });

      const rawText = result.text ?? '';
      const jsonStr = extractJson(rawText);
      let parsedData;

      try {
        parsedData = JSON.parse(jsonStr);
      } catch (e) {
        parsedData = await repairAndParseJson(apiKey, jsonStr, modelName || GEMINI_MODEL_NAME);
      }

      if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
          return parsedData;
      } else {
        throw new GeneralError('error_unexpected_json_structure');
      }
    } catch (error: any) {
        console.error("Error analyzing text with Gemini API:", error);
        if (error.message && error.message.includes("SAFETY")) {
            throw new GeneralError('error_safety_block');
        }
        let apiErrorObject;
        try {
          apiErrorObject = JSON.parse(error.message);
        } catch (parseError) {
          throw new GeneralError('error_analysis_failed', { message: error.message || "Unknown API error" });
        }
        if (apiErrorObject && apiErrorObject.error && apiErrorObject.error.message) {
          const { code, status, message } = apiErrorObject.error;
          if (status === 'RESOURCE_EXHAUSTED' || code === 429) {
            throw new ConfigError('error_quota_exhausted', { message: message });
          } else {
            throw new ConfigError('error_api_generic', { message: message });
          }
        }
        throw new GeneralError('error_analysis_failed', { message: error.message || "Unknown API error" });
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

  const ai = new GoogleGenAI({ apiKey });
  const model = ai.models;

  const fullPrompt = REBUTTAL_SYSTEM_PROMPT
    .replace('{analysisJson}', JSON.stringify(analysis, null, 2))
    .replace('{sourceText}', sourceText)
    .replace('{language}', languageCode);

  try {
    const result = await model.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: {
            temperature: 0.7,
            maxOutputTokens: 8192,
        },
    });

    return (result.text ?? '').trim();
  } catch (error: any) {
    console.error("Error generating rebuttal:", error);
    if (error.message && error.message.includes("SAFETY")) {
        throw new GeneralError('error_safety_block');
    }
    throw new GeneralError('error_rebuttal_generation', { message: error.message || "Unknown API error" });
  }
};
