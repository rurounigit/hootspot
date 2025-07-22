import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchModels } from './models';

// Mock the global fetch function
vi.stubGlobal('fetch', vi.fn());

// A sample API response containing various models
const mockApiResponse = {
  models: [
    // Stable models to be kept
    { name: 'models/gemini-1.5-pro-latest', displayName: 'Gemini 1.5 Pro', supportedGenerationMethods: ['generateContent'], version: '1.0' },
    { name: 'models/gemini-1.5-flash-latest', displayName: 'Gemini 1.5 Flash', supportedGenerationMethods: ['generateContent'], version: '1.0'},

    // Preview models to be kept
    { name: 'models/gemini-1.5-pro-preview-0514', displayName: 'Gemini 1.5 Pro Preview', supportedGenerationMethods: ['generateContent'], version: '1.0'},

    // Models to be filtered out
    { name: 'models/embedding-001', displayName: 'Embedding Model', supportedGenerationMethods: ['embedContent'], version: '1.0'},
    { name: 'models/aqa', displayName: 'AQA Model', supportedGenerationMethods: ['generateAnswer'], version: '1.0'},
    { name: 'models/gemini-1.0-pro', displayName: 'Gemini 1.0 Pro', supportedGenerationMethods: ['generateContent'], version: '1.0'}, // Old version
  ]
};

describe('Google API - Models', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch, filter, and group models correctly', async () => {
    // Mock a successful fetch response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await fetchModels('valid-key');

    // Verify fetch was called correctly
    expect(fetch).toHaveBeenCalledWith('https://generativelanguage.googleapis.com/v1beta/models?key=valid-key');

    // Verify the stable models are correct
    expect(result.stable).toHaveLength(2);
    expect(result.stable.map(m => m.displayName)).toContain('Gemini 1.5 Pro');
    expect(result.stable.map(m => m.displayName)).toContain('Gemini 1.5 Flash');


    // Verify the preview models are correct
    expect(result.preview).toHaveLength(1);
    expect(result.preview[0].displayName).toBe('Gemini 1.5 Pro Preview');

    // Verify that unwanted models were filtered out
    const allModelNames = [...result.stable, ...result.preview].map(m => m.displayName);
    expect(allModelNames).not.toContain('Embedding Model');
    expect(allModelNames).not.toContain('AQA Model');
    expect(allModelNames).not.toContain('Gemini 1.0 Pro');
  });

  it('should throw an error if the API request fails', async () => {
    // Mock a failed fetch response
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    } as Response);

    // Assert that the function rejects with the expected error
    await expect(fetchModels('invalid-key')).rejects.toThrow('Invalid API key');
  });

  it('should return empty arrays if the API response has no models array', async () => {
    // Mock a successful response but with an unexpected structure
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ not_models: [] }), // Incorrect key
    } as Response);

    const result = await fetchModels('valid-key');

    // The function should gracefully handle this and return empty groups
    expect(result.stable).toEqual([]);
    expect(result.preview).toEqual([]);
  });
});