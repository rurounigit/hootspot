// src/hooks/useAnalysisReportData.ts

import { useMemo } from 'react';
import { AIAnalysisOutput, PatternFinding } from '../types/api';
import Fuse from 'fuse.js';

const generateDistantColor = (index: number, saturation: number = 0.7, lightness: number = 0.6) => {
    const goldenAngle = 137.5;
    const hue = (index * goldenAngle) % 360;
    return `hsl(${hue}, ${saturation * 100}%, ${lightness * 100}%)`;
};

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
    if (!hasFindings || !sourceText) return [];

    const fuse = new Fuse([sourceText], {
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 4,
      threshold: 0.7,
    });

    const locatedFindings = findings.map((finding, index) => {
      const results = fuse.search(finding.specific_quote);
      if (results.length > 0 && results[0].matches && results[0].matches[0]) {
        const bestMatch = results[0].matches[0];
        const [start, end] = bestMatch.indices[0];
        return {
          ...finding,
          displayIndex: index,
          location: {
            start: start,
            end: end + 1,
          },
        };
      }
      return { ...finding, displayIndex: index, location: null };
    });

    return locatedFindings
      .filter(f => f.location !== null)
      .sort((a, b) => a.location!.start - b.location!.start);

  }, [findings, sourceText, hasFindings]);

  const bubbleChartData = useMemo(() => {
    const baseWidth = 500;
    const scaleFactor = chartWidth > 0 ? Math.min(1, chartWidth / baseWidth) : 1;
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
    if (indexedFindings.length === 0) return [];

    const mergedHighlights: { start: number; end: number; findings: (PatternFinding & { displayIndex: number; location: { start: number; end: number } | null })[] }[] = [];

    let currentHighlight = {
      start: indexedFindings[0].location!.start,
      end: indexedFindings[0].location!.end,
      findings: [indexedFindings[0]],
    };

    for (let i = 1; i < indexedFindings.length; i++) {
      const nextFinding = indexedFindings[i];
      if (nextFinding.location!.start < currentHighlight.end) {
        currentHighlight.end = Math.max(currentHighlight.end, nextFinding.location!.end);
        currentHighlight.findings.push(nextFinding);
      } else {
        mergedHighlights.push(currentHighlight);
        currentHighlight = {
          start: nextFinding.location!.start,
          end: nextFinding.location!.end,
          findings: [nextFinding],
        };
      }
    }
    mergedHighlights.push(currentHighlight);

    return mergedHighlights;
  }, [indexedFindings]);

  return {
    hasFindings,
    patternColorMap,
    indexedFindings,
    bubbleChartData,
    finalHighlights,
  };
};
