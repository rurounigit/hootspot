import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { LanguageProvider } from './i18n';

// Mock all custom hooks to control the data flow into the App component
vi.mock('./hooks/useConfig', () => ({
  useConfig: () => ({
    serviceProvider: 'google',
    apiKey: 'test-key',
    isCurrentProviderConfigured: true,
    isConfigCollapsed: true,
    setIsConfigCollapsed: vi.fn(),
    isNightMode: false,
    setIsNightMode: vi.fn(),
  }),
}));
vi.mock('./hooks/useModels', () => ({
  useModels: () => ({ models: { preview: [], stable: [] }, isLoading: false, error: null }),
}));
vi.mock('./hooks/useAnalysis', () => ({
  useAnalysis: () => ({
    isLoading: false,
    error: null,
    analysisResult: null,
    currentTextAnalyzed: null,
    textToAnalyze: '',
    setTextToAnalyze: vi.fn(),
    setPendingAnalysis: vi.fn(),
    isTranslating: false,
    handleAnalyzeText: vi.fn(),
    handleJsonLoad: vi.fn(),
    analysisReportRef: { current: null },
    displayedAnalysis: null,
  }),
}));
vi.mock('./hooks/useTranslationManager', () => ({
    useTranslationManager: () => ({
        isTranslatingRebuttal: false,
        handleRebuttalUpdate: vi.fn(),
        displayedRebuttal: null,
        translationError: null,
    })
}));

const renderWithProvider = (component: React.ReactElement) => {
    return render(<LanguageProvider>{component}</LanguageProvider>);
}

describe('App Component', () => {
  it('renders the main layout components', () => {
    renderWithProvider(<App />);

    // Check for major components by their titles or roles
    expect(screen.getByText('app_title')).toBeInTheDocument();
    expect(screen.getByText('config_title')).toBeInTheDocument();
    expect(screen.getByText('analyzer_title')).toBeInTheDocument();

    // Check for initial state message
    expect(screen.getByText('info_enter_text_to_analyze')).toBeInTheDocument();
  });
});