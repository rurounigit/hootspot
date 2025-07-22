import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react'; // Import waitFor
import { useConfig } from './useConfig';
import { API_KEY_STORAGE_KEY, SERVICE_PROVIDER_KEY } from '../config/storage-keys';

describe('useConfig hook', () => {
  const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useConfig());
    expect(result.current.serviceProvider).toBe('google');
    expect(result.current.apiKey).toBe(null);
  });

  it('should load initial values from localStorage', () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'test-key');
    localStorage.setItem(SERVICE_PROVIDER_KEY, 'local');

    const { result } = renderHook(() => useConfig());

    expect(result.current.apiKey).toBe('test-key');
    expect(result.current.serviceProvider).toBe('local');
  });

  it('should update serviceProvider and save to localStorage', () => {
    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.setServiceProvider('local');
    });

    expect(result.current.serviceProvider).toBe('local');
    expect(setItemSpy).toHaveBeenCalledWith(SERVICE_PROVIDER_KEY, 'local');
  });

  it('should update apiKeyInput and debounce the api key', async () => {
    // Correctly get the result from renderHook
    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.setApiKeyInput('new-key');
    });

    expect(result.current.apiKeyInput).toBe('new-key');
    expect(result.current.debouncedApiKey).not.toBe('new-key'); // Not updated yet

    // Use the imported waitFor utility correctly
    await waitFor(() => {
        expect(result.current.debouncedApiKey).toBe('new-key');
    }, { timeout: 600 });
  });
});