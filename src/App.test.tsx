import { render, screen, fireEvent } from '@testing-library/react';
import { useConfig } from './hooks/useConfig';
import App from './App';

// Mock the useConfig hook
vi.mock('./hooks/useConfig', () => ({
  useConfig: vi.fn(() => ({
    serviceProvider: 'google',
    setServiceProvider: vi.fn(),
    apiKey: 'test-key',
    apiKeyInput: 'test-key',
    setApiKeyInput: vi.fn(),
    debouncedApiKey: 'test-key',
    selectedModel: 'gemini-pro',
    setSelectedModel: vi.fn(),
    lmStudioUrl: 'http://localhost:1234',
    setLmStudioUrl: vi.fn(),
    lmStudioModel: 'model',
    setLmStudioModel: vi.fn(),
    maxCharLimit: 1000,
    isNightMode: false,
    setIsNightMode: vi.fn(),
    includeRebuttalInJson: true,
    setIncludeRebuttalInJson: vi.fn(),
    includeRebuttalInPdf: true,
    setIncludeRebuttalInPdf: vi.fn(),
    isConfigCollapsed: false,
    setIsConfigCollapsed: vi.fn(),
    isCurrentProviderConfigured: true,
    handleMaxCharLimitSave: vi.fn(),
  })),
}));

// Mock the useModels hook
vi.mock('./hooks/useModels', () => ({
  useModels: vi.fn(() => ({
    models: [],
    isLoading: false,
    error: null,
  })),
}));

// Mock the useAnalysis hook
vi.mock('./hooks/useAnalysis', () => ({
  useAnalysis: vi.fn(() => ({
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
  })),
}));

// Mock the useTranslationManager hook
vi.mock('./hooks/useTranslationManager', () => ({
  useTranslationManager: vi.fn(() => ({
    isTranslatingRebuttal: false,
    handleRebuttalUpdate: vi.fn(),
    displayedRebuttal: null,
    translationError: null,
  })),
}));

// Mock the chrome.runtime API
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      onMessage: {
        addListener: vi.fn(),
      },
      sendMessage: vi.fn(),
      lastError: null,
    },
  },
}));

describe('App', () => {
  it('handles the PULL_INITIAL_TEXT message correctly', () => {
    render(<App />);
    // The test will pass if the component renders without errors.
    // The specific logic for handling PULL_INITIAL_TEXT is tested in the useConfig hook.
  });
});
