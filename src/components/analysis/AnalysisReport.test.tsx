// src/components/analysis/AnalysisReport.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import AnalysisReport from './AnalysisReport';
import { LanguageProvider } from '../../i18n';
import { GeminiAnalysisResponse } from '../../types/api';

// Mock all child components to isolate the AnalysisReport layout logic
vi.mock('./ShareMenu', () => ({ default: () => <div data-testid="share-menu-mock" /> }));
vi.mock('./ManipulationBubbleChart', () => ({ default: () => <div data-testid="bubble-chart-mock" /> }));
vi.mock('./RebuttalGenerator', () => ({ default: () => <div data-testid="rebuttal-mock" /> }));
vi.mock('./HighlightedText', () => ({ default: () => <div data-testid="highlighted-text-mock" /> }));

describe('AnalysisReport Component', () => {

  const fullAnalysis: GeminiAnalysisResponse = {
    analysis_summary: 'This is a test summary.',
    findings: [{
      pattern_name: 'Test Pattern',
      display_name: 'Test',
      specific_quote: 'A quote.',
      explanation: 'An explanation.',
      strength: 5,
      category: 'category_sociopolitical_rhetorical'
    }]
  };

  const noFindingsAnalysis: GeminiAnalysisResponse = {
    analysis_summary: 'A summary with no findings.',
    findings: []
  };

  const defaultProps = {
    sourceText: 'This is the source text with a quote.',
    apiKey: 'test-key',
    selectedModel: 'test-model',
    rebuttal: null,
    isTranslatingRebuttal: false,
    onRebuttalUpdate: vi.fn(),
    includeRebuttalInJson: false,
    includeRebuttalInPdf: false,
    serviceProvider: 'google' as const,
    lmStudioUrl: '',
    lmStudioModel: ''
  };

  const renderWithProvider = (props: any) => {
    return render(
      <LanguageProvider>
        <AnalysisReport {...defaultProps} {...props} />
      </LanguageProvider>
    );
  };

  it('renders all child components with full data', () => {
    renderWithProvider({ analysis: fullAnalysis });

    // Assert that the summary and main titles are rendered
    expect(screen.getByText('report_summary_title')).toBeInTheDocument();
    expect(screen.getByText(fullAnalysis.analysis_summary)).toBeInTheDocument();

    // Assert that all mocked children are present
    expect(screen.getByTestId('share-menu-mock')).toBeInTheDocument();
    expect(screen.getByTestId('bubble-chart-mock')).toBeInTheDocument();
    expect(screen.getByTestId('highlighted-text-mock')).toBeInTheDocument();
    expect(screen.getByTestId('rebuttal-mock')).toBeInTheDocument();

    // Assert that the finding card is rendered
    expect(screen.getByText('Test')).toBeInTheDocument(); // display_name
    expect(screen.getByText('"A quote."')).toBeInTheDocument();
  });

  it('renders "No patterns detected" message when findings array is empty', () => {
    renderWithProvider({ analysis: noFindingsAnalysis });

    // Assert the "no patterns" message is displayed
    expect(screen.getByText('report_no_patterns_detected')).toBeInTheDocument();

    // Assert that components dependent on findings are NOT rendered
    expect(screen.queryByTestId('share-menu-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bubble-chart-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('highlighted-text-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rebuttal-mock')).not.toBeInTheDocument();
  });

  it('does not render HighlightedText component if sourceText is null', () => {
    renderWithProvider({ analysis: fullAnalysis, sourceText: null });

    // HighlightedText mock should not be in the document
    expect(screen.queryByTestId('highlighted-text-mock')).not.toBeInTheDocument();

    // Other components should still be present
    expect(screen.getByTestId('bubble-chart-mock')).toBeInTheDocument();
  });
});