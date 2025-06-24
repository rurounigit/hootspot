
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_PROMPT } from "../constants";
import { GeminiAnalysisResponse } from "../types";

export const testApiKey = async (apiKey: string): Promise<{isValid: boolean, error?: string}> => {
  if (!apiKey) {
    return {isValid: false, error: "API Key is empty."};
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: "Hello", // A simple, low-token query
      config: { // Minimal config for test
        temperature: 0, 
        topK: 1, 
        topP: 0,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for quick test
      }
    });
    // Check if response text is not empty and seems valid
    if (response.text && response.text.trim().length > 0) {
        return {isValid: true};
    } else {
        return {isValid: false, error: "Test query returned empty or invalid response."};
    }
  } catch (error: any) {
    console.error("API Key test failed:", error);
    let errorMessage = "API Key test failed. Check console for details.";
    if (error.message) {
        errorMessage = `API Key test failed: ${error.message}`;
    }
    if (error.toString().includes("API key not valid")) {
        errorMessage = "The provided API Key is not valid. Please check the key and try again.";
    } else if (error.toString().includes("fetch")) {
        errorMessage = "Network error during API Key test. Please check your connection.";
    }
    return {isValid: false, error: errorMessage};
  }
};

export const analyzeText = async (
  apiKey: string,
  textToAnalyze: string
): Promise<GeminiAnalysisResponse> => {
  if (!apiKey) {
    throw new Error("API Key is not configured.");
  }
  if (!textToAnalyze.trim()) {
    return {
      analysis_summary: "No text provided for analysis.",
      findings: [],
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: [
        { role: "user", parts: [{ text: `Please analyze the following text: ${textToAnalyze}` }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.0, // Set to 0.0 for deterministic output
        topK: 1,          // Consider only the most probable token
        topP: 0.1,        // Use a very small nucleus for sampling
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr) as GeminiAnalysisResponse;
      // Validate structure
      if (typeof parsedData.analysis_summary === 'string' && Array.isArray(parsedData.findings)) {
        return parsedData;
      } else {
        console.error("Parsed JSON does not match expected structure:", parsedData);
        throw new Error("Received an unexpected JSON structure from the API.");
      }
    } catch (e) {
      console.error("Failed to parse JSON response:", e, "Raw response:", jsonStr);
      throw new Error(`Failed to parse analysis: ${ (e as Error).message }. Raw response: ${jsonStr.substring(0,100)}...`);
    }
  } catch (error: any) {
    console.error("Error analyzing text with Gemini API:", error);
    if (error.message && error.message.includes("SAFETY")) {
        throw new Error("The request was blocked due to safety concerns from the API. Try modifying the input text.");
    }
    throw new Error(`Failed to analyze text: ${error.message || "Unknown API error"}`);
  }
};
