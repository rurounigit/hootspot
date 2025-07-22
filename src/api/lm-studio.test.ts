import { describe, it, expect, vi, afterEach } from 'vitest';
import { analyzeTextWithLMStudio } from './lm-studio';

// Mock the global fetch function
vi.stubGlobal('fetch', vi.fn());

const t = (key: string) => key; // Simple mock for the translation function

describe('analyzeTextWithLMStudio', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return analysis data on a successful API call', async () => {
    const mockApiResponse = {
      choices: [{
        message: {
          content: '```json\n{"analysis_summary": "Summary", "findings": []}\n```'
        }
      }]
    };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      redirected: false,
      type: 'basic',
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      text: vi.fn(),
      json: async () => mockApiResponse,
    } as Partial<Response> as Response);

    const result = await analyzeTextWithLMStudio('some text', 'http://localhost:1234', 'test-model', t);

    expect(fetch).toHaveBeenCalledWith('http://localhost:1234/v1/chat/completions', expect.any(Object));
    expect(result).toEqual({ analysis_summary: 'Summary', findings: [] });
  });

  it('should throw an error if the server connection fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      analyzeTextWithLMStudio('some text', 'http://localhost:1234', 'test-model', t)
    ).rejects.toThrow('error_local_server_connection');
  });

    it('should throw an error for a non-ok response from the server', async () => {
        vi.mocked(fetch).mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Headers(),
          redirected: false,
          type: 'basic',
          url: '',
          clone: vi.fn(),
          body: null,
          bodyUsed: false,
          arrayBuffer: vi.fn(),
          blob: vi.fn(),
          formData: vi.fn(),
          text: vi.fn(),
          json: async () => ({ error: { message: 'Model not found' } }),
        } as Partial<Response> as Response);

        await expect(
          analyzeTextWithLMStudio('some text', 'http://localhost:1234', 'bad-model', t)
        ).rejects.toThrow('error_local_model_not_loaded');
      });
});
