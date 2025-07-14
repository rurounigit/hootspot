// src/utils/textUtils.ts

import Hypher from 'hypher';
import germanPatterns from 'hyphenation.de';

// --- Create and configure the hyphenator instance ---
const hyphenator = new Hypher(germanPatterns);

// --- Create a single, reusable canvas for text measurement ---
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// --- Constants for layout control ---
const PADDING_FACTOR = 0.9; // Represents 90% of the diameter, for a 5% padding on each side.
const LINE_HEIGHT = 1.1;    // Standard line height for multi-line text.

/**
 * Wraps text to fit within a specific width.
 * This is a lower-level utility used by the main calculation function.
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
      if (currentLine) lines.push(currentLine);

      const wordWidth = context.measureText(word).width;
      if (wordWidth <= availableWidth) {
        currentLine = word;
      } else {
        const syllables = hyphenator.hyphenate(word);
        let tempLine = '';
        for (const syllable of syllables) {
          const testSyllableLine = tempLine ? `${tempLine}${syllable}` : syllable;
          if (context.measureText(testSyllableLine).width <= availableWidth) {
            tempLine = testSyllableLine;
          } else {
            lines.push(tempLine + '-');
            tempLine = syllable;
          }
        }
        currentLine = tempLine;
      }
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

/**
 * Calculates the optimal font size for a text to fit inside a circle using binary search
 * and a geometrically-aware validation check.
 *
 * @param text The text to be fitted.
 * @param radius The radius of the containing circle.
 * @param minFont The minimum allowable font size (e.g., 6).
 * @param maxFont The maximum allowable font size (e.g., 24).
 * @returns An object containing the optimal `fontSize` and the `lines` of wrapped text.
 */
export const calculateOptimalFontSize = (
  text: string,
  radius: number,
  minFont: number = 6,
  maxFont: number = 30
): { fontSize: number; lines: string[] } => {
  if (!text || radius <= 0) return { fontSize: minFont, lines: [] };

  let low = minFont;
  let high = maxFont;
  let bestFit = { fontSize: minFont, lines: wrapSvgText(text, radius * 2 * PADDING_FACTOR, minFont) };

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (mid === 0) { low = 1; continue; }

    // First, wrap text based on the widest available part of the circle (the inscribed square width).
    // This gives us a candidate set of lines.
    const inscribedWidth = radius * 2 * PADDING_FACTOR;
    const currentLines = wrapSvgText(text, inscribedWidth, mid);
    const lineCount = currentLines.length;
    const singleLineHeight = mid * LINE_HEIGHT;
    const textHeight = lineCount * singleLineHeight;

    let fitsGeometrically = true;

    // The text block must be shorter than the available diameter.
    if (textHeight > inscribedWidth) {
        fitsGeometrically = false;
    } else {
      // **THE CRITICAL FIX IS HERE:**
      // Now, check if each wrapped line fits within the circle's chord at its specific height.
      for (let i = 0; i < lineCount; i++) {
        const lineWidth = context.measureText(currentLines[i]).width;

        // Calculate the vertical distance of the line's center from the circle's center.
        const lineCenterY = -textHeight / 2 + (i * singleLineHeight) + singleLineHeight / 2;

        // Calculate the maximum allowed width at this Y position using the circle equation.
        // We use the raw radius here, because padding is applied to the final result.
        const maxAllowedWidthAtY = 2 * Math.sqrt(radius * radius - lineCenterY * lineCenterY);

        if (isNaN(maxAllowedWidthAtY) || lineWidth > maxAllowedWidthAtY * PADDING_FACTOR) {
          fitsGeometrically = false;
          break;
        }
      }
    }

    if (fitsGeometrically) {
      // It fits, so this is a potential candidate. Try for a larger font.
      bestFit = { fontSize: mid, lines: currentLines };
      low = mid + 1;
    } else {
      // It doesn't fit, so the font is too large. Try for a smaller font.
      high = mid - 1;
    }
  }

  // Final check to handle truncation if the smallest font still overflows.
  const finalHeight = bestFit.lines.length * bestFit.fontSize * LINE_HEIGHT;
  if (finalHeight > radius * 2 * PADDING_FACTOR) {
      const maxLines = Math.floor((radius * 2 * PADDING_FACTOR) / (bestFit.fontSize * LINE_HEIGHT));
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