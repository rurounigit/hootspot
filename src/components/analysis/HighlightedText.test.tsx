// src/components/analysis/HighlightedText.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import HighlightedText from './HighlightedText';
import { LanguageProvider } from '../../i18n'; // Keep the real import for the test file
import { GeminiFinding } from '../../types/api';

// Mock the i18n module correctly
vi.mock('../../i18n', async (importActual) => {
  // Import the actual module to get the real LanguageProvider
  const actual = await importActual<typeof import('../../i18n')>();
  return {
    ...actual, // Return all actual exports, including LanguageProvider
    // Override only the useTranslation hook for testing purposes
    useTranslation: () => ({
      t: (key: string) => key, // Mock the translation function
    }),
  };
});

describe('HighlightedText', () => {
  const patternColorMap = new Map([['Test Pattern', 'rgb(255, 0, 0)']]);
  const text = 'This is a test sentence with some text to highlight.';

  const mockMatches = [
    {
      start: 10,
      end: 24, // "test sentence"
      findings: [
        {
          pattern_name: 'Test Pattern',
          display_name: 'Test Pattern Name',
          specific_quote: 'test sentence',
          strength: 5,
          category: 'category_sociopolitical_rhetorical',
          explanation: 'test explanation',
          displayIndex: 0
        }
      ]
    }
  ];

  it('renders overlapping highlights correctly', () => {
    render(
      <LanguageProvider>
        <HighlightedText text={text} matches={mockMatches} patternColorMap={patternColorMap} />
      </LanguageProvider>
    );

    const markElement = screen.getByText('test sentence');
    expect(markElement).toBeInTheDocument();
    // Check that it's inside a <mark> tag
    expect(markElement.tagName).toBe('MARK');
  });

  it('displays tooltip on pill hover', async () => {
    render(
      <LanguageProvider>
        <HighlightedText text={text} matches={mockMatches} patternColorMap={patternColorMap} />
      </LanguageProvider>
    );

    // The pill is a span, so we find it by its style or a test-id if added
    const pill = document.querySelector('span[style*="background-color: rgb(255, 0, 0)"]') as HTMLElement;
    expect(pill).toBeInTheDocument();

    await userEvent.hover(pill);

    // The tooltip content is now visible
    expect(await screen.findByText('Test Pattern Name')).toBeInTheDocument();
    expect(await screen.findByText('category_sociopolitical_rhetorical')).toBeInTheDocument();
  });
});