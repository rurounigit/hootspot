// src/App.test.tsx
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useConfig } from './hooks/useConfig';
import { useModels } from './hooks/useModels';
import { useAnalysis } from './hooks/useAnalysis';
import { LanguageProvider } from './i18n';
import App from './App';
import { vi } from 'vitest';

// --- Mock Hooks ---
vi.mock('./hooks/useConfig');
vi.mock('./hooks/useModels');
vi.mock('./hooks/useAnalysis');
vi.mock('./hooks/useTranslationManager', () => ({
  useTranslationManager: vi.fn(() => ({
    isTranslatingRebuttal: false,
    handleRebuttalUpdate: vi.fn(),
    displayedRebuttal: null,
    translationError: null,
  })),
}));

// Baseline mock implementations
const mockUseConfig = {
  serviceProvider: 'google', setServiceProvider: vi.fn(), apiKey: 'test-key',
  apiKeyInput: 'test-key', setApiKeyInput: vi.fn(), debouncedApiKey: 'test-key',
  selectedModel: 'gemini-pro', setSelectedModel: vi.fn(), lmStudioUrl: 'http://localhost:1234',
  setLmStudioUrl: vi.fn(), lmStudioModel: 'model', setLmStudioModel: vi.fn(),
  maxCharLimit: 1000, isNightMode: false, setIsNightMode: vi.fn(),
  includeRebuttalInJson: true, setIncludeRebuttalInJson: vi.fn(),
  includeRebuttalInPdf: true, setIncludeRebuttalInPdf: vi.fn(),
  isConfigCollapsed: false, setIsConfigCollapsed: vi.fn(),
  isCurrentProviderConfigured: true, handleMaxCharLimitSave: vi.fn(),
};
const mockUseAnalysis = {
  isLoading: false, error: null, analysisResult: null, currentTextAnalyzed: null,
  textToAnalyze: '', setTextToAnalyze: vi.fn(), setPendingAnalysis: vi.fn(),
  isTranslating: false, handleAnalyzeText: vi.fn(), handleJsonLoad: vi.fn(),
  analysisReportRef: { current: null }, displayedAnalysis: null,
};
const mockUseModels = { models: { preview: [], stable: [] }, isLoading: false, error: null };

describe('App Component UI States', () => {

  beforeEach(() => {
    vi.mocked(useConfig).mockReturnValue(mockUseConfig);
    vi.mocked(useAnalysis).mockReturnValue(mockUseAnalysis);
    vi.mocked(useModels).mockReturnValue(mockUseModels);
  });

  it('renders the default state correctly', () => {
    render(<LanguageProvider><App /></LanguageProvider>);
    expect(screen.getByText('app_title')).toBeInTheDocument();
    expect(screen.getByText('info_enter_text_to_analyze')).toBeInTheDocument();
  });

  it('displays a loading spinner when models are loading', () => {
    vi.mocked(useModels).mockReturnValue({ ...mockUseModels, isLoading: true });
    render(<LanguageProvider><App /></LanguageProvider>);
    expect(screen.getByText('config_model_loading')).toBeInTheDocument();
  });

  it('displays a loading spinner on the analyze button when analysis is in progress', () => {
    vi.mocked(useAnalysis).mockReturnValue({ ...mockUseAnalysis, isLoading: true });
    render(<LanguageProvider><App /></LanguageProvider>);
    const analyzeButton = screen.getByRole('button', { name: /analyzer_button_analyzing/i });
    expect(analyzeButton).toBeInTheDocument();
    expect(analyzeButton).toBeDisabled();
  });

  it('displays a generic error message when an analysis error occurs', () => {
    vi.mocked(useAnalysis).mockReturnValue({ ...mockUseAnalysis, error: 'Something went wrong' });
    render(<LanguageProvider><App /></LanguageProvider>);
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('error_prefix')).toBeInTheDocument();
    expect(within(alert).getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays an analysis report when analysis is successful', () => {
    const mockReport = { analysis_summary: 'This is the summary.', findings: [] };
    vi.mocked(useAnalysis).mockReturnValue({
      ...mockUseAnalysis,
      displayedAnalysis: mockReport,
      currentTextAnalyzed: 'some text'
    });
    render(<LanguageProvider><App /></LanguageProvider>);
    expect(screen.getByText('report_summary_title')).toBeInTheDocument();
    expect(screen.getByText('This is the summary.')).toBeInTheDocument();
  });

  it('displays a warning when provider is not configured', () => {
    vi.mocked(useConfig).mockReturnValue({
        ...mockUseConfig,
        isCurrentProviderConfigured: false
    });
    render(<LanguageProvider><App /></LanguageProvider>);

    // This now correctly finds the one and only warning.
    expect(screen.getByText('analyzer_no_api_key_warning')).toBeInTheDocument();
  });

  it('calls setIsNightMode when the night mode toggle is clicked', async () => {
    const setIsNightModeMock = vi.fn();
    vi.mocked(useConfig).mockReturnValue({ ...mockUseConfig, setIsNightMode: setIsNightModeMock });
    render(<LanguageProvider><App /></LanguageProvider>);
    const nightModeButton = screen.getByTitle('night_mode_toggle_tooltip');
    await userEvent.click(nightModeButton);
    expect(setIsNightModeMock).toHaveBeenCalledWith(true);
  });
});