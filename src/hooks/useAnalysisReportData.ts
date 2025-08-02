// src/hooks/useAnalysisReportData.ts

import { useMemo } from 'react';
import { GeminiAnalysisResponse, GeminiFinding } from '../types/api';

const generateDistantColor = (index: number, saturation: number = 0.7, lightness: number = 0.6) => {
    const goldenAngle = 137.5;
    const hue = (index * goldenAngle) % 360;
    return `hsl(${hue}, ${saturation * 100}%, ${lightness * 100}%)`;
};

function escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const useAnalysisReportData = (
  analysis: GeminiAnalysisResponse,
  sourceText: string | null,
  chartWidth: number
) => {
  const { findings } = analysis;
  const hasFindings = findings && findings.length > 0;

  const patternColorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (hasFindings) {
      const uniquePatternNames = [...new Set(findings.map(f => f.pattern_name))];
      uniquePatternNames.forEach((name, index) => {
        map.set(name, generateDistantColor(index));
      });
    }
    return map;
  }, [findings, hasFindings]);

  const indexedFindings = useMemo(() => {
    const uniqueFindingsWithIndices = new Map<string, number>();
    let findingCounter = 0;
    return findings.map(finding => {
      const uniqueId = `${finding.pattern_name}::${finding.specific_quote}`;
      if (!uniqueFindingsWithIndices.has(uniqueId)) {
        uniqueFindingsWithIndices.set(uniqueId, findingCounter++);
      }
      return {
        ...finding,
        displayIndex: uniqueFindingsWithIndices.get(uniqueId) as number
      };
    });
  }, [findings]);

  const bubbleChartData = useMemo(() => {
    const baseWidth = 500;
    const scaleFactor = chartWidth > 0
      ? Math.min(1, chartWidth / baseWidth)
      : 1;

    if (!hasFindings) return [];

    return indexedFindings.map((finding) => {
      const strength = finding.strength;
      const radius = 2 + (strength * 6 * scaleFactor);

      return {
        id: `${finding.pattern_name}-${finding.displayIndex}`,
        name: finding.display_name,
        strength: strength,
        category: finding.category,
        color: patternColorMap.get(finding.pattern_name) || '#cccccc',
        radius: radius,
      };
    });
  }, [indexedFindings, hasFindings, patternColorMap, chartWidth]);

  const finalHighlights = useMemo(() => {
    const matchesByPosition = new Map<string, { start: number; end: number; findings: (GeminiFinding & { displayIndex: number })[] }>();

     if (hasFindings && sourceText) {
       indexedFindings.forEach(finding => {
         const quote = finding.specific_quote;
         if (!quote || typeof quote !== 'string' || quote.trim() === '') return;

         const cleanedQuoteForRegex = quote.trim().replace(/[\s.,;:"“”'‘’`]+$/g, "");
         const escapedQuote = escapeRegex(cleanedQuoteForRegex);
         const regex = new RegExp(escapedQuote, 'gi');
         let match;

         while ((match = regex.exec(sourceText))) {
             // Find the actual end position in the source text by looking for trailing characters
             // that should be included in the highlight
             let quoteEnd = match.index + match[0].length;

             // Extend the match to include trailing punctuation and quote characters
             // that immediately follow the matched text
             while (quoteEnd < sourceText.length) {
               const nextChar = sourceText[quoteEnd];
               // Include common trailing punctuation and quote characters
               if (/[.,;:"“”'‘’`\-!?]/.test(nextChar)) {
                 quoteEnd++;
               } else {
                 // Stop at whitespace or other characters that indicate word boundary
                 break;
               }
             }

             const key = `${match.index}-${quoteEnd}`;
             const existing = matchesByPosition.get(key);

             if (existing) {
               if (!existing.findings.some(f => f.displayIndex === finding.displayIndex)) {
                 existing.findings.push(finding);
               }
             } else {
                 matchesByPosition.set(key, {
                     start: match.index,
                     end: quoteEnd,
                     findings: [finding],
                 });
             }
         }
       });
    }

    const sortedMatches = Array.from(matchesByPosition.values()).sort((a, b) => a.start - b.start);
    const mergedHighlights: typeof sortedMatches = [];
    if (sortedMatches.length > 0) {
      let currentHighlight = { ...sortedMatches[0] };
      for (let i = 1; i < sortedMatches.length; i++) {
        const nextMatch = sortedMatches[i];
        if (nextMatch.start < currentHighlight.end) {
          nextMatch.findings.forEach(findingToAdd => {
            if (!currentHighlight.findings.some(existing => existing.pattern_name === findingToAdd.pattern_name && existing.specific_quote === findingToAdd.specific_quote)) {
              currentHighlight.findings.push(findingToAdd);
            }
          });
          currentHighlight.end = Math.max(currentHighlight.end, nextMatch.end);
        } else {
          mergedHighlights.push(currentHighlight);
          currentHighlight = { ...nextMatch };
        }
      }
      mergedHighlights.push(currentHighlight);
    }
    return mergedHighlights;
  }, [indexedFindings, sourceText, hasFindings]);

  return {
    hasFindings,
    patternColorMap,
    indexedFindings,
    bubbleChartData,
    finalHighlights,
  };
};
