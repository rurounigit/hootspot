import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnalysis } from './useAnalysis';
import * as GoogleApi from '../api/google/analysis';
import * as GoogleTranslationApi from '../api/google/translation';
import * as LMStudioApi from '../api/lm-studio';
import { GeminiAnalysisResponse } from '../types/api';

// Mock all API modules
vi.mock('../api/google/analysis');
vi.mock('../api/google/translation');
vi.mock('../api/lm-studio');

// Mock the i18n hook
vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en', // Default to 'en' for most tests
  }),
}));

const mockAnalysisResult: GeminiAnalysisResponse = {
  analysis_summary: 'A successful analysis.',
  findings: [],
};

describe('useAnalysis Hook', () => {
  const defaultProps = {
    serviceProvider: 'google' as 'google' | 'local',
    apiKey: 'test-key',
    lmStudioUrl: 'http://localhost:1234',
    lmStudioModel: 'test-model',
    selectedModel: 'gemini-pro',
    isCurrentProviderConfigured: true,
    setIsConfigCollapsed: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful analysis with Google provider', async () => {
    vi.mocked(GoogleApi.analyzeText).mockResolvedValue(mockAnalysisResult);
    const { result } = renderHook(() => useAnalysis(defaultProps.serviceProvider, defaultProps.apiKey, defaultProps.lmStudioUrl, defaultProps.lmStudioModel, defaultProps.selectedModel, defaultProps.isCurrentProviderConfigured, defaultProps.setIsConfigCollapsed));

    await act(async () => {
      result.current.handleAnalyzeText('Some text');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.analysisResult).toEqual(mockAnalysisResult);
    expect(result.current.currentTextAnalyzed).toBe('Some text');
    expect(result.current.error).toBe(null);
    expect(GoogleApi.analyzeText).toHaveBeenCalledWith('test-key', 'Some text', 'gemini-pro');
  });

  it('should handle successful analysis with LM Studio provider', async () => {
    vi.mocked(LMStudioApi.analyzeTextWithLMStudio).mockResolvedValue(mockAnalysisResult);
    const { result } = renderHook(() => useAnalysis('local', defaultProps.apiKey, defaultProps.lmStudioUrl, defaultProps.lmStudioModel, defaultProps.selectedModel, defaultProps.isCurrentProviderConfigured, defaultProps.setIsConfigCollapsed));

    await act(async () => {
      result.current.handleAnalyzeText('Some local text');
    });

    expect(result.current.analysisResult).toEqual(mockAnalysisResult);
    expect(LMStudioApi.analyzeTextWithLMStudio).toHaveBeenCalledWith('Some local text', 'http://localhost:1234', 'test-model', expect.any(Function));
    expect(GoogleTranslationApi.translateAnalysisResult).not.toHaveBeenCalled();
  });

  it('should set an error if analysis fails', async () => {
    const errorMessage = 'API Error';
    vi.mocked(GoogleApi.analyzeText).mockRejectedValue(new Error(errorMessage));
    const { result } = renderHook(() => useAnalysis(defaultProps.serviceProvider, defaultProps.apiKey, defaultProps.lmStudioUrl, defaultProps.lmStudioModel, defaultProps.selectedModel, defaultProps.isCurrentProviderConfigured, defaultProps.setIsConfigCollapsed));

    await act(async () => {
      result.current.handleAnalyzeText('Some text');
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.analysisResult).toBe(null);
  });

  it('should expand config and not call API if provider is not configured', async () => {
    const setIsConfigCollapsedMock = vi.fn();
    const { result } = renderHook(() => useAnalysis(defaultProps.serviceProvider, defaultProps.apiKey, defaultProps.lmStudioUrl, defaultProps.lmStudioModel, defaultProps.selectedModel, false, setIsConfigCollapsedMock));

    await act(async () => {
        result.current.handleAnalyzeText('Some text');
    });

    expect(setIsConfigCollapsedMock).toHaveBeenCalledWith(false);
    expect(GoogleApi.analyzeText).not.toHaveBeenCalled();
  });

  it('should correctly load and parse a valid JSON file', async () => {
    const { result } = renderHook(() => useAnalysis(defaultProps.serviceProvider, defaultProps.apiKey, defaultProps.lmStudioUrl, defaultProps.lmStudioModel, defaultProps.selectedModel, defaultProps.isCurrentProviderConfigured, defaultProps.setIsConfigCollapsed));
    const jsonData = {
      reportId: '123',
      sourceText: 'Loaded from JSON',
      analysisResult: mockAnalysisResult,
    };
    const file = new File([JSON.stringify(jsonData)], 'report.json', { type: 'application/json' });

    const mockReader = {
        readAsText: vi.fn(),
        onload: vi.fn(),
        result: JSON.stringify(jsonData)
    };
    vi.spyOn(window, 'FileReader').mockImplementation(() => mockReader as any);

    await act(async () => {
        result.current.handleJsonLoad(file);
        mockReader.onload({ target: mockReader });
    });

    await waitFor(() => {
        expect(result.current.textToAnalyze).toBe('Loaded from JSON');
    });

    expect(result.current.analysisResult).toEqual(mockAnalysisResult);
    expect(result.current.currentTextAnalyzed).toBe('Loaded from JSON');
    expect(result.current.error).toBe(null);
  });
});