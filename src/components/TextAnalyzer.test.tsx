import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react'; // Removed unused fireEvent
import userEvent from '@testing-library/user-event';
import TextAnalyzer from './TextAnalyzer';

// Mock the i18n hook
vi.mock('../i18n', async (importOriginal) => {
    const original = await importOriginal<typeof import('../i18n')>()
    return {
        ...original,
        useTranslation: () => ({
            t: (key: string) => key,
        }),
    }
});

describe('TextAnalyzer', () => {
  const defaultProps = {
    text: '',
    onTextChange: vi.fn(),
    onAnalyze: vi.fn(),
    onJsonLoad: vi.fn(),
    isLoading: false,
    maxCharLimit: 100,
    hasApiKey: true,
  };

  it('renders the textarea and buttons', () => {
    render(<TextAnalyzer {...defaultProps} />);
    expect(screen.getByPlaceholderText('analyzer_placeholder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyzer_button_analyze/i })).toBeInTheDocument();
  });

  it('disables the analyze button when text is empty', () => {
    render(<TextAnalyzer {...defaultProps} text="" />);
    expect(screen.getByRole('button', { name: /analyzer_button_analyze/i })).toBeDisabled();
  });

  it('enables the analyze button when text is present', () => {
    render(<TextAnalyzer {...defaultProps} text="Some sample text" />);
    expect(screen.getByRole('button', { name: /analyzer_button_analyze/i })).not.toBeDisabled();
  });

  it('calls onAnalyze when the analyze button is clicked', async () => {
    const onAnalyzeMock = vi.fn();
    render(<TextAnalyzer {...defaultProps} text="Analyze me" onAnalyze={onAnalyzeMock} />);
    const analyzeButton = screen.getByRole('button', { name: /analyzer_button_analyze/i });
    await userEvent.click(analyzeButton);
    expect(onAnalyzeMock).toHaveBeenCalledWith('Analyze me');
  });

  it('shows a character limit warning when text exceeds the max limit', () => {
    const longText = 'a'.repeat(101);
    render(<TextAnalyzer {...defaultProps} text={longText} />);
    expect(screen.getByText(/analyzer_chars_over_limit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyzer_button_analyze/i })).toBeDisabled();
  });
});