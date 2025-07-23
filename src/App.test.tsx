// src/App.test.tsx
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import App from './App';
import { LanguageProvider } from './i18n';
import { useConfig } from './hooks/useConfig';
import { useAnalysis } from './hooks/useAnalysis';
import { useModels } from './hooks/useModels';
import { useTranslationManager } from './hooks/useTranslationManager';
import { GeminiAnalysisResponse } from './types/api';

// Mock the chrome runtime for message listeners in App.tsx
vi.stubGlobal('chrome', {
    runtime: {
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
        },
        sendMessage: vi.fn(),
        lastError: undefined,
    },
});

vi.mock('./hooks/useConfig');
vi.mock('./hooks/useModels');
vi.mock('./hooks/useAnalysis');
vi.mock('./hooks/useTranslationManager');

// Create complete, correctly typed mocks for the custom hooks' return values
const mockUseConfig: ReturnType<typeof useConfig> = {
    serviceProvider: 'google', setServiceProvider: vi.fn(),
    apiKey: 'test-key', apiKeyInput: 'test-key', setApiKeyInput: vi.fn(),
    debouncedApiKey: 'test-key',
    selectedModel: 'gemini-pro', setSelectedModel: vi.fn(),
    lmStudioUrl: '', setLmStudioUrl: vi.fn(),
    lmStudioModel: '', setLmStudioModel: vi.fn(),
    maxCharLimit: 6000, setMaxCharLimit: vi.fn(),
    isNightMode: false, setIsNightMode: vi.fn(),
    includeRebuttalInJson: false, setIncludeRebuttalInJson: vi.fn(),
    includeRebuttalInPdf: false, setIncludeRebuttalInPdf: vi.fn(),
    isConfigCollapsed: true, setIsConfigCollapsed: vi.fn(),
    isCurrentProviderConfigured: true, handleMaxCharLimitSave: vi.fn(),
};

// This default object satisfies the type checker which expects a response object, not null.
const defaultAnalysis: GeminiAnalysisResponse = { analysis_summary: '', findings: [] };

const mockUseAnalysis: ReturnType<typeof useAnalysis> = {
    isLoading: false, error: null,
    analysisResult: null, currentTextAnalyzed: null,
    textToAnalyze: '', setTextToAnalyze: vi.fn(),
    pendingAnalysis: null, setPendingAnalysis: vi.fn(),
    isTranslating: false, handleAnalyzeText: vi.fn(),
    handleJsonLoad: vi.fn(),
    analysisReportRef: { current: null },
    displayedAnalysis: defaultAnalysis, // Use a default object instead of null
    translatedResults: {},
};

const mockUseTranslationManager: ReturnType<typeof useTranslationManager> = {
    rebuttal: null,
    isTranslatingRebuttal: false,
    handleRebuttalUpdate: vi.fn(),
    displayedRebuttal: null,
    translationError: null,
};

const renderWithProvider = (component: React.ReactElement) => {
    return render(<LanguageProvider>{component}</LanguageProvider>);
}

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useConfig).mockReturnValue(mockUseConfig);
        vi.mocked(useAnalysis).mockReturnValue(mockUseAnalysis);
        vi.mocked(useModels).mockReturnValue({ models: { preview: [], stable: [] }, isLoading: false, error: null });
        vi.mocked(useTranslationManager).mockReturnValue(mockUseTranslationManager);
    });

    it('renders the main layout components', () => {
        renderWithProvider(<App />);
        expect(screen.getByText('app_title')).toBeInTheDocument();
        expect(screen.getByText('config_title')).toBeInTheDocument();
    });

    describe('Message Handling for auto-analysis', () => {
        it('should call setPendingAnalysis when auto-analyzing and provider IS configured', () => {
            vi.mocked(useConfig).mockReturnValue({ ...mockUseConfig, isCurrentProviderConfigured: true });
            renderWithProvider(<App />);
            const onMessageCallback = (chrome.runtime.onMessage.addListener as Mock).mock.calls[0][0];

            act(() => {
                onMessageCallback({ type: 'PUSH_TEXT_TO_PANEL', text: 'analyze this', autoAnalyze: true }, {}, vi.fn());
            });

            expect(mockUseAnalysis.setTextToAnalyze).toHaveBeenCalledWith('analyze this');
            expect(mockUseAnalysis.setPendingAnalysis).toHaveBeenCalledWith({ text: 'analyze this' });
            expect(mockUseConfig.setIsConfigCollapsed).not.toHaveBeenCalled();
        });

        it('should expand config when auto-analyzing and provider IS NOT configured', () => {
            vi.mocked(useConfig).mockReturnValue({ ...mockUseConfig, isCurrentProviderConfigured: false });
            renderWithProvider(<App />);
            const onMessageCallback = (chrome.runtime.onMessage.addListener as Mock).mock.calls[0][0];

             act(() => {
                onMessageCallback({ type: 'PUSH_TEXT_TO_PANEL', text: 'analyze this', autoAnalyze: true }, {}, vi.fn());
            });

            expect(mockUseAnalysis.setTextToAnalyze).toHaveBeenCalledWith('analyze this');
            expect(mockUseAnalysis.setPendingAnalysis).not.toHaveBeenCalled();
            expect(mockUseConfig.setIsConfigCollapsed).toHaveBeenCalledWith(false);
        });
    });
});