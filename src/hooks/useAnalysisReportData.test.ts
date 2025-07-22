import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalysisReportData } from './useAnalysisReportData';
import { GeminiAnalysisResponse } from '../types/api';

const mockAnalysis: GeminiAnalysisResponse = {
  analysis_summary: 'A summary.',
  findings: [
    { pattern_name: 'Ad Hominem', display_name: 'Ad Hominem', specific_quote: 'You are wrong.', explanation: 'Attacks the person.', strength: 8, category: 'category_sociopolitical_rhetorical' },
    { pattern_name: 'Straw Man', display_name: 'Straw Man', specific_quote: 'They want chaos.', explanation: 'Misrepresents argument.', strength: 6, category: 'category_sociopolitical_rhetorical' },
    { pattern_name: 'Ad Hominem', display_name: 'Ad Hominem', specific_quote: 'a foolish idea.', explanation: 'Another attack.', strength: 5, category: 'category_sociopolitical_rhetorical' },
  ],
};
const sourceText = 'You are wrong. They want chaos. This is a foolish idea.';

describe('useAnalysisReportData', () => {
  it('should correctly process analysis data', () => {
    const { result } = renderHook(() => useAnalysisReportData(mockAnalysis, sourceText, 500));

    expect(result.current.finalHighlights).toHaveLength(3);
    expect(result.current.finalHighlights[0].start).toBe(0);
    // The string "You are wrong." has a length of 14, but our regex trims trailing punctuation
    // so the match ends at position 13 (excluding the period)
    expect(result.current.finalHighlights[0].end).toBe(13);
  });
});
