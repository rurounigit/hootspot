import { describe, it, expect, vi } from 'vitest';
import { calculateOptimalFontSize, wrapSvgText } from './textUtils';

// Mock the canvas context's measureText method for predictable results
const mockContext = {
  font: '',
  measureText: vi.fn((text: string) => ({ width: text.length * 6 })), // Assume each char is 6px wide
};
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any);


describe('textUtils', () => {
  describe('wrapSvgText', () => {
    it('should not wrap text that fits on one line', () => {
      const text = 'short text';
      const lines = wrapSvgText(text, 100, 12);
      expect(lines).toEqual(['short text']);
    });

    it('should wrap text that exceeds the available width', () => {
      const text = 'this is a long piece of text';
      const lines = wrapSvgText(text, 50, 12); // 50px width limit
      // With the mock measuring each character as 6px, "this is" (7 chars) would be 42px,
      // but adding "a" would make it "this is a" (9 chars = 54px) which exceeds 50px
      expect(lines).toEqual(['this', 'is a', 'long', 'piece', 'of', 'text']);
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
      expect(fontSize).toBeGreaterThan(8);
      expect(fontSize).toBeLessThanOrEqual(40);
      expect(lines.length).toBe(1);
    });

    it('should return multiple lines for text that needs to wrap', () => {
        const { lines } = calculateOptimalFontSize('A Very Long Phrase', 50, {
            minFont: 8,
            maxFontSize: 20,
            paddingFactor: 0.9,
          });
        expect(lines.length).toBeGreaterThan(1);
    });
  });
});
