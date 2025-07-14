// src/utils/textUtils.ts

import Hypher from 'hypher';
import germanPatterns from 'hyphenation.de';

// --- Create and configure the hyphenator instance ---
const hyphenator = new Hypher(germanPatterns);

// --- Create a single, reusable canvas for text measurement ---
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

/**
 * A professional, measurement-based text-wrapping solution. This algorithm
 * guarantees a fixed padding by measuring text pixel-width as it builds each line.
 * @param text The text to wrap.
 * @param radius The radius of the bubble.
 * @param fontSize The font size of the text.
 * @returns An array of strings, where each string is a correctly wrapped/hyphenated line.
 */
export const wrapSvgText = (text: string, radius: number, fontSize: number): string[] => {
  if (!text || !context) return [];

  // 1. Define the hard limit for text width, guaranteeing padding.
  const availableWidth = radius * 2 * 0.90; // 5% padding on each side

  // 2. Set the font on the canvas context for accurate measurements.
  context.font = `bold ${fontSize}px system-ui, sans-serif`;

  const lines: string[] = [];
  let currentLine = '';
  const words = text.split(' ');

  // 3. Process each word from the input text.
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testLineWidth = context.measureText(testLine).width;

    if (testLineWidth <= availableWidth) {
      // The word fits on the current line.
      currentLine = testLine;
    } else {
      // The word does not fit. The currentLine is now complete.
      if (currentLine) {
        lines.push(currentLine);
      }

      // Now, we must handle the word that overflowed.
      const wordWidth = context.measureText(word).width;

      if (wordWidth <= availableWidth) {
        // The word is shorter than the max width, so it starts a new line.
        currentLine = word;
      } else {
        // The word itself is too long and must be hyphenated.
        const syllables = hyphenator.hyphenate(word);
        let tempLine = '';
        for (const syllable of syllables) {
          const testSyllableLine = tempLine ? `${tempLine}${syllable}` : syllable;
          if (context.measureText(testSyllableLine).width <= availableWidth) {
            tempLine = testSyllableLine;
          } else {
            // This syllable overflows. Push the previous line with a hyphen.
            lines.push(tempLine + '-');
            tempLine = syllable; // Start the next line with this syllable.
          }
        }
        currentLine = tempLine; // The last part of the hyphenated word.
      }
    }
  }

  // 4. Add the final line to the array.
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};