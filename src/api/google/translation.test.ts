import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateAnalysisResult, translateText, translateUI } from './translation';
import * as Utils from './utils';
import { GeminiAnalysisResponse } from '../../types/api';

// Mock the @google/genai module
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

// Mock the utility functions
vi.mock('./utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('./utils')>();
    return {
      ...original,
      repairAndParseJson: vi.fn(),
    };
  });

// A simple mock for the 't' function (translation function)
const t = (key: string) => key;

describe('Google API - Translation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('translateAnalysisResult', () => {
    const analysis: GeminiAnalysisResponse = {
      analysis_summary: "This is a summary.",
      findings: [
        { pattern_name: 'Ad Hominem', display_name: 'Personal Attack', specific_quote: 'You are wrong.', explanation: 'Attacks the person.', strength: 8, category: 'category_sociopolitical_rhetorical' },
      ],
    };

    it('should correctly translate specific fields of an analysis', async () => {
      const translatedAnalysis = {
        analysis_summary: "Dies ist eine Zusammenfassung.",
        findings: [
            { pattern_name: 'Ad Hominem', display_name: 'Persönlicher Angriff', specific_quote: 'You are wrong.', explanation: 'Greift die Person an.', strength: 8, category: 'category_sociopolitical_rhetorical' },
        ],
      };
      mockGenerateContent.mockResolvedValue({ text: `\`\`\`json\n${JSON.stringify(translatedAnalysis)}\n\`\`\`` });

      const result = await translateAnalysisResult('test-key', analysis, 'de', 'gemini-pro', t);

      expect(mockGenerateContent).toHaveBeenCalled();
      // Untranslated fields should remain the same
      expect(result.findings[0].pattern_name).toBe('Ad Hominem');
      expect(result.findings[0].specific_quote).toBe('You are wrong.');
      // Translated fields should be updated
      expect(result.analysis_summary).toBe("Dies ist eine Zusammenfassung.");
      expect(result.findings[0].explanation).toBe('Greift die Person an.');
    });

    it('should call repairAndParseJson for malformed translation JSON', async () => {
        mockGenerateContent.mockResolvedValue({ text: '{"analysis_summary": "Incomplete", ' });
        const repairedData = { analysis_summary: 'Repariert', findings: [] };
        vi.mocked(Utils.repairAndParseJson).mockResolvedValue(repairedData);

        const result = await translateAnalysisResult('test-key', analysis, 'de', 'gemini-pro', t);

        expect(Utils.repairAndParseJson).toHaveBeenCalled();
        expect(result).toEqual(repairedData);
    });
  });

  describe('translateText', () => {
    it('should return a translated string', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Hallo Welt' });
      const result = await translateText('test-key', 'Hello World', 'de', 'gemini-pro', t);
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toBe('Hallo Welt');
    });

    it('should return an empty string if input is empty, without an API call', async () => {
        const result = await translateText('test-key', '', 'de', 'gemini-pro', t);
        expect(result).toBe('');
        expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });

  describe('translateUI', () => {
    it('should translate JSON values while preserving keys and placeholders', async () => {
      const baseTranslations = {
        app_title: 'HootSpot',
        app_footer_copyright: '© {year} HootSpot. '
      };
      const expectedTranslations = {
        app_title: 'HootSpot DE',
        app_footer_copyright: '© {year} HootSpot. DE'
      };
      mockGenerateContent.mockResolvedValue({ text: `\`\`\`json\n${JSON.stringify(expectedTranslations)}\n\`\`\`` });

      const result = await translateUI('test-key', 'de', JSON.stringify(baseTranslations), t);

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result.app_title).toBe('HootSpot DE');
      // Verify that the key and the placeholder were preserved
      expect(result.app_footer_copyright).toBe('© {year} HootSpot. DE');
    });
  });
});