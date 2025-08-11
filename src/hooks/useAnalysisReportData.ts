// src/hooks/useAnalysisReportData.ts

import { useMemo } from 'react';
import { AIAnalysisOutput, PatternFinding } from '../types/api';

const generateDistantColor = (index: number, saturation: number = 0.7, lightness: number = 0.6) => {
    const goldenAngle = 137.5;
    const hue = (index * goldenAngle) % 360;
    return `hsl(${hue}, ${saturation * 100}%, ${lightness * 100}%)`;
};

function escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const useAnalysisReportData = (
  analysis: AIAnalysisOutput | null,
  sourceText: string | null,
  chartWidth: number
) => {
  const findings = analysis?.findings || [];
  const hasFindings = findings.length > 0;

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
    const matchesByPosition = new Map<string, { start: number; end: number; findings: (PatternFinding & { displayIndex: number })[] }>();
    const MIN_WORDS_FOR_MATCH = 3;

    if (hasFindings && sourceText) {
      indexedFindings.forEach(finding => {
        const originalQuote = finding.specific_quote;
        if (!originalQuote || typeof originalQuote !== 'string' || originalQuote.trim() === '') return;

        const cleanedQuote = originalQuote
          .trim()
          .replace(/^[.,;:"“”'‘’`\s…]+/, '')
          .replace(/[.,;:"“”'‘’`\s…]+$/, '');

        if (!cleanedQuote) return;

        let words = cleanedQuote.split(/\s+/);

        // *** THE NEW "SALAMI-SLICE" LOGIC ***
        while (words.length >= MIN_WORDS_FOR_MATCH) {
          const searchTerm = escapeRegex(words.join(' '));
          const regex = new RegExp(searchTerm, 'gi');

          const allMatches = Array.from(sourceText.matchAll(regex));

          // Only proceed if we find exactly one match to avoid ambiguity
          if (allMatches.length === 1) {
            const match = allMatches[0];
            const matchIndex = match.index!;
            let quoteEnd = matchIndex + match[0].length;

            while (quoteEnd < sourceText.length) {
              const nextChar = sourceText[quoteEnd];
              if (/[.,;:"“”'‘’`\-!?]/.test(nextChar)) {
                quoteEnd++;
              } else {
                break;
              }
            }

            const key = `${matchIndex}-${quoteEnd}`;
            const existing = matchesByPosition.get(key);
            if (existing) {
              if (!existing.findings.some(f => f.displayIndex === finding.displayIndex)) {
                existing.findings.push(finding);
              }
            } else {
              matchesByPosition.set(key, {
                start: matchIndex,
                end: quoteEnd,
                findings: [finding],
              });
            }

            // Match found, break the while loop for this finding
            break;
          }

          // If no unique match found, remove the first word and try again
          words.shift();
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
