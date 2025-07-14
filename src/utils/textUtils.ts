// src/utils/textUtils.ts

// --- Create a single, reusable canvas for text measurement ---
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// --- Constants for layout control ---
const PADDING_FACTOR = 0.9; // Represents 90% of the diameter, for a 5% padding on each side.
const LINE_HEIGHT = 1.1;    // Standard line height for multi-line text.

/**
 * Wraps text to fit within a specific width using a language-agnostic,
 * character-based breaking algorithm for oversized words.
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
        // **THE NEW LOGIC IS HERE:**
        // The word itself is too long and must be broken at the character level.
        // This is language-agnostic and does not require a hyphenation library.
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

    const inscribedWidth = radius * 2 * PADDING_FACTOR;
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

        if (isNaN(maxAllowedWidthAtY) || lineWidth > maxAllowedWidthAtY * PADDING_FACTOR) {
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