import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTranslationManager } from './useTranslationManager';
import * as GoogleTranslationApi from '../api/google/translation';

// Mock the translation API
vi.mock('../api/google/translation');

// Mock the i18n hook to control the language
let currentLanguage = 'en';
vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: currentLanguage,
  }),
}));

describe('useTranslationManager Hook', () => {
  const defaultProps = {
    apiKey: 'test-key',
    selectedModel: 'gemini-pro',
    serviceProvider: 'google' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentLanguage = 'en';
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTranslationManager(defaultProps.apiKey, defaultProps.selectedModel, defaultProps.serviceProvider));
    expect(result.current.rebuttal).toBe(null);
    expect(result.current.displayedRebuttal).toBe(null);
    expect(result.current.isTranslatingRebuttal).toBe(false);
    expect(result.current.translationError).toBe(null);
  });

  it('should update the rebuttal correctly when handleRebuttalUpdate is called', () => {
    const { result } = renderHook(() => useTranslationManager(defaultProps.apiKey, defaultProps.selectedModel, defaultProps.serviceProvider));
    const newRebuttal = 'This is a new rebuttal.';

    act(() => {
      result.current.handleRebuttalUpdate(newRebuttal);
    });

    expect(result.current.rebuttal).toEqual({ text: newRebuttal, lang: 'en' });
    expect(result.current.displayedRebuttal).toBe(newRebuttal);
  });

  it('should trigger translation when language changes', async () => {
    const translatedRebuttal = 'Ceci est une réfutation.';
    vi.mocked(GoogleTranslationApi.translateText).mockResolvedValue(translatedRebuttal);

    const { result, rerender } = renderHook(() => useTranslationManager(defaultProps.apiKey, defaultProps.selectedModel, defaultProps.serviceProvider));

    act(() => {
      result.current.handleRebuttalUpdate('This is a rebuttal.');
    });

    currentLanguage = 'fr';
    rerender();

    await waitFor(() => {
        expect(result.current.isTranslatingRebuttal).toBe(false);
    });

    expect(GoogleTranslationApi.translateText).toHaveBeenCalledWith('test-key', 'This is a rebuttal.', 'fr', 'gemini-pro', expect.any(Function));
    expect(result.current.displayedRebuttal).toBe(translatedRebuttal);
  });

  it('should not trigger translation if the service provider is local', () => {
    const { result, rerender } = renderHook(() => useTranslationManager(defaultProps.apiKey, defaultProps.selectedModel, 'local'));

    act(() => {
        result.current.handleRebuttalUpdate('A rebuttal for a local model.');
    });

    currentLanguage = 'es';
    rerender();

    expect(GoogleTranslationApi.translateText).not.toHaveBeenCalled();
    expect(result.current.isTranslatingRebuttal).toBe(false);
  });

  it('should handle translation errors gracefully', async () => {
    const errorMessage = 'Translation API failed';
    vi.mocked(GoogleTranslationApi.translateText).mockRejectedValue(new Error(errorMessage));

    const { result, rerender } = renderHook(() => useTranslationManager(defaultProps.apiKey, defaultProps.selectedModel, defaultProps.serviceProvider));

    act(() => {
      result.current.handleRebuttalUpdate('Some text to translate.');
    });

    currentLanguage = 'it';
    rerender();

    await waitFor(() => {
        expect(result.current.isTranslatingRebuttal).toBe(false);
    });

    expect(result.current.translationError).toBe(errorMessage);
    expect(result.current.displayedRebuttal).toBe(null);
  });

  it('should use a cached translation if one is available and not re-fetch', async () => {
    const spanishTranslation = 'Una refutación.';
    vi.mocked(GoogleTranslationApi.translateText).mockResolvedValue(spanishTranslation);

    const { result, rerender } = renderHook(() => useTranslationManager(defaultProps.apiKey, defaultProps.selectedModel, defaultProps.serviceProvider));

    // Step 1: Generate initial rebuttal. No API call yet.
    act(() => {
      result.current.handleRebuttalUpdate('A rebuttal.');
    });
    expect(GoogleTranslationApi.translateText).not.toHaveBeenCalled();

    // Step 2: Switch to Spanish. This triggers the first and ONLY API call.
    currentLanguage = 'es';
    rerender();

    await waitFor(() => expect(result.current.displayedRebuttal).toBe(spanishTranslation));
    expect(GoogleTranslationApi.translateText).toHaveBeenCalledTimes(1);

    // Step 3: Switch back to English. This should be instant and from the cache.
    currentLanguage = 'en';
    rerender();
    expect(result.current.displayedRebuttal).toBe('A rebuttal.');
    expect(GoogleTranslationApi.translateText).toHaveBeenCalledTimes(1); // Count must remain 1.

    // Step 4: Switch back to Spanish. This must also come from the cache.
    currentLanguage = 'es';
    rerender();
    expect(result.current.displayedRebuttal).toBe(spanishTranslation);
    expect(GoogleTranslationApi.translateText).toHaveBeenCalledTimes(1); // Count MUST still be 1.
  });
});