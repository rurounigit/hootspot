// src/api/google/utils.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { repairAndParseJson, testApiKey } from './utils';
import { GoogleGenAI } from '@google/genai';

// --- Mock Setup ---
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  const GoogleGenAI = vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  }));
  return { GoogleGenAI };
});

// A mock translation function `t` for providing user-friendly error messages.
const mockT = vi.fn((key: string, replacements?: Record<string, any>) => {
    if (replacements) {
        return `${key} with ${JSON.stringify(replacements)}`;
    }
    return key;
});


describe('Google API Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('repairAndParseJson', () => {
        const apiKey = 'test-api-key';
        const modelName = 'gemini-pro';
        const brokenJson = '{"key": "value",';

        it('returns the parsed JSON when the repair is successful', async () => {
            const repairedJson = '{"key": "value"}';
            const parsedData = { key: 'value' };
            mockGenerateContent.mockResolvedValue({ text: `\`\`\`json\n${repairedJson}\n\`\`\`` });

            const result = await repairAndParseJson(apiKey, brokenJson, modelName);

            expect(result).toEqual(parsedData);
            expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey });
            expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        });

        it('throws an error when the repair fails', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'still broken' }); // Simulate AI failing to fix

            await expect(repairAndParseJson(apiKey, 'still broken', modelName))
              .rejects.toThrow('Failed to parse analysis even after attempting a repair: Unexpected token \'s\', "still broken" is not valid JSON');

            expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        });
    });

    describe('testApiKey', () => {
        it('should resolve successfully for a valid key', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Hello' });
            await expect(testApiKey('valid-key', mockT, 'gemini-pro')).resolves.toBeUndefined();
        });

        it('should throw an error if the API key is empty', async () => {
            await expect(testApiKey('', mockT, 'gemini-pro')).rejects.toThrow('error_api_key_empty');
        });

        it('should throw if the test query returns an empty response', async () => {
            mockGenerateContent.mockResolvedValue({ text: ' ' }); // Empty response
            await expect(testApiKey('valid-key', mockT, 'gemini-pro')).rejects.toThrow('test_query_returned_empty');
        });

        it('should throw a specific error for quota exhaustion', async () => {
            const quotaError = new Error(JSON.stringify({
                error: {
                    status: 'RESOURCE_EXHAUSTED',
                    message: 'Quota exceeded.'
                }
            }));
            mockGenerateContent.mockRejectedValue(quotaError);
            await expect(testApiKey('valid-key', mockT, 'gemini-pro')).rejects.toThrow('error_quota_exhausted with {"message":"Quota exceeded."}');
        });

        it('should throw a generic API error for other issues', async () => {
            const genericError = new Error(JSON.stringify({
                error: {
                    status: 'INVALID_ARGUMENT',
                    message: 'Invalid request.'
                }
            }));
            mockGenerateContent.mockRejectedValue(genericError);
            await expect(testApiKey('valid-key', mockT, 'gemini-pro')).rejects.toThrow('error_api_generic with {"message":"Invalid request."}');
        });

         it('should throw a generic test failure message for unparseable errors', async () => {
            const unparseableError = new Error('A simple string error');
            mockGenerateContent.mockRejectedValue(unparseableError);
            await expect(testApiKey('valid-key', mockT, 'gemini-pro')).rejects.toThrow('error_api_key_test_failed_message with {"message":"A simple string error"}');
        });
    });
});