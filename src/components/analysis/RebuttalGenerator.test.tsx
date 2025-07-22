import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RebuttalGenerator from './RebuttalGenerator';
import * as GoogleApi from '../../api/google/analysis';
import { LanguageProvider } from '../../i18n';
import en from '../../locales/en.json';

// Create a mock t function for testing
const t = (key: string) => en[key as keyof typeof en] || key;

vi.mock('../../i18n', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../i18n')>();
    return { ...original, useTranslation: () => ({ t, language: 'en' }) };
});

vi.mock('../../api/google/analysis');

describe('RebuttalGenerator', () => {
  // Define a type for the component's props for clarity
  type RebuttalGeneratorProps = React.ComponentProps<typeof RebuttalGenerator>;

  const defaultProps: RebuttalGeneratorProps = {
    analysis: { analysis_summary: 'summary', findings: [] },
    sourceText: 'Some source text.',
    apiKey: 'test-key',
    selectedModel: 'gemini-pro',
    rebuttalForDisplay: null,
    isTranslating: false,
    onUpdate: vi.fn(),
    serviceProvider: 'google',
    lmStudioUrl: '',
    lmStudioModel: '',
  };

  // Add the correct type for the 'props' parameter
  const renderWithProvider = (props: Partial<RebuttalGeneratorProps>) => {
    return render(
        <LanguageProvider>
            <RebuttalGenerator {...defaultProps} {...props} />
        </LanguageProvider>
    );
  };


  it('calls the generate rebuttal API on click and displays the result', async () => {
    const onUpdateMock = vi.fn();
    const mockRebuttal = 'This is a generated rebuttal.';
    vi.mocked(GoogleApi.generateRebuttal).mockResolvedValue(mockRebuttal);

    renderWithProvider({ onUpdate: onUpdateMock });

    const generateButton = screen.getByRole('button', { name: /Generate/i });
    await userEvent.click(generateButton);

    // The button shows the translation key, not the literal text "Generating..."
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generating.../i })).toBeInTheDocument();
    });
    await waitFor(() => expect(GoogleApi.generateRebuttal).toHaveBeenCalled());
    await waitFor(() => expect(onUpdateMock).toHaveBeenCalledWith(mockRebuttal));
  });

  it('displays an error message if API call fails', async () => {
    const error = new Error('API failed');
    vi.mocked(GoogleApi.generateRebuttal).mockRejectedValue(error);

    renderWithProvider({});
    const generateButton = screen.getByRole('button', { name: /Generate/i });
    await userEvent.click(generateButton);

    expect(await screen.findByText('API failed')).toBeInTheDocument();
  });
});
