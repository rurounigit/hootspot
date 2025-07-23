// src/App.test.tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useConfig } from './hooks/useConfig';
import { useModels } from './hooks/useModels';
import { useAnalysis } from './hooks/useAnalysis';
import { LanguageProvider } from './i18n';
import App from './App';
import { vi } from 'vitest';
import { GeminiAnalysisResponse } from './types/api';

// --- Mock the modules ---
vi.mock('./hooks/useConfig');
vi.mock('./hooks/useModels');
vi.mock('./hooks/useAnalysis');
vi.mock('./hooks/useTranslationManager', () => ({
  useTranslationManager: vi.fn(() => ({
    isTranslatingRebuttal: false, handleRebuttalUpdate: vi.fn(),
    displayedRebuttal: null, translationError: null,
  })),
}));

// --- Define fully typed baseline mocks ---
const baselineMockUseConfig = {
  serviceProvider: 'google' as const, setServiceProvider: vi.fn(), apiKey: 'test-key',
  apiKeyInput: 'test-key', setApiKeyInput: vi.fn(), debouncedApiKey: 'test-key',
  selectedModel: 'gemini-pro', setSelectedModel: vi.fn(), lmStudioUrl: 'http://localhost:1234',
  setLmStudioUrl: vi.fn(), lmStudioModel: 'model', setLmStudioModel: vi.fn(),
  maxCharLimit: 1000, setMaxCharLimit: vi.fn(), isNightMode: false,
  setIsNightMode: vi.fn(), includeRebuttalInJson: true, setIncludeRebuttalInJson: vi.fn(),
  includeRebuttalInPdf: true, setIncludeRebuttalInPdf: vi.fn(),
  isConfigCollapsed: false, setIsConfigCollapsed: vi.fn(),
  isCurrentProviderConfigured: true, handleMaxCharLimitSave: vi.fn(),
};

const baselineMockUseAnalysis = {
  isLoading: false, error: null, analysisResult: null, currentTextAnalyzed: null,
  textToAnalyze: '', setTextToAnalyze: vi.fn(), setPendingAnalysis: vi.fn(),
  isTranslating: false, handleAnalyzeText: vi.fn(), handleJsonLoad: vi.fn(),
  analysisReportRef: { current: null }, displayedAnalysis: null,
  pendingAnalysis: null, translatedResults: {},
};

const baselineMockUseModels = {
  models: { preview: [], stable: [] }, isLoading: false, error: null,
};


describe('App Component UI States', () => {

  // Use beforeEach to reset mocks before each test
  beforeEach(() => {
    vi.mocked(useConfig).mockReturnValue(baselineMockUseConfig);
    vi.mocked(useAnalysis).mockReturnValue(baselineMockUseAnalysis as any);
    vi.mocked(useModels).mockReturnValue(baselineMockUseModels);
  });

  it('renders the default state correctly', () => {
    render(<LanguageProvider><App /></LanguageProvider>);
    expect(screen.getByText('app_title')).toBeInTheDocument();
    expect(screen.getByText('info_enter_text_to_analyze')).toBeInTheDocument();
  });

  it('displays a loading spinner when models are loading', () => {
    vi.mocked(useModels).mockReturnValue({ ...baselineMockUseModels, isLoading: true });
    render(<LanguageProvider><App /></LanguageProvider>);
    expect(screen.getByText('config_model_loading')).toBeInTheDocument();
  });

  it('displays a loading spinner on the analyze button when analysis is in progress', () => {
    vi.mocked(useAnalysis).mockReturnValue({ ...baselineMockUseAnalysis, isLoading: true } as any);
    render(<LanguageProvider><App /></LanguageProvider>);
    const analyzeButton = screen.getByRole('button', { name: /analyzer_button_analyzing/i });
    expect(analyzeButton).toBeInTheDocument();
    expect(analyzeButton).toBeDisabled();
  });

  it('displays a generic error message when an analysis error occurs', () => {
    vi.mocked(useAnalysis).mockReturnValue({ ...baselineMockUseAnalysis, error: 'Something went wrong' } as any);
    render(<LanguageProvider><App /></LanguageProvider>);
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('error_prefix')).toBeInTheDocument();
    expect(within(alert).getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays an analysis report when analysis is successful', () => {
    const mockReport: GeminiAnalysisResponse = { analysis_summary: 'This is the summary.', findings: [] };
    vi.mocked(useAnalysis).mockReturnValue({
      ...baselineMockUseAnalysis,
      displayedAnalysis: mockReport,
      currentTextAnalyzed: 'some text'
    } as any);
    render(<LanguageProvider><App /></LanguageProvider>);
    expect(screen.getByText('report_summary_title')).toBeInTheDocument();
    expect(screen.getByText('This is the summary.')).toBeInTheDocument();
  });

  it('displays a warning when provider is not configured', () => {
    vi.mocked(useConfig).mockReturnValue({
        ...baselineMockUseConfig,
        isCurrentProviderConfigured: false
    });
    render(<LanguageProvider><App /></LanguageProvider>);
    expect(screen.getByText('analyzer_no_api_key_warning')).toBeInTheDocument();
  });

  it('calls setIsNightMode when the night mode toggle is clicked', async () => {
    const setIsNightModeMock = vi.fn();
    vi.mocked(useConfig).mockReturnValue({ ...baselineMockUseConfig, setIsNightMode: setIsNightModeMock });
    render(<LanguageProvider><App /></LanguageProvider>);
    const nightModeButton = screen.getByTitle('night_mode_toggle_tooltip');
    await userEvent.click(nightModeButton);
    expect(setIsNightModeMock).toHaveBeenCalledWith(true);
  });
});