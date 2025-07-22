import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalysisReportData } from './useAnalysisReportData';
import { GeminiAnalysisResponse } from '../types/api';

const mockAnalysis: GeminiAnalysisResponse = {
  analysis_summary: 'A summary.',
  findings: [
    { pattern_name: 'Ad Hominem', display_name: 'Ad Hominem', specific_quote: 'You are wrong.', explanation: 'Attacks the person.', strength: 8, category: 'category_sociopolitical_rhetorical' },
    { pattern_name: 'Straw Man', display_name: 'Straw Man', specific_quote: 'They want chaos.', explanation: 'Misrepresents argument.', strength: 6, category: 'category_sociopolitical_rhetorical' },
    { pattern_name: 'Ad Hominem', display_name: 'Ad Hominem', specific_quote: 'A foolish idea.', explanation: 'Another attack.', strength: 5, category: 'category_sociopolitical_rhetorical' },
  ],
};
const sourceText = 'You are wrong. They want chaos. This is a foolish idea.';

describe('useAnalysisReportData', () => {
  it('should correctly process analysis data', () => {
    const { result } = renderHook(() => useAnalysisReportData(mockAnalysis, sourceText, 500));

    // Test if findings are indexed correctly
    expect(result.current.indexedFindings).toHaveLength(3);
    expect(result.current.indexedFindings[0].displayIndex).toBe(0); // First unique finding
    expect(result.current.indexedFindings[1].displayIndex).toBe(1); // Second unique finding
    expect(result.current.indexedFindings[2].displayIndex).toBe(2); // Third unique finding

    // Test color map generation
    expect(result.current.patternColorMap.size).toBe(2); // 'Ad Hominem' and 'Straw Man'
    expect(result.current.patternColorMap.get('Ad Hominem')).toBeDefined();

    // Test bubble chart data generation
    expect(result.current.bubbleChartData).toHaveLength(3);
    expect(result.current.bubbleChartData[0].name).toBe('Ad Hominem');
    expect(result.current.bubbleChartData[0].strength).toBe(8);

    // Test highlight generation
    expect(result.current.finalHighlights).toHaveLength(3);
    expect(result.current.finalHighlights[0].start).toBe(0);
    expect(result.current.finalHighlights[0].end).toBe(15); // "You are wrong."
  });
});
