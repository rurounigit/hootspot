import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_PROMPT, REBUTTAL_SYSTEM_PROMPT } from "../../config/api-prompts";
import { GeminiAnalysisResponse, GeminiFinding } from "../../types/api";
import { repairAndParseJson } from "./utils";
import { extractJson } from "../../utils/apiUtils";

export const analyzeText = async (
  apiKey: string,
  textToAnalyze: string,
  modelName: string,
): Promise<GeminiAnalysisResponse> => {
    if (!apiKey) {
      throw new Error("KEY::error_api_key_not_configured::API Key is not configured.");
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
          parsedData.findings.sort((a: GeminiFinding, b: GeminiFinding) => {
            const indexA = textToAnalyze.indexOf(a.specific_quote);
            const indexB = textToAnalyze.indexOf(b.specific_quote);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          return parsedData;
      } else {
        throw new Error("Received an unexpected JSON structure from the API.");
      }
    } catch (error: any) {
        console.error("Error analyzing text with Gemini API:", error);
        if (error.message && error.message.includes("SAFETY")) {
            throw new Error("KEY::error_safety_block::The request was blocked due to safety concerns from the API.");
        }
        let apiErrorObject;
        try {
          apiErrorObject = JSON.parse(error.message);
        } catch (parseError) {
          throw new Error(`KEY::error_analysis_failed::Failed to analyze text: ${error.message || "Unknown API error"}`);
        }
        if (apiErrorObject && apiErrorObject.error && apiErrorObject.error.message) {
          const { code, status, message } = apiErrorObject.error;
          if (status === 'RESOURCE_EXHAUSTED' || code === 429) {
            throw new Error(`KEY::error_quota_exhausted::API Quota Error: ${message}`);
          } else {
            throw new Error(`KEY::error_api_generic::API Error: ${message}`);
          }
        }
        throw new Error(`KEY::error_analysis_failed::Failed to analyze text: ${error.message || "Unknown API error"}`);
    }
};

export const generateRebuttal = async (
  apiKey: string,
  sourceText: string,
  analysis: GeminiAnalysisResponse,
  modelName: string,
  languageCode: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("KEY::error_api_key_not_configured::API Key is not configured.");
  }
  if (!sourceText || !analysis) {
    throw new Error("KEY::error_rebuttal_generation::Source text and analysis are required to generate a rebuttal.");
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
        throw new Error("KEY::error_safety_block::The rebuttal generation was blocked due to safety concerns from the API.");
    }
    throw new Error(`KEY::error_rebuttal_generation::Failed to generate rebuttal: ${error.message || "Unknown API error"}`);
  }
};
