// src/utils/textUtils.ts

import { PDF_CONFIG } from '../pdf-config'; // <-- IMPORT THE CONFIG

// --- Create a single, reusable canvas for text measurement ---
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// --- Constants for layout control ---
const LINE_HEIGHT = 1.1; // Standard line height for multi-line text.

/**
 * Wraps text to fit within a specific width using a language-agnostic,
 * character-based breaking algorithm for oversized words.
 *
 * @param text The text to wrap.
 * @param availableWidth The maximum pixel width for any line.
 * @param fontSize The font size to use for measurement.
 * @returns An array of strings, where each string is a correctly wrapped line.
 */
export const wrapSvgText = (text: string, availableWidth: number, fontSize: number): string[] => {
  if (!text || !context || availableWidth <= 0) return [];

  context.font = `bold ${fontSize}px system-ui, sans-serif`;

  const lines: string[] = [];
  let currentLine = '';
  const words = text.split(' ');

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testLineWidth = context.measureText(testLine).width;

    if (testLineWidth <= availableWidth) {
      currentLine = testLine;
    } else {
      // The current line is full, push it to the results.
      if (currentLine) {
        lines.push(currentLine);
      }

      const wordWidth = context.measureText(word).width;

      if (wordWidth <= availableWidth) {
        // The new word fits on a line by itself.
        currentLine = word;
      } else {
        // The word itself is too long and must be broken at the character level.
        let tempWord = '';
        for (let i = 0; i < word.length; i++) {
          const char = word[i];
          const nextTempWord = tempWord + char;
          // Check if the substring plus a hyphen still fits
          if (context.measureText(nextTempWord + '-').width <= availableWidth) {
            tempWord = nextTempWord;
          } else {
            // The character overflows, so push the previous fitting substring with a hyphen.
            lines.push(tempWord + '-');
            // Start the new tempWord with the current character.
            tempWord = char;
          }
        }
        // The remainder of the word becomes the new current line.
        currentLine = tempWord;
      }
    }
  }

  // Add the final line to the array.
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};


/**
 * Calculates the optimal font size for a text to fit inside a circle using binary search
 * and a geometrically-aware validation check.
 *
 * @param text The text to be fitted.
 * @param radius The radius of the containing circle.
 * @param minFont The minimum allowable font size (e.g., 6).
 * @returns An object containing the optimal `fontSize` and the `lines` of wrapped text.
 */
export const calculateOptimalFontSize = (
  text: string,
  radius: number,
  minFont: number = 6
): { fontSize: number; lines: string[] } => {
  if (!text || radius <= 0) return { fontSize: minFont, lines: [] };

  // Use values from the config file
  let low = minFont;
  let high = PDF_CONFIG.BUBBLE_MAX_FONT_SIZE;
  const paddingFactor = PDF_CONFIG.BUBBLE_TEXT_PADDING_FACTOR;

  let bestFit = { fontSize: minFont, lines: wrapSvgText(text, radius * 2 * paddingFactor, minFont) };

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (mid === 0) { low = 1; continue; }

    const inscribedWidth = radius * 2 * paddingFactor;
    const currentLines = wrapSvgText(text, inscribedWidth, mid);
    const lineCount = currentLines.length;
    const singleLineHeight = mid * LINE_HEIGHT;
    const textHeight = lineCount * singleLineHeight;

    let fitsGeometrically = true;

    if (textHeight > inscribedWidth) {
        fitsGeometrically = false;
    } else {
      for (let i = 0; i < lineCount; i++) {
        const lineWidth = context.measureText(currentLines[i]).width;
        const lineCenterY = -textHeight / 2 + (i * singleLineHeight) + singleLineHeight / 2;
        const maxAllowedWidthAtY = 2 * Math.sqrt(radius * radius - lineCenterY * lineCenterY);

        if (isNaN(maxAllowedWidthAtY) || lineWidth > maxAllowedWidthAtY * paddingFactor) {
          fitsGeometrically = false;
          break;
        }
      }
    }

    if (fitsGeometrically) {
      bestFit = { fontSize: mid, lines: currentLines };
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // Final check to handle truncation if the smallest font still overflows.
  const finalHeight = bestFit.lines.length * bestFit.fontSize * LINE_HEIGHT;
  if (finalHeight > radius * 2 * paddingFactor) {
      const maxLines = Math.floor((radius * 2 * paddingFactor) / (bestFit.fontSize * LINE_HEIGHT));
      if (maxLines > 0) {
          const truncatedLines = bestFit.lines.slice(0, maxLines);
          if (truncatedLines.length > 0) {
              const lastLine = truncatedLines[truncatedLines.length - 1];
              truncatedLines[truncatedLines.length - 1] = lastLine.slice(0, -1) + '…';
          }
          return { fontSize: bestFit.fontSize, lines: truncatedLines };
      }
      return { fontSize: bestFit.fontSize, lines: [] };
  }

  return bestFit;
};