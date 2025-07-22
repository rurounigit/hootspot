import { describe, it, expect, vi } from 'vitest';
import { render, screen} from '@testing-library/react';
import ConfigurationManager from './ConfigurationManager';

// Mock the i18n hook
vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the useConfig hook
vi.mock('../hooks/useConfig', () => ({
  useConfig: () => ({
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
    lmStudioModel: 'test-model',
    setLmStudioModel: vi.fn(),
    maxCharLimit: 100,
    isNightMode: false,
    setIsNightMode: vi.fn(),
    includeRebuttalInJson: true,
    setIncludeRebuttalInJson: vi.fn(),
    includeRebuttalInPdf: false,
    setIncludeRebuttalInPdf: vi.fn(),
    isConfigCollapsed: false,
    setIsConfigCollapsed: vi.fn(),
    isCurrentProviderConfigured: true,
    handleMaxCharLimitSave: vi.fn(),
  }),
}));

// Mock the useModels hook
vi.mock('../hooks/useModels', () => ({
  useModels: () => ({
    models: { stable: [{ name: 'gemini-pro', displayName: 'Gemini Pro' }], preview: [] },
    isLoading: false,
    error: null,
  }),
}));

// Mock the useAnalysis hook
vi.mock('../hooks/useAnalysis', () => ({
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

// Mock the useTranslationManager hook
vi.mock('../hooks/useTranslationManager', () => ({
  useTranslationManager: () => ({
    isTranslatingRebuttal: false,
    handleRebuttalUpdate: vi.fn(),
    displayedRebuttal: null,
    translationError: null,
  }),
}));

describe('ConfigurationManager', () => {
  it('renders the configuration form when expanded', () => {
    render(<ConfigurationManager
      serviceProvider="google"
      onServiceProviderChange={vi.fn()}
      apiKeyInput="test-key"
      onApiKeyInputChange={vi.fn()}
      models={{ stable: [], preview: [] }}
      selectedModel=""
      onModelChange={vi.fn()}
      areModelsLoading={false}
      modelsError={null}
      lmStudioUrl=""
      onLmStudioUrlChange={vi.fn()}
      lmStudioModel=""
      onLmStudioModelChange={vi.fn()}
      currentMaxCharLimit={100}
      onMaxCharLimitSave={vi.fn()}
      isNightMode={false}
      onNightModeChange={vi.fn()}
      includeRebuttalInJson={true}
      onIncludeRebuttalInJsonChange={vi.fn()}
      includeRebuttalInPdf={false}
      onIncludeRebuttalInPdfChange={vi.fn()}
      onConfigured={vi.fn()}
      isCurrentProviderConfigured={true}
      isCollapsed={false}
      onToggleCollapse={vi.fn()}
    />);
    expect(screen.getByText('config_title')).toBeInTheDocument();
    expect(screen.getByText('config_provider_title')).toBeInTheDocument();
  });

  it('shows a success message when configured and collapsed', () => {
    render(<ConfigurationManager
      serviceProvider="google"
      onServiceProviderChange={vi.fn()}
      apiKeyInput="test-key"
      onApiKeyInputChange={vi.fn()}
      models={{ stable: [], preview: [] }}
      selectedModel=""
      onModelChange={vi.fn()}
      areModelsLoading={false}
      modelsError={null}
      lmStudioUrl=""
      onLmStudioUrlChange={vi.fn()}
      lmStudioModel=""
      onLmStudioModelChange={vi.fn()}
      currentMaxCharLimit={100}
      onMaxCharLimitSave={vi.fn()}
      isNightMode={false}
      onNightModeChange={vi.fn()}
      includeRebuttalInJson={true}
      onIncludeRebuttalInJsonChange={vi.fn()}
      includeRebuttalInPdf={false}
      onIncludeRebuttalInPdfChange={vi.fn()}
      onConfigured={vi.fn()}
      isCurrentProviderConfigured={true}
      isCollapsed={true}
      onToggleCollapse={vi.fn()}
    />);
    expect(screen.getByText('config_is_configured')).toBeInTheDocument();
  });

  it('shows an error message when not configured and collapsed', () => {
    render(<ConfigurationManager
      serviceProvider="google"
      onServiceProviderChange={vi.fn()}
      apiKeyInput=""
      onApiKeyInputChange={vi.fn()}
      models={{ stable: [], preview: [] }}
      selectedModel=""
      onModelChange={vi.fn()}
      areModelsLoading={false}
      modelsError={null}
      lmStudioUrl=""
      onLmStudioUrlChange={vi.fn()}
      lmStudioModel=""
      onLmStudioModelChange={vi.fn()}
      currentMaxCharLimit={100}
      onMaxCharLimitSave={vi.fn()}
      isNightMode={false}
      onNightModeChange={vi.fn()}
      includeRebuttalInJson={true}
      onIncludeRebuttalInJsonChange={vi.fn()}
      includeRebuttalInPdf={false}
      onIncludeRebuttalInPdfChange={vi.fn()}
      onConfigured={vi.fn()}
      isCurrentProviderConfigured={false}
      isCollapsed={true}
      onToggleCollapse={vi.fn()}
    />);
    expect(screen.getByText('config_not_configured')).toBeInTheDocument();
  });
});
