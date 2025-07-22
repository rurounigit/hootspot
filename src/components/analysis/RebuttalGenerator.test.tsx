import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RebuttalGenerator from './RebuttalGenerator';
import * as GoogleApi from '../../api/google/analysis';
import { LanguageProvider } from '../../i18n';

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

    const generateButton = screen.getByRole('button', { name: /rebuttal_button_generate/i });
    await userEvent.click(generateButton);

    expect(await screen.findByText(/rebuttal_button_generating/i)).toBeInTheDocument();
    expect(GoogleApi.generateRebuttal).toHaveBeenCalled();
    expect(onUpdateMock).toHaveBeenCalledWith(mockRebuttal);
  });

  it('displays an error message if API call fails', async () => {
    const error = new Error('API failed');
    vi.mocked(GoogleApi.generateRebuttal).mockRejectedValue(error);

    renderWithProvider({});
    const generateButton = screen.getByRole('button', { name: /rebuttal_button_generate/i });
    await userEvent.click(generateButton);

    expect(await screen.findByText('API failed')).toBeInTheDocument();
  });
});