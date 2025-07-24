import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useModels } from './useModels';
import * as Api from '../api/google/models';
import { GroupedModels } from './useModels';

// Mock the API module that fetches models
vi.mock('../api/google/models');

const mockModels: GroupedModels = {
  stable: [{ name: 'models/gemini-pro', displayName: 'Gemini Pro', supportedGenerationMethods: ['generateContent'], version: '1.0' }],
  preview: [{ name: 'models/gemini-pro-preview', displayName: 'Gemini Pro Preview', supportedGenerationMethods: ['generateContent'], version: '1.0' }],
};

describe('useModels Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should not fetch models if API key is null', () => {
    renderHook(() => useModels(null));
    expect(Api.fetchModels).not.toHaveBeenCalled();
  });

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => useModels(null));
    expect(result.current.models).toEqual({ preview: [], stable: [] });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle successful model fetching', async () => {
    vi.mocked(Api.fetchModels).mockResolvedValue(mockModels);

    const { result } = renderHook(() => useModels('valid-key'));

    // Check loading state immediately after call
    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to update after the async operation
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.models).toEqual(mockModels);
    expect(result.current.error).toBe(null);
    expect(Api.fetchModels).toHaveBeenCalledWith('valid-key');
  });

  it('should handle errors during model fetching', async () => {
    const errorMessage = 'Invalid API Key';
    vi.mocked(Api.fetchModels).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useModels('invalid-key'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.models).toEqual({ preview: [], stable: [] });
  });

  it('should reset state when a valid API key is removed', async () => {
    vi.mocked(Api.fetchModels).mockResolvedValue(mockModels);
    const { result, rerender } = renderHook(({ apiKey }) => useModels(apiKey), {
        initialProps: { apiKey: 'valid-key' as string | null }
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.models).toEqual(mockModels);
    expect(result.current.error).toBe(null);

    // Rerender the hook with a null API key
    rerender({ apiKey: null });

    // State should reset to its initial values
    expect(result.current.models).toEqual({ preview: [], stable: [] });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // NEW: This test explicitly verifies that an error state is cleared when the key is removed.
  it('should reset state, including errors, when an invalid API key is removed', async () => {
    const errorMessage = 'Invalid API Key';
    vi.mocked(Api.fetchModels).mockRejectedValue(new Error(errorMessage));

    const { result, rerender } = renderHook(({ apiKey }) => useModels(apiKey), {
        initialProps: { apiKey: 'invalid-key' as string | null }
    });

    // Wait for the hook to enter its error state
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.models).toEqual({ preview: [], stable: [] });
    expect(result.current.error).toBe(errorMessage);

    // Rerender the hook with a null API key, simulating the user clearing the input
    rerender({ apiKey: null });

    // The error should be cleared and the state should be fully reset
    expect(result.current.models).toEqual({ preview: [], stable: [] });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null); // The most important assertion for this test
  });
});