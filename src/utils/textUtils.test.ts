// textUtils.test.ts

import { describe, it, expect, vi } from 'vitest';
import { calculateOptimalFontSize, wrapSvgText } from './textUtils';

// Mock the canvas context's measureText method for predictable results.
// We'll assume a simple model where each character is 6 pixels wide.
const mockContext = {
  font: '',
  measureText: vi.fn((text: string) => ({ width: text.length * 6 })),
};
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any);


describe('textUtils', () => {
  describe('wrapSvgText', () => {
    it('should not wrap text that fits on one line', () => {
      const text = 'short text';
      const lines = wrapSvgText(text, 100, 12); // 100px is plenty of space
      expect(lines).toEqual(['short text']);
    });

    it('should wrap text that exceeds the available width', () => {
      const text = 'this is a long piece of text';
      const availableWidth = 60; // 60px width limit
      const lines = wrapSvgText(text, availableWidth, 12);

      // --- Explanation of Expected Output ---
      // 'this is'      (7 chars * 6px = 42px) -> Fits
      // 'this is a'    (9 chars * 6px = 54px) -> Fits
      // 'this is a long'(14 chars * 6px = 84px) -> Breaks. Line is 'this is a'.
      // New line starts with 'long'.
      // 'long piece'   (10 chars * 6px = 60px) -> Fits
      // 'long piece of'(13 chars * 6px = 78px) -> Breaks. Line is 'long piece'.
      // New line starts with 'of'.
      // 'of text'      (7 chars * 6px = 42px) -> Fits
      // Final line is 'of text'.
      expect(lines).toEqual(['this is a', 'long piece', 'of text']);
    });

    it('should break and hyphenate a single word that is too long', () => {
      const longWord = 'supercalifragilisticexpialidocious';
      const availableWidth = 70; // 70px width limit
      const lines = wrapSvgText(longWord, availableWidth, 12);

      // --- Explanation of Expected Output ---
      // The logic breaks a word when `(substring + '-')` exceeds the width.
      // With 6px per char, max 11 chars fit (11*6=66px). `(11 chars + '-')` is 12*6=72px, which breaks.
      // So it will break after 10 characters and add a hyphen.
      // 'supercalif' + '-' -> 11 chars * 6 = 66px. Fits.
      // 'supercalifr' + '-' -> 12 chars * 6 = 72px. Breaks. Line is 'supercalif-'.
      // Remaining: 'ragilisticexpialidocious' -> 'ragilistic-'
      // Remaining: 'expialidocious' -> 'expialidoc-'
      // Remaining: 'ious'
      expect(lines).toEqual([
        'supercalif-',
        'ragilistic-',
        'expialidoc-',
        'ious',
      ]);
    });
  });

  describe('calculateOptimalFontSize', () => {
    it('should find the largest font size that fits within the radius', () => {
      const { fontSize, lines } = calculateOptimalFontSize('Hello', 50, {
        minFont: 8,
        maxFontSize: 40,
        paddingFactor: 0.9,
      });

      // Assert that the result is reasonable. The exact value depends on the mock.
      // The binary search should find a font size larger than the minimum.
      expect(fontSize).toBeGreaterThan(8);
      expect(fontSize).toBeLessThanOrEqual(40);
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('Hello');
    });

    it('should return multiple lines for text that needs to wrap', () => {
      const { lines } = calculateOptimalFontSize('A Very Long Phrase That Wraps', 50, {
        minFont: 8,
        maxFontSize: 20,
        paddingFactor: 0.9,
      });
      // Given the long text and constrained radius, the function should wrap the text into multiple lines.
      expect(lines.length).toBeGreaterThan(1);
    });
  });
});