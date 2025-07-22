import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeText, generateRebuttal } from './analysis';
import { GoogleGenAI } from '@google/genai';
import * as Utils from './utils';

// Mock the entire @google/genai module
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  const GoogleGenAI = vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  }));
  return { GoogleGenAI };
});

// Mock the repairAndParseJson function from the utils module
vi.mock('./utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('./utils')>();
  return {
    ...original, // Keep the original extractJson
    repairAndParseJson: vi.fn(),
  };
});

describe('Google API - Analysis', () => {
  beforeEach(() => {
    // Clear all mock history and implementations before each test
    vi.clearAllMocks();
  });

  describe('analyzeText', () => {
    const validApiResponse = {
      text: '```json\n{"analysis_summary": "Summary", "findings": [{"specific_quote": "quote b"}, {"specific_quote": "quote a"}]}\n```'
    };
    const textToAnalyze = 'This is quote a and quote b.';

    it('should return a sorted analysis on a successful API call', async () => {
      mockGenerateContent.mockResolvedValue(validApiResponse);
      const result = await analyzeText('test-key', textToAnalyze, 'gemini-pro');
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-key' });
      expect(mockGenerateContent).toHaveBeenCalled();
      // Test that results are sorted by their appearance in the source text
      expect(result.findings[0].specific_quote).toBe('quote a');
      expect(result.findings[1].specific_quote).toBe('quote b');
    });

    it('should throw an error if API key is not provided', async () => {
      await expect(analyzeText('', textToAnalyze, 'gemini-pro'))
        .rejects.toThrow('error_api_key_not_configured');
    });

    it('should call repairAndParseJson for malformed JSON', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{"analysis_summary": "Incomplete", ' });
      const repairedData = { analysis_summary: 'Repaired', findings: [] };
      vi.mocked(Utils.repairAndParseJson).mockResolvedValue(repairedData);

      const result = await analyzeText('test-key', textToAnalyze, 'gemini-pro');

      expect(Utils.repairAndParseJson).toHaveBeenCalled();
      expect(result).toEqual(repairedData);
    });

    it('should throw a specific error for API safety blocks', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Request was blocked due to SAFETY'));
      await expect(analyzeText('test-key', textToAnalyze, 'gemini-pro'))
        .rejects.toThrow('The request was blocked due to safety concerns from the API.');
    });

    it('should return a default response for empty text without calling the API', async () => {
        const result = await analyzeText('test-key', '  ', 'gemini-pro');
        expect(result).toEqual({
          analysis_summary: "No text provided for analysis.",
          findings: [],
        });
        expect(mockGenerateContent).not.toHaveBeenCalled();
      });
  });

  describe('generateRebuttal', () => {
    const sourceText = 'Source text.';
    const analysis = { analysis_summary: 'summary', findings: [] };

    it('should return a rebuttal on a successful API call', async () => {
      mockGenerateContent.mockResolvedValue({ text: '  A successful rebuttal.  ' });
      const result = await generateRebuttal('test-key', sourceText, analysis, 'gemini-pro', 'en');

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toBe('A successful rebuttal.'); // Check for trimming
    });

    it('should throw an error if API key is not configured', async () => {
        await expect(generateRebuttal('', sourceText, analysis, 'gemini-pro', 'en'))
          .rejects.toThrow('API Key is not configured.');
      });

    it('should throw a specific error for rebuttal safety blocks', async () => {
        mockGenerateContent.mockRejectedValue(new Error('Blocked for SAFETY reasons.'));
        await expect(generateRebuttal('test-key', sourceText, analysis, 'gemini-pro', 'en'))
            .rejects.toThrow('The rebuttal generation was blocked due to safety concerns from the API.');
    });
  });
});