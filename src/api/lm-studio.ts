// src/api/lm-studio.ts

import { SYSTEM_PROMPT, REBUTTAL_SYSTEM_PROMPT } from '../config/api-prompts';
import { GeminiAnalysisResponse, GeminiFinding } from '../types/api';

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

// This helper function aggressively extracts a JSON object from a string.
function extractJson(str: string): string {
    // First, try to find JSON within markdown fences.
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/s;
    const fenceMatch = str.match(fenceRegex);
    if (fenceMatch && fenceMatch[1]) {
        return fenceMatch[1].trim();
    }

    // If no fences, find the first '{' and the last '}'
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        // Return the original string if no valid JSON structure is found
        return str;
    }

    return str.substring(firstBrace, lastBrace + 1);
}

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
            const errorData = await response.json();
            throw new Error(t('error_local_model_not_loaded', { model: modelName, message: errorData.error?.message || response.statusText }));
        }
        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
            throw new Error(t('test_query_returned_empty'));
        }
    } catch (error: any) {
        if (error instanceof TypeError) {
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
    if (!serverUrl || !modelName) {
        throw new Error('error_local_server_config_missing');
    }
    if (!textToAnalyze.trim()) {
        return { analysis_summary: "No text provided for analysis.", findings: [] };
    }

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
        if (!content) {
            throw new Error(t('error_unexpected_json_structure'));
        }

        const jsonStr = extractJson(content);
        let parsedData;

        try {
            parsedData = JSON.parse(jsonStr);
        } catch (e) {
            console.error("--- HootSpot LOCAL JSON PARSE FAILED ---");
            console.error("Original malformed JSON from local model:", jsonStr);
            throw new Error(t('error_json_parse', { message: (e as Error).message, response: jsonStr.substring(0, 100) }));
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
            throw new Error(t('error_unexpected_json_structure'));
        }
    } catch (error: any) {
        if (error instanceof TypeError) {
             throw new Error(t('error_local_server_connection', { url: serverUrl }));
        }
        console.error("Error analyzing text with LM Studio:", error);
        throw error;
    }
};


export const generateRebuttalWithLMStudio = async (
    sourceText: string,
    analysis: GeminiAnalysisResponse,
    serverUrl: string,
    modelName: string,
    languageCode: string,
    t: TFunction
): Promise<string> => {
    if (!serverUrl || !modelName) {
        throw new Error(t('error_local_server_config_missing'));
    }
    if (!sourceText || !analysis) {
        throw new Error("Source text and analysis are required to generate a rebuttal.");
    }

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
        if (!content) {
            throw new Error(t('error_unexpected_json_structure'));
        }
        return content.trim();
    } catch (error: any) {
        if (error instanceof TypeError) {
            throw new Error(t('error_local_server_connection', { url: serverUrl }));
        }
        console.error("Error generating rebuttal with LM Studio:", error);
        throw new Error(`Failed to generate rebuttal: ${error.message || "Unknown API error"}`);
    }
};

