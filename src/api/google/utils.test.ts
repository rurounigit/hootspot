// src/api/google/utils.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { repairAndParseJson } from './utils';
import { GoogleGenAI } from '@google/genai';

// Mock the entire @google/genai module
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  // Use a factory function to define the mock
  const GoogleGenAI = vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  }));
  return { GoogleGenAI }; // Export the mocked constructor
});


describe('repairAndParseJson', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

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
        const repairError = new Error('Parse error');
        mockGenerateContent.mockResolvedValue({ text: 'still broken' }); // Simulate AI failing to fix

        // We expect the repairAndParseJson to throw an error
        await expect(repairAndParseJson(apiKey, 'still broken', modelName))
          .rejects.toThrow('Failed to parse analysis even after attempting a repair: Unexpected token \'s\', "still broken" is not valid JSON');

        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });
});