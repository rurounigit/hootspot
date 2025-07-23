// src/components/pdf/ReportPdfDocument.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReportPdfDocument } from './ReportPdfDocument';
import { GeminiAnalysisResponse } from '../../types/api';

// FIX: Mock the entire @react-pdf/renderer module to prevent jsdom errors
vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  View: ({ children, style }: { children: React.ReactNode; style?: any }) => <div style={style}>{children}</div>,
  Text: ({ children, style }: { children: React.ReactNode; style?: any }) => <span style={style}>{children}</span>,
  Image: ({ src, style }: { src: string; style?: any }) => <img src={src} style={style} alt="" />,
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

describe('ReportPdfDocument', () => {
    const mockTranslations = {
        reportTitle: 'Test Report',
        summaryTitle: 'Summary',
        highlightedTextTitle: 'Highlighted Text',
        profileTitle: 'Profile',
        detectedPatternsTitle: 'Detected Patterns',
        rebuttalTitle: 'Rebuttal',
        quoteLabel: 'Quote',
        explanationLabel: 'Explanation',
        pageNumber: 'Page {pageNumber} of {totalPages}',
        categoryNames: { 'Category A': 'Category A' },
    };

    const mockAnalysis: GeminiAnalysisResponse = {
        analysis_summary: 'This is a test summary.',
        findings: [
            { pattern_name: 'Pattern One', display_name: 'P1', specific_quote: 'Test quote 1', explanation: 'Test explanation', strength: 5, category: 'Category A' },
        ],
    };

    const mockProps = {
        analysis: mockAnalysis,
        sourceText: 'This is the source text.',
        highlightData: [{ start: 8, end: 25 }],
        chartImage: 'data:image/png;base64,mock',
        patternColorMap: { 'Pattern One': 'hsl(0, 100%, 50%)' },
        rebuttal: 'This is a test rebuttal.',
        translations: mockTranslations,
    };

    it('renders the document structure with all sections', () => {
        render(<ReportPdfDocument {...mockProps} />);

        expect(screen.getByText('Test Report')).toBeInTheDocument();
        expect(screen.getByText('This is a test summary.')).toBeInTheDocument();
        expect(screen.getByText(/This is the/)).toBeInTheDocument();
        expect(screen.getByText('source text.')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Detected Patterns')).toBeInTheDocument();
        expect(screen.getByText('Rebuttal')).toBeInTheDocument();
    });

    it('renders correctly when analysis_summary is missing', () => {
        const props = { ...mockProps, analysis: { ...mockAnalysis, analysis_summary: '' } };
        render(<ReportPdfDocument {...props} />);
        expect(screen.queryByText('Summary')).not.toBeInTheDocument();
    });

    it('renders correctly when rebuttal is missing', () => {
        const props = { ...mockProps, rebuttal: null };
        render(<ReportPdfDocument {...props} />);
        expect(screen.queryByText('Rebuttal')).not.toBeInTheDocument();
    });
});