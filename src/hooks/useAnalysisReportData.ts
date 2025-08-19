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
  // === DEBUG LOGGING ===
  console.log('[useAnalysisReportData] Hook called with:', {
    analysisExists: !!analysis,
    sourceTextLength: sourceText ? sourceText.length : 0,
    findingsCount: analysis?.findings?.length || 0,
    chartWidth
  });

  const findings = analysis?.findings || [];
  const hasFindings = findings.length > 0;
  console.log('[useAnalysisReportData] Processed findings:', { findingsCount: findings.length, hasFindings });

  const patternColorMap = useMemo(() => {
    console.log('[useAnalysisReportData] Generating patternColorMap...');
    const map = new Map<string, string>();
    if (hasFindings) {
      const uniquePatternNames = [...new Set(findings.map(f => f.pattern_name))];
      console.log('[useAnalysisReportData] Unique pattern names:', uniquePatternNames);
      uniquePatternNames.forEach((name, index) => {
        const color = generateDistantColor(index);
        map.set(name, color);
        console.log(`[useAnalysisReportData] Pattern color - ${name}: ${color}`);
      });
    }
    console.log('[useAnalysisReportData] Generated patternColorMap:', map);
    return map;
  }, [findings, hasFindings]);

  const indexedFindings = useMemo(() => {
    console.log('[useAnalysisReportData] Processing indexedFindings with HYBRID APPROACH...', {
      hasFindings,
      sourceTextAvailable: !!sourceText,
      sourceTextLength: sourceText ? sourceText.length : 0,
      findingsToProcess: findings.length
    });

    if (!hasFindings || !sourceText) {
      console.log('[useAnalysisReportData] Early return - no findings or sourceText');
      return [];
    }

    // === DEBUG: Compare with potential salami slice approach ===
    console.log('[useAnalysisReportData] DEBUG: For comparison with salami slice approach:');
    findings.forEach((finding, index) => {
      console.log(`[useAnalysisReportData] Finding ${index + 1} quote: "${finding.specific_quote}"`);
      console.log(`[useAnalysisReportData] Finding ${index + 1} quote length: ${finding.specific_quote.length}`);

      // Simple exact match test
      const exactMatchIndex = sourceText.indexOf(finding.specific_quote);
      if (exactMatchIndex !== -1) {
        console.log(`[useAnalysisReportData] EXACT MATCH FOUND at position ${exactMatchIndex}`);
      } else {
        console.log(`[useAnalysisReportData] NO EXACT MATCH - would use salami slice approach`);
        // Test with cleaned quote (remove leading/trailing whitespace and punctuation)
        const cleanedQuote = finding.specific_quote
          .trim()
          .replace(/^[.,;:"“”'‘’`\s…]+/, '')
          .replace(/[.,;:"“”'‘’`\s…]+$/, '');
        const cleanedMatchIndex = sourceText.indexOf(cleanedQuote);
        if (cleanedMatchIndex !== -1) {
          console.log(`[useAnalysisReportData] CLEANED MATCH FOUND at position ${cleanedMatchIndex}: "${cleanedQuote}"`);
        }
      }
    });

    // === HYBRID APPROACH: Exact matching first, then fuzzy matching ===
    console.log('[useAnalysisReportData] Using hybrid approach: exact matching first, then fuzzy matching');

    const locatedFindings = findings.map((finding, index) => {
      console.log(`[useAnalysisReportData] Processing finding ${index + 1}/${findings.length}:`, {
        pattern_name: finding.pattern_name,
        quote_length: finding.specific_quote.length,
        quote_preview: finding.specific_quote.substring(0, 50) + (finding.specific_quote.length > 50 ? '...' : '')
      });

      // === STEP 1: Try exact matching (salami slice approach) ===
      console.log(`[useAnalysisReportData] Step 1: Trying exact match for "${finding.pattern_name}"`);
      let exactMatchIndex = sourceText.indexOf(finding.specific_quote);

      if (exactMatchIndex !== -1) {
        console.log(`[useAnalysisReportData] EXACT MATCH FOUND at position ${exactMatchIndex}`);
        const result = {
          ...finding,
          displayIndex: index,
          location: {
            start: exactMatchIndex,
            end: exactMatchIndex + finding.specific_quote.length,
          },
        };
        console.log(`[useAnalysisReportData] Exact match result for finding ${index}:`, result);
        return result;
      }

      // === STEP 2: Try cleaned quote matching ===
      console.log(`[useAnalysisReportData] Step 2: Trying cleaned quote match for "${finding.pattern_name}"`);
      const cleanedQuote = finding.specific_quote
        .trim()
        .replace(/^[.,;:"“”'‘’`\s…]+/, '')
        .replace(/[.,;:"“”'‘’`\s…]+$/, '');

      if (cleanedQuote !== finding.specific_quote && cleanedQuote.length > 0) {
        const cleanedMatchIndex = sourceText.indexOf(cleanedQuote);
        if (cleanedMatchIndex !== -1) {
          console.log(`[useAnalysisReportData] CLEANED MATCH FOUND at position ${cleanedMatchIndex}: "${cleanedQuote}"`);
          const result = {
            ...finding,
            displayIndex: index,
            location: {
              start: cleanedMatchIndex,
              end: cleanedMatchIndex + cleanedQuote.length,
            },
          };
          console.log(`[useAnalysisReportData] Cleaned match result for finding ${index}:`, result);
          return result;
        }
      }

      // === STEP 3: Fall back to improved fuse.js matching ===
      console.log(`[useAnalysisReportData] Step 3: Falling back to improved fuse.js matching for "${finding.pattern_name}"`);

      // Improved fuse.js configuration for better accuracy
      const fuseConfig = {
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 10, // Increased minimum length for better matches
        threshold: 0.3, // Lower threshold for more precise matching
        isCaseSensitive: false,
        findAllMatches: true, // Find all matches to choose the best one
        location: 0,
        distance: 100, // Reduced distance for more localized searching
        useExtendedSearch: false,
      };
      console.log('[useAnalysisReportData] Creating improved Fuse instance with config:', fuseConfig);

      const fuse = new Fuse([sourceText], fuseConfig);
      const results = fuse.search(finding.specific_quote);
      console.log(`[useAnalysisReportData] Improved fuse search results for "${finding.pattern_name}" - found ${results.length} matches`);

      if (results.length > 0) {
        console.log(`[useAnalysisReportData] First result score:`, results[0]?.score);
        console.log(`[useAnalysisReportData] First result matches:`, results[0]?.matches);

        if (results[0].matches && results[0].matches[0]) {
          const bestMatch = results[0].matches[0];
          console.log(`[useAnalysisReportData] Best match indices:`, bestMatch.indices);
          console.log(`[useAnalysisReportData] Best match value:`, bestMatch.value);

          if (bestMatch.indices.length > 0) {
            const [start, end] = bestMatch.indices[0];
            const matchedText = sourceText.substring(start, end + 1);
            console.log(`[useAnalysisReportData] Extracted location: start=${start}, end=${end + 1}`);
            console.log(`[useAnalysisReportData] Matched text: "${matchedText}"`);
            console.log(`[useAnalysisReportData] Original quote: "${finding.specific_quote}"`);
            console.log(`[useAnalysisReportData] Match similarity:`, {
              originalLength: finding.specific_quote.length,
              matchedLength: matchedText.length,
              score: results[0].score
            });

            // Only accept matches with reasonable scores
            if (results[0].score < 0.5) {
              const result = {
                ...finding,
                displayIndex: index,
                location: {
                  start: start,
                  end: end + 1,
                },
              };
              console.log(`[useAnalysisReportData] Successful fuzzy match for finding ${index}:`, result);
              return result;
            } else {
              console.log(`[useAnalysisReportData] Fuzzy match score too high (${results[0].score}), rejecting match`);
            }
          }
        }
      }

      console.log(`[useAnalysisReportData] No valid match found for finding ${index}, returning null location`);
      return { ...finding, displayIndex: index, location: null };
    });

    // === FILTERING DEBUG LOGGING ===
    console.log('[useAnalysisReportData] Before filtering - locatedFindings count:', locatedFindings.length);
    const locatedFindingsWithLocation = locatedFindings.filter(f => f.location !== null);
    console.log('[useAnalysisReportData] After filtering (location !== null) - count:', locatedFindingsWithLocation.length);

    locatedFindingsWithLocation.forEach((finding, index) => {
      console.log(`[useAnalysisReportData] Filtered finding ${index + 1}:`, {
        pattern_name: finding.pattern_name,
        displayIndex: finding.displayIndex,
        location: finding.location,
        quote_preview: finding.specific_quote.substring(0, 30) + '...'
      });
    });

    // === SORTING DEBUG LOGGING ===
    console.log('[useAnalysisReportData] Sorting findings by location...');
    const sortedFindings = locatedFindingsWithLocation.sort((a, b) => {
      const result = a.location!.start - b.location!.start;
      console.log(`[useAnalysisReportData] Sort comparison: ${a.pattern_name} (${a.location!.start}) vs ${b.pattern_name} (${b.location!.start}) = ${result}`);
      return result;
    });

    console.log('[useAnalysisReportData] Final sorted findings count:', sortedFindings.length);
    sortedFindings.forEach((finding, index) => {
      console.log(`[useAnalysisReportData] Sorted finding ${index + 1}:`, {
        pattern_name: finding.pattern_name,
        displayIndex: finding.displayIndex,
        start: finding.location!.start,
        end: finding.location!.end
      });
    });

    return sortedFindings;

  }, [findings, sourceText, hasFindings]);

  const bubbleChartData = useMemo(() => {
    console.log('[useAnalysisReportData] Generating bubbleChartData...', {
      indexedFindingsCount: indexedFindings.length,
      hasFindings,
      chartWidth,
      patternColorMapSize: patternColorMap.size
    });

    const baseWidth = 500;
    const scaleFactor = chartWidth > 0 ? Math.min(1, chartWidth / baseWidth) : 1;
    console.log('[useAnalysisReportData] Chart scale factor:', { baseWidth, chartWidth, scaleFactor });

    if (!hasFindings) {
      console.log('[useAnalysisReportData] No findings, returning empty bubble chart data');
      return [];
    }

    const chartData = indexedFindings.map((finding) => {
      const strength = finding.strength;
      const radius = 2 + (strength * 6 * scaleFactor);
      const color = patternColorMap.get(finding.pattern_name) || '#cccccc';

      console.log(`[useAnalysisReportData] Bubble data for ${finding.pattern_name}:`, {
        displayIndex: finding.displayIndex,
        strength,
        baseRadius: 2 + (strength * 6),
        scaledRadius: radius,
        color,
        category: finding.category
      });

      const bubble = {
        id: `${finding.pattern_name}-${finding.displayIndex}`,
        name: finding.display_name,
        strength: strength,
        category: finding.category,
        color: color,
        radius: radius,
      };

      console.log(`[useAnalysisReportData] Generated bubble:`, bubble);
      return bubble;
    });

    console.log('[useAnalysisReportData] Final bubble chart data count:', chartData.length);
    return chartData;
  }, [indexedFindings, hasFindings, patternColorMap, chartWidth]);

  const finalHighlights = useMemo(() => {
    console.log('[useAnalysisReportData] Processing finalHighlights...', {
      indexedFindingsCount: indexedFindings.length
    });

    if (indexedFindings.length === 0) {
      console.log('[useAnalysisReportData] No indexed findings, returning empty highlights');
      return [];
    }

    const mergedHighlights: { start: number; end: number; findings: (PatternFinding & { displayIndex: number; location: { start: number; end: number } | null })[] }[] = [];
    console.log('[useAnalysisReportData] Starting highlight merging process...');

    let currentHighlight = {
      start: indexedFindings[0].location?.start ?? 0,
      end: indexedFindings[0].location?.end ?? 0,
      findings: [indexedFindings[0]],
    };
    console.log('[useAnalysisReportData] Initial highlight:', {
      start: currentHighlight.start,
      end: currentHighlight.end,
      findingPattern: currentHighlight.findings[0].pattern_name,
      findingQuote: currentHighlight.findings[0].specific_quote.substring(0, 30) + '...'
    });

    for (let i = 1; i < indexedFindings.length; i++) {
      const nextFinding = indexedFindings[i];
      console.log(`[useAnalysisReportData] Processing finding ${i + 1}/${indexedFindings.length}:`, {
        pattern_name: nextFinding.pattern_name,
        start: nextFinding.location!.start,
        end: nextFinding.location!.end
      });

      if (nextFinding.location!.start < currentHighlight.end) {
        console.log(`[useAnalysisReportData] Overlapping highlight detected - merging`);
        const newEnd = Math.max(currentHighlight.end, nextFinding.location!.end);
        console.log(`[useAnalysisReportData] Extending highlight end from ${currentHighlight.end} to ${newEnd}`);
        currentHighlight.end = newEnd;
        currentHighlight.findings.push(nextFinding);
        console.log(`[useAnalysisReportData] Highlight now contains ${currentHighlight.findings.length} findings`);
      } else {
        console.log(`[useAnalysisReportData] Non-overlapping highlight - adding current and starting new`);
        console.log(`[useAnalysisReportData] Adding highlight:`, {
          start: currentHighlight.start,
          end: currentHighlight.end,
          findingsCount: currentHighlight.findings.length
        });
        mergedHighlights.push(currentHighlight);

        currentHighlight = {
          start: nextFinding.location!.start,
          end: nextFinding.location!.end,
          findings: [nextFinding],
        };
        console.log(`[useAnalysisReportData] Started new highlight:`, {
          start: currentHighlight.start,
          end: currentHighlight.end
        });
      }
    }

    console.log('[useAnalysisReportData] Adding final highlight');
    mergedHighlights.push(currentHighlight);
    console.log('[useAnalysisReportData] Final merged highlights count:', mergedHighlights.length);

    mergedHighlights.forEach((highlight, index) => {
      console.log(`[useAnalysisReportData] Final highlight ${index + 1}:`, {
        start: highlight.start,
        end: highlight.end,
        findingsCount: highlight.findings.length,
        findings: highlight.findings.map(f => ({
          pattern_name: f.pattern_name,
          quote_preview: f.specific_quote.substring(0, 30) + '...'
        }))
      });
    });

    return mergedHighlights;
  }, [indexedFindings]);

  const result = {
    hasFindings,
    patternColorMap,
    indexedFindings,
    bubbleChartData,
    finalHighlights,
  };

  console.log('[useAnalysisReportData] Hook returning result:', {
    hasFindings: result.hasFindings,
    patternColorMapSize: result.patternColorMap.size,
    indexedFindingsCount: result.indexedFindings.length,
    bubbleChartDataCount: result.bubbleChartData.length,
    finalHighlightsCount: result.finalHighlights.length
  });

  return result;
};
