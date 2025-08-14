import { OPENROUTER_API_BASE_URL } from '../../constants';
import { JSON_REPAIR_SYSTEM_PROMPT } from '../../config/api-prompts';
import { extractJson } from '../../utils/apiUtils';
import { ConfigError, GeneralError } from '../../utils/errors';

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

export async function repairAndParseJson(
    apiKey: string,
    brokenJson: string,
    modelName: string
): Promise<any> {
    console.warn("Attempting to repair malformed JSON with OpenRouter...");
    try {
        const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: 'system', content: JSON_REPAIR_SYSTEM_PROMPT },
                    { role: 'user', content: brokenJson },
                ],
                response_format: { type: 'json_object' },
                temperature: 0,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenRouter repair request failed: ${errorData.error.message}`);
        }

        const rawJson = await response.json();
        const repairedJson = extractJson(rawJson.choices[0].message.content);
        return JSON.parse(repairedJson);
    } catch (e) {
        console.error("--- HootSpot JSON REPAIR FAILED (OpenRouter) ---");
        console.error("Original broken JSON:", brokenJson);
        throw new Error(`Failed to parse analysis even after attempting a repair: ${(e as Error).message}`);
    }
}

export const testApiKey = async (
  apiKey: string,
  t: TFunction,
  modelName: string
): Promise<void> => {
  if (!apiKey) {
    throw new ConfigError('error_api_key_empty');
  }
  if (!modelName) {
    throw new ConfigError('error_model_not_selected');
  }

  try {
    const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        // Handle specific OpenRouter error cases
        if (errorData.error && errorData.error.message) {
            const { message } = errorData.error;
            // Check for common OpenRouter error patterns
            if (message.toLowerCase().includes('auth') || message.toLowerCase().includes('credentials')) {
                throw new ConfigError('error_api_key_test_failed_message', { message: 'Invalid or missing API credentials' });
            }
            throw new ConfigError('error_api_key_test_failed_message', { message });
        }
        throw new ConfigError('error_api_key_test_failed_generic');
    }
    const result = await response.json();
    if (!result.choices || result.choices.length === 0 || !result.choices[0].message.content) {
        throw new ConfigError('test_query_returned_empty');
    }
  } catch (error: any) {
    console.error("API Key test failed:", error);
    // If it's already a ConfigError, rethrow it
    if (error instanceof ConfigError) {
        throw error;
    }
    // Otherwise, wrap it in a ConfigError for consistent handling
    throw new ConfigError('error_api_key_test_failed_message', { message: error.message || 'Unknown error' });
  }
};
